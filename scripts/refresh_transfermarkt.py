#!/usr/bin/env python3
"""
refresh_transfermarkt.py

Weekly incremental refresh of Transfermarkt squad data.

Reads enrichment_cache.json for current values, fetches fresh data from:
  - transfermarkt-api (localhost:8000) for squad profile and contract data
  - transfermarkt.com directly for per-season club transfer spending/income
    (no club-level transfers endpoint exists in the transfermarkt-api)

Updates only fields that have changed, regenerates lib/squadProfile.ts.
Preserves league_positions parsed from the existing TS file (populated by a
separate process; no Transfermarkt API endpoint exists for standings).

Usage:
    # Full refresh (all clubs):
    python scripts/refresh_transfermarkt.py

    # Single club (for testing):
    python scripts/refresh_transfermarkt.py --club arsenal

    # Dry-run: fetch + compare, write nothing:
    python scripts/refresh_transfermarkt.py --dry-run

    # Skip transfer activity (squad data only, much faster):
    python scripts/refresh_transfermarkt.py --no-transfers

Requirements:
    pip install requests
    # transfermarkt-api running on localhost:8000 — e.g.:
    # docker run -p 8000:8000 ghcr.io/felipeall/transfermarkt-api:latest
"""

import argparse
import json
import re
import sys
import time
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests")
    sys.exit(1)

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_URL         = "http://localhost:8000"
DELAY_SECONDS    = 1.5
SCRIPT_DIR       = Path(__file__).parent
MAPPING_PATH     = SCRIPT_DIR / "transfermarkt_mapping.json"
CACHE_PATH       = SCRIPT_DIR / "enrichment_cache.json"
OUTPUT_PATH      = SCRIPT_DIR.parent / "lib" / "squadProfile.ts"
TODAY            = date.today().isoformat()

# Last 5 seasons. saison_id = the year the season STARTED (2024 → 2024/25 season).
# Football seasons start in August, so in Jan-July we're still in the prev-year's season.
_today           = date.today()
_latest_sid      = _today.year - 1 if _today.month < 8 else _today.year
TRANSFER_SEASONS = [_latest_sid - i for i in range(5)]  # e.g. [2025, 2024, 2023, 2022, 2021]

TM_USER_AGENT    = "Mozilla/5.0 (compatible; InsightEleven-research/1.0)"
TM_BASE_URL      = "https://www.transfermarkt.com"

SCALAR_FIELDS    = ["avg_age", "squad_value_eur_m", "squad_size"]
EXPIRY_BANDS     = ["0-12m", "12-24m", "24m+", "unknown"]
AGE_BANDS        = ["under_21", "age_21_23", "age_24_26", "age_27_29", "over_30"]

# ─── transfermarkt-api helpers ────────────────────────────────────────────────

def api_get(session: requests.Session, path: str) -> Optional[dict]:
    url = f"{BASE_URL}{path}"
    try:
        r = session.get(url, timeout=15)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.Timeout:
        print(f"      ERROR [timeout] {url}")
    except requests.exceptions.HTTPError as e:
        print(f"      ERROR [HTTP {e.response.status_code}] {url}")
    except requests.exceptions.ConnectionError:
        print(f"      ERROR [connection refused] {url}")
    except Exception as e:
        print(f"      ERROR [{type(e).__name__}] {url}: {e}")
    return None


def api_is_reachable(session: requests.Session) -> bool:
    try:
        r = session.get(f"{BASE_URL}/openapi.json", timeout=8)
        return r.status_code == 200
    except Exception:
        return False


# ─── Transfermarkt.com transfer scraper ──────────────────────────────────────

def _parse_transfer_fee(html_cell: str) -> float:
    """
    Parse a transfer fee cell like '€69.20m' or '€300k' or '-'.
    Returns the fee in EUR millions. Returns 0.0 for free/undisclosed.
    """
    m = re.search(
        r'<span class="abloeseZusatz">€</span>\s*([\d\.,]+)\s*<span class="abloeseZusatz">([mk]?)</span>',
        html_cell,
    )
    if not m:
        return 0.0
    raw = float(m.group(1).replace(",", ""))
    unit = m.group(2).lower()
    if unit == "m":
        return round(raw, 2)
    if unit == "k":
        return round(raw / 1000, 2)
    return round(raw / 1_000_000, 2)


