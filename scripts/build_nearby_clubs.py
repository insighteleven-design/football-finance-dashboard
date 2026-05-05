#!/usr/bin/env python3
"""
build_nearby_clubs.py

Geocodes every club in the Insight Eleven database via OpenStreetMap/Nominatim,
then computes which clubs lie within 10 miles of each other.
Writes lib/nearbyClubs.ts.

Data source: OpenStreetMap Nominatim (https://nominatim.openstreetmap.org)
Rate limit:  1 request per 1.1 s (Nominatim usage policy)
One-time enrichment — results cached in scripts/club_coords_cache.json.

Usage:
    python scripts/build_nearby_clubs.py --dry-run         # geocode only, no writes
    python scripts/build_nearby_clubs.py                   # write lib/nearbyClubs.ts
    python scripts/build_nearby_clubs.py --region english  # one region only
    python scripts/build_nearby_clubs.py --force           # re-geocode all (ignore cache)
"""

import argparse
import json
import math
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError

# ─── Paths ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR = Path(__file__).parent
LIB_DIR     = SCRIPTS_DIR.parent / "lib"
OUTPUT_PATH = LIB_DIR / "nearbyClubs.ts"
CACHE_PATH  = SCRIPTS_DIR / "club_coords_cache.json"

NOMINATIM_URL  = "https://nominatim.openstreetmap.org/search"
DELAY_SECONDS  = 1.1
RADIUS_MILES   = 25.0
EARTH_RADIUS_M = 3958.8   # Earth radius in miles

USER_AGENT = "InsightEleven-NearbyClubs/1.0 (non-commercial research; olliecantrill@insighteleven.co.uk)"

# ─── Country → search country string ─────────────────────────────────────────

COUNTRY_TO_NOMINATIM: Dict[str, str] = {
    "England":     "United Kingdom",
    "France":      "France",
    "Germany":     "Germany",
    "Italy":       "Italy",
    "Spain":       "Spain",
    "Austria":     "Austria",
    "Switzerland": "Switzerland",
    "Norway":      "Norway",
    "Denmark":     "Denmark",
    "Sweden":      "Sweden",
    "Netherlands": "Netherlands",
    "Belgium":     "Belgium",
    "Japan":       "Japan",
}

# ─── Per-slug geocoding city overrides ───────────────────────────────────────
# Nominatim fails on city names with parentheses or special chars.

GEOCODE_CITY_OVERRIDES: Dict[str, str] = {
    "telstar": "IJmuiden",  # source has "Velsen (IJmuiden)" which confuses Nominatim
}

# ─── Division labels (for the nearbyClubs output) ─────────────────────────────

EN_DIVISION_LABELS: Dict[str, str] = {
    "premier-league": "Premier League",
    "championship":   "Championship",
    "league-one":     "League One",
    "league-two":     "League Two",
}

JP_DIVISION_LABELS: Dict[str, str] = {
    "j1": "J1 League",
    "j2": "J2 League",
    "j3": "J3 League",
}

