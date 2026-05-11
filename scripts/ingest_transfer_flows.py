#!/usr/bin/env python3
"""
Ingest transfer events for Europe's top 5 leagues (2015-16 to 2024-25).

For each club × season:
  1. Fetch squad — identify new arrivals (joinedOn within that season)
  2. Call /players/{id}/transfers to get origin club ID + market value at transfer
  3. Call /clubs/{id}/profile to get origin club country (cached to disk)
  4. Upsert to transfer_events table in Supabase

Usage:
    python scripts/ingest_transfer_flows.py                    # all clubs, 2015-2024
    python scripts/ingest_transfer_flows.py --from-season 2022 # recent seasons only
    python scripts/ingest_transfer_flows.py --season 2024      # single season
    python scripts/ingest_transfer_flows.py --club 281         # single club ID (debug)
    python scripts/ingest_transfer_flows.py --dry-run          # log only, no writes
"""

import argparse
import json
import os
import sys
import time
from datetime import date, datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.local")

API_BASE = "https://transfermarkt-api.fly.dev"
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

COMPETITIONS = {
    "GB1": "Premier League",
    "L1":  "Bundesliga",
    "ES1": "La Liga",
    "IT1": "Serie A",
    "FR1": "Ligue 1",
}

ALL_SEASONS = [str(y) for y in range(2015, 2025)]  # 2015-16 through 2024-25

SEASON_LABEL = {str(y): f"{y}-{str(y + 1)[2:]}" for y in range(2015, 2025)}

CACHE_FILE = Path(__file__).parent / "club_country_cache.json"

_session = requests.Session()
_session.headers.update({"User-Agent": "football-finance-dashboard/1.0"})


# ── API helpers ───────────────────────────────────────────────────────────────

def api_get(path: str, retries: int = 3) -> dict | None:
    url = f"{API_BASE}{path}"
    for attempt in range(retries):
        try:
            r = _session.get(url, timeout=20)
            if r.status_code == 404:
                return None
            r.raise_for_status()
            time.sleep(0.5)
            return r.json()
        except Exception as exc:
            if attempt == retries - 1:
                print(f"  ✗ GET {path}: {exc}", file=sys.stderr)
                return None
            time.sleep(1.5 * (attempt + 1))
    return None


def load_cache() -> dict:
    return json.loads(CACHE_FILE.read_text()) if CACHE_FILE.exists() else {}


def save_cache(cache: dict):
    CACHE_FILE.write_text(json.dumps(cache, indent=2))


# ── Domain helpers ────────────────────────────────────────────────────────────

def season_date_range(season_id: str) -> tuple[date, date]:
    y = int(season_id)
    return date(y, 6, 1), date(y + 1, 5, 31)


def is_new_arrival(joined_on_str: str, season_id: str) -> bool:
    if not joined_on_str:
        return False
    try:
        joined = datetime.strptime(joined_on_str, "%Y-%m-%d").date()
    except ValueError:
        return False
    start, end = season_date_range(season_id)
    return start <= joined <= end


def get_club_country(club_id: str, cache: dict) -> str | None:
    if club_id in cache:
        return cache[club_id]
    data = api_get(f"/clubs/{club_id}/profile")
    country = (data or {}).get("league", {}).get("countryName")
    cache[club_id] = country
    save_cache(cache)
    return country


