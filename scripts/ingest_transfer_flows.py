#!/usr/bin/env python3
"""
ingest_transfer_flows.py

Ingests squad data for the top 5 European leagues into Supabase.
Sources:
  - transfermarkt-api (localhost:8000 by default) for squad/player data
  - transfermarkt_mapping.json for club slug → tm_id mapping

Competitions ingested:
  GB1  Premier League
  L1   Bundesliga
  ES1  La Liga
  IT1  Serie A
  FR1  Ligue 1

Usage:
    # Full ingest (all 5 leagues):
    python scripts/ingest_transfer_flows.py

    # Single club (for testing):
    python scripts/ingest_transfer_flows.py --club arsenal

    # Dry-run (fetch + log, write nothing to Supabase):
    python scripts/ingest_transfer_flows.py --dry-run

    # Use live API instead of local Docker:
    python scripts/ingest_transfer_flows.py --api-url https://transfermarkt-api.fly.dev

    # Skip transfer-flows API data check:
    python scripts/ingest_transfer_flows.py --no-transfers

Requirements:
    pip install requests python-dotenv
    Supabase credentials in .env.local (or shell env):
        NEXT_PUBLIC_SUPABASE_URL
        SUPABASE_SERVICE_ROLE_KEY
    transfermarkt-api running:
        docker run -p 8000:8000 ghcr.io/felipeall/transfermarkt-api:latest
"""

import argparse
import json
import os
import sys
import time
from datetime import date, datetime
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests")
    sys.exit(1)

# Load .env.local so credentials can be stored there without exporting to shell
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env.local")
except ImportError:
    pass  # fall back to shell environment variables

# ─── Config ───────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent
MAPPING_PATH = SCRIPT_DIR / "transfermarkt_mapping.json"
SEASON       = "2024-25"
DELAY_TM     = 1.5   # delay between transfermarkt-api calls
DELAY_SB     = 0.1   # delay between Supabase upserts

COMPETITIONS = {
    "GB1": {"name": "Premier League",  "country": "England", "tier": 1},
    "L1":  {"name": "Bundesliga",      "country": "Germany", "tier": 1},
    "ES1": {"name": "La Liga",         "country": "Spain",   "tier": 1},
    "IT1": {"name": "Serie A",         "country": "Italy",   "tier": 1},
    "FR1": {"name": "Ligue 1",         "country": "France",  "tier": 1},
}

# ─── Supabase REST client ─────────────────────────────────────────────────────

class SupabaseClient:
    def __init__(self, url: str, service_key: str, dry_run: bool = False):
        self.base   = url.rstrip("/")
        self.key    = service_key
        self.dry_run = dry_run
        self._session = requests.Session()
        self._session.headers.update({
            "apikey":        service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type":  "application/json",
        })

    def upsert(self, table: str, rows: list) -> None:
        if not rows:
            return
        if self.dry_run:
            print(f"      [dry-run] would upsert {len(rows)} row(s) → {table}")
            return
        url = f"{self.base}/rest/v1/{table}"
        resp = self._session.post(
            url,
            json=rows,
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
            timeout=30,
        )
        if not resp.ok:
            print(f"      ERROR [{resp.status_code}] {table}: {resp.text[:200]}")
            resp.raise_for_status()
        time.sleep(DELAY_SB)

    def delete_squad_season(self, club_id: str, season: str) -> None:
        """Remove stale squad_players rows before re-inserting a fresh roster."""
        if self.dry_run:
            return
        url = f"{self.base}/rest/v1/squad_players"
        resp = self._session.delete(
            url,
            params={"club_id": f"eq.{club_id}", "season": f"eq.{season}"},
            headers={"Prefer": "return=minimal"},
            timeout=15,
        )
        if not resp.ok:
            print(f"      WARN: could not delete stale squad rows for {club_id}: {resp.text[:100]}")

# ─── Transfermarkt-API client ─────────────────────────────────────────────────

