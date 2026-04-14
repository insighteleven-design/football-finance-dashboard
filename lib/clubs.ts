export type Division = "premier-league" | "championship" | "league-one" | "league-two";

export type DataConfidence = "high" | "medium" | "low" | "abridged";

export interface ClubFinancials {
  slug: string;
  name: string;
  division: Division;
  /** If set, use this division for vs-average bar comparisons (for promoted/relegated clubs whose accounts cover their previous division) */
  compare_division?: Division;
  revenue: number | null;
  wage_bill: number | null;
  operating_profit: number | null;
  profit_from_player_sales?: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
  cash: number | null;
  fiscal_year_end: string;
  wage_ratio: number | null;
  /** "high" = web-validated, "medium" = extracted from accounts, "low" = abbreviated/no data, "abridged" = abridged accounts filed */
  data_confidence: DataConfidence;
}

export const METRICS: { key: keyof ClubFinancials; label: string; description: string }[] = [
  { key: "revenue",                    label: "Revenue",                    description: "Total revenue / turnover" },
  { key: "wage_bill",                  label: "Wage Bill",                  description: "Total staff costs" },
  { key: "operating_profit",         label: "Operating Profit / (Loss)", description: "Profit / loss from operations (after amortisation, before player sales)" },
  { key: "profit_from_player_sales", label: "Player Sales Profit",        description: "Profit generated from selling player registrations" },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",   description: "Profit / loss before tax (including player sales)" },
  { key: "net_debt",                   label: "Net Cash / (Debt)",          description: "Positive = net debt, negative = net cash position (Swiss Ramble definition, includes transfer payables)" },
  { key: "cash",                       label: "Cash",                       description: "Cash and equivalents at year end" },
  { key: "wage_ratio",                 label: "Wage Ratio",                 description: "Wage bill as % of revenue" },
];

type RawEntry = Omit<ClubFinancials, "slug" | "name" | "division" | "wage_ratio" | "data_confidence"> & {
  data_confidence?: DataConfidence;
};