def find_transfer_record(player_id: str, to_club_id: str, season_id: str) -> dict | None:
    """Return the transfer event matching this club + season from player history."""
    data = api_get(f"/players/{player_id}/transfers")
    if not data:
        return None

    start, end = season_date_range(season_id)
    candidates = []

    for t in data.get("transfers", []):
        if t.get("upcoming"):
            continue
        if t.get("clubTo", {}).get("id") != to_club_id:
            continue
        raw_date = t.get("date", "")
        try:
            td = datetime.strptime(raw_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        if start <= td <= end:
            return t
        candidates.append(t)

    # Fallback: most recent transfer to this club regardless of date
    return candidates[-1] if candidates else None


# ── Supabase writes ───────────────────────────────────────────────────────────

def upsert_competition(comp_id: str, name: str, dry_run: bool):
    if dry_run:
        return
    _session.post(
        f"{SUPABASE_URL}/rest/v1/competitions",
        headers={**SUPABASE_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=[{"id": comp_id, "name": name}],
    )


def upsert_club(club_id: str, name: str, comp_id: str, dry_run: bool):
    if dry_run:
        return
    _session.post(
        f"{SUPABASE_URL}/rest/v1/clubs",
        headers={**SUPABASE_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=[{"id": club_id, "name": name, "competition_id": comp_id}],
    )


def upsert_transfer_event(row: dict, dry_run: bool) -> bool:
    if dry_run:
        print(
            f"    [DRY] {row['player_name']}: {row['from_club_name']} "
            f"({row['from_country']}) → {row['to_competition_id']} {row['season']}"
        )
        return True
    r = _session.post(
        f"{SUPABASE_URL}/rest/v1/transfer_events",
        headers={**SUPABASE_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=[row],
    )
    return r.status_code in (200, 201)


# ── Core ingestion ────────────────────────────────────────────────────────────

def ingest_club_season(
    club_id: str,
    club_name: str,
    comp_id: str,
    season_id: str,
    cache: dict,
    dry_run: bool,
) -> int:
    squad = api_get(f"/clubs/{club_id}/players?season_id={season_id}")
    if not squad:
        return 0

    arrivals = 0
    for player in squad.get("players", []):
        joined_on = player.get("joinedOn", "")
        if not is_new_arrival(joined_on, season_id):
            continue
        if not player.get("signedFrom"):
            continue

        player_id = str(player["id"])
        transfer = find_transfer_record(player_id, club_id, season_id)

        from_club_id   = (transfer or {}).get("clubFrom", {}).get("id")
        from_club_name = (transfer or {}).get("clubFrom", {}).get("name") or player.get("signedFrom", "")
        market_value   = (transfer or {}).get("marketValue") or player.get("marketValue")
        from_country   = get_club_country(from_club_id, cache) if from_club_id else None

        if not from_country:
            continue  # skip if origin country unknown

        row = {
            "season":           SEASON_LABEL[season_id],
            "player_id":        player_id,
            "player_name":      player["name"],
            "to_club_id":       club_id,
            "to_competition_id": comp_id,
            "from_club_id":     from_club_id,
            "from_club_name":   from_club_name,
            "from_country":     from_country,
            "market_value_eur": market_value,
            "transfer_date":    joined_on or None,
        }

        if upsert_transfer_event(row, dry_run):
            print(f"    ✓ {player['name']}: {from_club_name} ({from_country})")
            arrivals += 1

    return arrivals


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url",      default=API_BASE)
    parser.add_argument("--dry-run",      action="store_true")
    parser.add_argument("--club",         default="", help="Single Transfermarkt club ID")
    parser.add_argument("--season",       default="", help="Single season year e.g. 2024")
    parser.add_argument("--from-season",  default="2015", help="Start year (inclusive)")
    parser.add_argument("--to-season",    default="2024", help="End year (inclusive)")
    args = parser.parse_args()

    global API_BASE
    API_BASE = args.api_url

    if args.season:
        seasons = [args.season]
    else:
        seasons = [str(y) for y in range(int(args.from_season), int(args.to_season) + 1)]

    cache = load_cache()
    total = 0

    for comp_id, comp_name in COMPETITIONS.items():
        print(f"\n── {comp_id}: {comp_name} ──────────────────────────────")
        upsert_competition(comp_id, comp_name, args.dry_run)

        data = api_get(f"/competitions/{comp_id}/clubs?season_id={seasons[-1]}")
        if not data:
            print(f"  Could not fetch clubs for {comp_id}")
            continue

        clubs = data.get("clubs", [])
        if args.club:
            clubs = [c for c in clubs if str(c["id"]) == args.club]

        for club in clubs:
            club_id   = str(club["id"])
            club_name = club["name"]
            upsert_club(club_id, club_name, comp_id, args.dry_run)
            print(f"\n  {club_name} ({club_id})")

            for season_id in seasons:
                label = SEASON_LABEL[season_id]
                count = ingest_club_season(club_id, club_name, comp_id, season_id, cache, args.dry_run)
                if count:
                    print(f"    → {count} transfers in {label}")
                total += count

    mode = "DRY RUN — " if args.dry_run else ""
    print(f"\n{mode}Done. Total transfer events: {total}")


if __name__ == "__main__":
    main()