def fetch_season_transfers(tm_id: str, season_year: int) -> Optional[dict]:
    """
    Scrape the club transfers summary page for a given season.
    Uses a placeholder slug — TM only requires the verein ID to be correct.

    Returns: {season, gross_income_eur_m, gross_spend_eur_m, net_eur_m}
    Returns None on network error.
    """
    url = f"{TM_BASE_URL}/club/transfers/verein/{tm_id}/saison_id/{season_year}"
    req = urllib.request.Request(url, headers={
        "User-Agent": TM_USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"      ERROR [transfer-scrape] season {season_year}: {e}")
        return None

    block_m = re.search(r'<div class="box transfer-record">(.*?)</div>', html, re.DOTALL)
    if not block_m:
        # Page loaded but no transfer-record box — club may not exist for this season
        return None
    block = block_m.group(1)

    income_m = re.search(r'transfer-record__total--positive[^>]*>(.*?)</td>', block, re.DOTALL)
    spend_m  = re.search(r'transfer-record__total--negative[^>]*>(.*?)</td>', block, re.DOTALL)

    income = _parse_transfer_fee(income_m.group(1)) if income_m else 0.0
    spend  = _parse_transfer_fee(spend_m.group(1))  if spend_m  else 0.0

    end_year     = season_year + 1
    season_label = f"{str(season_year)[2:]}/{str(end_year)[2:]}"

    return {
        "season":             season_label,
        "gross_income_eur_m": income,
        "gross_spend_eur_m":  spend,
        "net_eur_m":          round(income - spend, 2),
    }


def fetch_transfer_activity(tm_id: str) -> list:
    """
    Fetch and aggregate transfer spend/income for the last 5 seasons.
    Returns a list of TransferSeasonData dicts, most recent first.
    On per-season error, that season is omitted from the list.
    """
    results = []
    for year in TRANSFER_SEASONS:
        data = fetch_season_transfers(tm_id, year)
        time.sleep(DELAY_SECONDS)
        if data is not None:
            results.append(data)
    return results


# ─── Squad data helpers ───────────────────────────────────────────────────────

def _expiry_band(contract_str: Optional[str]) -> Optional[str]:
    if not contract_str:
        return None
    try:
        exp = datetime.strptime(contract_str, "%Y-%m-%d").date()
    except ValueError:
        return None
    months = (exp - date.today()).days / 30.44
    if months <= 12:
        return "0-12m"
    if months <= 24:
        return "12-24m"
    return "24m+"


def build_contract_expiry(players: list) -> Optional[dict]:
    bands: dict = {"0-12m": 0, "12-24m": 0, "24m+": 0, "unknown": 0}
    for p in players:
        band = _expiry_band(p.get("contract"))
        bands[band if band else "unknown"] += 1
    total = sum(bands.values())
    if total == 0 or bands["unknown"] == total:
        return None
    return {k: v for k, v in bands.items() if k != "unknown" or v > 0}


def build_age_bands(players: list) -> Optional[dict]:
    bands: dict = {"under_21": 0, "age_21_23": 0, "age_24_26": 0, "age_27_29": 0, "over_30": 0}
    counted = 0
    for p in players:
        age = p.get("age")
        if not isinstance(age, int):
            continue
        counted += 1
        if age < 21:
            bands["under_21"] += 1
        elif age <= 23:
            bands["age_21_23"] += 1
        elif age <= 26:
            bands["age_24_26"] += 1
        elif age <= 29:
            bands["age_27_29"] += 1
        else:
            bands["over_30"] += 1
    return bands if counted > 0 else None


# ─── Change detection ─────────────────────────────────────────────────────────

def detect_changes(old: dict, new: dict) -> list:
    changes = []
    for field in SCALAR_FIELDS:
        if old.get(field) != new.get(field):
            changes.append((field, old.get(field), new.get(field)))
    for band in EXPIRY_BANDS:
        ov = (old.get("contract_expiry") or {}).get(band, 0)
        nv = (new.get("contract_expiry") or {}).get(band, 0)
        if ov != nv:
            changes.append((f"contract_expiry.{band}", ov, nv))
    for band in AGE_BANDS:
        ov = (old.get("age_bands") or {}).get(band, 0)
        nv = (new.get("age_bands") or {}).get(band, 0)
        if ov != nv:
            changes.append((f"age_bands.{band}", ov, nv))
    # Compare transfer_activity as serialised JSON (order matters — most recent first)
    old_ta = json.dumps(old.get("transfer_activity", []), sort_keys=True)
    new_ta = json.dumps(new.get("transfer_activity", []), sort_keys=True)
    if old_ta != new_ta:
        old_seasons = len(old.get("transfer_activity", []))
        new_seasons = len(new.get("transfer_activity", []))
        changes.append(("transfer_activity", f"{old_seasons} seasons", f"{new_seasons} seasons"))
    return changes


# ─── TypeScript parsing ───────────────────────────────────────────────────────

def parse_league_positions(ts_content: str) -> dict:
    """
    Extract league_positions arrays from squadProfile.ts.
    Returns a dict of slug → list of position dicts.
    """
    result: dict = {}
    club_re  = re.compile(r'"([\w-]+)":\s*\{(.*?)\n  \},', re.DOTALL)
    entry_re = re.compile(
        r'\{\s*season:\s*"([^"]+)",\s*league_name:\s*"([^"]+)",\s*'
        r'tier:\s*(\d+),\s*position:\s*(\d+|null)\s*\}'
    )
    for m in club_re.finditer(ts_content):
        slug = m.group(1)
        body = m.group(2)
        lp_match = re.search(r'league_positions:\s*\[(.*?)\]', body, re.DOTALL)
        entries = []
        if lp_match:
            for ep in entry_re.finditer(lp_match.group(1)):
                entries.append({
                    "season":      ep.group(1),
                    "league_name": ep.group(2),
                    "tier":        int(ep.group(3)),
                    "position":    None if ep.group(4) == "null" else int(ep.group(4)),
                })
        result[slug] = entries
    return result


# ─── TypeScript output ────────────────────────────────────────────────────────

TS_HEADER = """\
// AUTO-GENERATED by scripts/enrich_squad_profiles.py — do not edit manually.
// Source: Transfermarkt (via transfermarkt-api, https://github.com/felipeall/transfermarkt-api)
//   transfer_activity  — scraped from transfermarkt.com club transfers pages
//   league_positions   — no competition standings endpoint in transfermarkt-api
//
// Contract expiry data is crowdsourced from Transfermarkt and may not reflect
// current signed contracts. Treat as indicative only.

export type ContractExpiryBands = {
  "0-12m":   number;
  "12-24m":  number;
  "24m+":    number;
  unknown?:  number;
};

export type TransferSeasonData = {
  season:            string;
  gross_spend_eur_m: number | null;
  gross_income_eur_m: number | null;
  net_eur_m:         number | null;
};

export type LeaguePositionData = {
  season:      string;
  league_name: string;
  tier:        number;
  position:    number | null;
};

export type AgeBands = {
  under_21:  number;
  age_21_23: number;
  age_24_26: number;
  age_27_29: number;
  over_30:   number;
};

export type SquadProfile = {
  tm_id:             string | null;
  avg_age:           number | null;
  squad_value_eur_m: number | null;
  squad_size:        number | null;
  contract_expiry:   ContractExpiryBands | null;
  age_bands?:        AgeBands | null;
  transfer_activity: TransferSeasonData[];
  /** Populated from a separate source — no competition standings endpoint in the API */
  league_positions:  LeaguePositionData[];
  data_as_of:        string | null;
};

export const squadProfiles: Record<string, SquadProfile> = {
"""

TS_FOOTER = "};\n"


def _v(val) -> str:
    if val is None:
        return "null"
    if isinstance(val, str):
        return json.dumps(val)
    if isinstance(val, bool):
        return "true" if val else "false"
    return str(val)


def format_transfer_activity(transfer_activity: list) -> str:
    if not transfer_activity:
        return "[]"
    entry_lines = "\n".join(
        f'      {{ season: "{t["season"]}", '
        f'gross_spend_eur_m: {t["gross_spend_eur_m"]}, '
        f'gross_income_eur_m: {t["gross_income_eur_m"]}, '
        f'net_eur_m: {t["net_eur_m"]} }},'
        for t in transfer_activity
    )
    return f"[\n{entry_lines}\n    ]"


def format_league_positions(league_positions: list) -> str:
    if not league_positions:
        return "[]"
    entry_lines = "\n".join(
        f'      {{ season: "{e["season"]}", league_name: "{e["league_name"]}", '
        f'tier: {e["tier"]}, position: {"null" if e.get("position") is None else e["position"]} }},'
        for e in league_positions
    )
    return f"[\n{entry_lines}\n    ]"


def format_ts_entry(slug: str, d: dict, league_positions: list) -> str:
    expiry = d.get("contract_expiry")
    if expiry:
        exp_str = (
            "{ "
            + f'"0-12m": {expiry.get("0-12m", 0)}, '
            + f'"12-24m": {expiry.get("12-24m", 0)}, '
            + f'"24m+": {expiry.get("24m+", 0)}'
            + (f' , unknown: {expiry["unknown"]}' if expiry.get("unknown") else "")
            + " }"
        )
    else:
        exp_str = "null"

    ab = d.get("age_bands")
    if ab:
        ab_str = (
            "{ "
            + f'under_21: {ab.get("under_21", 0)}, '
            + f'age_21_23: {ab.get("age_21_23", 0)}, '
            + f'age_24_26: {ab.get("age_24_26", 0)}, '
            + f'age_27_29: {ab.get("age_27_29", 0)}, '
            + f'over_30: {ab.get("over_30", 0)}'
            + " }"
        )
    else:
        ab_str = "null"

    ta_str = format_transfer_activity(d.get("transfer_activity") or [])
    lp_str = format_league_positions(league_positions)

    lines = [
        f'  "{slug}": {{',
        f'    tm_id:             {_v(d.get("tm_id"))},',
        f'    avg_age:           {_v(d.get("avg_age"))},',
        f'    squad_value_eur_m: {_v(d.get("squad_value_eur_m"))},',
        f'    squad_size:        {_v(d.get("squad_size"))},',
        f'    contract_expiry:   {exp_str},',
        f'    age_bands:         {ab_str},',
        f'    transfer_activity: {ta_str},',
        f'    league_positions:  {lp_str},',
        f'    data_as_of:        {_v(d.get("data_as_of"))},',
        f'  }},',
    ]
    return "\n".join(lines)


# ─── Per-club fetch ───────────────────────────────────────────────────────────

def fetch_club(slug: str, tm_id: str, session: requests.Session, include_transfers: bool) -> tuple:
    """
    Fetch profile + players + (optionally) transfer activity for one club.
    Returns (data_dict, errors_list). On hard errors, data_dict is None.
    """
    errors = []

    # Profile
    profile = api_get(session, f"/clubs/{tm_id}/profile")
    time.sleep(DELAY_SECONDS)

    avg_age = squad_value_m = squad_size = None
    if profile is None:
        errors.append("profile-fetch-failed")
    else:
        squad       = profile.get("squad", {})
        avg_age     = squad.get("averageAge")
        squad_size  = squad.get("size")
        raw_val     = profile.get("currentMarketValue")
        if raw_val is not None:
            squad_value_m = round(raw_val / 1_000_000, 1)

    # Players
    players_resp = api_get(session, f"/clubs/{tm_id}/players")
    time.sleep(DELAY_SECONDS)

    contract_expiry = age_bands = None
    if players_resp is None:
        errors.append("players-fetch-failed")
    else:
        players = players_resp.get("players", [])
        if players:
            contract_expiry = build_contract_expiry(players)
            age_bands       = build_age_bands(players)
        else:
            errors.append("players-empty")

    if errors:
        return None, errors

    # Transfer activity (direct TM scrape)
    transfer_activity = []
    if include_transfers:
        transfer_activity = fetch_transfer_activity(tm_id)
        if not transfer_activity:
            errors.append("transfer-fetch-failed")
            # Non-fatal — return data without transfer_activity

    data = {
        "avg_age":          avg_age,
        "squad_value_eur_m": squad_value_m,
        "squad_size":        squad_size,
        "contract_expiry":   contract_expiry,
        "age_bands":         age_bands,
        "transfer_activity": transfer_activity,
        "league_positions":  [],
        "data_as_of":        TODAY,
        "tm_id":             tm_id,
    }
    return data, errors


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Weekly incremental Transfermarkt squad data refresh."
    )
    parser.add_argument("--dry-run",         action="store_true",
                        help="Fetch + compare but write nothing.")
    parser.add_argument("--no-transfers",    action="store_true",
                        help="Skip transfer_activity fetch (squad data only, ~2× faster).")
    parser.add_argument("--transfers-only",  action="store_true",
                        help="Scrape only transfer_activity; skip API profile/players calls. "
                             "Useful for one-time backfill without running the transfermarkt-api.")
    parser.add_argument("--club", metavar="SLUG",
                        help="Refresh a single club slug (for testing).")
    args = parser.parse_args()

    transfers_only    = args.transfers_only
    include_transfers = not args.no_transfers or transfers_only
    seasons_label     = f"{TRANSFER_SEASONS[-1]}-{TRANSFER_SEASONS[0]}" if include_transfers else "n/a"

    run_ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"Transfermarkt refresh — {run_ts}")
    print(f"Transfer seasons:       {seasons_label}")
    print("=" * 60)

    # ── Load mapping ──────────────────────────────────────────────
    if not MAPPING_PATH.exists():
        print(f"ERROR: {MAPPING_PATH} not found — run build_tm_mapping.py first.")
        sys.exit(1)
    mapping: dict = json.loads(MAPPING_PATH.read_text())
    print(f"Mapping:  {len(mapping)} clubs")

    # ── Load enrichment cache ─────────────────────────────────────
    cache: dict = {}
    if CACHE_PATH.exists():
        try:
            cache = json.loads(CACHE_PATH.read_text())
            print(f"Cache:    {len(cache)} existing entries")
        except json.JSONDecodeError:
            print("WARNING: enrichment_cache.json is invalid JSON — starting fresh.")

    # ── Parse league_positions from existing TS file ──────────────
    existing_lp: dict = {}
    if OUTPUT_PATH.exists():
        existing_lp = parse_league_positions(OUTPUT_PATH.read_text())
        populated = sum(1 for lp in existing_lp.values() if lp)
        print(f"TS file:  {len(existing_lp)} clubs parsed, {populated} with league_positions data")
    print()

    # ── Build club list ───────────────────────────────────────────
    if args.club:
        if args.club not in mapping:
            print(f"ERROR: '{args.club}' not in transfermarkt_mapping.json")
            sys.exit(1)
        clubs_to_process = [(args.club, mapping[args.club])]
    else:
        clubs_to_process = [
            (slug, meta) for slug, meta in mapping.items()
            if meta.get("tm_id") and meta.get("confidence") != "low"
        ]

    skipped = len(mapping) - len(clubs_to_process)
    calls_per_club = 2 + (len(TRANSFER_SEASONS) if include_transfers else 0)
    print(f"Clubs to refresh: {len(clubs_to_process)}"
          + (f" ({skipped} skipped — null tm_id or low confidence)" if skipped else ""))
    if not args.dry_run:
        est_min = len(clubs_to_process) * calls_per_club * DELAY_SECONDS / 60
        print(f"API calls/club:   {calls_per_club}  (~{est_min:.0f} min total)")
    print()

    # ── Check transfermarkt-api (not needed for --transfers-only or --dry-run) ──
    session = requests.Session()
    session.headers["User-Agent"] = "InsightEleven-Refresh/1.0 (non-commercial research)"

    if not args.dry_run and not transfers_only:
        if not api_is_reachable(session):
            print("ERROR: transfermarkt-api not reachable at http://localhost:8000")
            print("  Run:  docker run -p 8000:8000 ghcr.io/felipeall/transfermarkt-api:latest")
            sys.exit(1)
        print("API is reachable. Starting...\n")
    elif transfers_only:
        print("Transfers-only mode — skipping transfermarkt-api (squad data preserved from cache).\n")

    # ── Fetch + compare ───────────────────────────────────────────
    updated_cache    = dict(cache)
    clubs_updated    = 0
    total_changes    = 0
    error_list: list = []

    for i, (slug, meta) in enumerate(clubs_to_process):
        tm_id = meta["tm_id"]
        prefix = f"  [{i+1:>3}/{len(clubs_to_process)}] {slug}"

        if args.dry_run:
            if transfers_only:
                calls_desc = f"TM seasons {TRANSFER_SEASONS} (transfers-only)"
            else:
                calls_desc = f"/clubs/{tm_id}/profile + /players"
                if include_transfers:
                    calls_desc += f" + TM seasons {TRANSFER_SEASONS}"
            print(f"{prefix}  (dry-run — would fetch: {calls_desc})")
            continue

        print(f"{prefix}")

        if transfers_only:
            # Skip API calls entirely; build new_data from the existing cache entry
            existing = cache.get(slug)
            if not existing:
                print(f"      SKIP — not in cache (run full refresh first)")
                continue
            transfer_activity = fetch_transfer_activity(tm_id)
            new_data = dict(existing)
            new_data["transfer_activity"] = transfer_activity
            errors = [] if transfer_activity else ["transfer-fetch-failed"]
        else:
            new_data, errors = fetch_club(slug, tm_id, session, include_transfers)

        if new_data is None:
            # Hard failure (profile or players failed)
            print(f"      ERRORS: {', '.join(errors)}")
            error_list.append({"club": slug, "tm_id": tm_id, "errors": errors})
            continue

        if errors:
            # Soft failure (transfer fetch failed, but squad data is good)
            print(f"      WARN: {', '.join(errors)}")
            # Preserve existing transfer_activity from cache so we don't wipe it
            existing_ta = cache.get(slug, {}).get("transfer_activity", [])
            new_data["transfer_activity"] = existing_ta

        old_data = cache.get(slug, {})
        changes  = detect_changes(old_data, new_data)

        if changes:
            clubs_updated += 1
            total_changes += len(changes)
            for field, old_val, new_val in changes:
                print(f"      CHANGED  {field}: {old_val!r} → {new_val!r}")
        else:
            print(f"      no changes")

        updated_cache[slug] = new_data

        # Write cache after each club so long runs survive interruption
        CACHE_PATH.write_text(json.dumps(updated_cache, indent=2, ensure_ascii=False) + "\n")

    # ── Summary ───────────────────────────────────────────────────
    print()
    print("=" * 60)
    print(f"Summary [{run_ts}]")
    print(f"  Clubs processed:     {len(clubs_to_process)}")
    print(f"  Clubs updated:       {clubs_updated}")
    print(f"  Total field changes: {total_changes}")
    print(f"  Errors:              {len(error_list)}")
    if error_list:
        for e in error_list:
            print(f"    {e['club']} (tm_id={e['tm_id']}): {', '.join(e['errors'])}")

    if args.dry_run:
        print("\nDry-run mode — nothing written.")
        return

    # ── Write outputs ─────────────────────────────────────────────
    if clubs_updated == 0 and not error_list:
        print("\nNo changes detected — skipping file writes.")
        return

    CACHE_PATH.write_text(json.dumps(updated_cache, indent=2, ensure_ascii=False) + "\n")
    print(f"\nWrote enrichment_cache.json  ({len(updated_cache)} entries)")

    ts_lines = [TS_HEADER]
    for slug in sorted(updated_cache.keys()):
        lp = existing_lp.get(slug, [])
        ts_lines.append(format_ts_entry(slug, updated_cache[slug], lp))
        ts_lines.append("")
    ts_lines.append(TS_FOOTER)
    OUTPUT_PATH.write_text("\n".join(ts_lines))
    print(f"Wrote lib/squadProfile.ts    ({len(updated_cache)} clubs)")

    if error_list:
        sys.exit(1)


if __name__ == "__main__":
    main()