# Japan slug → city (same table as build_market_data.py)
JAPAN_SLUG_TO_CITY: Dict[str, str] = {
    "sapporo":       "Sapporo",
    "kashima":       "Kashima",
    "urawa":         "Saitama",
    "kashiwa":       "Kashiwa",
    "fc-tokyo":      "Tokyo",
    "tokyo-verdy":   "Tokyo",
    "machida":       "Machida",
    "kawasaki":      "Kawasaki",
    "yokohama-fm":   "Yokohama",
    "shonan":        "Hiratsuka",
    "niigata":       "Niigata",
    "iwata":         "Iwata",
    "nagoya":        "Nagoya",
    "kyoto":         "Kyoto",
    "gamba-osaka":   "Osaka",
    "cerezo-osaka":  "Osaka",
    "vissel-kobe":   "Kobe",
    "hiroshima":     "Hiroshima",
    "fukuoka":       "Fukuoka",
    "tosu":          "Tosu",
    "sendai":        "Sendai",
    "akita":         "Akita",
    "yamagata":      "Yamagata",
    "iwaki":         "Iwaki",
    "mito":          "Mito",
    "tochigi-sc":    "Utsunomiya",
    "gunma":         "Maebashi",
    "chiba":         "Chiba",
    "yokohama-fc":   "Yokohama",
    "kofu":          "Kofu",
    "shimizu":       "Shizuoka",
    "fujeda":        "Fujieda",
    "okayama":       "Okayama",
    "yamaguchi":     "Yamaguchi",
    "tokushima":     "Tokushima",
    "ehime":         "Matsuyama",
    "nagasaki":      "Nagasaki",
    "kumamoto":      "Kumamoto",
    "oita":          "Oita",
    "kagoshima":     "Kagoshima",
    "hachinohe":     "Hachinohe",
    "iwate-grulla":  "Morioka",
    "fukushima-utd": "Fukushima",
    "omiya":         "Saitama",
    "ys-yokohama":   "Yokohama",
    "sagamihara":    "Sagamihara",
    "matsumoto":     "Matsumoto",
    "nagano":        "Nagano",
    "toyama":        "Toyama",
    "kanazawa":      "Kanazawa",
    "numazu":        "Numazu",
    "fc-gifu":       "Gifu",
    "fc-osaka":      "Osaka",
    "nara":          "Nara",
    "tottori":       "Tottori",
    "imabari":       "Imabari",
    "kitakyushu":    "Kitakyushu",
    "miyazaki":      "Miyazaki",
    "ryukyu":        "Naha",
    "tochigi-city":  "Utsunomiya",
    "kochi":         "Kochi",
}

# ─── Haversine distance ───────────────────────────────────────────────────────

def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi   = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))

# ─── Nominatim geocoding ──────────────────────────────────────────────────────

def geocode(club_name: str, city: str, country: str) -> Optional[Tuple[float, float, str]]:
    """
    Returns (lat, lng, display_name) or None on failure.
    Tries:  1. "{club_name}, {city}, {country}"
            2. "{city}, {country}"   (city-level fallback)
    """
    nom_country = COUNTRY_TO_NOMINATIM.get(country, country)
    queries = [
        f"{club_name}, {city}, {nom_country}",
        f"{city}, {nom_country}",
    ]

    for q in queries:
        params = urlencode({"q": q, "format": "json", "limit": "1", "addressdetails": "0"})
        url    = f"{NOMINATIM_URL}?{params}"
        req    = Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
            if data:
                r = data[0]
                return float(r["lat"]), float(r["lon"]), r.get("display_name", "")
        except (URLError, json.JSONDecodeError, KeyError, ValueError):
            pass
        time.sleep(DELAY_SECONDS)

    return None

# ─── Club parsing ─────────────────────────────────────────────────────────────

