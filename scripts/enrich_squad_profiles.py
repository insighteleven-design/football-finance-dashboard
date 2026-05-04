#!/usr/bin/env python3
"""
enrich_squad_profiles.py

Fetches Transfermarkt data for every club in transfermarkt_mapping.json
and writes enriched squad profiles to lib/squadProfile.ts.

Data fetched per club (2 API calls each):
  /clubs/{id}/profile  → avg_age, squad_value_eur_m, squad_size
  /clubs/{id}/players  → contract expiry breakdown (0-12m, 12-24m, 24m+)

NOT available via this API (fields set to null with explanation):
  transfer_activity    — no /clubs/{id}/transfers endpoint exists
  league_positions     — no standings endpoint exists

Usage:
    # Dry-run: validate mappings, log what would be fetched, write nothing
    python scripts/enrich_squad_profiles.py --dry-run

    # Full run: fetch data and write lib/squadProfile.ts
    python scripts/enrich_squad_profiles.py

    # Single region
    python scripts/enrich_squad_profiles.py --region english

    # Retry only clubs that errored or have no data
    python scripts/enrich_squad_profiles.py --retry-errors

Output: lib/squadProfile.ts
"""

import argparse
import json
import sys
import time
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed.  Run:  pip install requests")
    sys.exit(1)

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_URL      = "http://localhost:8000"
DELAY_SECONDS = 1.5
MAPPING_PATH  = Path(__file__).parent / "transfermarkt_mapping.json"
OUTPUT_PATH   = Path(__file__).parent.parent / "lib" / "squadProfile.ts"
TODAY         = date.today()

# ─── API helpers ──────────────────────────────────────────────────────────────

def get(session: requests.Session, path: str) -> Optional[dict]:
    url = f"{BASE_URL}{path}"
    try:
        r = session.get(url, timeout=12)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.Timeout:
        print(f"      ERROR [timeout] {url}")
    except requests.exceptions.HTTPError as e:
        print(f"      ERROR [HTTP {e.response.status_code}] {url}")
    except Exception as e:
        print(f"      ERROR [{type(e).__name__}] {url}: {e}")
    return None


# ─── Contract expiry bucketing ────────────────────────────────────────────────

def expiry_band(contract_str: Optional[str]) -> Optional[str]:
    """Return '0-12m', '12-24m', '24m+', or None if contract date missing."""
    if not contract_str:
        return None
    try:
        exp = datetime.strptime(contract_str, "%Y-%m-%d").date()
    except ValueError:
        return None
    days = (exp - TODAY).days
    if days < 0:
        return "0-12m"   # already expired — treat as imminent
    months = days / 30.44
    if months <= 12:
        return "0-12m"
    if months <= 24:
        return "12-24m"
    return "24m+"


def build_age_profile(players: list) -> Optional[dict]:
    """Bucket players into age bands. Returns None if no age data."""
    bands: Dict[str, int] = {
        "under_21": 0, "age_21_23": 0, "age_24_26": 0,
        "age_27_29": 0, "over_30": 0,
    }
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


def build_expiry_profile(players: list) -> Optional[dict]:
    """Bucket players by contract expiry band. Returns None if no contract data."""
    bands: Dict[str, int] = {"0-12m": 0, "12-24m": 0, "24m+": 0, "unknown": 0}
    for p in players:
        band = expiry_band(p.get("contract"))
        if band:
            bands[band] += 1
        else:
            bands["unknown"] += 1
    total = sum(bands.values())
    if total == 0 or bands["unknown"] == total:
        return None
    return {k: v for k, v in bands.items() if k != "unknown" or v > 0}


# ─── Per-club enrichment ──────────────────────────────────────────────────────

