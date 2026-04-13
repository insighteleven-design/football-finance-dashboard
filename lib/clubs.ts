export type Division = "premier-league" | "championship" | "league-one" | "league-two";

export type DataConfidence = "high" | "medium" | "low" | "abridged";

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
  /** "high" = web-validated, "medium" = extracted from accounts, "low" = abbreviated/no data */
  data_confidence: DataConfidence;
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

type RawEntry = Omit<ClubFinancials, "slug" | "name" | "division" | "wage_ratio" | "data_confidence"> & {
  data_confidence?: DataConfidence;
};

// ─── Premier League 2025/26 ───────────────────────────────────────────────────
// Promoted: Burnley, Leeds United, Sunderland (from Championship)
// Relegated: Ipswich Town, Leicester City, Southampton (to Championship)
const plRaw: Record<string, RawEntry> = {
  arsenal:        { revenue: 690.30, wage_bill: 346.80, operating_profit:  -38.51, pre_tax_profit:   -1.30, net_debt:  292.59, cash:   32.53, fiscal_year_end: "2025-05-31" },
  aston_villa:    { revenue: 276.00, wage_bill: 252.00, operating_profit:  -93.94, pre_tax_profit:  -86.00, net_debt:   20.45, cash:    0.00, fiscal_year_end: "2024-06-30" },
  bournemouth:    { revenue: 181.72, wage_bill: 158.42, operating_profit:   28.27, pre_tax_profit:   14.89, net_debt:  146.64, cash:   47.24, fiscal_year_end: "2025-06-30" },
  brentford:      { revenue: 173.08, wage_bill: 130.78, operating_profit:  -12.76, pre_tax_profit:  -20.53, net_debt:  130.10, cash:    1.98, fiscal_year_end: "2025-06-30" },
  brighton:       { revenue: 221.06, wage_bill: 158.68, operating_profit:  -31.31, pre_tax_profit:  -55.80, net_debt:  -39.84, cash:   39.84, fiscal_year_end: "2025-06-30" },
  burnley:        { revenue: 133.57, wage_bill:  93.42, operating_profit:  -11.99, pre_tax_profit:  -28.95, net_debt:  103.48, cash:    8.91, fiscal_year_end: "2024-07-31" },
  chelsea:        { revenue: 468.50, wage_bill: 338.00, operating_profit: -205.68, pre_tax_profit:  128.40, net_debt: 1641.87, cash:    0.00, fiscal_year_end: "2024-06-30" },
  crystal_palace: { revenue: 189.31, wage_bill: 132.44, operating_profit:  -20.00, pre_tax_profit:  -33.56, net_debt:  147.27, cash:    8.86, fiscal_year_end: "2024-06-30" },
  everton:        { revenue: 186.90, wage_bill: 156.63, operating_profit:  -92.69, pre_tax_profit:  -53.22, net_debt:  567.35, cash:   26.42, fiscal_year_end: "2024-06-30" },
  fulham:         { revenue: 181.56, wage_bill: 154.75, operating_profit:  -69.46, pre_tax_profit:  -31.21, net_debt:   11.63, cash:   32.77, fiscal_year_end: "2024-06-30" },
  leeds:          { revenue: 127.56, wage_bill:  84.03, operating_profit:  -76.25, pre_tax_profit:  -60.81, net_debt:   55.29, cash:    5.01, fiscal_year_end: "2024-06-30" },
  liverpool:      { revenue: 702.72, wage_bill: 427.73, operating_profit:   23.76, pre_tax_profit:   15.21, net_debt:  282.72, cash:    2.54, fiscal_year_end: "2025-05-31" },
  man_city:       { revenue: 694.09, wage_bill: 408.40, operating_profit:  -93.30, pre_tax_profit:   -9.92, net_debt:    null, cash:  173.72, fiscal_year_end: "2025-06-30" },
  man_united:     { revenue: 666.50, wage_bill: 328.23, operating_profit:  -12.86, pre_tax_profit:  -39.70, net_debt:  562.49, cash:   74.15, fiscal_year_end: "2025-06-30" },
  newcastle:      { revenue: 320.31, wage_bill: 218.74, operating_profit:    1.21, pre_tax_profit:  -11.08, net_debt:   34.29, cash:   15.43, fiscal_year_end: "2024-06-30" },
  nottm_forest:   { revenue: 221.75, wage_bill: 166.65, operating_profit:  -64.93, pre_tax_profit:  -78.92, net_debt:   85.58, cash:   13.22, fiscal_year_end: "2025-06-30" },
  sunderland:     { revenue:  39.42, wage_bill:  52.90, operating_profit:   -0.33, pre_tax_profit:   -3.28, net_debt:    4.51, cash:   20.71, fiscal_year_end: "2025-07-31" },
  tottenham:      { revenue: 528.19, wage_bill: 221.93, operating_profit:  -61.02, pre_tax_profit:  -26.03, net_debt:  772.47, cash:   78.97, fiscal_year_end: "2024-06-30" },
  west_ham:       { revenue: 226.06, wage_bill: 173.34, operating_profit: -109.47, pre_tax_profit: -108.84, net_debt:   19.77, cash:    0.42, fiscal_year_end: "2025-05-31" },
  wolves:         { revenue: 171.98, wage_bill: 162.09, operating_profit: -117.30, pre_tax_profit:  -15.30, net_debt:   67.96, cash:   33.44, fiscal_year_end: "2025-06-30" },
};

