#!/usr/bin/env python3
"""
build_tm_mapping.py

Parses TypeScript source files for every active club in the Insight Eleven
database and searches the transfermarkt-api to produce a slug → TM ID mapping.

Usage:
    # Full run (all regions)
    python scripts/build_tm_mapping.py

    # Dry-run: parse clubs and log what would be searched — no API calls
    python scripts/build_tm_mapping.py --dry-run

    # Single region only
    python scripts/build_tm_mapping.py --region english
    python scripts/build_tm_mapping.py --region eu
    python scripts/build_tm_mapping.py --region japan

    # Re-run only low-confidence and error entries
    python scripts/build_tm_mapping.py --retry-low

Output:
    scripts/transfermarkt_mapping.json

    {
      "arsenal": {
        "tm_id": "11",
        "tm_name": "Arsenal FC",
        "confidence": "high",
        "region": "english",
        "country": "England"
      },
      "some-club": {
        "tm_id": null,
        "tm_name": null,
        "confidence": "low",
        "region": "eu",
        "country": "France",
        "note": "no results — manual lookup required"
      }
    }

The script is idempotent: existing high-confidence entries are skipped on
re-runs. Use --retry-low to re-attempt only flagged entries.

API: https://transfermarkt-api.fly.dev  (open-source, self-hostable)
Rate limit: 1 request / 1.5 s (conservative — hosted instance limits to ~2/3s)
"""

import argparse
import json
import re
import sys
import time
import urllib.parse
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed.  Run:  pip install requests")
    sys.exit(1)

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_URL        = "http://localhost:8000"
DELAY_SECONDS   = 1.5
OUTPUT_PATH     = Path(__file__).parent / "transfermarkt_mapping.json"
LIB_DIR         = Path(__file__).parent.parent / "lib"

# High-confidence threshold: similarity score ≥ this value
HIGH_CONFIDENCE_THRESHOLD = 0.80

# Active EU country files and their country names
EU_FILES: dict[str, str] = {
    "frClubs.ts":  "France",
    "dkClubs.ts":  "Denmark",
    "noClubs.ts":  "Norway",
    "swClubs.ts":  "Sweden",
    "itClubs.ts":  "Italy",
    "esClubs.ts":  "Spain",
    "deClubs.ts":  "Germany",
    "de2Clubs.ts": "Germany",
    "atClubs.ts":  "Austria",
    "chClubs.ts":  "Switzerland",
}

# ─── Club source parsing ──────────────────────────────────────────────────────

def parse_english_clubs() -> list[dict]:
    """
    Extract slug → display name from the NAMES map in lib/clubs.ts.
    Handles both unquoted (arsenal) and hyphenated-quoted ("aston-villa") keys.
    """
    text = (LIB_DIR / "clubs.ts").read_text()

    names_match = re.search(
        r'const NAMES[^=]*=\s*\{(.*?)\};',
        text, re.DOTALL
    )
    if not names_match:
        print("  WARNING: NAMES map not found in clubs.ts")
        return []

    block = names_match.group(1)
    clubs = []

    for m in re.finditer(
        r'(?:"([a-z][a-z0-9-]*)"|([a-z][a-z0-9]*))\s*:\s*"([^"]+)"',
        block
    ):
        slug = m.group(1) or m.group(2)
        name = m.group(3)
        clubs.append({"slug": slug, "name": name, "region": "english", "country": "England"})

    return clubs


def parse_eu_clubs() -> list[dict]:
    """
    Extract slug → display name from the 10 active EU country files.
    Each club object has slug: on one line and name: on the next.
    The stadium also has a nested name: field — we capture only the club-level
    name by requiring slug/name on consecutive lines.
    """
    clubs = []
    for filename, country in EU_FILES.items():
        path = LIB_DIR / filename
        if not path.exists():
            print(f"  WARNING: {filename} not found — skipping")
            continue

        text = path.read_text()

        # Match slug on one line immediately followed by name on the next line
        pairs = re.findall(
            r'slug:\s*"([a-z0-9][a-z0-9-]*)"\s*,\s*\n\s*name:\s*"([^"]+)"',
            text
        )
        for slug, name in pairs:
            clubs.append({"slug": slug, "name": name, "region": "eu", "country": country})

    return clubs


