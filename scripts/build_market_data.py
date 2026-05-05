#!/usr/bin/env python3
"""
build_market_data.py

Matches every club in the Insight Eleven database to a GeoNames city record
and writes lib/marketData.ts (city name, population, lat/lng per slug).

Data source:  GeoNames cities1000 dataset — cities with population ≥ 1,000
              https://download.geonames.org/export/dump/cities1000.zip
              Creative Commons Attribution 4.0 (cc-by)
No API key required — one-time offline enrichment.

Usage:
    python scripts/build_market_data.py --dry-run          # print matches, write nothing
    python scripts/build_market_data.py                    # write lib/marketData.ts
    python scripts/build_market_data.py --region english   # one region only
    python scripts/build_market_data.py --region eu
    python scripts/build_market_data.py --region japan
"""

import argparse
import json
import re
import sys
import zipfile
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.request import urlretrieve

# ─── Paths ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR  = Path(__file__).parent
LIB_DIR      = SCRIPTS_DIR.parent / "lib"
DATA_DIR     = SCRIPTS_DIR / "data"
GEONAMES_ZIP = DATA_DIR / "cities1000.zip"
GEONAMES_TXT = DATA_DIR / "cities1000.txt"
OUTPUT_PATH  = LIB_DIR / "marketData.ts"
CACHE_PATH   = SCRIPTS_DIR / "market_data_cache.json"
GEONAMES_URL = "https://download.geonames.org/export/dump/cities1000.zip"

# ─── Country → ISO-2 ─────────────────────────────────────────────────────────

COUNTRY_TO_ISO2: Dict[str, str] = {
    "England":     "GB",
    "France":      "FR",
    "Germany":     "DE",
    "Italy":       "IT",
    "Spain":       "ES",
    "Austria":     "AT",
    "Switzerland": "CH",
    "Norway":      "NO",
    "Denmark":     "DK",
    "Sweden":      "SE",
    "Netherlands": "NL",
    "Belgium":     "BE",
    "Japan":       "JP",
}

# ─── Per-slug city search overrides ──────────────────────────────────────────
# GeoNames uses local spellings / longer forms; override where fuzzy matching
# would otherwise pick the wrong city.

CITY_SEARCH_OVERRIDES: Dict[str, str] = {
    # German/Austrian — GeoNames uses local spellings
    "1-fc-koeln":          "Köln",
    "1-fc-nuernberg":      "Nürnberg",
    "eintracht-frankfurt": "Frankfurt am Main",   # avoid Frankfurt (Oder)
    # Spanish — GeoNames uses bilingual "Gasteiz / Vitoria" for Vitoria-Gasteiz
    "deportivo-alaves":    "Gasteiz / Vitoria",
    # Swiss — GeoNames uses German name "Sitten" for Sion
    "fc-sion":             "Sitten",
    # Dutch — GeoNames needs exact compound names
    "almere-city":         "Almere Stad",
    "fc-den-bosch":        "'s-Hertogenbosch",
    "telstar":             "IJmuiden",
    # Danish — Brøndby has no standalone GeoNames entry; use named suburb
    "brondby-if":          "Brondby Strand",
    "lyngby-bk":           "Kongens Lyngby",
    # AS Monaco plays in France (Ligue 1) but Monaco city is country MC in GeoNames
    "as-monaco":           "Nice",
    # Japan — GeoNames appends "-shi" suffix to Japanese cities
    "nara":                "Nara-shi",
    # Austrian/German — GeoNames needs full compound names
    "sv-ried":             "Ried im Innkreis",
    "sv-07-elversberg":    "Spiesen-Elversberg",
}

# ─── English: local authority → city search term ──────────────────────────────
# Only entries that do NOT map directly to a searchable city name are listed.

LA_TO_CITY: Dict[str, str] = {
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
    "Brighton and Hove":             "Brighton",
    "Wirral":                        "Birkenhead",
}

# ─── Japan: slug → city (all 61 J-league clubs) ───────────────────────────────

