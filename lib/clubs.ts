export type Division = "premier-league" | "championship";

export interface ClubFinancials {
  slug: string;
  name: string;
  division: Division;
  revenue: number | null;
  wage_bill: number | null;
  operating_profit: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
  cash: number | null;
  fiscal_year_end: string;
  wage_ratio: number | null;
}

export const METRICS: { key: keyof ClubFinancials; label: string; description: string }[] = [
  { key: "revenue",          label: "Revenue",           description: "Total revenue / turnover" },
  { key: "wage_bill",        label: "Wage Bill",         description: "Total staff costs" },
  { key: "operating_profit", label: "Operating Profit",  description: "Profit / loss from operations" },
  { key: "pre_tax_profit",   label: "Pre-tax Profit",    description: "Profit / loss before tax" },
  { key: "net_debt",         label: "Net Debt",          description: "Net debt (negative = net cash)" },
  { key: "cash",             label: "Cash",              description: "Cash and equivalents at year end" },
  { key: "wage_ratio",       label: "Wage Ratio",        description: "Wage bill as % of revenue" },
];

type RawEntry = Omit<ClubFinancials, "slug" | "name" | "division" | "wage_ratio">;

const plRaw: Record<string, RawEntry> = {
  arsenal:        { revenue: 643.29, wage_bill: 331.23, operating_profit:  -38.51, pre_tax_profit:  25.20, net_debt:  292.59, cash:   32.53, fiscal_year_end: "2025-05-31" },
  aston_villa:    { revenue: 246.81, wage_bill: 230.82, operating_profit:  -93.94, pre_tax_profit: -35.40, net_debt:   20.45, cash:    0.00, fiscal_year_end: "2024-06-30" },
  bournemouth:    { revenue: 181.72, wage_bill: 158.42, operating_profit:   28.27, pre_tax_profit:  14.89, net_debt:  146.64, cash:   47.24, fiscal_year_end: "2025-06-30" },
  brentford:      { revenue: 173.08, wage_bill: 130.78, operating_profit:  -12.76, pre_tax_profit: -20.53, net_debt:  130.10, cash:    1.98, fiscal_year_end: "2025-06-30" },
  brighton:       { revenue: 221.06, wage_bill: 158.68, operating_profit:  -31.31, pre_tax_profit: -32.01, net_debt:  -39.84, cash:   39.84, fiscal_year_end: "2025-06-30" },
  chelsea:        { revenue: 415.01, wage_bill: 296.50, operating_profit: -205.68, pre_tax_profit: -64.74, net_debt: 1641.87, cash:    0.00, fiscal_year_end: "2024-06-30" },
  crystal_palace: { revenue: 189.31, wage_bill: 132.44, operating_profit:  -20.00, pre_tax_profit: -33.56, net_debt:  147.27, cash:    8.86, fiscal_year_end: "2024-06-30" },
  everton:        { revenue: 186.90, wage_bill: 156.63, operating_profit:  -92.69, pre_tax_profit: -53.22, net_debt:  567.35, cash:   26.42, fiscal_year_end: "2024-06-30" },
  fulham:         { revenue: 181.56, wage_bill: 154.75, operating_profit:  -69.46, pre_tax_profit: -31.21, net_debt:   11.63, cash:   32.77, fiscal_year_end: "2024-06-30" },
  ipswich:        { revenue: 155.42, wage_bill:  77.14, operating_profit:   -6.21, pre_tax_profit:   4.01, net_debt:   -4.59, cash:   13.67, fiscal_year_end: "2025-06-30" },
  leicester:      { revenue: 105.35, wage_bill: 107.16, operating_profit:   -8.98, pre_tax_profit: -19.43, net_debt:  199.25, cash:    7.09, fiscal_year_end: "2024-06-30" },
  liverpool:      { revenue: 702.72, wage_bill: 427.73, operating_profit:   23.76, pre_tax_profit:  15.21, net_debt:  282.72, cash:    2.54, fiscal_year_end: "2025-05-31" },
  man_city:       { revenue: 694.09, wage_bill: 408.40, operating_profit:  -93.30, pre_tax_profit:  -9.92, net_debt:    null, cash:  173.72, fiscal_year_end: "2025-06-30" },
  man_united:     { revenue: 600.65, wage_bill: 328.23, operating_profit:  -12.86, pre_tax_profit: -32.75, net_debt:  562.49, cash:   74.15, fiscal_year_end: "2025-06-30" },
  newcastle:      { revenue: 320.31, wage_bill: 218.74, operating_profit:    1.21, pre_tax_profit: -11.08, net_debt:   34.29, cash:   15.43, fiscal_year_end: "2024-06-30" },
  nottm_forest:   { revenue: 221.75, wage_bill: 166.65, operating_profit:  -64.93, pre_tax_profit: -78.92, net_debt:   85.58, cash:   13.22, fiscal_year_end: "2025-06-30" },
  southampton:    { revenue: 157.52, wage_bill: 113.96, operating_profit:  -62.25, pre_tax_profit: -45.29, net_debt:   -9.35, cash:    9.35, fiscal_year_end: "2025-06-30" },
  tottenham:      { revenue: 528.19, wage_bill: 221.93, operating_profit:  -61.02, pre_tax_profit: -26.03, net_debt:  772.47, cash:   78.97, fiscal_year_end: "2024-06-30" },
  west_ham:       { revenue: 226.06, wage_bill: 173.34, operating_profit: -109.47, pre_tax_profit:-108.84, net_debt:   19.77, cash:    0.42, fiscal_year_end: "2025-05-31" },
  wolves:         { revenue: 171.98, wage_bill: 162.09, operating_profit: -117.30, pre_tax_profit: -11.63, net_debt:   67.96, cash:   33.44, fiscal_year_end: "2025-06-30" },
};