def parse_english_clubs() -> List[Dict]:
    text = (LIB_DIR / "clubs.ts").read_text()
    names_match = re.search(r'const NAMES[^=]*=\s*\{(.*?)\};', text, re.DOTALL)
    name_map: Dict[str, str] = {}
    if names_match:
        for m in re.finditer(r'(?:"([a-z][a-z0-9-]*)"|([a-z][a-z0-9]*))\s*:\s*"([^"]+)"',
                              names_match.group(1)):
            slug = m.group(1) or m.group(2)
            name_map[slug] = m.group(3)

    # Division from raw data entries
    div_map: Dict[str, str] = {}
    for m in re.finditer(
        r'"([a-z][a-z0-9-]*)"\s*:\s*\{[^}]*?division:\s*"([^"]+)"',
        text,
        re.DOTALL,
    ):
        div_map[m.group(1)] = m.group(2)
    # Also grab from setDivision / the clubs array directly
    # Simpler: parse division from the raw entry pattern in clubs.ts
    # The clubs use: division set in makeClub calls
    for m in re.finditer(
        r'(?:"([a-z][a-z0-9-]*)"|([a-z][a-z0-9]*))\s*:\s*\{[^{}]*?(?:fiscal_year_end|data_confidence)',
        text,
        re.DOTALL,
    ):
        pass  # slug already in name_map

    # Build from marketContext slugs (all English clubs with location data)
    mc_text = (LIB_DIR / "marketContext.ts").read_text()
    la_to_city: Dict[str, str] = {
        "Greater London":                "London",
        "Blackburn with Darwen":         "Blackburn",
        "Hyndburn":                      "Accrington",
        "Kingston upon Hull, City of":   "Kingston upon Hull",
        "Bristol, City of":              "Bristol",
        "Bournemouth, Christchurch and Poole": "Bournemouth",
        "East Staffordshire":            "Burton upon Trent",
        "Kirklees":                      "Huddersfield",
        "North East Lincolnshire":       "Grimsby",
        "Sandwell":                      "West Bromwich",
        "Shropshire":                    "Shrewsbury",
        "Trafford":                      "Manchester",
        "West Northamptonshire":         "Northampton",
        "Westmorland and Furness":       "Barrow-in-Furness",
        "Medway":                        "Rochester",
        "Wyre":                          "Fleetwood",
    }

    out = []
    # Parse division from clubs.ts raw entries by matching slug to division in the PL/Championship sections
    # Use a simple approach: grep for slug in clubs array
    div_from_array: Dict[str, str] = {}
    for div_key, div_label in [
        ("premier-league", "premier-league"),
        ("championship",   "championship"),
        ("league-one",     "league-one"),
        ("league-two",     "league-two"),
    ]:
        # Find each division section and extract slugs
        section_match = re.search(
            rf'(?:Premier League|Championship|League One|League Two)[^\n]*\n'
            rf'(?:.*\n)*?(?=//.*(?:Premier|Championship|League One|League Two|$))',
            text,
        )

    # Simpler: import the clubs array data by looking at raw entries
    # Each entry is: "slug": { ... fiscal_year_end, division fields not directly in raw...}
    # The division comes from the makePL / makeChamp etc. helper calls
    # Best approach: look for division assignment patterns

    # Actually use the clubs.ts DIVISIONS constant or similar
    # Fall back: use the marketContext data and set division to "unknown"
    # We'll parse it properly from the raw array by finding which section each slug appears in

    sections = re.split(
        r'//\s*─+\s*(Premier League|Championship|League One|League Two)[^\n]*',
        text,
    )
    current_div = "premier-league"
    div_order = {
        "Premier League": "premier-league",
        "Championship":   "championship",
        "League One":     "league-one",
        "League Two":     "league-two",
    }
    for i, section in enumerate(sections):
        if section in div_order:
            current_div = div_order[section]
        else:
            for m in re.finditer(r'"([a-z][a-z0-9-]+)"\s*:\s*\{', section):
                div_from_array[m.group(1)] = current_div

    for m in re.finditer(
        r'(?:"([a-z][a-z0-9-]+)"|([a-z][a-z0-9]*))\s*:\s*\{[^}]*local_authority:\s*"([^"]+)"',
        mc_text,
    ):
        slug = m.group(1) or m.group(2)
        la   = m.group(3)
        city = la_to_city.get(la, la)
        div  = div_from_array.get(slug, "premier-league")  # fallback
        out.append({
            "slug":     slug,
            "name":     name_map.get(slug, slug),
            "city":     city,
            "country":  "England",
            "division": EN_DIVISION_LABELS.get(div, div),
        })
    return out


def parse_eu_clubs() -> List[Dict]:
    import glob
    out = []
    for filepath in sorted(glob.glob(str(LIB_DIR / "*Clubs.ts"))):
        fname = Path(filepath).name
        if fname in ("clubs.ts", "japanClubs.ts"):
            continue
        text = Path(filepath).read_text()
        for m in re.finditer(
            r'slug:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"[^}]*?country:\s*"([^"]+)"'
            r'[^}]*?league:\s*"([^"]*)"[^}]*?city:\s*"([^"]*)"',
            text,
            re.DOTALL,
        ):
            slug, name, country, league, city = (
                m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
            )
            out.append({
                "slug":     slug,
                "name":     name,
                "city":     city if city else None,
                "country":  country,
                "division": league,
            })
    return out