JAPAN_SLUG_TO_CITY: Dict[str, str] = {
    # J1 (20)
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
    # J2 (20)
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
    # J3 (21)
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

# ─── GeoNames loader ──────────────────────────────────────────────────────────

GeonamesEntry = Dict  # type alias

def download_geonames() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    if GEONAMES_TXT.exists():
        print(f"  GeoNames cache: {GEONAMES_TXT} (already downloaded)")
        return
    print(f"  Downloading GeoNames cities1000 dataset (~20 MB)...")
    urlretrieve(GEONAMES_URL, GEONAMES_ZIP)
    print(f"  Extracting...")
    with zipfile.ZipFile(GEONAMES_ZIP) as zf:
        zf.extract("cities1000.txt", DATA_DIR)
    GEONAMES_ZIP.unlink(missing_ok=True)
    print(f"  Saved: {GEONAMES_TXT}")


def load_geonames() -> Dict[str, List[GeonamesEntry]]:
    """Return {country_code: [entries sorted by pop desc]}."""
    index: Dict[str, List[GeonamesEntry]] = {}
    with open(GEONAMES_TXT, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 15:
                continue
            cc  = parts[8]
            pop = int(parts[14]) if parts[14].isdigit() else 0
            index.setdefault(cc, []).append({
                "geonameid":    int(parts[0]),
                "name":         parts[1],
                "asciiname":    parts[2],
                "lat":          float(parts[4]),
                "lng":          float(parts[5]),
                "feature_code": parts[7],
                "cc":           cc,
                "pop":          pop,
            })
    for cc in index:
        index[cc].sort(key=lambda e: e["pop"], reverse=True)
    return index


def _score(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def find_city(
    city: str,
    country_code: str,
    index: Dict[str, List[GeonamesEntry]],
) -> Tuple[Optional[GeonamesEntry], float, str]:
    """
    Find best GeoNames entry for city in country.
    Returns (entry, score, match_type) where match_type in {'exact','ascii','fuzzy','none'}.
    """
    candidates = index.get(country_code, [])
    city_l = city.lower().strip()

    # Pass 1: exact match on name or asciiname (fast path)
    for e in candidates:
        if e["name"].lower() == city_l or e["asciiname"].lower() == city_l:
            return e, 1.0, "exact"

    # Pass 2: best fuzzy match
    best_e: Optional[GeonamesEntry] = None
    best_s = 0.0
    for e in candidates:
        s = max(_score(city, e["name"]), _score(city, e["asciiname"]))
        if s > best_s:
            best_s = s
            best_e = e
        if s >= 0.95:
            break  # good enough — stop early

    mtype = "fuzzy" if best_e else "none"
    return best_e, best_s, mtype

# ─── Club parsing ─────────────────────────────────────────────────────────────

def parse_english_clubs() -> List[Dict]:
    """Returns [{slug, name, city, country}] for English clubs."""
    # Derive club name from NAMES map in clubs.ts
    clubs_text = (LIB_DIR / "clubs.ts").read_text()
    names_match = re.search(r'const NAMES[^=]*=\s*\{(.*?)\};', clubs_text, re.DOTALL)
    name_map: Dict[str, str] = {}
    if names_match:
        for m in re.finditer(r'(?:"([a-z][a-z0-9-]*)"|([a-z][a-z0-9]*))\s*:\s*"([^"]+)"',
                              names_match.group(1)):
            slug = m.group(1) or m.group(2)
            name_map[slug] = m.group(3)

    # Local authority from marketContext.ts
    mc_text = (LIB_DIR / "marketContext.ts").read_text()
    out = []
    # Match both quoted slugs ("afc-wimbledon") and unquoted slugs (accrington).
    # [^}]* matches across newlines because } is not a newline char.
    for m in re.finditer(
        r'(?:"([a-z][a-z0-9-]+)"|([a-z][a-z0-9]*))\s*:\s*\{[^}]*local_authority:\s*"([^"]+)"',
        mc_text,
    ):
        slug = m.group(1) or m.group(2)
        la   = m.group(3)
        city = CITY_SEARCH_OVERRIDES.get(slug) or LA_TO_CITY.get(la, la)
        out.append({
            "slug":    slug,
            "name":    name_map.get(slug, slug),
            "city":    city,
            "country": "England",
        })
    return out


def parse_eu_clubs() -> List[Dict]:
    """Returns [{slug, name, city, country}] for EU clubs (uses city field)."""
    import glob
    out = []
    for filepath in sorted(glob.glob(str(LIB_DIR / "*Clubs.ts"))):
        fname = Path(filepath).name
        if fname in ("clubs.ts", "japanClubs.ts"):
            continue
        text = Path(filepath).read_text()
        # Match consecutive slug / name / country / city lines
        for m in re.finditer(
            r'slug:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"[^}]*?country:\s*"([^"]+)"[^}]*?(?:league:\s*"[^"]*"[^}]*?)?city:\s*"([^"]*)"',
            text,
            re.DOTALL,
        ):
            slug, name, country, city = m.group(1), m.group(2), m.group(3), m.group(4)
            if city:
                out.append({"slug": slug, "name": name, "city": city, "country": country})
            else:
                out.append({"slug": slug, "name": name, "city": None, "country": country})
    return out


def parse_japan_clubs() -> List[Dict]:
    """Returns [{slug, name, city, country}] for all J-league clubs."""
    text = (LIB_DIR / "japanClubs.ts").read_text()
    out  = []
    for div in ("J1", "J2", "J3"):
        sm = re.search(rf'const {div}_SLUGS[^=]*=\s*\[(.*?)\];', text, re.DOTALL)
        nm = re.search(rf'const {div}_NAMES[^=]*=\s*\[(.*?)\];', text, re.DOTALL)
        if not sm or not nm:
            continue
        slugs = re.findall(r'"([^"]+)"', sm.group(1))
        names = re.findall(r'"([^"]+)"', nm.group(1))
        for slug, name in zip(slugs, names):
            city = JAPAN_SLUG_TO_CITY.get(slug)
            out.append({"slug": slug, "name": name, "city": city, "country": "Japan"})
    return out

# ─── TypeScript output ────────────────────────────────────────────────────────

TS_HEADER = """\
// AUTO-GENERATED by scripts/build_market_data.py — do not edit manually.
// Source: GeoNames cities1000 dataset (https://www.geonames.org)
// Licence: Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0)

export type MarketData = {
  city:    string;
  country: string;
  pop_m:   number | null;  // GeoNames city population in millions (2 d.p.)
  lat:     number | null;
  lng:     number | null;
};

export const marketData: Record<string, MarketData> = {
"""
TS_FOOTER = "};\n"


def fmt_entry(slug: str, d: Dict) -> str:
    def v(x) -> str:
        if x is None: return "null"
        if isinstance(x, str): return json.dumps(x)
        return str(x)
    return (
        f'  "{slug}": {{'
        f' city: {v(d["city"])}, country: {v(d["country"])},'
        f' pop_m: {v(d["pop_m"])}, lat: {v(d["lat"])}, lng: {v(d["lng"])} }},'
    )

# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build lib/marketData.ts from GeoNames cities dataset."
    )
    parser.add_argument("--dry-run",  action="store_true",
                        help="Print matches only — write nothing.")
    parser.add_argument("--region",   choices=["english", "eu", "japan"],
                        help="Process one region only.")
    args = parser.parse_args()

    # ── Load GeoNames ──
    print("Loading GeoNames data...")
    download_geonames()
    index = load_geonames()
    total_cities = sum(len(v) for v in index.values())
    print(f"  {total_cities:,} cities loaded across {len(index)} countries.\n")

    # ── Collect clubs ──
    all_clubs: List[Dict] = []
    if not args.region or args.region == "english":
        batch = parse_english_clubs()
        all_clubs.extend(batch)
        print(f"English clubs parsed:  {len(batch)}")
    if not args.region or args.region == "eu":
        batch = parse_eu_clubs()
        all_clubs.extend(batch)
        print(f"EU clubs parsed:       {len(batch)}")
    if not args.region or args.region == "japan":
        batch = parse_japan_clubs()
        all_clubs.extend(batch)
        print(f"Japan clubs parsed:    {len(batch)}")
    print(f"Total:                 {len(all_clubs)}\n")

    # ── Match each club to GeoNames ──
    results: Dict[str, Dict] = {}
    high = medium = low = no_city = 0

    CONF_THRESHOLD_HIGH   = 0.90
    CONF_THRESHOLD_MEDIUM = 0.70

    if args.dry_run:
        print(f"{'─'*90}")
        print(f"{'SLUG':<35} {'SEARCH CITY':<22} {'GEONAMES MATCH':<22} {'POP':>10}  CONF")
        print(f"{'─'*90}")

    by_region: Dict[str, List] = {}
    for c in all_clubs:
        region = c["country"]
        by_region.setdefault(region, []).append(c)

    for region_name, clubs in by_region.items():
        if args.dry_run:
            print(f"\n[{region_name.upper()}]")

        for c in clubs:
            slug    = c["slug"]
            city    = c["city"]
            country = c["country"]
            iso2    = COUNTRY_TO_ISO2.get(country, "")

            city = CITY_SEARCH_OVERRIDES.get(slug, city)  # per-slug override

            if not city or not iso2:
                entry = {"city": city or "", "country": country, "pop_m": None, "lat": None, "lng": None}
                results[slug] = entry
                no_city += 1
                if args.dry_run:
                    print(f"  {slug:<33} {'NO CITY':>22}  {'—':>22}  {'—':>10}  ✗ NO_CITY")
                continue

            match, score, mtype = find_city(city, iso2, index)

            if match is None:
                entry = {"city": city, "country": country, "pop_m": None, "lat": None, "lng": None}
                conf_label = "✗ NO_MATCH"
                no_city += 1
            else:
                pop_m = round(match["pop"] / 1_000_000, 2) if match["pop"] else None
                entry = {
                    "city":    city,
                    "country": country,
                    "pop_m":   pop_m,
                    "lat":     round(match["lat"], 4),
                    "lng":     round(match["lng"], 4),
                }
                if score >= CONF_THRESHOLD_HIGH:
                    conf_label = "✓ HIGH"
                    high += 1
                elif score >= CONF_THRESHOLD_MEDIUM:
                    conf_label = f"~ MED ({score:.2f})"
                    medium += 1
                else:
                    conf_label = f"✗ LOW ({score:.2f})"
                    low += 1

            results[slug] = entry

            if args.dry_run:
                match_name = match["asciiname"] if match else "—"
                pop_str    = f"{match['pop']:,}" if match and match["pop"] else "—"
                print(
                    f"  {slug:<33}  {city:<20}  {match_name:<20}  {pop_str:>10}  {conf_label}"
                )

    # ── Summary ──
    total = len(results)
    print(f"\n{'─'*90}")
    print(f"Summary:  {total} clubs total")
    print(f"  High confidence:    {high}  ({100*high//total if total else 0}%)")
    print(f"  Medium confidence:  {medium}")
    print(f"  Low confidence:     {low}")
    print(f"  No city / no match: {no_city}")

    if args.dry_run:
        print(f"\nDRY RUN — no files written.")
        print(f"Re-run without --dry-run to write {OUTPUT_PATH}")
        return

    # ── Write TypeScript ──
    lines = [TS_HEADER]
    for slug in sorted(results.keys()):
        lines.append(fmt_entry(slug, results[slug]))
    lines.append("")
    lines.append(TS_FOOTER)
    OUTPUT_PATH.write_text("\n".join(lines))
    print(f"\nWritten: {OUTPUT_PATH}")

    # ── Write JSON cache ──
    CACHE_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"Cache:   {CACHE_PATH}")


if __name__ == "__main__":
    main()