// Championship 2024/25 — from Companies House annual accounts
const chRaw: Record<string, RawEntry> = {
  blackburn:     { revenue:  23.70, wage_bill:  28.22, operating_profit:  -21.41, pre_tax_profit:  -10.42, net_debt:  151.39, cash:   0.26, fiscal_year_end: "2025-06-30" },
  bristol_city:  { revenue:  24.06, wage_bill:  25.85, operating_profit:  -18.84, pre_tax_profit:  -13.15, net_debt:   20.74, cash:   0.03, fiscal_year_end: "2025-06-30" },
  burnley:       { revenue: 133.57, wage_bill:  93.42, operating_profit:  -11.99, pre_tax_profit:  -28.95, net_debt:  103.48, cash:   8.91, fiscal_year_end: "2024-07-31" },
  cardiff:       { revenue:  25.76, wage_bill:  38.95, operating_profit:  -27.49, pre_tax_profit:  -34.48, net_debt:  132.92, cash:   1.38, fiscal_year_end: "2025-05-31" },
  coventry:      { revenue:  34.15, wage_bill:  26.48, operating_profit:  -24.78, pre_tax_profit:  -21.60, net_debt:   49.40, cash:   0.37, fiscal_year_end: "2025-05-31" },
  derby:         { revenue:  31.87, wage_bill:  31.53, operating_profit:  -11.07, pre_tax_profit:  -11.07, net_debt:   61.89, cash:   1.62, fiscal_year_end: "2025-06-30" },
  hull:          { revenue:  25.82, wage_bill:  36.68, operating_profit:   -8.63, pre_tax_profit:  -10.22, net_debt:   76.47, cash:   0.09, fiscal_year_end: "2025-06-30" },
  leeds:         { revenue: 127.56, wage_bill:  84.03, operating_profit:  -76.25, pre_tax_profit:  -60.81, net_debt:   55.29, cash:   5.01, fiscal_year_end: "2024-06-30" },
  luton:         { revenue:  66.82, wage_bill:  39.50, operating_profit:   17.15, pre_tax_profit:   17.87, net_debt:   -1.34, cash:   1.34, fiscal_year_end: "2025-06-30" },
  middlesbrough: { revenue:  32.48, wage_bill:  36.36, operating_profit:  -10.34, pre_tax_profit:  -11.42, net_debt:   11.37, cash:   0.16, fiscal_year_end: "2025-06-30" },
  millwall:      { revenue:  23.86, wage_bill:  28.63, operating_profit:    1.05, pre_tax_profit:    0.18, net_debt:    null, cash:   0.79, fiscal_year_end: "2025-06-30" },
  norwich:       { revenue:  39.28, wage_bill:  48.08, operating_profit:  -14.38, pre_tax_profit:  -20.67, net_debt:   54.43, cash:   2.00, fiscal_year_end: "2025-06-30" },
  oxford_utd:    { revenue:  19.00, wage_bill:  21.66, operating_profit:  -17.46, pre_tax_profit:  -17.48, net_debt:   -0.21, cash:   0.24, fiscal_year_end: "2025-06-30" },
  plymouth:      { revenue:  28.83, wage_bill:  21.25, operating_profit:    0.22, pre_tax_profit:    0.32, net_debt:    0.07, cash:   2.68, fiscal_year_end: "2025-06-30" },
  portsmouth:    { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:   0.00, fiscal_year_end: "2025-08-31" },
  preston:       { revenue:  18.88, wage_bill:  25.67, operating_profit:  -16.02, pre_tax_profit:  -15.98, net_debt:    null, cash:   2.37, fiscal_year_end: "2025-06-30" },
  qpr:           { revenue:  31.37, wage_bill:  23.42, operating_profit:   -1.67, pre_tax_profit:    0.20, net_debt:    6.14, cash:   0.07, fiscal_year_end: "2025-05-31" },
  sheff_utd:     { revenue:  79.33, wage_bill:  45.97, operating_profit:  -16.64, pre_tax_profit:    2.59, net_debt:   53.68, cash:   2.78, fiscal_year_end: "2025-06-30" },
  sheff_wed:     { revenue:  26.34, wage_bill:  21.81, operating_profit:   -9.26, pre_tax_profit:  -10.01, net_debt:    6.85, cash:   0.16, fiscal_year_end: "2024-07-31" },
  stoke:         { revenue:  35.44, wage_bill:  30.30, operating_profit:  -29.54, pre_tax_profit:  -28.31, net_debt:  158.00, cash:  25.52, fiscal_year_end: "2025-05-31" },
  sunderland:    { revenue:  39.42, wage_bill:  52.90, operating_profit:   -0.33, pre_tax_profit:   -3.28, net_debt:    4.51, cash:  20.71, fiscal_year_end: "2025-07-31" },
  swansea:       { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:   null, fiscal_year_end: "2025-06-30" },
  watford:       { revenue:  25.98, wage_bill:  28.12, operating_profit:  -12.47, pre_tax_profit:  -15.95, net_debt:   57.90, cash:   1.31, fiscal_year_end: "2025-06-30" },
  west_brom:     { revenue:  30.35, wage_bill:  37.05, operating_profit:  -20.25, pre_tax_profit:  -19.99, net_debt:   71.85, cash:   0.47, fiscal_year_end: "2025-06-30" },
};