def enrich_club(
    slug: str,
    tm_id: str,
    session: requests.Session,
    dry_run: bool,
) -> Tuple[Optional[dict], List[str]]:
    """
    Fetch profile + players for one club.
    Returns (data_dict, error_list).
    data_dict keys: avg_age, squad_value_eur_m, squad_size, contract_expiry, errors
    """
    errors: List[str] = []

    if dry_run:
        print(f"    [DRY-RUN] would fetch:")
        print(f"      GET /clubs/{tm_id}/profile  → avg_age, squad_value_eur_m, squad_size")
        print(f"      GET /clubs/{tm_id}/players  → contract expiry breakdown")
        return None, []

    # ── Profile ──
    profile = get(session, f"/clubs/{tm_id}/profile")
    time.sleep(DELAY_SECONDS)

    avg_age:         Optional[float] = None
    squad_value_m:   Optional[float] = None
    squad_size:      Optional[int]   = None

    if profile is None:
        errors.append("profile-fetch-failed")
    else:
        squad = profile.get("squad", {})
        avg_age       = squad.get("averageAge")
        squad_size    = squad.get("size")
        raw_value     = profile.get("currentMarketValue")
        if raw_value is not None:
            squad_value_m = round(raw_value / 1_000_000, 1)

    # ── Players ──
    players_resp = get(session, f"/clubs/{tm_id}/players")
    time.sleep(DELAY_SECONDS)

    contract_expiry: Optional[dict] = None

    age_bands:       Optional[dict] = None

    if players_resp is None:
        errors.append("players-fetch-failed")
    else:
        players = players_resp.get("players", [])
        if players:
            contract_expiry = build_expiry_profile(players)
            age_bands       = build_age_profile(players)
        else:
            errors.append("players-empty")

    # Partial success: write what we have even if some calls failed
    data = {
        "avg_age":          avg_age,
        "squad_value_eur_m": squad_value_m,
        "squad_size":        squad_size,
        "contract_expiry":   contract_expiry,
        "age_bands":         age_bands,
        # Empty — to be populated from a separate source in a future phase
        "transfer_activity": [],
        "league_positions":  [],
        "data_as_of":        TODAY.isoformat(),
        "tm_id":             tm_id,
    }
    if errors:
        data["errors"] = errors

    return data, errors


# ─── TypeScript output ────────────────────────────────────────────────────────

TS_HEADER = """\
// AUTO-GENERATED by scripts/enrich_squad_profiles.py — do not edit manually.
// Source: Transfermarkt (via transfermarkt-api, https://github.com/felipeall/transfermarkt-api)
//
// Fields stored as empty arrays — to be populated from a separate source in a future phase:
//   transfer_activity  — no /clubs/{id}/transfers endpoint in transfermarkt-api
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
  /** Empty — to be populated in a future phase */
  transfer_activity: TransferSeasonData[];
  /** Empty — to be populated in a future phase */
  league_positions:  LeaguePositionData[];
  data_as_of:        string | null;
};

export const squadProfiles: Record<string, SquadProfile> = {
"""

TS_FOOTER = "};\n"


