"""Generate JapanPriorYear entries from J-League CSV files."""
import csv, json
from pathlib import Path

BASE = Path("/Users/olliecantrill/Downloads/Japan Club Finances")

def j(x):
    if x is None: return None
    return round((float(x) / 150) * 100) / 100

def wr(wage, rev):
    if not wage or not rev: return None
    return round((float(wage) / float(rev)) * 1000) / 10

def nd(tot_liab, curr_assets):
    if tot_liab is None or curr_assets is None: return None
    return j(float(tot_liab) - float(curr_assets))

def pn(s):
    if not s or str(s).strip() in ('', 'nega', '-'): return None
    try: return float(str(s).replace(',', '').strip())
    except: return None

def fmt_date(s):
    y, m = s.split('/')
    ld = {'01':'31','02':'28','03':'31','04':'30','05':'31','06':'30',
          '07':'31','08':'31','09':'30','10':'31','11':'30','12':'31'}.get(m,'30')
    return f"{y}-{m}-{ld}"

SLUG = {
    "Sapporo":"sapporo","Sendai":"sendai","Kashima":"kashima","Urawa":"urawa",
    "Kashiwa":"kashiwa","FC Tokyo":"fc-tokyo","Kawasaki Frontale":"kawasaki",
    "Yokohama FM":"yokohama-fm","Yokohama FC":"yokohama-fc","Shonan":"shonan",
    "Shimizu":"shimizu","Nagoya Grampus":"nagoya","Gamba Osaka":"gamba-osaka",
    "Cerezo Osaka":"cerezo-osaka","Vissel Kobe":"vissel-kobe","Hiroshima":"hiroshima",
    "Tokushima":"tokushima","Fukuoka":"fukuoka","Avispa Fukuoka":"fukuoka",
    "Tosu":"tosu","Oita":"oita",
    "Yamagata":"yamagata","Mito":"mito","Tochigi":"tochigi-sc","Gunma":"gunma",
    "Omiya":"omiya","Chiba":"chiba","Tokyo Verdy":"tokyo-verdy","Machida":"machida",
    "Kofu":"kofu","Matsumoto":"matsumoto","Niigata":"niigata","Kanazawa":"kanazawa",
    "Iwata":"iwata","Kyoto":"kyoto","Okayama":"okayama","Yamaguchi":"yamaguchi",
    "Ehime":"ehime","Kitakyushu":"kitakyushu","Nagasaki":"nagasaki","Ryukyu":"ryukyu",
    "Akita":"akita","Sagamihara":"sagamihara",
    "Hachinohe":"hachinohe","Fukushima":"fukushima-utd","Nagano":"nagano",
    "Toyama":"toyama","Gifu":"fc-gifu","FC Gifu":"fc-gifu","Fujeda":"fujeda",
    "Imabari":"imabari","Kumamoto":"kumamoto","Miyazaki":"miyazaki",
    "Kagoshima":"kagoshima","FC Osaka":"fc-osaka","Nara":"nara","Tottori":"tottori",
    # skip always
    "Iwate":None,"YS Yokohama":None,"Noto":None,"Kagawa":None,"Ibaraki":None,
}

# Per-file skip rules: {filename: set of (league, club) tuples}
FILE_SKIP = {
    "j_league_financials_2020.csv": {
        ("J1","Avispa Fukuoka"),  # was J2 in 2020, J1 entry is a data error
        ("J1","Tokushima"),       # was J2 in 2020, J1 entry is a data error
        ("J3","Kanazawa"),        # J3 Kanazawa is a duplicate of J2 Kanazawa
        ("J3","Noto"),            # skip per instructions
        ("J3","Kagawa"),          # skip per instructions
        ("J3","Kagoshima"),       # implausible revenue (7412 JPY m for J3), skip
    },
    "j_league_financials_2021.csv": {
        ("J3","Kanazawa"),        # J3 Kanazawa still a duplicate of J2 entry if present
    },
    "j_league_financials_2022.csv": {},  # J3 handled by skip_j3 flag below
}

def process(filename, skip_j3=False):
    path = BASE / filename
    results = {}  # slug → year_data (keyed on slug; first-seen wins for same slug)
    file_skip = FILE_SKIP.get(filename, set())

    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            league  = row['League'].strip()
            club    = row['Club'].strip()
            fy      = row['Fiscal_Year_End'].strip()

            if skip_j3 and league == "J3":
                continue
            if (league, club) in file_skip:
                continue

            slug = SLUG.get(club)
            if slug is None:
                continue
            if slug in results:
                continue  # keep first occurrence (higher league tier for duplicates)

            rev  = pn(row.get('Revenue'))
            wage = pn(row.get('Team_Personnel_Costs'))
            op   = pn(row.get('Operating_Income_Loss'))
            pt   = pn(row.get('Pre_Tax_Income_Loss'))
            ca   = pn(row.get('Current_Assets'))
            tl   = pn(row.get('Total_Liabilities'))

            if rev is None: continue

            results[slug] = {
                "fiscal_year_end": fmt_date(fy),
                "revenue":         j(rev),
                "wage_bill":       j(wage),
                "wage_ratio":      wr(wage, rev),
                "operating_profit":j(op),
                "profit_from_player_sales": None,
                "pre_tax_profit":  j(pt),
                "net_debt":        nd(tl, ca),
            }
    return results

# 2020 CSV = FY2020 season (fiscal year ending ~Jan 2021)
fy2020 = process("j_league_financials_2020.csv")
# 2021 CSV = FY2021 season (fiscal year ending ~Jan 2022)
fy2021 = process("j_league_financials_2021.csv")
# 2022 CSV = FY2022 season for J1/J2 (fiscal year ending ~Jan 2023)
# Skip J3 — their fiscal years in this file end in Jan/Dec 2024 (= FY2023, already in project)
fy2022 = process("j_league_financials_2022.csv", skip_j3=True)

all_slugs = sorted(set(list(fy2020) + list(fy2021) + list(fy2022)))

def ts_val(v):
    if v is None: return "null"
    return str(v)

def ts_entry(d):
    return (
        f'{{ fiscal_year_end: "{d["fiscal_year_end"]}", '
        f'revenue: {ts_val(d["revenue"])}, wage_bill: {ts_val(d["wage_bill"])}, '
        f'wage_ratio: {ts_val(d["wage_ratio"])}, '
        f'operating_profit: {ts_val(d["operating_profit"])}, '
        f'profit_from_player_sales: null, '
        f'pre_tax_profit: {ts_val(d["pre_tax_profit"])}, '
        f'net_debt: {ts_val(d["net_debt"])} }}'
    )

print("// ── Generated prior_years data (most-recent first, deduped by fiscal_year_end) ─")
print()
out = {}
for slug in all_slugs:
    # Build list most-recent-first, deduplicating by fiscal_year_end
    seen_dates = set()
    entries = []
    for src in [fy2022, fy2021, fy2020]:
        if slug in src:
            d = src[slug]
            if d["fiscal_year_end"] not in seen_dates:
                seen_dates.add(d["fiscal_year_end"])
                entries.append(d)
    if not entries: continue
    out[slug] = entries
    print(f'// {slug}')
    for e in entries:
        print(f'  {ts_entry(e)},')
    print()

with open("/tmp/japan_history.json", "w") as f:
    json.dump(out, f, indent=2)
print(f"// JSON written to /tmp/japan_history.json")
print(f"// Total slugs with historical data: {len(out)}")