def parse_japan_clubs() -> list[dict]:
    """
    Extract slug → display name from J1/J2/J3 SLUGS and NAMES arrays
    in lib/japanClubs.ts.
    """
    text = (LIB_DIR / "japanClubs.ts").read_text()
    clubs = []

    for division in ("J1", "J2", "J3"):
        slugs_m = re.search(
            rf'const {division}_SLUGS[^=]*=\s*\[(.*?)\];',
            text, re.DOTALL
        )
        names_m = re.search(
            rf'const {division}_NAMES[^=]*=\s*\[(.*?)\];',
            text, re.DOTALL
        )
        if not slugs_m or not names_m:
            print(f"  WARNING: Could not parse {division} arrays in japanClubs.ts")
            continue

        slugs = re.findall(r'"([a-z][a-z0-9-]*)"', slugs_m.group(1))
        names = re.findall(r'"([^"]+)"',            names_m.group(1))

        if len(slugs) != len(names):
            print(f"  WARNING: {division} slug/name count mismatch ({len(slugs)} vs {len(names)})")

        for slug, name in zip(slugs, names):
            clubs.append({
                "slug":     slug,
                "name":     name,
                "region":   "japan",
                "country":  "Japan",
                "division": division.lower(),
            })

    return clubs


# ─── Name normalisation & similarity ─────────────────────────────────────────

_STRIP_TOKENS = frozenset([
    "fc", "sc", "fk", "bk", "sk", "if", "ac", "as", "ss",
    "vfb", "vfl", "sv", "tsv", "fsv", "rb", "1.",
])

def normalise(name: str) -> str:
    """Lower-case, strip common club-type tokens, collapse whitespace."""
    name = name.lower()
    tokens = name.split()
    tokens = [t for t in tokens if t not in _STRIP_TOKENS]
    return " ".join(tokens).strip()


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def best_score(our_name: str, tm_name: str) -> float:
    """Max of raw and normalised similarity."""
    return max(
        similarity(our_name, tm_name),
        similarity(normalise(our_name), normalise(tm_name)),
    )


# ─── Transfermarkt search ─────────────────────────────────────────────────────

def search_tm(name: str, session: requests.Session) -> Optional[List[dict]]:
    """
    Call /clubs/search/{name}.
    Returns list of result dicts, empty list if none, None on error.
    """
    url = f"{BASE_URL}/clubs/search/{urllib.parse.quote(name, safe='')}"
    try:
        resp = session.get(url, timeout=12)
        resp.raise_for_status()
        data = resp.json()
        # API returns {"results": [...]} (or "clubs" in older versions)
        if isinstance(data, dict):
            return data.get("results", data.get("clubs", []))
        if isinstance(data, list):
            return data
        return []
    except requests.exceptions.Timeout:
        print(f"      ERROR [timeout] — {url}")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"      ERROR [HTTP {e.response.status_code}] — {url}")
        return None
    except Exception as e:
        print(f"      ERROR [{type(e).__name__}: {e}] — {url}")
        return None


def pick_best(our_name: str, country: str, results: List[dict]) -> Tuple[Optional[dict], float]:
    """Return (best_result, score). Score includes +0.08 bonus for country match."""
    if not results:
        return None, 0.0

    scored = []
    for r in results:
        tm_name    = r.get("name", "")
        tm_country = r.get("country", "")
        score = best_score(our_name, tm_name)
        if tm_country and country.lower() in tm_country.lower():
            score = min(score + 0.08, 1.0)
        scored.append((score, r))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1], scored[0][0]