const NAMES: Record<string, string> = {
  // Premier League
  arsenal: "Arsenal",             aston_villa: "Aston Villa",
  bournemouth: "Bournemouth",     brentford: "Brentford",
  brighton: "Brighton",           chelsea: "Chelsea",
  crystal_palace: "Crystal Palace", everton: "Everton",
  fulham: "Fulham",               ipswich: "Ipswich Town",
  leicester: "Leicester City",    liverpool: "Liverpool",
  man_city: "Man City",           man_united: "Man United",
  newcastle: "Newcastle Utd",     nottm_forest: "Nott'm Forest",
  southampton: "Southampton",     tottenham: "Tottenham",
  west_ham: "West Ham",           wolves: "Wolves",
  // Championship
  blackburn: "Blackburn Rovers",  bristol_city: "Bristol City",
  burnley: "Burnley",             cardiff: "Cardiff City",
  coventry: "Coventry City",      derby: "Derby County",
  hull: "Hull City",              leeds: "Leeds United",
  luton: "Luton Town",            middlesbrough: "Middlesbrough",
  millwall: "Millwall",           norwich: "Norwich City",
  oxford_utd: "Oxford United",    plymouth: "Plymouth Argyle",
  portsmouth: "Portsmouth",       preston: "Preston NE",
  qpr: "QPR",                     sheff_utd: "Sheffield Utd",
  sheff_wed: "Sheffield Wed",     stoke: "Stoke City",
  sunderland: "Sunderland",       swansea: "Swansea City",
  watford: "Watford",             west_brom: "West Brom",
};

function makeClubs(raw: Record<string, RawEntry>, division: Division): ClubFinancials[] {
  return Object.entries(raw).map(([slug, d]) => ({
    slug,
    name: NAMES[slug],
    division,
    ...d,
    wage_ratio:
      d.revenue && d.wage_bill ? Math.round((d.wage_bill / d.revenue) * 1000) / 10 : null,
  }));
}

export const clubs: ClubFinancials[] = [
  ...makeClubs(plRaw, "premier-league"),
  ...makeClubs(chRaw, "championship"),
];

export function getClub(slug: string): ClubFinancials | undefined {
  return clubs.find((c) => c.slug === slug);
}

export function fmt(value: number | null, isRatio = false): string {
  if (value === null || value === undefined) return "—";
  if (isRatio) return `${value.toFixed(1)}%`;
  const abs = Math.abs(value);
  return `${value < 0 ? "-" : ""}£${abs.toFixed(1)}m`;
}