class TMClient:
    def __init__(self, base_url: str):
        self._session = requests.Session()
        self._session.headers["User-Agent"] = "InsightEleven-Ingest/1.0 (non-commercial research)"
        self.base = base_url.rstrip("/")

    def get(self, path: str) -> Optional[dict]:
        url = f"{self.base}{path}"
        try:
            r = self._session.get(url, timeout=20)
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

    def is_reachable(self) -> bool:
        try:
            r = self._session.get(f"{self.base}/openapi.json", timeout=8)
            return r.status_code == 200
        except Exception:
            return False

    def get_competition_clubs(self, comp_id: str) -> list:
        data = self.get(f"/competitions/{comp_id}/clubs")
        time.sleep(DELAY_TM)
        return data.get("clubs", []) if data else []

    def get_club_players(self, tm_id: str) -> list:
        data = self.get(f"/clubs/{tm_id}/players")
        time.sleep(DELAY_TM)
        return data.get("players", []) if data else []

# ─── Helpers ──────────────────────────────────────────────────────────────────

def parse_date(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    try:
        datetime.strptime(s, "%Y-%m-%d")
        return s
    except ValueError:
        return None


def build_player_row(p: dict) -> dict:
    return {
        "id":                     p["id"],
        "name":                   p.get("name") or "Unknown",
        "date_of_birth":          parse_date(p.get("dateOfBirth")),
        "place_of_birth_country": None,
        "position_main":          p.get("position"),
        "market_value_eur":       p.get("marketValue"),
        "updated_at":             datetime.utcnow().isoformat() + "Z",
    }


def build_nationality_rows(player_id: str, nationalities: list) -> list:
    rows = []
    for i, nat in enumerate(nationalities or []):
        if nat and isinstance(nat, str):
            rows.append({
                "player_id":  player_id,
                "nationality": nat.strip(),
                "is_primary": i == 0,
            })
    return rows


def build_squad_row(club_id: str, p: dict, season: str) -> dict:
    return {
        "club_id":          club_id,
        "player_id":        p["id"],
        "season":           season,
        "position":         p.get("position"),
        "age":              p.get("age"),
        "signed_from":      p.get("signedFrom"),
        "joined_on":        parse_date(p.get("joinedOn")),
        "contract_expires": parse_date(p.get("contract")),
        "market_value_eur": p.get("marketValue"),
    }

# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest Transfer Flows squad data into Supabase."
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Fetch data but write nothing to Supabase.")
    parser.add_argument("--club", metavar="SLUG",
                        help="Process only this club slug (for testing).")
    parser.add_argument("--api-url", default="http://localhost:8000",
                        help="Base URL for the transfermarkt-api (default: http://localhost:8000).")
    args = parser.parse_args()

    run_ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"Transfer Flows ingest — {run_ts}")
    print(f"  Season:  {SEASON}")
    print(f"  API:     {args.api_url}")
    print(f"  Dry-run: {args.dry_run}")
    print("=" * 60)

    # ── Credentials ──────────────────────────────────────────────
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        print("ERROR: Supabase credentials not found.")
        print("  Add to .env.local (or export to shell):")
        print("    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co")
        print("    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
        sys.exit(1)

    # ── Init clients ──────────────────────────────────────────────
    tm = TMClient(args.api_url)
    sb = SupabaseClient(supabase_url, service_key, dry_run=args.dry_run)

    if not tm.is_reachable():
        print(f"\nERROR: transfermarkt-api not reachable at {args.api_url}")
        if args.api_url == "http://localhost:8000":
            print("  Start it with:")
            print("    docker run -p 8000:8000 ghcr.io/felipeall/transfermarkt-api:latest")
            print("  Or use the live API:")
            print("    python scripts/ingest_transfer_flows.py --api-url https://transfermarkt-api.fly.dev")
        sys.exit(1)

    print(f"\ntransfermarkt-api reachable at {args.api_url}\n")

    # ── Load slug → tm_id mapping ──────────────────────────────────
    mapping: dict = json.loads(MAPPING_PATH.read_text())
    tm_id_to_slug = {
        meta["tm_id"]: slug
        for slug, meta in mapping.items()
        if meta.get("tm_id")
    }

    # ── Seed competition rows ──────────────────────────────────────
    competition_rows = [
        {"id": comp_id, "name": meta["name"], "country": meta["country"], "tier": meta["tier"]}
        for comp_id, meta in COMPETITIONS.items()
    ]
    sb.upsert("competitions", competition_rows)
    print(f"Competitions: {len(competition_rows)} upserted")

    # ── Build work list ─────────────────────────────────────────────
    # Maps club_tm_id → {competition_id, name}
    work: dict[str, dict] = {}

    if args.club:
        # Single-club mode: look up which competition it belongs to
        if args.club not in mapping:
            print(f"ERROR: slug '{args.club}' not found in transfermarkt_mapping.json")
            sys.exit(1)
        meta   = mapping[args.club]
        tm_id  = meta["tm_id"]
        # Determine competition by fetching profile (not required for --club flag —
        # we'll ask the user to specify if needed; for now default to first match)
        country_to_comp = {
            "England": "GB1", "Germany": "L1",
            "Spain":   "ES1", "Italy":   "IT1", "France": "FR1",
        }
        comp_id = country_to_comp.get(meta.get("country", ""))
        if not comp_id:
            print(f"ERROR: Cannot determine competition for '{args.club}' (country={meta.get('country')})")
            sys.exit(1)
        work[tm_id] = {"competition_id": comp_id, "name": meta["tm_name"]}
        print(f"Single-club mode: {args.club} (tm_id={tm_id}, comp={comp_id})\n")
    else:
        # Full mode: fetch each competition's current club list from the TM API
        print("Fetching competition club lists…")
        for comp_id in COMPETITIONS:
            clubs_in_comp = tm.get_competition_clubs(comp_id)
            for club in clubs_in_comp:
                cid  = str(club.get("id", ""))
                name = club.get("name", f"Club {cid}")
                if cid:
                    work[cid] = {"competition_id": comp_id, "name": name}
            print(f"  {comp_id} ({COMPETITIONS[comp_id]['name']}): {len(clubs_in_comp)} clubs")
        print(f"Total clubs to ingest: {len(work)}\n")

    # ── Per-club ingest ─────────────────────────────────────────────
    stats = {
        "clubs_ok":    0,
        "clubs_err":   0,
        "players_new": 0,
        "nats_new":    0,
        "squad_rows":  0,
        "errors":      [],
    }

    for i, (tm_id, club_meta) in enumerate(work.items()):
        comp_id  = club_meta["competition_id"]
        slug     = tm_id_to_slug.get(tm_id, f"club-{tm_id}")
        name     = club_meta["name"]
        prefix   = f"  [{i+1:>3}/{len(work)}] {name} (tm_id={tm_id})"
        print(prefix)

        # Upsert club row
        sb.upsert("clubs", [{
            "id":             tm_id,
            "name":           name,
            "competition_id": comp_id,
            "country":        COMPETITIONS[comp_id]["country"],
            "updated_at":     datetime.utcnow().isoformat() + "Z",
        }])

        # Fetch players
        players = tm.get_club_players(tm_id)
        if not players:
            print(f"      WARN: no players returned — skipping")
            stats["clubs_err"] += 1
            stats["errors"].append(f"{name} (tm_id={tm_id}): no players")
            continue

        # Build rows
        player_rows    = []
        nat_rows       = []
        squad_rows     = []
        seen_player_ids = set()

        for p in players:
            pid = str(p.get("id", ""))
            if not pid:
                continue
            if pid in seen_player_ids:
                continue
            seen_player_ids.add(pid)

            player_rows.append(build_player_row(p))
            nat_rows.extend(build_nationality_rows(pid, p.get("nationality") or []))
            squad_rows.append(build_squad_row(tm_id, p, SEASON))

        # Upsert in dependency order: players → nationalities → squad_players
        sb.upsert("players", player_rows)
        # Delete stale squad rows before reinserting (handles departures)
        sb.delete_squad_season(tm_id, SEASON)
        sb.upsert("player_nationalities", nat_rows)
        sb.upsert("squad_players", squad_rows)

        stats["clubs_ok"]    += 1
        stats["players_new"] += len(player_rows)
        stats["nats_new"]    += len(nat_rows)
        stats["squad_rows"]  += len(squad_rows)

        nat_count = len([r for r in nat_rows if r["is_primary"]])
        print(f"      {len(player_rows)} players | {nat_count} nationalities | {len(squad_rows)} squad rows")

    # ── Summary ─────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print(f"Ingest complete — {run_ts}")
    print(f"  Clubs ingested:       {stats['clubs_ok']}")
    print(f"  Clubs errored:        {stats['clubs_err']}")
    print(f"  Players inserted:     {stats['players_new']}")
    print(f"  Nationalities stored: {stats['nats_new']}")
    print(f"  Squad rows written:   {stats['squad_rows']}")

    if args.dry_run:
        print("\n  Dry-run — nothing written to Supabase.")

    if stats["errors"]:
        print(f"\nErrors ({len(stats['errors'])}):")
        for e in stats["errors"]:
            print(f"  {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