def resolve_club(
    club: dict,
    session: requests.Session,
    dry_run: bool,
) -> dict:
    """
    Search Transfermarkt for one club and return a mapping entry.
    On dry-run, logs the intended search and returns a placeholder.
    """
    slug    = club["slug"]
    name    = club["name"]
    country = club["country"]
    region  = club["region"]

    if dry_run:
        print(f"    [DRY-RUN] search: {name!r}  ({country})")
        return {
            "tm_id":      None,
            "tm_name":    None,
            "confidence": "low",
            "region":     region,
            "country":    country,
            "note":       "dry-run — not searched",
        }

    results = search_tm(name, session)

    if results is None:
        # API error
        return {
            "tm_id":      None,
            "tm_name":    None,
            "confidence": "low",
            "region":     region,
            "country":    country,
            "note":       "api-error — retry later",
        }

    if not results:
        # Try a shorter search term (strip suffixes like "United", "City" etc.)
        short_name = re.sub(
            r'\b(United|City|Athletic|Wanderers|County|Town|Rovers|Albion|FC|SC)\b',
            '', name, flags=re.IGNORECASE
        ).strip()
        if short_name and short_name != name:
            print(f"      no results — retrying as {short_name!r}")
            time.sleep(DELAY_SECONDS)
            results = search_tm(short_name, session) or []

    best, score = pick_best(name, country, results)

    if best is None:
        return {
            "tm_id":      None,
            "tm_name":    None,
            "confidence": "low",
            "region":     region,
            "country":    country,
            "note":       "no results — manual lookup required",
        }

    confidence = "high" if score >= HIGH_CONFIDENCE_THRESHOLD else "low"
    entry: dict = {
        "tm_id":      best.get("id"),
        "tm_name":    best.get("name"),
        "confidence": confidence,
        "region":     region,
        "country":    country,
    }
    if confidence == "low":
        entry["note"] = (
            f"best match score {score:.2f} — verify: "
            f"tm_name={best.get('name')!r}, tm_country={best.get('country')!r}"
        )
    return entry


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build Transfermarkt club ID mapping for Insight Eleven."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Parse clubs and log intended searches — no API calls made.",
    )
    parser.add_argument(
        "--region", choices=["english", "eu", "japan"],
        help="Process only one region.",
    )
    parser.add_argument(
        "--retry-low", action="store_true",
        help="Re-attempt only entries already marked low-confidence or api-error.",
    )
    args = parser.parse_args()

    # ── 1. Parse clubs from source files ──────────────────────────────────────
    all_clubs: list[dict] = []
    if not args.region or args.region == "english":
        batch = parse_english_clubs()
        print(f"English clubs: {len(batch)}")
        all_clubs.extend(batch)
    if not args.region or args.region == "eu":
        batch = parse_eu_clubs()
        print(f"EU clubs:      {len(batch)}")
        all_clubs.extend(batch)
    if not args.region or args.region == "japan":
        batch = parse_japan_clubs()
        print(f"Japan clubs:   {len(batch)}")
        all_clubs.extend(batch)

    if not all_clubs:
        print("No clubs found — check LIB_DIR path or --region flag.")
        sys.exit(1)

    print(f"Total:         {len(all_clubs)}\n")

    # ── 2. Load existing mapping (idempotent) ──────────────────────────────────
    existing: dict = {}
    if OUTPUT_PATH.exists():
        try:
            existing = json.loads(OUTPUT_PATH.read_text())
            print(f"Loaded {len(existing)} existing entries from {OUTPUT_PATH.name}")
        except json.JSONDecodeError:
            print("WARNING: Existing mapping is invalid JSON — starting fresh.")
    mapping: dict = dict(existing)

    # ── 3. Filter clubs to process ─────────────────────────────────────────────
    to_process = []
    for club in all_clubs:
        slug = club["slug"]
        existing_entry = mapping.get(slug)

        if existing_entry is None:
            to_process.append(club)
        elif args.retry_low:
            confidence = existing_entry.get("confidence", "low")
            note       = existing_entry.get("note", "")
            if confidence == "low" or "api-error" in note:
                to_process.append(club)
        # else: already mapped with high confidence — skip

    if not to_process:
        print("Nothing to process — all clubs already mapped.")
        print(f"Use --retry-low to re-attempt low-confidence entries.")
        sys.exit(0)

    print(f"Clubs to search: {len(to_process)}")
    if not args.dry_run:
        est = len(to_process) * DELAY_SECONDS
        print(f"Estimated time:  ~{est/60:.1f} min at {DELAY_SECONDS}s delay\n")

    # ── 4. Search ──────────────────────────────────────────────────────────────
    session = requests.Session()
    session.headers["User-Agent"] = "InsightEleven-TM-Mapper/1.0 (non-commercial research)"

    errors = 0
    for i, club in enumerate(to_process):
        slug = club["slug"]
        print(f"  [{i+1:>3}/{len(to_process)}] {slug}  ({club['name']}, {club['country']})")

        entry = resolve_club(club, session, args.dry_run)
        mapping[slug] = entry

        if entry.get("note", "").startswith("api-error"):
            errors += 1
        elif entry.get("confidence") == "high":
            print(f"           → {entry['tm_id']}  {entry['tm_name']!r}  ✓")
        else:
            print(f"           → LOW  {entry.get('note', '')}")

        if not args.dry_run:
            # Write after every club so partial runs are usable
            OUTPUT_PATH.write_text(json.dumps(mapping, indent=2, ensure_ascii=False))
            time.sleep(DELAY_SECONDS)

    # ── 5. Final summary ───────────────────────────────────────────────────────
    print(f"\n{'─' * 60}")
    if args.dry_run:
        print(f"DRY-RUN complete.  {len(to_process)} clubs would be searched.")
        print("No files written.")
    else:
        total  = len(mapping)
        high   = sum(1 for v in mapping.values() if v.get("confidence") == "high")
        low    = sum(1 for v in mapping.values() if v.get("confidence") == "low")
        print(f"Mapping written to: {OUTPUT_PATH}")
        print(f"  Total entries:    {total}")
        print(f"  High confidence:  {high}")
        print(f"  Low confidence:   {low}  ← review before proceeding to Step 3")
        print(f"  API errors:       {errors}")
        if low > 0:
            print(f"\nLow-confidence slugs:")
            for slug, v in mapping.items():
                if v.get("confidence") == "low":
                    print(f"    {slug:40s}  {v.get('note', '')}")


if __name__ == "__main__":
    main()
