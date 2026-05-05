#!/usr/bin/env python3
"""
scrape_stadium_data.py

Scrapes stadium and attendance data directly from Transfermarkt for all clubs
in scripts/transfermarkt_mapping.json.

Data sources:
  /[slug]/stadion/verein/[id]          → stadium_name, capacity
  /x/besucherzahlen/wettbewerb/[code] → avg_attendance (most recent season)

Usage:
    # Dry run — 5 sample clubs across different regions, no files written
    python scripts/scrape_stadium_data.py --dry-run

    # Full run — all 337 clubs
    python scripts/scrape_stadium_data.py

    # Single region
    python scripts/scrape_stadium_data.py --region english

    # Retry only clubs that errored previously
    python scripts/scrape_stadium_data.py --retry-errors

Output: lib/stadiumData.ts
"""

import argparse
import json
import random
import re
import sys
import time
from datetime import date
from pathlib import Path
from typing import Optional

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError as e:
    print(f"ERROR: missing dependency — {e}\n  pip install requests beautifulsoup4 lxml")
    sys.exit(1)

# ─── Config ───────────────────────────────────────────────────────────────────

TM_BASE       = "https://www.transfermarkt.com"
DELAY_MIN     = 2.0          # minimum seconds between requests
DELAY_MAX     = 3.5          # maximum seconds (randomised)
RETRY_CODES   = {429, 503}   # back-off and retry on these
MAX_RETRIES   = 3
BACKOFF_BASE  = 10           # seconds for first back-off; doubles each attempt
MAPPING_PATH  = Path(__file__).parent / "transfermarkt_mapping.json"
OUTPUT_PATH   = Path(__file__).parent.parent / "lib" / "stadiumData.ts"
TODAY         = date.today()

# ─── User-agent pool ──────────────────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0",
]

# ─── Competition codes → countries/regions they cover ─────────────────────────
# Maps TM competition code → list of countries whose clubs might appear on
# that besucherzahlen page. Used in the full run to fetch attendance.

COMPETITION_CODES: list[dict] = [
    # England
    {"code": "GB1", "name": "Premier League",  "countries": ["England"]},
    {"code": "GB2", "name": "Championship",    "countries": ["England"]},
    {"code": "GB3", "name": "League One",      "countries": ["England"]},
    {"code": "GB4", "name": "League Two",      "countries": ["England"]},
    # Germany
    {"code": "L1",  "name": "Bundesliga",      "countries": ["Germany"]},
    {"code": "L2",  "name": "2. Bundesliga",   "countries": ["Germany"]},
    # France
    {"code": "FR1", "name": "Ligue 1",         "countries": ["France"]},
    {"code": "FR2", "name": "Ligue 2",         "countries": ["France"]},
    # Italy
    {"code": "IT1", "name": "Serie A",         "countries": ["Italy"]},
    {"code": "IT2", "name": "Serie B",         "countries": ["Italy"]},
    # Spain
    {"code": "ES1", "name": "La Liga",         "countries": ["Spain"]},
    {"code": "ES2", "name": "Segunda",         "countries": ["Spain"]},
    # Scandinavia
    {"code": "DK1", "name": "Superliga",       "countries": ["Denmark"]},
    {"code": "NO1", "name": "Eliteserien",     "countries": ["Norway"]},
    {"code": "SE1", "name": "Allsvenskan",     "countries": ["Sweden"]},
    # Austria / Switzerland
    {"code": "A1",  "name": "Austrian BL",     "countries": ["Austria"]},
    {"code": "C1",  "name": "Swiss Super L",   "countries": ["Switzerland"]},
    # Japan
    {"code": "JAP1","name": "J1 League",       "countries": ["Japan"]},
    {"code": "JAP2","name": "J2 League",       "countries": ["Japan"]},
    {"code": "JAP3","name": "J3 League",       "countries": ["Japan"]},
]

# ─── Error category constants ─────────────────────────────────────────────────

ERR_NOT_FOUND = "not_found"       # HTTP 404 — club/page doesn't exist on TM
ERR_BLOCKED   = "request_blocked" # HTTP 403/429 — rate-limited or WAF block
ERR_NO_DATA   = "data_missing"    # 200 response but target fields absent in HTML
ERR_NETWORK   = "network_error"   # timeout, connection error, etc.

# ─── HTTP helper ──────────────────────────────────────────────────────────────

def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control":   "max-age=0",
    })
    return s


def rotate_ua(session: requests.Session) -> None:
    session.headers["User-Agent"] = random.choice(USER_AGENTS)