// ─── Premier League 2025/26 ───────────────────────────────────────────────────
// Promoted: Burnley, Leeds United, Sunderland (from Championship)
// Relegated: Ipswich Town, Leicester City, Southampton (to Championship)
const plRaw: Record<string, RawEntry> = {
  arsenal:        { revenue: 690.30, wage_bill: 346.80, operating_profit:  -63.90, profit_from_player_sales:  81.20, pre_tax_profit:   -1.30, net_debt:  302.30, cash:   32.53, fiscal_year_end: "2025-05-31", data_confidence: "high" },
  aston_villa:    { revenue: 275.70, wage_bill: 252.00, operating_profit: -145.30, profit_from_player_sales:  64.70, pre_tax_profit:  -85.90, net_debt:   24.90, cash:    0.00, fiscal_year_end: "2024-06-30", data_confidence: "high" },
  bournemouth:    { revenue: 181.70, wage_bill: 158.40, operating_profit:  -62.70, profit_from_player_sales:  91.00, pre_tax_profit:   14.90, net_debt:    4.40, cash:   47.24, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  brentford:      { revenue: 173.10, wage_bill: 130.80, operating_profit:  -48.80, profit_from_player_sales:  27.20, pre_tax_profit:  -20.50, net_debt:  130.10, cash:    1.98, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  brighton:       { revenue: 222.40, wage_bill: 165.00, operating_profit: -102.00, profit_from_player_sales:  57.00, pre_tax_profit:  -55.80, net_debt:  365.60, cash:   39.84, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  burnley:        { revenue: 133.60, wage_bill:  93.40, operating_profit:  -26.50, profit_from_player_sales:  15.10, pre_tax_profit:  -28.40, net_debt:  103.50, cash:    8.91, fiscal_year_end: "2024-07-31", data_confidence: "high", compare_division: "championship" },
  chelsea:        { revenue: 490.90, wage_bill: 359.30, operating_profit: -258.00, profit_from_player_sales:  32.00, pre_tax_profit: -262.40, net_debt: 1300.00, cash:    0.00, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  crystal_palace: { revenue: 190.20, wage_bill: 133.70, operating_profit:  -20.70, profit_from_player_sales:   1.30, pre_tax_profit:  -32.90, net_debt:  148.90, cash:    8.86, fiscal_year_end: "2024-06-30", data_confidence: "high" },
  everton:        { revenue: 186.90, wage_bill: 156.60, operating_profit:  -92.70, profit_from_player_sales:  48.50, pre_tax_profit:  -53.20, net_debt: 1018.10, cash:   26.42, fiscal_year_end: "2024-06-30", data_confidence: "high" },
  fulham:         { revenue: 181.60, wage_bill: 154.80, operating_profit:  -64.90, profit_from_player_sales:  32.70, pre_tax_profit:  -32.10, net_debt:   92.20, cash:   32.77, fiscal_year_end: "2024-06-30", data_confidence: "high" },
  leeds:          { revenue: 137.00, wage_bill: 102.70, operating_profit:  -68.40, profit_from_player_sales:  24.80, pre_tax_profit:  -49.20, net_debt:   24.90, cash:    5.01, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship" },
  liverpool:      { revenue: 703.00, wage_bill: 428.00, operating_profit:  -30.00, profit_from_player_sales:  53.00, pre_tax_profit:   15.00, net_debt:  217.00, cash:    2.54, fiscal_year_end: "2025-05-31", data_confidence: "high" },
  man_city:       { revenue: 694.00, wage_bill: 408.00, operating_profit:  -93.00, profit_from_player_sales:  95.00, pre_tax_profit:  -10.00, net_debt:  328.00, cash:  173.72, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  man_united:     { revenue: 667.00, wage_bill: 313.00, operating_profit:  -31.00, profit_from_player_sales:  49.00, pre_tax_profit:  -40.00, net_debt:  550.90, cash:   74.15, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  newcastle:      { revenue: 335.00, wage_bill: 243.00, operating_profit: -109.00, profit_from_player_sales:  20.00, pre_tax_profit:   35.00, net_debt:   52.00, cash:   15.43, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  nottm_forest:   { revenue: 221.70, wage_bill: 166.70, operating_profit:  -64.90, profit_from_player_sales:   7.00, pre_tax_profit:  -78.90, net_debt:   85.80, cash:   13.22, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  sunderland:     { revenue:  38.20, wage_bill:  31.40, operating_profit:  -16.90, profit_from_player_sales:   8.80, pre_tax_profit:   -8.60, net_debt:   28.10, cash:   20.71, fiscal_year_end: "2024-07-31", data_confidence: "high", compare_division: "championship" },
  tottenham:      { revenue: 565.00, wage_bill: 256.00, operating_profit:  -91.00, profit_from_player_sales:  53.00, pre_tax_profit: -121.00, net_debt:  831.00, cash:   78.97, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  west_ham:       { revenue: 228.00, wage_bill: 176.00, operating_profit: -104.80, profit_from_player_sales:  20.00, pre_tax_profit: -104.20, net_debt:  216.30, cash:    0.42, fiscal_year_end: "2025-05-31", data_confidence: "high" },
  wolves:         { revenue: 177.70, wage_bill: 141.90, operating_profit:  -73.30, profit_from_player_sales:  64.60, pre_tax_profit:  -14.30, net_debt:   72.70, cash:   33.44, fiscal_year_end: "2024-05-31", data_confidence: "high", compare_division: "championship" },
};

// ─── Championship 2025/26 ─────────────────────────────────────────────────────
// Promoted to PL: Burnley, Leeds United, Sunderland
// Relegated from PL: Ipswich Town, Leicester City, Southampton
// Promoted from L1: Birmingham City, Charlton Athletic, Wrexham
// Relegated to L1: Cardiff City, Luton Town, Plymouth Argyle
const chRaw: Record<string, RawEntry> = {
  birmingham:     { revenue:  35.64, wage_bill:  35.70, operating_profit:  -39.42, pre_tax_profit:  -34.56, net_debt:  183.16, cash:   14.23, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one" },
  blackburn:      { revenue:  23.70, wage_bill:  28.22, operating_profit:  -21.41, pre_tax_profit:  -10.42, net_debt:  151.39, cash:    0.26, fiscal_year_end: "2025-06-30" },
  bristol_city:   { revenue:  40.30, wage_bill:  35.90, operating_profit:  -18.84, pre_tax_profit:  -18.60, net_debt:   20.74, cash:    0.03, fiscal_year_end: "2025-06-30" },
  charlton:       { revenue:  11.17, wage_bill:  15.71, operating_profit:  -16.83, pre_tax_profit:  -15.39, net_debt:   31.45, cash:    0.46, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one" },
  coventry:       { revenue:  34.15, wage_bill:  26.48, operating_profit:  -24.78, pre_tax_profit:  -21.60, net_debt:   49.40, cash:    0.37, fiscal_year_end: "2025-05-31" },
  derby:          { revenue:  31.87, wage_bill:  31.53, operating_profit:  -11.07, pre_tax_profit:  -11.07, net_debt:   61.89, cash:    1.62, fiscal_year_end: "2025-06-30" },
  hull:           { revenue:  25.82, wage_bill:  36.68, operating_profit:   -8.63, pre_tax_profit:  -10.22, net_debt:   76.47, cash:    0.09, fiscal_year_end: "2025-06-30" },
  ipswich:        { revenue: 155.42, wage_bill:  77.14, operating_profit:   -6.21, pre_tax_profit:    4.01, net_debt:   -4.59, cash:   13.67, fiscal_year_end: "2025-06-30", compare_division: "premier-league" },
  leicester:      { revenue: 105.35, wage_bill: 107.16, operating_profit:   -8.98, pre_tax_profit:  -19.43, net_debt:  199.25, cash:    7.09, fiscal_year_end: "2024-06-30", compare_division: "premier-league" },
  middlesbrough:  { revenue:  32.48, wage_bill:  36.36, operating_profit:  -10.34, pre_tax_profit:  -11.42, net_debt:   11.37, cash:    0.16, fiscal_year_end: "2025-06-30" },
  millwall:       { revenue:  29.30, wage_bill:  28.63, operating_profit:    1.05, pre_tax_profit:   -0.30, net_debt:    null, cash:    0.79, fiscal_year_end: "2025-06-30" },
  norwich:        { revenue:  39.28, wage_bill:  48.08, operating_profit:  -14.38, pre_tax_profit:  -20.67, net_debt:   54.43, cash:    2.00, fiscal_year_end: "2025-06-30" },
  oxford_utd:     { revenue:  19.00, wage_bill:  21.66, operating_profit:  -17.46, pre_tax_profit:  -17.48, net_debt:   -0.21, cash:    0.24, fiscal_year_end: "2025-06-30" },
  portsmouth:     { revenue:  24.57, wage_bill:  17.43, operating_profit:   -1.45, pre_tax_profit:   -4.36, net_debt:    6.15, cash:    2.04, fiscal_year_end: "2025-06-30", data_confidence: "medium" },
  preston:        { revenue:  18.88, wage_bill:  25.67, operating_profit:  -16.02, pre_tax_profit:  -15.98, net_debt:    null, cash:    2.37, fiscal_year_end: "2025-06-30" },
  qpr:            { revenue:  28.00, wage_bill:  27.50, operating_profit:  -20.70, pre_tax_profit:  -20.30, net_debt:    6.14, cash:    0.07, fiscal_year_end: "2025-05-31" },
  sheff_utd:      { revenue:  79.33, wage_bill:  45.97, operating_profit:  -16.64, pre_tax_profit:    2.59, net_debt:   53.68, cash:    2.78, fiscal_year_end: "2025-06-30" },
  sheff_wed:      { revenue:  26.34, wage_bill:  21.81, operating_profit:   -9.26, pre_tax_profit:  -10.01, net_debt:    6.85, cash:    0.16, fiscal_year_end: "2024-07-31" },
  southampton:    { revenue: 157.52, wage_bill: 113.96, operating_profit:  -62.25, pre_tax_profit:  -53.90, net_debt:   -9.35, cash:    9.35, fiscal_year_end: "2025-06-30", compare_division: "premier-league" },
  stoke:          { revenue:  35.44, wage_bill:  30.30, operating_profit:  -29.54, pre_tax_profit:  -28.31, net_debt:  158.00, cash:   25.52, fiscal_year_end: "2025-05-31" },
  swansea:        { revenue:  21.54, wage_bill:  27.35, operating_profit:  -25.20, pre_tax_profit:  -15.19, net_debt:   -1.62, cash:    5.31, fiscal_year_end: "2024-06-30", data_confidence: "medium" },
  watford:        { revenue:  25.98, wage_bill:  28.12, operating_profit:  -12.47, pre_tax_profit:  -15.95, net_debt:   57.90, cash:    1.31, fiscal_year_end: "2025-06-30" },
  west_brom:      { revenue:  30.35, wage_bill:  37.05, operating_profit:  -20.25, pre_tax_profit:  -17.00, net_debt:   71.85, cash:    0.47, fiscal_year_end: "2025-06-30" },
  wrexham:        { revenue:  33.34, wage_bill:  19.95, operating_profit:  -14.85, pre_tax_profit:  -15.24, net_debt:   -2.66, cash:    3.32, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one" },
};

// ─── League One 2025/26 ───────────────────────────────────────────────────────
// Promoted to Championship: Birmingham City, Charlton Athletic, Wrexham
// Relegated from Championship: Cardiff City, Luton Town, Plymouth Argyle
// Promoted from L2: AFC Wimbledon, Bradford City, Doncaster Rovers, Port Vale
// Relegated to L2: Bristol Rovers, Cambridge Utd, Crawley Town, Shrewsbury Town
const l1Raw: Record<string, RawEntry> = {
  afc_wimbledon:  { revenue:   9.78, wage_bill:   5.74, operating_profit:   -1.40, pre_tax_profit:   -1.30, net_debt:   -1.26, cash:    1.34, fiscal_year_end: "2025-06-30", compare_division: "league-two" },
  barnsley:       { revenue:  10.28, wage_bill:  11.46, operating_profit:   -6.28, pre_tax_profit:   -6.58, net_debt:   -0.88, cash:    0.88, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  blackpool:      { revenue:  10.90, wage_bill:  10.97, operating_profit:   -8.40, pre_tax_profit:   -5.60, net_debt:   16.45, cash:    1.42, fiscal_year_end: "2025-06-30" },
  bolton:         { revenue:  20.46, wage_bill:  18.47, operating_profit:  -13.96, pre_tax_profit:  -14.36, net_debt:    5.50, cash:    0.46, fiscal_year_end: "2025-06-30", data_confidence: "medium" },
  bradford:       { revenue:   8.69, wage_bill:   null, operating_profit:   -2.98, pre_tax_profit:   -2.99, net_debt:    5.40, cash:    0.17, fiscal_year_end: "2025-06-30", compare_division: "league-two" },
  burton:         { revenue:   6.41, wage_bill:   8.23, operating_profit:   -8.58, pre_tax_profit:   -8.34, net_debt:   -0.66, cash:    0.67, fiscal_year_end: "2025-06-30" },
  cardiff:        { revenue:  25.76, wage_bill:  38.95, operating_profit:  -27.49, pre_tax_profit:  -34.48, net_debt:  132.92, cash:    1.38, fiscal_year_end: "2025-05-31", data_confidence: "high", compare_division: "championship" },
  doncaster:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.26, cash:    null, fiscal_year_end: "2025-05-31", compare_division: "league-two" },
  exeter:         { revenue:   8.21, wage_bill:   6.88, operating_profit:   -4.39, pre_tax_profit:    0.53, net_debt:   -0.35, cash:    0.35, fiscal_year_end: "2025-06-30" },
  huddersfield:   { revenue:  10.63, wage_bill:  16.89, operating_profit:  -20.06, pre_tax_profit:  -22.39, net_debt:   79.35, cash:    3.23, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  leyton_orient:  { revenue:   9.43, wage_bill:   null, operating_profit:   -4.62, pre_tax_profit:   -4.61, net_debt:    0.90, cash:    0.74, fiscal_year_end: "2025-06-30" },
  lincoln:        { revenue:   8.48, wage_bill:   7.53, operating_profit:   -2.87, pre_tax_profit:   -2.88, net_debt:   -0.99, cash:    1.61, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  luton:          { revenue:  66.82, wage_bill:  39.50, operating_profit:   17.15, pre_tax_profit:   14.30, net_debt:   -1.34, cash:    1.34, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship" },
  mansfield:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    0.13, fiscal_year_end: "2025-06-30" },
  northampton:    { revenue:   7.54, wage_bill:   6.22, operating_profit:   -3.00, pre_tax_profit:   -3.00, net_debt:   13.32, cash:    0.20, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  peterborough:   { revenue:  15.92, wage_bill:   8.52, operating_profit:    4.22, pre_tax_profit:    2.91, net_debt:   17.64, cash:    0.15, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  plymouth:       { revenue:  28.83, wage_bill:  21.25, operating_profit:    0.22, pre_tax_profit:    0.32, net_debt:    0.07, cash:    2.68, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship" },
  port_vale:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   19.53, cash:    0.17, fiscal_year_end: "2025-06-30", compare_division: "league-two" },
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
  barnet:         { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.92, cash:    null, fiscal_year_end: "2025-06-30", data_confidence: "abridged" },
  barrow:         { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    0.05, fiscal_year_end: "2025-05-31", data_confidence: "abridged" },
  bristol_rovers: { revenue:   8.11, wage_bill:   8.91, operating_profit:   -6.47, pre_tax_profit:   -7.90, net_debt:   -0.77, cash:    1.31, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one" },
  bromley:        { revenue:   5.27, wage_bill:   null, operating_profit:   -1.06, pre_tax_profit:   -1.09, net_debt:    0.42, cash:    0.50, fiscal_year_end: "2024-12-31" },
  cambridge:      { revenue:   9.25, wage_bill:   6.66, operating_profit:   -3.74, pre_tax_profit:   -3.74, net_debt:   -0.26, cash:    0.30, fiscal_year_end: "2025-06-30", compare_division: "league-one" },
  cheltenham:     { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.13, cash:    0.55, fiscal_year_end: "2025-05-31" },
  chesterfield:   { revenue:   7.80, wage_bill:   6.04, operating_profit:   -2.22, pre_tax_profit:   -2.38, net_debt:    2.27, cash:    1.48, fiscal_year_end: "2025-06-30", data_confidence: "medium" },
  colchester:     { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   40.02, cash:    0.15, fiscal_year_end: "2025-06-30" },
  crawley:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   10.58, cash:    0.06, fiscal_year_end: "2025-06-30", compare_division: "league-one" },
  crewe:          { revenue:   5.20, wage_bill:   null, operating_profit:   -1.16, pre_tax_profit:   -1.16, net_debt:    4.56, cash:    0.10, fiscal_year_end: "2025-06-30" },
  fleetwood:      { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    null, fiscal_year_end: "2025-06-30" },
  gillingham:     { revenue:   7.53, wage_bill:   6.77, operating_profit:   -5.72, pre_tax_profit:   -5.74, net_debt:    6.99, cash:    0.08, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  grimsby:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    0.87, cash:    0.44, fiscal_year_end: "2025-06-30" },
  harrogate:      { revenue:   4.06, wage_bill:   3.53, operating_profit:   -2.17, pre_tax_profit:   -2.17, net_debt:    6.30, cash:    0.11, fiscal_year_end: "2025-06-30" },
  mk_dons:        { revenue:   5.72, wage_bill:   5.22, operating_profit:   -3.70, pre_tax_profit:   -2.20, net_debt:    null, cash:    0.33, fiscal_year_end: "2024-06-30" },
  newport:        { revenue:   null, wage_bill:   null, operating_profit:   -0.76, pre_tax_profit:    null, net_debt:    0.06, cash:    0.03, fiscal_year_end: "2025-06-30" },
  notts_county:   { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    0.79, fiscal_year_end: "2025-06-30" },
  oldham:         { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:    null, cash:    0.13, fiscal_year_end: "2025-06-30", data_confidence: "abridged" },
  salford:        { revenue:   null, wage_bill:   null, operating_profit:    null, pre_tax_profit:    null, net_debt:   20.41, cash:    0.07, fiscal_year_end: "2025-06-30" },
  shrewsbury:     { revenue:   7.21, wage_bill:   5.35, operating_profit:   -0.92, pre_tax_profit:   -0.93, net_debt:    1.25, cash:    0.07, fiscal_year_end: "2025-06-30", compare_division: "league-one" },
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