def parse_japan_clubs() -> List[Dict]:
    text = (LIB_DIR / "japanClubs.ts").read_text()
    out  = []
    for div in ("J1", "J2", "J3"):
        sm = re.search(rf'const {div}_SLUGS[^=]*=\s*\[(.*?)\];', text, re.DOTALL)
        nm = re.search(rf'const {div}_NAMES[^=]*=\s*\[(.*?)\];', text, re.DOTALL)
        if not sm or not nm:
            continue
        slugs = re.findall(r'"([^"]+)"', sm.group(1))
        names = re.findall(r'"([^"]+)"', nm.group(1))
        div_label = JP_DIVISION_LABELS[div.lower()]
        for slug, name in zip(slugs, names):
            city = JAPAN_SLUG_TO_CITY.get(slug)
            out.append({
                "slug":     slug,
                "name":     name,
                "city":     city,
                "country":  "Japan",
                "division": div_label,
            })
    return out

# ─── TypeScript output ────────────────────────────────────────────────────────

TS_HEADER = """\
// AUTO-GENERATED by scripts/build_nearby_clubs.py — do not edit manually.
// Source: OpenStreetMap / Nominatim geocoding (https://nominatim.openstreetmap.org)
// Radius: 25 miles. "Nearby" means clubs in the Insight Eleven database only.

export type NearbyClub = {
  slug:           string;
  name:           string;
  division:       string;
  distance_miles: number;
};

export type MarketClassification = "Not Competitive" | "Competitive" | "Very Competitive";

export type NearbyClubsData = {
  clubs:          NearbyClub[];
  classification: MarketClassification;
};

export const nearbyClubs: Record<string, NearbyClubsData> = {
"""
TS_FOOTER = "};\n"


def classify(n: int) -> str:
    if n <= 1: return "Not Competitive"
    if n <= 4: return "Competitive"
    return "Very Competitive"


def fmt_nearby_entry(slug: str, nearby: List[Dict], classification: str) -> str:
    if not nearby:
        clubs_str = "[]"
    else:
        items = []
        for c in nearby:
            items.append(
                f'    {{ slug: {json.dumps(c["slug"])}, name: {json.dumps(c["name"])},'
                f' division: {json.dumps(c["division"])}, distance_miles: {c["distance_miles"]} }}'
            )
        clubs_str = "[\n" + ",\n".join(items) + "\n  ]"
    return (
        f'  "{slug}": {{\n'
        f'    clubs: {clubs_str},\n'
        f'    classification: "{classification}",\n'
        f'  }},'
    )

# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build lib/nearbyClubs.ts via Nominatim geocoding."
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Geocode clubs and print results — write nothing.")
    parser.add_argument("--region",  choices=["english", "eu", "japan"],
                        help="Process one region only.")
    parser.add_argument("--force",   action="store_true",
                        help="Re-geocode all clubs (ignore existing cache).")
    args = parser.parse_args()

    # ── Load coords cache ──
    coords_cache: Dict[str, Optional[Dict]] = {}
    if CACHE_PATH.exists() and not args.force:
        try:
            coords_cache = json.loads(CACHE_PATH.read_text())
            print(f"Loaded {len(coords_cache)} cached coordinates.")
        except json.JSONDecodeError:
            print("Cache invalid — starting fresh.")

    # ── Collect clubs ──
    all_clubs: List[Dict] = []
    if not args.region or args.region == "english":
        batch = parse_english_clubs()
        all_clubs.extend(batch)
        print(f"English clubs: {len(batch)}")
    if not args.region or args.region == "eu":
        batch = parse_eu_clubs()
        all_clubs.extend(batch)
        print(f"EU clubs:      {len(batch)}")
    if not args.region or args.region == "japan":
        batch = parse_japan_clubs()
        all_clubs.extend(batch)
        print(f"Japan clubs:   {len(batch)}")
    print(f"Total:         {len(all_clubs)}\n")

    # ── Geocode ──
    to_geocode = [c for c in all_clubs if c["slug"] not in coords_cache and c.get("city")]
    no_city    = [c for c in all_clubs if not c.get("city")]

    if to_geocode:
        est_min = len(to_geocode) * DELAY_SECONDS / 60
        print(f"Clubs to geocode: {len(to_geocode)}  (~{est_min:.0f} min)")
        if no_city:
            print(f"Clubs without city (skipped): {len(no_city)}")
        print()

        for i, c in enumerate(to_geocode):
            slug = c["slug"]
            city = GEOCODE_CITY_OVERRIDES.get(slug, c["city"])
            country = c["country"]
            print(f"  [{i+1:>3}/{len(to_geocode)}] {slug:<35}", end="  ", flush=True)
            result = geocode(c["name"], city, country)
            time.sleep(DELAY_SECONDS)

            if result:
                lat, lng, display = result
                coords_cache[slug] = {"lat": lat, "lng": lng, "display": display}
                print(f"✓  {lat:.4f}, {lng:.4f}  ({display[:50]})")
            else:
                coords_cache[slug] = None
                print(f"✗  geocode failed")

            # Save cache after each club
            if not args.dry_run:
                CACHE_PATH.write_text(json.dumps(coords_cache, indent=2, ensure_ascii=False))
    else:
        print("All clubs already geocoded (from cache).\n")

    if args.dry_run:
        # Print summary of what the full run would produce
        print(f"\n{'─'*70}")
        print(f"DRY RUN — proximity computation preview")
        print(f"{'─'*70}")
        ok     = sum(1 for v in coords_cache.values() if v)
        failed = sum(1 for v in coords_cache.values() if v is None)
        print(f"  Geocoded:     {ok}")
        print(f"  Failed:       {failed}")
        print(f"  No city:      {len(no_city)}")
        print(f"\nRe-run without --dry-run to compute proximity and write {OUTPUT_PATH}")
        return

    # ── Save coords cache ──
    CACHE_PATH.write_text(json.dumps(coords_cache, indent=2, ensure_ascii=False))

    # ── Build lookup: slug → club metadata ──
    slug_to_club: Dict[str, Dict] = {c["slug"]: c for c in all_clubs}

    # ── Compute proximity for each club ──
    print(f"\nComputing 10-mile proximity for {len(all_clubs)} clubs...")
    results: Dict[str, Dict] = {}

    for c in all_clubs:
        slug  = c["slug"]
        coord = coords_cache.get(slug)

        if not coord:
            results[slug] = {"clubs": [], "classification": "Monopoly"}
            continue

        lat1, lng1 = coord["lat"], coord["lng"]
        nearby: List[Dict] = []

        for other in all_clubs:
            if other["slug"] == slug:
                continue
            other_coord = coords_cache.get(other["slug"])
            if not other_coord:
                continue
            dist = haversine_miles(lat1, lng1, other_coord["lat"], other_coord["lng"])
            if dist <= RADIUS_MILES:
                nearby.append({
                    "slug":           other["slug"],
                    "name":           other["name"],
                    "division":       other["division"],
                    "distance_miles": round(dist, 1),
                })

        nearby.sort(key=lambda x: x["distance_miles"])
        classification = classify(len(nearby))
        results[slug] = {"clubs": nearby, "classification": classification}

    # ── Print proximity summary ──
    monopoly    = sum(1 for v in results.values() if v["classification"] == "Monopoly")
    competitive = sum(1 for v in results.values() if v["classification"] == "Competitive")
    crowded     = sum(1 for v in results.values() if v["classification"] == "Crowded")
    print(f"\nProximity results:")
    print(f"  Monopoly    (0 nearby):  {monopoly}")
    print(f"  Competitive (1–2):       {competitive}")
    print(f"  Crowded     (3+):        {crowded}")

    # Show most crowded markets
    top = sorted(results.items(), key=lambda x: -len(x[1]["clubs"]))[:10]
    print(f"\nMost competitive markets:")
    for slug, data in top:
        names = ", ".join(c["name"] for c in data["clubs"][:3])
        print(f"  {slug:<35} {len(data['clubs'])} nearby: {names}")

    # ── Write TypeScript ──
    lines = [TS_HEADER]
    for slug in sorted(results.keys()):
        d = results[slug]
        lines.append(fmt_nearby_entry(slug, d["clubs"], d["classification"]))
        lines.append("")
    lines.append(TS_FOOTER)
    OUTPUT_PATH.write_text("\n".join(lines))
    print(f"\nWritten: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