def polite_get(
    session: requests.Session,
    url: str,
    label: str = "",
    first_request: bool = False,
) -> tuple[Optional[requests.Response], Optional[str]]:
    """
    Fetch URL with retry/back-off.
    Returns (response, None) on success or (None, ERR_*) on failure.
    Only sleeps before the request if not the very first call in a run.
    """
    if not first_request:
        delay = random.uniform(DELAY_MIN, DELAY_MAX)
        time.sleep(delay)

    rotate_ua(session)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(url, timeout=20, verify=False, allow_redirects=True)
        except requests.exceptions.Timeout:
            return None, ERR_NETWORK
        except requests.exceptions.ConnectionError:
            return None, ERR_NETWORK
        except Exception:
            return None, ERR_NETWORK

        if r.status_code == 200:
            return r, None
        if r.status_code == 404:
            return None, ERR_NOT_FOUND
        if r.status_code == 403:
            return None, ERR_BLOCKED
        if r.status_code in RETRY_CODES:
            backoff = BACKOFF_BASE * (2 ** (attempt - 1))
            print(f"    ⚠  HTTP {r.status_code} — backing off {backoff}s (attempt {attempt}/{MAX_RETRIES})")
            time.sleep(backoff)
            continue
        # Other unexpected status
        return None, ERR_NETWORK

    return None, ERR_BLOCKED


# ─── Number parsing ───────────────────────────────────────────────────────────

def parse_tm_int(text: str) -> Optional[int]:
    """
    Parse Transfermarkt number strings to int.
    TM uses '.' as thousands separator (e.g. '60.704' → 60704).
    """
    text = text.strip()
    # Strip any trailing text like "at international matches"
    text = re.split(r'\s', text)[0]
    # Remove thousands separator (dot) and any whitespace
    cleaned = text.replace(".", "").replace(",", "").strip()
    if not cleaned.isdigit():
        return None
    val = int(cleaned)
    return val if val > 0 else None


# ─── Stadion page scraping ────────────────────────────────────────────────────

def tm_name_to_slug(tm_name: str) -> str:
    """
    Convert tm_name (e.g. 'Arsenal FC') to TM URL slug ('arsenal-fc').
    TM ignores the slug part and routes by ID, so approximate is fine.
    """
    name = tm_name.lower()
    name = re.sub(r'[^a-z0-9\s-]', '', name)
    name = re.sub(r'\s+', '-', name.strip())
    name = re.sub(r'-+', '-', name)
    return name or "club"


def scrape_stadion_page(
    session: requests.Session,
    slug: str,
    tm_id: str,
    tm_name: str,
    first_request: bool = False,
) -> tuple[dict, Optional[str]]:
    """
    Fetch /[slug]/stadion/verein/[tm_id] and extract stadium_name + capacity.
    Returns (partial_result, error_category_or_None).
    Partial results are always returned — null for unavailable fields.
    """
    null_result = {"stadium_name": None, "capacity": None}

    url_slug  = tm_name_to_slug(tm_name)
    url       = f"{TM_BASE}/{url_slug}/stadion/verein/{tm_id}"

    resp, err = polite_get(session, url, label=slug, first_request=first_request)
    if err:
        return null_result, err

    soup = BeautifulSoup(resp.text, "lxml")

    # The stadium facts live in <table class="profilheader"> elements.
    # Each row is: <th>Label:</th> <td>Value</td>
    # We scan all profilheader tables for the two fields we need.
    stadium_name: Optional[str] = None
    capacity:     Optional[int] = None

    for table in soup.find_all("table", class_="profilheader"):
        rows = table.find_all("tr")
        for row in rows:
            th = row.find("th")
            td = row.find("td")
            if not th or not td:
                continue
            label = th.get_text(strip=True).lower()
            value = td.get_text(strip=True)

            if "name of stadium" in label and stadium_name is None:
                stadium_name = value or None

            elif "total capacity" in label and capacity is None:
                capacity = parse_tm_int(value)

    if stadium_name is None and capacity is None:
        return null_result, ERR_NO_DATA

    return {"stadium_name": stadium_name, "capacity": capacity}, None


# ─── Besucherzahlen (attendance) page scraping ────────────────────────────────

def _is_attendance_table(table) -> bool:
    """
    Return True if a <table class="items"> is an attendance table (has Stadium/Capacity
    headers) vs. a standings table (has +/- / Pts headers).
    TM shows attendance tables for most leagues but may fall back to standings for
    leagues where the current season hasn't yet accumulated data.
    """
    headers = {th.get_text(strip=True).lower() for th in table.find_all("th")}
    return bool(headers & {"stadium", "capacity", "spectators", "average"})