def format_ts_entry(slug: str, d: dict) -> str:
    def v(val) -> str:
        if val is None:
            return "null"
        if isinstance(val, str):
            return json.dumps(val)
        if isinstance(val, bool):
            return "true" if val else "false"
        return str(val)

    expiry = d.get("contract_expiry")
    if expiry:
        exp_str = (
            "{ "
            + f'"0-12m": {expiry.get("0-12m", 0)}, '
            + f'"12-24m": {expiry.get("12-24m", 0)}, '
            + f'"24m+": {expiry.get("24m+", 0)}'
            + (" , unknown: " + str(expiry["unknown"]) if expiry.get("unknown") else "")
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

    lines = [
        f'  "{slug}": {{',
        f'    tm_id:             {v(d.get("tm_id"))},',
        f'    avg_age:           {v(d.get("avg_age"))},',
        f'    squad_value_eur_m: {v(d.get("squad_value_eur_m"))},',
        f'    squad_size:        {v(d.get("squad_size"))},',
        f'    contract_expiry:   {exp_str},',
        f'    age_bands:         {ab_str},',
        f'    transfer_activity: [],',
        f'    league_positions:  [],',
        f'    data_as_of:        {v(d.get("data_as_of"))},',
        f'  }},',
    ]
    return "\n".join(lines)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enrich squad profiles with Transfermarkt data."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Validate mappings and log what would be fetched — writes nothing.",
    )
    parser.add_argument(
        "--region", choices=["english", "eu", "japan"],
        help="Process only one region.",
    )
    parser.add_argument(
        "--retry-errors", action="store_true",
        help="Re-fetch only clubs whose existing entry has an errors field.",
    )
    parser.add_argument(
        "--add-age-bands", action="store_true",
        help="Players-only pass: add age_bands to clubs that already have enrichment data.",
    )
    args = parser.parse_args()

    # ── Load mapping ──
    if not MAPPING_PATH.exists():
        print(f"ERROR: {MAPPING_PATH} not found — run build_tm_mapping.py first.")
        sys.exit(1)
    mapping: dict = json.loads(MAPPING_PATH.read_text())
    print(f"Loaded {len(mapping)} clubs from mapping file.")

    # ── Load existing enrichment (idempotent) ──
    existing: Dict[str, dict] = {}
    if OUTPUT_PATH.exists():
        raw = OUTPUT_PATH.read_text()
        # Extract existing JSON-like entries via simple extraction
        # We store enrichment data separately as JSON for idempotency
        cache_path = Path(__file__).parent / "enrichment_cache.json"
        if cache_path.exists():
            try:
                existing = json.loads(cache_path.read_text())
                print(f"Loaded {len(existing)} existing enrichment entries from cache.")
            except json.JSONDecodeError:
                print("WARNING: Cache is invalid JSON — starting fresh.")

    # ── Add-age-bands pass (players-only, backfill) ──────────────────────────────
    if args.add_age_bands:
        session = requests.Session()
        session.headers["User-Agent"] = "InsightEleven-Enrichment/1.0 (non-commercial research)"
        enriched = dict(existing)
        clubs_needing_bands = [
            (slug, meta) for slug, meta in mapping.items()
            if meta.get("tm_id") and enriched.get(slug) and "age_bands" not in enriched[slug]
            and (not args.region or meta.get("region") == args.region)
        ]
        print(f"\nClubs needing age_bands: {len(clubs_needing_bands)}")
        est_min = len(clubs_needing_bands) * DELAY_SECONDS / 60
        print(f"API calls: {len(clubs_needing_bands)}  (~{est_min:.0f} min)")
        cache_path = Path(__file__).parent / "enrichment_cache.json"
        for i, (slug, meta) in enumerate(clubs_needing_bands):
            tm_id = meta["tm_id"]
            print(f"  [{i+1:>3}/{len(clubs_needing_bands)}] {slug}")
            players_resp = get(session, f"/clubs/{tm_id}/players")
            time.sleep(DELAY_SECONDS)
            if players_resp is not None:
                players = players_resp.get("players", [])
                enriched[slug]["age_bands"] = build_age_profile(players) if players else None
            else:
                enriched[slug]["age_bands"] = None
            cache_path.write_text(json.dumps(enriched, indent=2, ensure_ascii=False))
        ts_lines = [TS_HEADER]
        for s in sorted(enriched.keys()):
            ts_lines.append(format_ts_entry(s, enriched[s]))
            ts_lines.append("")
        ts_lines.append(TS_FOOTER)
        OUTPUT_PATH.write_text("\n".join(ts_lines))
        print(f"\nDone. Written to: {OUTPUT_PATH}")
        return

    # ── Filter by region and retry flags ──
    clubs_to_process = []
    for slug, meta in mapping.items():
        region = meta.get("region", "")
        if args.region and region != args.region:
            continue
        if meta.get("tm_id") is None:
            print(f"  SKIP {slug} — no tm_id in mapping")
            continue
        existing_entry = existing.get(slug)
        if existing_entry and not args.retry_errors:
            if not existing_entry.get("errors"):
                continue  # already enriched cleanly
        if args.retry_errors and existing_entry and not existing_entry.get("errors"):
            continue  # --retry-errors only re-does errored clubs
        clubs_to_process.append((slug, meta))

    if not clubs_to_process:
        print("Nothing to process — all clubs already enriched.")
        print("Use --retry-errors to re-fetch clubs with errors.")
        sys.exit(0)

    print(f"\nClubs to enrich: {len(clubs_to_process)}")
    if not args.dry_run:
        api_calls = len(clubs_to_process) * 2
        est_min   = api_calls * DELAY_SECONDS / 60
        print(f"API calls:       {api_calls}  (~{est_min:.0f} min at {DELAY_SECONDS}s delay)")

    # ── Dry-run summary ──
    if args.dry_run:
        print("\n" + "─" * 60)
        print("DRY-RUN: validating mappings and logging intended fetches")
        print("─" * 60)
        by_region: Dict[str, list] = {}
        missing_tm_id = []
        for slug, meta in clubs_to_process:
            r = meta.get("region", "unknown")
            by_region.setdefault(r, []).append((slug, meta))
            if not meta.get("tm_id"):
                missing_tm_id.append(slug)

        for region, entries in sorted(by_region.items()):
            print(f"\n[{region.upper()}]  {len(entries)} clubs")
            for slug, meta in entries[:5]:
                print(f"  {slug:<45}  tm_id={meta['tm_id']}")
            if len(entries) > 5:
                print(f"  ... and {len(entries) - 5} more")

        print(f"\nTotal API calls that would be made: {len(clubs_to_process) * 2}")
        print(f"  /clubs/{{id}}/profile  × {len(clubs_to_process)}")
        print(f"  /clubs/{{id}}/players  × {len(clubs_to_process)}")
        print(f"\nData points that WILL be populated:")
        print(f"  avg_age           — from profile.squad.averageAge")
        print(f"  squad_value_eur_m — from profile.currentMarketValue / 1,000,000")
        print(f"  squad_size        — from profile.squad.size")
        print(f"  contract_expiry   — bucketed from players[].contract dates")
        print(f"\nData points stored as empty arrays (to be populated in a future phase):")
        print(f"  transfer_activity — no /clubs/{{id}}/transfers endpoint in this API")
        print(f"  league_positions  — no competition standings endpoint in this API")
        if missing_tm_id:
            print(f"\nWARNING: {len(missing_tm_id)} clubs have no tm_id — will be skipped:")
            for s in missing_tm_id:
                print(f"  {s}")
        print(f"\nOutput would be written to: {OUTPUT_PATH}")
        print(f"Intermediate cache:          {Path(__file__).parent / 'enrichment_cache.json'}")
        return

    # ── Full run ──
    session = requests.Session()
    session.headers["User-Agent"] = "InsightEleven-Enrichment/1.0 (non-commercial research)"

    enriched = dict(existing)
    error_count   = 0
    partial_count = 0
    success_count = 0

    for i, (slug, meta) in enumerate(clubs_to_process):
        tm_id = meta["tm_id"]
        region = meta.get("region", "?")
        print(f"  [{i+1:>3}/{len(clubs_to_process)}] {slug}  (tm_id={tm_id}, {region})")

        data, errors = enrich_club(slug, tm_id, session, dry_run=False)

        if data is None:
            error_count += 1
            continue

        enriched[slug] = data

        if errors:
            partial_count += 1
            print(f"           → partial ({', '.join(errors)})")
        else:
            success_count += 1
            age = data.get("avg_age")
            val = data.get("squad_value_eur_m")
            exp = data.get("contract_expiry")
            exp_str = f"expiry={exp}" if exp else "expiry=null"
            print(f"           → age={age}  value=€{val}m  {exp_str}")

        # Write cache after every club (partial run safety)
        cache_path = Path(__file__).parent / "enrichment_cache.json"
        cache_path.write_text(json.dumps(enriched, indent=2, ensure_ascii=False))

    # ── Write TypeScript output ──
    ts_lines = [TS_HEADER]
    for slug in sorted(enriched.keys()):
        ts_lines.append(format_ts_entry(slug, enriched[slug]))
        ts_lines.append("")
    ts_lines.append(TS_FOOTER)
    OUTPUT_PATH.write_text("\n".join(ts_lines))

    # ── Summary ──
    print(f"\n{'─' * 60}")
    print(f"Enrichment complete.")
    print(f"  Success (all fields):  {success_count}")
    print(f"  Partial (some errors): {partial_count}")
    print(f"  Failed (no data):      {error_count}")
    print(f"  Written to:            {OUTPUT_PATH}")

    if error_count or partial_count:
        print(f"\nClubs with errors:")
        for slug, d in enriched.items():
            if d.get("errors"):
                print(f"  {slug:<45}  {d['errors']}")
        print(f"\nRe-run with --retry-errors to attempt failed clubs again.")


if __name__ == "__main__":
    main()