// ─── Championship 2025/26 ─────────────────────────────────────────────────────
// Promoted to PL: Burnley, Leeds United, Sunderland
// Relegated from PL: Ipswich Town, Leicester City, Southampton
// Promoted from L1: Birmingham City, Charlton Athletic, Wrexham
// Relegated to L1: Cardiff City, Luton Town, Plymouth Argyle
const chRaw: Record<string, RawEntry> = {
  birmingham:     { revenue:  35.64, wage_bill:  35.70, operating_profit:  -39.42, pre_tax_profit:  -34.56, net_debt:  183.16, cash:   14.23, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  blackburn:      { revenue:  23.70, wage_bill:  28.22, operating_profit:  -21.41, pre_tax_profit:  -10.42, net_debt:  151.39, cash:    0.26, fiscal_year_end: "2025-06-30" },
  bristol_city:   { revenue:  40.30, wage_bill:  35.90, operating_profit:  -18.84, pre_tax_profit:  -18.60, net_debt:   20.74, cash:    0.03, fiscal_year_end: "2025-06-30" },
  charlton:       { revenue:  11.17, wage_bill:  15.71, operating_profit:  -16.83, pre_tax_profit:  -15.39, net_debt:   31.45, cash:    0.46, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  coventry:       { revenue:  34.15, wage_bill:  26.48, operating_profit:  -24.78, pre_tax_profit:  -21.60, net_debt:   49.40, cash:    0.37, fiscal_year_end: "2025-05-31" },
  derby:          { revenue:  31.87, wage_bill:  31.53, operating_profit:  -11.07, pre_tax_profit:  -11.07, net_debt:   61.89, cash:    1.62, fiscal_year_end: "2025-06-30" },
  hull:           { revenue:  25.82, wage_bill:  36.68, operating_profit:   -8.63, pre_tax_profit:  -10.22, net_debt:   76.47, cash:    0.09, fiscal_year_end: "2025-06-30" },
  ipswich:        { revenue: 155.42, wage_bill:  77.14, operating_profit:   -6.21, pre_tax_profit:    4.01, net_debt:   -4.59, cash:   13.67, fiscal_year_end: "2025-06-30" },
  leicester:      { revenue: 105.35, wage_bill: 107.16, operating_profit:   -8.98, pre_tax_profit:  -19.43, net_debt:  199.25, cash:    7.09, fiscal_year_end: "2024-06-30" },
  middlesbrough:  { revenue:  32.48, wage_bill:  36.36, operating_profit:  -10.34, pre_tax_profit:  -11.42, net_debt:   11.37, cash:    0.16, fiscal_year_end: "2025-06-30" },
  millwall:       { revenue:  29.30, wage_bill:  28.63, operating_profit:    1.05, pre_tax_profit:   -0.30, net_debt:    null, cash:    0.79, fiscal_year_end: "2025-06-30" },
  norwich:        { revenue:  39.28, wage_bill:  48.08, operating_profit:  -14.38, pre_tax_profit:  -20.67, net_debt:   54.43, cash:    2.00, fiscal_year_end: "2025-06-30" },
  oxford_utd:     { revenue:  19.00, wage_bill:  21.66, operating_profit:  -17.46, pre_tax_profit:  -17.48, net_debt:   -0.21, cash:    0.24, fiscal_year_end: "2025-06-30" },
  portsmouth:     { revenue:  24.57, wage_bill:  17.43, operating_profit:   -1.45, pre_tax_profit:   -4.36, net_debt:    6.15, cash:    2.04, fiscal_year_end: "2025-06-30", data_confidence: "medium" },
  preston:        { revenue:  18.88, wage_bill:  25.67, operating_profit:  -16.02, pre_tax_profit:  -15.98, net_debt:    null, cash:    2.37, fiscal_year_end: "2025-06-30" },
  qpr:            { revenue:  28.00, wage_bill:  27.50, operating_profit:   -1.67, pre_tax_profit:  -20.30, net_debt:    6.14, cash:    0.07, fiscal_year_end: "2025-05-31" },
  sheff_utd:      { revenue:  79.33, wage_bill:  45.97, operating_profit:  -16.64, pre_tax_profit:    2.59, net_debt:   53.68, cash:    2.78, fiscal_year_end: "2025-06-30" },
  sheff_wed:      { revenue:  26.34, wage_bill:  21.81, operating_profit:   -9.26, pre_tax_profit:  -10.01, net_debt:    6.85, cash:    0.16, fiscal_year_end: "2024-07-31" },
  southampton:    { revenue: 157.52, wage_bill: 113.96, operating_profit:  -62.25, pre_tax_profit:  -53.90, net_debt:   -9.35, cash:    9.35, fiscal_year_end: "2025-06-30" },
  stoke:          { revenue:  35.44, wage_bill:  30.30, operating_profit:  -29.54, pre_tax_profit:  -28.31, net_debt:  158.00, cash:   25.52, fiscal_year_end: "2025-05-31" },
  swansea:        { revenue:  21.54, wage_bill:  27.35, operating_profit:  -25.20, pre_tax_profit:  -15.19, net_debt:   -1.62, cash:    5.31, fiscal_year_end: "2024-06-30", data_confidence: "medium" },
  watford:        { revenue:  25.98, wage_bill:  28.12, operating_profit:  -12.47, pre_tax_profit:  -15.95, net_debt:   57.90, cash:    1.31, fiscal_year_end: "2025-06-30" },
  west_brom:      { revenue:  30.35, wage_bill:  37.05, operating_profit:  -20.25, pre_tax_profit:  -17.00, net_debt:   71.85, cash:    0.47, fiscal_year_end: "2025-06-30" },
  wrexham:        { revenue:  33.34, wage_bill:  19.95, operating_profit:  -14.85, pre_tax_profit:  -15.24, net_debt:   -2.66, cash:    3.32, fiscal_year_end: "2025-06-30", data_confidence: "high" },
};

// ─── League One 2025/26 ───────────────────────────────────────────────────────
// Promoted to Championship: Birmingham City, Charlton Athletic, Wrexham
// Relegated from Championship: Cardiff City, Luton Town, Plymouth Argyle
// Promoted from L2: AFC Wimbledon, Bradford City, Doncaster Rovers, Port Vale
// Relegated to L2: Bristol Rovers, Cambridge Utd, Crawley Town, Shrewsbury Town
const l1Raw: Record<string, RawEntry> = {
  afc_wimbledon:  { revenue:   9.78, wage_bill:   5.74, operating_profit:   -1.40, pre_tax_profit:   -1.30, net_debt:   -1.26, cash:    1.34, fiscal_year_end: "2025-06-30" },
  barnsley:       { revenue:  10.28, wage_bill:  11.46, operating_profit:   -6.28, pre_tax_profit:   -6.58, net_debt:   -0.88, cash:    0.88, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  blackpool:      { revenue:  10.90, wage_bill:  10.97, operating_profit:   -8.40, pre_tax_profit:   -5.60, net_debt:   16.45, cash:    1.42, fiscal_year_end: "2025-06-30" },
  bolton:         { revenue:  20.46, wage_bill:  18.47, operating_profit:  -13.96, pre_tax_profit:  -14.36, net_debt:    5.50, cash:    0.46, fiscal_year_end: "2025-06-30", data_confidence: "medium" },
  bradford:       { revenue:   8.69, wage_bill:   null, operating_profit:   -2.98, pre_tax_profit:   -2.99, net_debt:    5.40, cash:    0.17, fiscal_year_end: "2025-06-30" },
  burton:         { revenue:   6.41, wage_bill:   8.23, operating_profit:   -8.58, pre_tax_profit:   -8.34, net_debt:   -0.66, cash:    0.67, fiscal_year_end: "2025-06-30" },
  cardiff:        { revenue:  25.76, wage_bill:  38.95, operating_profit:  -27.49, pre_tax_profit:  -34.48, net_debt:  132.92, cash:    1.38, fiscal_year_end: "2025-05-31", data_confidence: "high" },
  doncaster:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.26, cash:    null, fiscal_year_end: "2025-05-31" },
  exeter:         { revenue:   8.21, wage_bill:   6.88, operating_profit:   -4.39, pre_tax_profit:    0.53, net_debt:   -0.35, cash:    0.35, fiscal_year_end: "2025-06-30" },
  huddersfield:   { revenue:  10.63, wage_bill:  16.89, operating_profit:  -20.06, pre_tax_profit:  -22.39, net_debt:   79.35, cash:    3.23, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  leyton_orient:  { revenue:   9.43, wage_bill:   null, operating_profit:   -4.62, pre_tax_profit:   -4.61, net_debt:    0.90, cash:    0.74, fiscal_year_end: "2025-06-30" },
  lincoln:        { revenue:   8.48, wage_bill:   7.53, operating_profit:   -2.87, pre_tax_profit:   -2.88, net_debt:   -0.99, cash:    1.61, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  luton:          { revenue:  66.82, wage_bill:  39.50, operating_profit:   17.15, pre_tax_profit:   14.30, net_debt:   -1.34, cash:    1.34, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  mansfield:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    0.13, fiscal_year_end: "2025-06-30" },
  northampton:    { revenue:   7.54, wage_bill:   6.22, operating_profit:   -3.00, pre_tax_profit:   -3.00, net_debt:   13.32, cash:    0.20, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  peterborough:   { revenue:  15.92, wage_bill:   8.52, operating_profit:    4.22, pre_tax_profit:    2.91, net_debt:   17.64, cash:    0.15, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  plymouth:       { revenue:  28.83, wage_bill:  21.25, operating_profit:    0.22, pre_tax_profit:    0.32, net_debt:    0.07, cash:    2.68, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  port_vale:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   19.53, cash:    0.17, fiscal_year_end: "2025-06-30" },
  reading:        { revenue:   9.81, wage_bill:  12.41, operating_profit:   -3.76, pre_tax_profit:   -3.88, net_debt:  103.85, cash:    0.27, fiscal_year_end: "2025-06-30" },
  rotherham:      { revenue:  19.17, wage_bill:  12.95, operating_profit:   -1.70, pre_tax_profit:   -1.70, net_debt:   -0.02, cash:    0.97, fiscal_year_end: "2024-06-30", data_confidence: "high" },
  stevenage:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.21, cash:    0.17, fiscal_year_end: "2025-05-31" },
  stockport:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.61, cash:    0.48, fiscal_year_end: "2025-06-30" },
  wigan:          { revenue:   7.25, wage_bill:   8.90, operating_profit:   -7.97, pre_tax_profit:   -0.40, net_debt:   18.73, cash:    0.60, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  wycombe:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   18.69, cash:    1.79, fiscal_year_end: "2025-06-30" },
};

// ─── League Two 2025/26 ───────────────────────────────────────────────────────
// Promoted to L1: AFC Wimbledon, Bradford City, Doncaster Rovers, Port Vale
// Relegated from L1: Bristol Rovers, Cambridge Utd, Crawley Town, Shrewsbury Town
// Promoted from National League: Barnet, Oldham Athletic
// Relegated to National League: Carlisle Utd, Morecambe (+ 2 others)
const l2Raw: Record<string, RawEntry> = {
  accrington:     { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    5.65, cash:    0.16, fiscal_year_end: "2025-06-30" },
  barnet:         { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    null, fiscal_year_end: "2025-06-30" },
  barrow:         { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    null, fiscal_year_end: "2025-04-30", data_confidence: "abridged" },
  bristol_rovers: { revenue:   8.11, wage_bill:   8.91, operating_profit:   -6.47, pre_tax_profit:   -7.90, net_debt:   -0.77, cash:    1.31, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  bromley:        { revenue:   5.27, wage_bill:   null, operating_profit:   -1.06, pre_tax_profit:   -1.09, net_debt:    0.42, cash:    0.50, fiscal_year_end: "2024-12-31" },
  cambridge:      { revenue:   9.25, wage_bill:   6.66, operating_profit:   -3.74, pre_tax_profit:   -3.74, net_debt:   -0.26, cash:    0.30, fiscal_year_end: "2025-06-30" },
  cheltenham:     { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.13, cash:    0.55, fiscal_year_end: "2025-05-31" },
  chesterfield:   { revenue:   7.80, wage_bill:   6.04, operating_profit:   -2.22, pre_tax_profit:   -2.38, net_debt:    2.27, cash:    1.48, fiscal_year_end: "2025-06-30", data_confidence: "medium" },
  colchester:     { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   40.02, cash:    0.15, fiscal_year_end: "2025-06-30" },
  crawley:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   10.58, cash:    0.06, fiscal_year_end: "2025-06-30" },
  crewe:          { revenue:   5.20, wage_bill:   null, operating_profit:   -1.16, pre_tax_profit:   -1.16, net_debt:    4.56, cash:    0.10, fiscal_year_end: "2025-06-30" },
  fleetwood:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    null, fiscal_year_end: "2025-06-30" },
  gillingham:     { revenue:   7.53, wage_bill:   6.77, operating_profit:   -5.72, pre_tax_profit:   -5.74, net_debt:    6.99, cash:    0.08, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  grimsby:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.87, cash:    0.44, fiscal_year_end: "2025-06-30" },
  harrogate:      { revenue:   4.06, wage_bill:   3.53, operating_profit:   -2.17, pre_tax_profit:   -2.17, net_debt:    6.30, cash:    0.11, fiscal_year_end: "2025-06-30" },
  mk_dons:        { revenue:   5.72, wage_bill:   5.22, operating_profit:   -3.70, pre_tax_profit:   -2.20, net_debt:    null, cash:    0.33, fiscal_year_end: "2024-06-30" },
  newport:        { revenue:   null, wage_bill:   null, operating_profit:   -0.76, pre_tax_profit:    null, net_debt:    0.06, cash:    0.03, fiscal_year_end: "2025-06-30" },
  notts_county:   { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    0.79, fiscal_year_end: "2025-06-30" },
  oldham:         { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    null, fiscal_year_end: "2025-06-30" },
  salford:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   20.41, cash:    0.07, fiscal_year_end: "2025-06-30" },
  shrewsbury:     { revenue:   7.21, wage_bill:   5.35, operating_profit:   -0.92, pre_tax_profit:   -0.93, net_debt:    1.25, cash:    0.07, fiscal_year_end: "2025-06-30" },
  swindon:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   10.49, cash:    0.01, fiscal_year_end: "2025-05-31" },
  tranmere:       { revenue:   5.76, wage_bill:   5.17, operating_profit:   -2.80, pre_tax_profit:   -2.92, net_debt:    2.30, cash:    0.38, fiscal_year_end: "2025-06-30" },
  walsall:        { revenue:   8.23, wage_bill:   5.88, operating_profit:   -1.34, pre_tax_profit:   -1.97, net_debt:    9.61, cash:    0.00, fiscal_year_end: "2025-05-31", data_confidence: "high" },
};

const NAMES: Record<string, string> = {
  // Premier League 2025/26
  arsenal: "Arsenal",             aston_villa: "Aston Villa",
  bournemouth: "Bournemouth",     brentford: "Brentford",
  brighton: "Brighton",           burnley: "Burnley",
  chelsea: "Chelsea",             crystal_palace: "Crystal Palace",
  everton: "Everton",             fulham: "Fulham",
  leeds: "Leeds United",          liverpool: "Liverpool",
  man_city: "Man City",           man_united: "Man United",
  newcastle: "Newcastle Utd",     nottm_forest: "Nott'm Forest",
  sunderland: "Sunderland",       tottenham: "Tottenham",
  west_ham: "West Ham",           wolves: "Wolves",
  // Championship 2025/26
  birmingham: "Birmingham City",  blackburn: "Blackburn Rovers",
  bristol_city: "Bristol City",   charlton: "Charlton Athletic",
  coventry: "Coventry City",      derby: "Derby County",
  hull: "Hull City",              ipswich: "Ipswich Town",
  leicester: "Leicester City",    middlesbrough: "Middlesbrough",
  millwall: "Millwall",           norwich: "Norwich City",
  oxford_utd: "Oxford United",    portsmouth: "Portsmouth",
  preston: "Preston NE",          qpr: "QPR",
  sheff_utd: "Sheffield Utd",     sheff_wed: "Sheffield Wed",
  southampton: "Southampton",     stoke: "Stoke City",
  swansea: "Swansea City",        watford: "Watford",
  west_brom: "West Brom",         wrexham: "Wrexham",
  // League One 2025/26
  afc_wimbledon: "AFC Wimbledon", barnsley: "Barnsley",
  blackpool: "Blackpool",         bolton: "Bolton Wanderers",
  bradford: "Bradford City",      burton: "Burton Albion",
  cardiff: "Cardiff City",        doncaster: "Doncaster Rovers",
  exeter: "Exeter City",          huddersfield: "Huddersfield Town",
  leyton_orient: "Leyton Orient", lincoln: "Lincoln City",
  luton: "Luton Town",            mansfield: "Mansfield Town",
  northampton: "Northampton",     peterborough: "Peterborough Utd",
  plymouth: "Plymouth Argyle",    port_vale: "Port Vale",
  reading: "Reading",             rotherham: "Rotherham Utd",
  stevenage: "Stevenage",         stockport: "Stockport County",
  wigan: "Wigan Athletic",        wycombe: "Wycombe Wanderers",
  // League Two 2025/26
  accrington: "Accrington Stanley", barnet: "Barnet",
  barrow: "Barrow",               bristol_rovers: "Bristol Rovers",
  bromley: "Bromley",             cambridge: "Cambridge Utd",
  cheltenham: "Cheltenham Town",  chesterfield: "Chesterfield",
  colchester: "Colchester Utd",   crawley: "Crawley Town",
  crewe: "Crewe Alexandra",       fleetwood: "Fleetwood Town",
  gillingham: "Gillingham",       grimsby: "Grimsby Town",
  harrogate: "Harrogate Town",    mk_dons: "MK Dons",
  newport: "Newport County",      notts_county: "Notts County",
  oldham: "Oldham Athletic",      salford: "Salford City",
  shrewsbury: "Shrewsbury Town",  swindon: "Swindon Town",
  tranmere: "Tranmere Rovers",    walsall: "Walsall",
};

function makeClubs(
  raw: Record<string, RawEntry>,
  division: Division,
  defaultConfidence: DataConfidence = "high"
): ClubFinancials[] {
  return Object.entries(raw).map(([slug, d]) => {
    const noData = d.revenue === null && d.wage_bill === null && d.pre_tax_profit === null;
    const confidence = d.data_confidence ?? (noData ? "low" : defaultConfidence);
    return {
      slug,
      name: NAMES[slug],
      division,
      ...d,
      wage_ratio:
        d.revenue && d.wage_bill ? Math.round((d.wage_bill / d.revenue) * 1000) / 10 : null,
      data_confidence: confidence,
    };
  });
}

export const clubs: ClubFinancials[] = [
  ...makeClubs(plRaw, "premier-league", "high"),
  ...makeClubs(chRaw, "championship",   "high"),
  ...makeClubs(l1Raw, "league-one",     "medium"),
  ...makeClubs(l2Raw, "league-two",     "medium"),
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