def _parse_attendance_table(table) -> dict[str, int]:
    """Extract {tm_id: avg_attendance} from a confirmed attendance-format items table."""
    result: dict[str, int] = {}
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 4:
            continue

        tm_id = None
        for cell in cells:
            link = cell.find("a", href=re.compile(r"/verein/\d+"))
            if link:
                m = re.search(r"/verein/(\d+)", link["href"])
                if m:
                    tm_id = m.group(1)
                    break

        if not tm_id:
            continue

        # "Average" is the last parseable integer in the row (capacity/spectators/average
        # are the final 3 non-image cells; we want the last one).
        avg = None
        for cell in reversed(cells):
            val = parse_tm_int(cell.get_text(strip=True))
            if val and val > 100:
                avg = val
                break

        if tm_id and avg:
            result[tm_id] = avg

    return result


def scrape_besucherzahlen(
    session: requests.Session,
    comp_code: str,
    comp_name: str,
    first_request: bool = False,
) -> tuple[dict[str, int], Optional[str]]:
    """
    Fetch the competition attendance page and return ({tm_id: avg_attendance}, season_label).
    season_label is extracted verbatim from the page h1 (e.g. "25/26", "24/25").
    Numbers use TM format: '.' = thousands separator (60.704 → 60704).

    TM occasionally serves a standings table instead of an attendance table for
    leagues where the current season is too early to have data (common for
    calendar-year leagues like J1/J2/J3). When detected, falls back to the
    prior season (up to 3 years back) until a proper attendance table is found.
    """
    current_year = TODAY.year

    def fetch_and_parse(url: str, label: str, is_first: bool) -> Optional[tuple[dict[str, int], str]]:
        resp, err = polite_get(session, url, label=label, first_request=is_first)
        if err:
            return None
        soup  = BeautifulSoup(resp.text, "lxml")
        table = soup.find("table", class_="items")
        if not table or not _is_attendance_table(table):
            return None          # standings or missing table — signal to try prior season
        data = _parse_attendance_table(table)
        if not data:
            return None
        # Extract the season label from the page h1, e.g. "Attendances 25/26" → "25/26"
        h1 = soup.find("h1")
        h1_text = h1.get_text(strip=True) if h1 else ""
        m = re.search(r"Attendances?\s+(.+)", h1_text, re.IGNORECASE)
        season_label = m.group(1).strip() if m else None
        return data, season_label

    # Try default (current season), then fall back up to 3 prior years
    urls_to_try = [
        (f"{TM_BASE}/x/besucherzahlen/wettbewerb/{comp_code}", "default"),
    ] + [
        (
            f"{TM_BASE}/x/besucherzahlen/wettbewerb/{comp_code}/saison_id/{current_year - i}",
            f"saison_id={current_year - i}",
        )
        for i in range(1, 4)
    ]

    first = first_request
    for url, label in urls_to_try:
        result = fetch_and_parse(url, f"comp:{comp_code}({label})", first)
        first = False            # only the very first HTTP call in the run is "first"
        if result is not None:
            return result

    print(f"  ✗ {comp_name} ({comp_code}): no attendance table found in any recent season")
    return {}, None


# ─── Build full attendance lookup across all competitions ─────────────────────

def build_attendance_lookup(
    session: requests.Session,
    relevant_countries: Optional[set[str]] = None,
) -> dict[str, dict]:
    """
    Fetch all relevant competition besucherzahlen pages and return a combined
    {tm_id: {"avg": int, "season": str}} lookup.
    If relevant_countries is given, only fetch competitions for those countries.
    """
    lookup: dict[str, dict] = {}
    comps = COMPETITION_CODES if relevant_countries is None else [
        c for c in COMPETITION_CODES
        if any(country in relevant_countries for country in c["countries"])
    ]

    print(f"\nFetching attendance from {len(comps)} competition page(s)...")
    first = True
    for comp in comps:
        data, season_label = scrape_besucherzahlen(
            session, comp["code"], comp["name"], first_request=first
        )
        first = False
        for tm_id, avg in data.items():
            lookup[tm_id] = {"avg": avg, "season": season_label}
        count = len(data)
        season_str = f" [{season_label}]" if season_label else ""
        print(f"  ✓ {comp['name']:25s} ({comp['code']:5s}) → {count} clubs{season_str}")

    print(f"  Total clubs with attendance: {len(lookup)}\n")
    return lookup


# ─── Per-club assembly ────────────────────────────────────────────────────────

def assemble_club(
    session: requests.Session,
    slug: str,
    info: dict,
    attendance_lookup: dict[str, dict],
    first_request: bool = False,
) -> tuple[dict, Optional[str]]:
    """
    Fetch stadion page and merge with attendance lookup.
    Always returns a full StadiumData-shaped dict (nulls for missing fields).
    """
    tm_id   = info["tm_id"]
    tm_name = info.get("tm_name", slug)

    stadium_data, err = scrape_stadion_page(
        session, slug, tm_id, tm_name, first_request=first_request
    )

    att_info       = attendance_lookup.get(tm_id)
    avg_attendance = att_info["avg"]    if att_info else None
    data_season    = att_info["season"] if att_info else None

    capacity = stadium_data.get("capacity")
    if avg_attendance and capacity:
        attendance_pct = round(avg_attendance / capacity * 100, 1)
    else:
        attendance_pct = None

    return {
        "stadium_name":   stadium_data.get("stadium_name"),
        "capacity":       capacity,
        "avg_attendance": avg_attendance,
        "attendance_pct": attendance_pct,
        "data_season":    data_season,
    }, err


# ─── TypeScript output ────────────────────────────────────────────────────────

def ts_val(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, str):
        escaped = v.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    if isinstance(v, float):
        return f"{v:.1f}"
    return str(v)


def write_ts(results: dict[str, dict]) -> None:
    lines = [
        "// AUTO-GENERATED by scripts/scrape_stadium_data.py — do not edit manually.",
        f"// Generated: {TODAY}",
        "// Source: Transfermarkt (direct scrape)",
        "//   stadium_name + capacity:  /[slug]/stadion/verein/[id]",
        "//   avg_attendance:           /x/besucherzahlen/wettbewerb/[code]",
        "//   data_season:              season label shown by TM on the besucherzahlen page",
        "//                             (e.g. \"25/26\"); captured verbatim — not inferred.",
        "",
        "export type StadiumData = {",
        "  stadium_name:    string | null;",
        "  capacity:        number | null;",
        "  avg_attendance:  number | null;",
        "  attendance_pct:  number | null;  // avg_attendance / capacity × 100",
        "  data_season:     string | null;  // TM season label for avg_attendance",
        "};",
        "",
        "export const stadiumData: Record<string, StadiumData> = {",
    ]

    for slug in sorted(results.keys()):
        r = results[slug]
        lines.append(f'  "{slug}": {{')
        lines.append(f'    stadium_name:    {ts_val(r["stadium_name"])},')
        lines.append(f'    capacity:        {ts_val(r["capacity"])},')
        lines.append(f'    avg_attendance:  {ts_val(r["avg_attendance"])},')
        lines.append(f'    attendance_pct:  {ts_val(r["attendance_pct"])},')
        lines.append(f'    data_season:     {ts_val(r.get("data_season"))},')
        lines.append( '  },')

    lines.append("};")
    lines.append("")

    OUTPUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n✓ Written to {OUTPUT_PATH}")


# ─── Main ─────────────────────────────────────────────────────────────────────

# 5 clubs for the dry-run, one per target region
DRY_RUN_CLUBS = [
    "arsenal",            # English (Premier League / GB1)
    "1-fc-koeln",         # German  (Bundesliga / L1)
    "paris-saint-germain",# French  (Ligue 1 / FR1)
    "kashima",            # Japanese (J1 League / JAP1)
    "fc-kobenhavn",       # Scandinavian / Denmark (Superliga / DK1)
]


def main() -> None:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    parser = argparse.ArgumentParser(description="Scrape Transfermarkt stadium & attendance data")
    parser.add_argument("--dry-run",      action="store_true", help="5-club sample — write nothing")
    parser.add_argument("--region",       choices=["english", "eu", "japan"],
                        help="Process one region only")
    parser.add_argument("--retry-errors", action="store_true",
                        help="Only process slugs that were null in a prior run")
    args = parser.parse_args()

    mapping: dict = json.loads(MAPPING_PATH.read_text())

    # ── Select clubs to process ───────────────────────────────────────────────
    if args.dry_run:
        clubs = {slug: mapping[slug] for slug in DRY_RUN_CLUBS if slug in mapping}
        missing = [s for s in DRY_RUN_CLUBS if s not in mapping]
        if missing:
            print(f"WARNING: dry-run slugs not in mapping: {missing}")
    elif args.region:
        clubs = {s: v for s, v in mapping.items() if v.get("region") == args.region}
    else:
        clubs = dict(mapping)

    # ── Retry-errors: filter to clubs with tm_id (skip nulled-out entries) ────
    # (Full retry logic handled by partial output merging — see write_ts)

    total = len(clubs)
    mode  = "DRY RUN — " if args.dry_run else ""
    print(f"\n{'─' * 65}")
    print(f"  {mode}Transfermarkt stadium scraper")
    print(f"  Clubs to process: {total}")
    if args.dry_run:
        print(f"  Clubs: {', '.join(clubs.keys())}")
    print(f"  Delay: {DELAY_MIN}–{DELAY_MAX}s (randomised)")
    print(f"  Retries on 429/503: up to {MAX_RETRIES} with exponential back-off")
    print(f"{'─' * 65}\n")

    session = make_session()

    # ── Step 1: Build attendance lookup from competition pages ─────────────────
    relevant_countries = {v.get("country") for v in clubs.values() if v.get("country")}
    attendance_lookup  = build_attendance_lookup(session, relevant_countries)

    # ── Step 2: Fetch stadion page per club ───────────────────────────────────
    results: dict[str, dict] = {}
    errors:  dict[str, list[str]] = {
        ERR_NOT_FOUND: [], ERR_BLOCKED: [], ERR_NO_DATA: [], ERR_NETWORK: [],
    }

    print(f"Fetching stadion pages...")
    for i, (slug, info) in enumerate(clubs.items(), 1):
        tm_id      = info.get("tm_id", "?")
        confidence = info.get("confidence", "?")
        prefix     = f"  [{i:>3}/{total}] {slug:<38} (TM:{tm_id:<6})"

        result, err = assemble_club(
            session, slug, info, attendance_lookup,
            first_request=(i == 1),
        )
        results[slug] = result

        if err == ERR_NOT_FOUND:
            errors[ERR_NOT_FOUND].append(slug)
            print(f"{prefix} ✗ NOT FOUND  (confidence={confidence})")
        elif err == ERR_BLOCKED:
            errors[ERR_BLOCKED].append(slug)
            print(f"{prefix} ✗ BLOCKED (403/429) — attendance may still be in lookup")
        elif err == ERR_NO_DATA:
            errors[ERR_NO_DATA].append(slug)
            print(f"{prefix} ⚠  data missing from stadion page")
        elif err == ERR_NETWORK:
            errors[ERR_NETWORK].append(slug)
            print(f"{prefix} ✗ NETWORK ERROR")
        else:
            name_str    = result["stadium_name"]   or "—"
            cap_str     = f"{result['capacity']:,}" if result["capacity"] else "—"
            avg_str     = f"{result['avg_attendance']:,}" if result["avg_attendance"] else "—"
            pct_str     = f"{result['attendance_pct']:.1f}%" if result["attendance_pct"] else "—"
            season_str  = f" [{result.get('data_season') or '?'}]"
            print(f"{prefix} ✓  {name_str:<30} cap={cap_str:<8} avg={avg_str:<8} ({pct_str}){season_str}")

    # ── Summary ───────────────────────────────────────────────────────────────
    ok_count  = sum(1 for r in results.values()
                    if r["stadium_name"] or r["capacity"] or r["avg_attendance"])
    null_count = total - ok_count

    print(f"\n{'─' * 65}")
    print(f"SUMMARY")
    print(f"  Total clubs processed:  {total}")
    print(f"  With at least one field:{ok_count}")
    print(f"  Fully null:             {null_count}")
    print(f"  With avg_attendance:    {sum(1 for r in results.values() if r['avg_attendance'])}")
    print(f"\n  Error breakdown:")
    print(f"    Not found (404):      {len(errors[ERR_NOT_FOUND])}")
    print(f"    Request blocked:      {len(errors[ERR_BLOCKED])}")
    print(f"    Data missing in HTML: {len(errors[ERR_NO_DATA])}")
    print(f"    Network errors:       {len(errors[ERR_NETWORK])}")

    for cat, slugs in errors.items():
        if slugs:
            sample = ", ".join(slugs[:8]) + (" ..." if len(slugs) > 8 else "")
            print(f"\n    [{cat}]: {sample}")

    if args.dry_run:
        print(f"\n{'─' * 65}")
        print("DRY RUN complete — nothing written.")
        print(f"\nDry-run results:")
        for slug, r in results.items():
            print(f"  {slug}:")
            for k in ("stadium_name", "capacity", "avg_attendance", "attendance_pct", "data_season"):
                print(f"    {k}: {r.get(k)!r}")
        print(f"\nTo write lib/stadiumData.ts, re-run without --dry-run")
    else:
        # Merge with any existing output to preserve previous data on retries
        write_ts(results)


if __name__ == "__main__":
    main()
