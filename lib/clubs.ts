export type Division = "premier-league" | "championship" | "league-one" | "league-two";

export type DataConfidence = "high" | "medium" | "low" | "abridged";

export type FinancialSnapshot = {
  revenue: number | null;
  wage_bill: number | null;
  wage_ratio: number | null;
  operating_profit: number | null;
  profit_from_player_sales: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
};

export interface PriorYearFinancials extends FinancialSnapshot {
  fiscal_year_end: string;
  /** Which division to use for vs-average comparison in the prior year tab */
  compare_division?: Division;
}

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
  prior_year?: PriorYearFinancials | null;
}

export const METRICS: { key: keyof ClubFinancials; label: string; description: string }[] = [
  { key: "revenue",                    label: "Revenue",                    description: "Total revenue / turnover" },
  { key: "wage_bill",                  label: "Wage Bill",                  description: "Total staff costs" },
  { key: "operating_profit",         label: "Operating Profit / (Loss)", description: "Profit / loss from operations (after amortisation, before player sales)" },
  { key: "profit_from_player_sales", label: "Player Sales Profit",        description: "Profit generated from selling player registrations" },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",   description: "Profit / loss before tax (including player sales)" },
  { key: "net_debt",                   label: "Net Debt",          description: "Positive = net debt, negative = net cash position (Swiss Ramble definition, includes transfer payables)" },
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
  arsenal:        { revenue: 690.30, wage_bill: 346.80, operating_profit:  -63.90, profit_from_player_sales:  81.20, pre_tax_profit:   -1.30, net_debt:  302.30, cash:   32.53, fiscal_year_end: "2025-05-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  613.5, wage_bill:  327.8, wage_ratio:  53, operating_profit:  -49.7, profit_from_player_sales:   51.1, pre_tax_profit:   -17.7, net_debt:   275.0, compare_division: "premier-league" } },
  aston_villa:    { revenue: 310.08, wage_bill: 245.96, operating_profit:  -64.64, profit_from_player_sales:  51.98, pre_tax_profit:  -22.49, net_debt:  148.85, cash:    0.00, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  246.81, wage_bill:  230.82, wage_ratio:  94, operating_profit:  -93.94, profit_from_player_sales:   64.71, pre_tax_profit:   -35.40, net_debt:  190.43, compare_division: "premier-league" } },
  bournemouth:    { revenue: 181.70, wage_bill: 158.40, operating_profit:  -62.70, profit_from_player_sales:  91.00, pre_tax_profit:   14.90, net_debt:    4.40, cash:   47.24, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  160.8, wage_bill:  136.2, wage_ratio:  85, operating_profit:  -55.9, profit_from_player_sales:    0.3, pre_tax_profit:   -66.3, net_debt:   118.8, compare_division: "premier-league" } },
  brentford:      { revenue: 173.10, wage_bill: 130.80, operating_profit:  -48.80, profit_from_player_sales:  27.20, pre_tax_profit:  -20.50, net_debt:  130.10, cash:    1.98, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  166.5, wage_bill:  114.4, wage_ratio:  69, operating_profit:  -29.2, profit_from_player_sales:   25.2, pre_tax_profit:    -7.9, net_debt:    90.9, compare_division: "premier-league" } },
  brighton:       { revenue: 222.40, wage_bill: 158.68, operating_profit: -102.00, profit_from_player_sales:  57.00, pre_tax_profit:  -55.80, net_debt:  365.60, cash:   39.84, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  222.5, wage_bill:  146.2, wage_ratio:  66, operating_profit:  -35.6, profit_from_player_sales:  110.3, pre_tax_profit:    75.1, net_debt:   281.3, compare_division: "premier-league" } },
  burnley:        { revenue: 133.60, wage_bill:  93.40, operating_profit:  -26.50, profit_from_player_sales:  15.10, pre_tax_profit:  -28.40, net_debt:  103.50, cash:    8.91, fiscal_year_end: "2024-07-31", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2023-07-31", revenue:   64.9, wage_bill:   57.6, wage_ratio:  89, operating_profit:  -40.7, profit_from_player_sales:   11.4, pre_tax_profit:   -36.0, net_debt:    81.3, compare_division: "championship" } },
  chelsea:        { revenue: 490.86, wage_bill: 359.27, operating_profit: -308.16, profit_from_player_sales:  57.91, pre_tax_profit: -262.44, net_debt:  -49.01, cash:   49.009, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  468.5, wage_bill:  338.0, wage_ratio:  72, operating_profit: -213.0, profit_from_player_sales:  152.5, pre_tax_profit:   128.4, net_debt:   267.2, compare_division: "premier-league" } },
  crystal_palace: { revenue: 195.30, wage_bill: 145.48, operating_profit:  -42.72, profit_from_player_sales:  66.08, pre_tax_profit:    8.07, net_debt:  140.18, cash:   13.69, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  190.20, wage_bill:  133.70, wage_ratio:  70, operating_profit:  -20.70, profit_from_player_sales:    1.30, pre_tax_profit:   -32.90, net_debt:   148.90, compare_division: "premier-league" } },
  everton:        { revenue: 196.70, wage_bill: 152.06, operating_profit:  -75.93, profit_from_player_sales:  31.33, pre_tax_profit:   -8.61, net_debt:  389.40, cash:   79.14, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  186.90, wage_bill:  156.60, wage_ratio:  84, operating_profit:  -92.70, profit_from_player_sales:   48.50, pre_tax_profit:   -53.20, net_debt:  1018.10, compare_division: "premier-league" } },
  fulham:         { revenue: 194.79, wage_bill: 166.51, operating_profit:  -80.57, profit_from_player_sales:  41.04, pre_tax_profit:  -39.01, net_debt:   84.90, cash:   13.17, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  181.60, wage_bill:  154.80, wage_ratio:  85, operating_profit:  -64.90, profit_from_player_sales:   32.70, pre_tax_profit:   -32.10, net_debt:    92.20, compare_division: "premier-league" } },
  leeds:          { revenue: 137.00, wage_bill: 102.70, operating_profit:  -68.40, profit_from_player_sales:  24.80, pre_tax_profit:  -49.20, net_debt:   24.90, cash:   33.95, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  127.6, wage_bill:   84.0, wage_ratio:  66, operating_profit:  -76.3, profit_from_player_sales:   33.7, pre_tax_profit:   -60.8, net_debt:    55.3, compare_division: "championship" } },
  liverpool:      { revenue: 703.00, wage_bill: 428.00, operating_profit:  -30.00, profit_from_player_sales:  53.00, pre_tax_profit:   15.00, net_debt:  282.72, cash:    2.54, fiscal_year_end: "2025-05-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  613.8, wage_bill:  386.1, wage_ratio:  63, operating_profit:  -69.7, profit_from_player_sales:   22.0, pre_tax_profit:   -57.1, net_debt:   306.8, compare_division: "premier-league" } },
  man_city:       { revenue: 694.00, wage_bill: 408.00, operating_profit:  -93.00, profit_from_player_sales:  95.00, pre_tax_profit:  -10.00, net_debt:  328.00, cash:  173.72, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  715.0, wage_bill:  412.6, wage_ratio:  58, operating_profit:  -60.5, profit_from_player_sales:  139.0, pre_tax_profit:    73.8, net_debt:     9.6, compare_division: "premier-league" } },
  man_united:     { revenue: 667.00, wage_bill: 313.00, operating_profit:  -31.00, profit_from_player_sales:  49.00, pre_tax_profit:  -40.00, net_debt:  550.90, cash:   74.15, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  661.8, wage_bill:  364.7, wage_ratio:  55, operating_profit: -106.8, profit_from_player_sales:   37.4, pre_tax_profit:  -130.7, net_debt:   473.1, compare_division: "premier-league" } },
  newcastle:      { revenue: 335.00, wage_bill: 243.00, operating_profit: -109.00, profit_from_player_sales:  20.00, pre_tax_profit:   35.00, net_debt:   52.00, cash:   12.70, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  320.3, wage_bill:  218.7, wage_ratio:  68, operating_profit:  -68.7, profit_from_player_sales:   69.8, pre_tax_profit:   -11.1, net_debt:    34.3, compare_division: "premier-league" } },
  nottm_forest:   { revenue: 221.70, wage_bill: 166.70, operating_profit:  -64.90, profit_from_player_sales:   7.00, pre_tax_profit:  -78.90, net_debt:   85.80, cash:   13.22, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  189.6, wage_bill:  166.4, wage_ratio:  88, operating_profit:  -73.3, profit_from_player_sales:  100.5, pre_tax_profit:    12.1, net_debt:    96.2, compare_division: "premier-league" } },
  sunderland:     { revenue:  39.42, wage_bill:  52.90, operating_profit:   -0.33, profit_from_player_sales:  45.84, pre_tax_profit:   -3.28, net_debt:   24.33, cash:   20.71, fiscal_year_end: "2025-07-31", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-07-31", revenue:   37.45, wage_bill:   30.46, wage_ratio:  81, operating_profit:   -8.49, profit_from_player_sales:    8.82, pre_tax_profit:    -9.07, net_debt:    28.10, compare_division: "championship" } },
  tottenham:      { revenue: 565.00, wage_bill: 256.00, operating_profit:  -91.00, profit_from_player_sales:  53.00, pre_tax_profit: -121.00, net_debt:  831.00, cash:   20.41, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  528.2, wage_bill:  221.9, wage_ratio:  42, operating_profit:  -61.0, profit_from_player_sales:   82.3, pre_tax_profit:   -26.0, net_debt:   772.5, compare_division: "premier-league" } },
  west_ham:       { revenue: 226.06, wage_bill: 173.34, operating_profit: -109.47, profit_from_player_sales:  19.95, pre_tax_profit: -108.84, net_debt:  216.22, cash:    0.42, fiscal_year_end: "2025-05-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  269.7, wage_bill:  161.0, wage_ratio:  60, operating_profit:  -30.8, profit_from_player_sales:   96.3, pre_tax_profit:    57.2, net_debt:   -32.5, compare_division: "premier-league" } },
  wolves:         { revenue: 172.00, wage_bill: 162.09, operating_profit: -117.30, profit_from_player_sales: 116.98, pre_tax_profit:  -11.63, net_debt:   67.95, cash:   33.44, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  177.70, wage_bill:  141.90, wage_ratio:  80, operating_profit:  -73.30, profit_from_player_sales:   64.60, pre_tax_profit:   -14.30, net_debt:    72.70, compare_division: "premier-league" } },
};

// ─── Championship 2025/26 ─────────────────────────────────────────────────────
// Promoted to PL: Burnley, Leeds United, Sunderland
// Relegated from PL: Ipswich Town, Leicester City, Southampton
// Promoted from L1: Birmingham City, Charlton Athletic, Wrexham
// Relegated to L1: Cardiff City, Luton Town, Plymouth Argyle
const chRaw: Record<string, RawEntry> = {
  birmingham:     { revenue:  35.64, wage_bill:  35.70, operating_profit:  -39.42, profit_from_player_sales:  14.27, pre_tax_profit:  -34.56, net_debt:  183.16, cash:   14.23, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  28.72, wage_bill:  33.72, wage_ratio: 117, operating_profit:  -32.59, profit_from_player_sales:  15.41, pre_tax_profit:  -16.08, net_debt: 142.81, compare_division: "championship" } },
  blackburn:      { revenue:  23.70, wage_bill:  28.22, operating_profit:  -21.41, profit_from_player_sales:  13.02, pre_tax_profit:  -10.42, net_debt:  151.39, cash:    0.26, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  21.40, wage_bill:  25.44, wage_ratio: 119, operating_profit:  -19.50, profit_from_player_sales:  23.56, pre_tax_profit:    3.33, net_debt: 118.13, compare_division: "championship" } },
  bristol_city:   { revenue:  24.06, wage_bill:  25.85, operating_profit:  -18.84, profit_from_player_sales:   5.80, pre_tax_profit:  -13.15, net_debt:   20.74, cash:    0.03, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  20.52, wage_bill:  24.82, wage_ratio: 121, operating_profit:  -21.97, profit_from_player_sales:  21.70, pre_tax_profit:   -0.80, net_debt:  23.43, compare_division: "championship" } },
  charlton:       { revenue:  11.17, wage_bill:  15.71, operating_profit:  -16.83, profit_from_player_sales:   1.44, pre_tax_profit:  -15.39, net_debt:   31.45, cash:    0.46, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:   8.81, wage_bill:  12.13, wage_ratio: 138, operating_profit:  -14.57, profit_from_player_sales:   0.69, pre_tax_profit:  -13.93, net_debt:  29.77, compare_division: "league-one" } },
  coventry:       { revenue:  34.15, wage_bill:  26.48, operating_profit:  -24.78, profit_from_player_sales:   3.13, pre_tax_profit:  -21.60, net_debt:   49.40, cash:    0.37, fiscal_year_end: "2025-05-31",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  29.31, wage_bill:  23.41, wage_ratio:  80, operating_profit:  -14.96, profit_from_player_sales:  23.68, pre_tax_profit:    8.69, net_debt:  56.81, compare_division: "championship" } },
  derby:          { revenue:  31.87, wage_bill:  31.53, operating_profit:  -11.07, profit_from_player_sales:  10.30, pre_tax_profit:  -11.07, net_debt:   61.89, cash:    1.62, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  19.40, wage_bill:  21.98, wage_ratio: 113, operating_profit:  -14.17, profit_from_player_sales:   4.63, pre_tax_profit:  -14.18, net_debt:  60.34, compare_division: "championship" } },
  hull:           { revenue:  25.82, wage_bill:  36.68, operating_profit:   -8.63, profit_from_player_sales:  33.05, pre_tax_profit:  -10.22, net_debt:   76.47, cash:    0.09, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  21.23, wage_bill:  29.56, wage_ratio: 139, operating_profit:  -18.13, profit_from_player_sales:   8.34, pre_tax_profit:  -18.85, net_debt:  78.25, compare_division: "championship" } },
  ipswich:        { revenue: 155.42, wage_bill:  77.14, operating_profit:   -6.21, profit_from_player_sales:  15.40, pre_tax_profit:    4.01, net_debt:    0.00, cash:   13.67, fiscal_year_end: "2025-06-30", compare_division: "premier-league",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  37.31, wage_bill:  44.53, wage_ratio: 119, operating_profit:  -40.48, profit_from_player_sales:   1.23, pre_tax_profit:  -39.28, net_debt:  62.30, compare_division: "championship" } },
  leicester:      { revenue: 105.35, wage_bill: 107.16, operating_profit:   -8.98, profit_from_player_sales:  71.84, pre_tax_profit:  -19.43, net_debt:  218.88, cash:    7.09, fiscal_year_end: "2024-06-30", compare_division: "premier-league" },
  middlesbrough:  { revenue:  32.48, wage_bill:  36.36, operating_profit:  -10.34, profit_from_player_sales:  26.34, pre_tax_profit:  -11.42, net_debt:   11.37, cash:    0.16, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  32.25, wage_bill:  31.39, wage_ratio:  97, operating_profit:  -11.92, profit_from_player_sales:  17.11, pre_tax_profit:  -12.43, net_debt:  58.21, compare_division: "championship" } },
  millwall:       { revenue:  23.86, wage_bill:  28.63, operating_profit:    1.05, profit_from_player_sales:  21.62, pre_tax_profit:    0.18, net_debt:    null, cash:    0.79, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  21.41, wage_bill:  25.58, wage_ratio: 119, operating_profit:  -18.29, profit_from_player_sales:   0.00, pre_tax_profit:  -18.59, net_debt: 174.49, compare_division: "championship" } },
  norwich:        { revenue:  39.28, wage_bill:  48.08, operating_profit:  -14.38, profit_from_player_sales:  23.21, pre_tax_profit:  -20.67, net_debt:   54.43, cash:    2.00, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  73.14, wage_bill:  45.86, wage_ratio:  63, operating_profit:   -6.97, profit_from_player_sales:  13.38, pre_tax_profit:  -14.37, net_debt: 132.30, compare_division: "premier-league" } },
  oxford_utd:     { revenue:  19.00, wage_bill:  21.66, operating_profit:  -17.46, profit_from_player_sales:   0.08, pre_tax_profit:  -17.48, net_debt:   -0.21, cash:    0.24, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:   8.44, wage_bill:  11.25, wage_ratio: 133, operating_profit:  -15.72, profit_from_player_sales:   0.62, pre_tax_profit:  -15.85, net_debt:  47.45, compare_division: "league-one" } },
  portsmouth:     { revenue:  24.57, wage_bill:  17.43, operating_profit:   -4.20, profit_from_player_sales:   0.39, pre_tax_profit:   -4.36, net_debt:    6.15, cash:    2.04, fiscal_year_end: "2025-06-30", data_confidence: "medium",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  13.62, wage_bill:  10.57, wage_ratio:  78, operating_profit:   -3.79, profit_from_player_sales:   0.03, pre_tax_profit:   -5.61, net_debt:   8.28, compare_division: "league-one" } },
  preston:        { revenue:  18.88, wage_bill:  25.67, operating_profit:  -16.02, profit_from_player_sales:   0.00, pre_tax_profit:  -15.98, net_debt:    null, cash:    2.37, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  15.31, wage_bill:  21.29, wage_ratio: 139, operating_profit:  -12.35, profit_from_player_sales:   0.38, pre_tax_profit:  -12.32, net_debt:   5.34, compare_division: "championship" } },
  qpr:            { revenue:  28.00, wage_bill:  27.50, operating_profit:  -20.70, profit_from_player_sales:   2.26, pre_tax_profit:  -20.30, net_debt:  112.88, cash:    0.07, fiscal_year_end: "2025-05-31",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  25.89, wage_bill:  23.78, wage_ratio:  92, operating_profit:  -15.18, profit_from_player_sales:   2.20, pre_tax_profit:  -13.53, net_debt: 117.42, compare_division: "championship" } },
  sheff_utd:      { revenue:  79.33, wage_bill:  45.97, operating_profit:  -16.64, profit_from_player_sales:  25.38, pre_tax_profit:    2.59, net_debt:   53.68, cash:    2.78, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 137.60, wage_bill:  63.70, wage_ratio:  46, operating_profit:   -7.45, profit_from_player_sales:  19.35, pre_tax_profit:    3.90, net_debt: 103.38, compare_division: "premier-league" } },
  sheff_wed:      { revenue:  26.34, wage_bill:  21.81, operating_profit:   -9.26, profit_from_player_sales:   0.00, pre_tax_profit:  -10.01, net_debt:    6.85, cash:    0.16, fiscal_year_end: "2024-07-31",
    prior_year: { fiscal_year_end: "2023-07-31", revenue:  19.31, wage_bill:  15.76, wage_ratio:  82, operating_profit:   -6.47, profit_from_player_sales:   0.00, pre_tax_profit:   -7.24, net_debt:  77.81, compare_division: "championship" } },
  southampton:    { revenue: 157.52, wage_bill: 113.96, operating_profit:  -62.25, profit_from_player_sales:  28.44, pre_tax_profit:  -45.29, net_debt:  113.17, cash:    9.35, fiscal_year_end: "2025-06-30", compare_division: "premier-league",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  84.00, wage_bill:  79.01, wage_ratio:  94, operating_profit:   -7.05, profit_from_player_sales: 123.04, pre_tax_profit:   24.09, net_debt: 217.25, compare_division: "premier-league" } },
  stoke:          { revenue:  35.44, wage_bill:  30.30, operating_profit:  -29.54, profit_from_player_sales:   0.15, pre_tax_profit:  -28.31, net_debt:  157.00, cash:   25.52, fiscal_year_end: "2025-05-31",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  32.27, wage_bill:  31.76, wage_ratio:  98, operating_profit:  -30.71, profit_from_player_sales:   4.41, pre_tax_profit:  -25.86, net_debt: 160.50, compare_division: "championship" } },
  swansea:        { revenue:  21.54, wage_bill:  27.35, operating_profit:  -25.20, profit_from_player_sales:  10.47, pre_tax_profit:  -15.19, net_debt:   -1.62, cash:    5.31, fiscal_year_end: "2024-06-30", data_confidence: "medium",
    prior_year: { fiscal_year_end: "2023-06-30", revenue:  21.57, wage_bill:  24.85, wage_ratio: 115, operating_profit:  -21.28, profit_from_player_sales:   4.52, pre_tax_profit:  -17.93, net_debt:  10.77, compare_division: "championship" } },
  watford:        { revenue:  25.98, wage_bill:  28.12, operating_profit:  -12.47, profit_from_player_sales:  15.83, pre_tax_profit:  -15.95, net_debt:   57.90, cash:    1.31, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  57.59, wage_bill:  33.03, wage_ratio:  57, operating_profit:   -7.05, profit_from_player_sales:  29.26, pre_tax_profit:   12.76, net_debt: 130.61, compare_division: "championship" } },
  west_brom:      { revenue:  30.35, wage_bill:  37.05, operating_profit:  -20.25, profit_from_player_sales:   9.20, pre_tax_profit:  -19.99, net_debt:   71.85, cash:    0.47, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  28.21, wage_bill:  42.90, wage_ratio: 152, operating_profit:  -29.20, profit_from_player_sales:   3.53, pre_tax_profit:  -33.87, net_debt:  73.01, compare_division: "championship" } },
  wrexham:        { revenue:  33.34, wage_bill:  19.95, operating_profit:  -14.85, profit_from_player_sales:   0.00, pre_tax_profit:  -15.24, net_debt:   -2.66, cash:    3.32, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  26.73, wage_bill:  11.04, wage_ratio:  41, operating_profit:   -2.02, profit_from_player_sales:   0.00, pre_tax_profit:   -2.73, net_debt:  25.63, compare_division: "league-one" } },
};

// ─── League One 2025/26 ───────────────────────────────────────────────────────
// Promoted to Championship: Birmingham City, Charlton Athletic, Wrexham
// Relegated from Championship: Cardiff City, Luton Town, Plymouth Argyle
// Promoted from L2: AFC Wimbledon, Bradford City, Doncaster Rovers, Port Vale
// Relegated to L2: Bristol Rovers, Cambridge Utd, Crawley Town, Shrewsbury Town
const l1Raw: Record<string, RawEntry> = {
  afc_wimbledon:  { revenue:  9.78, wage_bill:  5.74, operating_profit:  -1.40, profit_from_player_sales:  0.97, pre_tax_profit:  -1.30, net_debt:  20.05, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-two",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.69, wage_bill:  5.14, wage_ratio:  59, operating_profit:  0.34, profit_from_player_sales:  3.28, pre_tax_profit:  0.38, net_debt:  22.86, compare_division: "league-two" } },
  barnsley:       { revenue: 10.28, wage_bill: 11.46, operating_profit:  -6.28, profit_from_player_sales: -0.17, pre_tax_profit:  -6.58, net_debt:   6.81, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.97, wage_bill: 11.25, wage_ratio: 125, operating_profit: -9.66, profit_from_player_sales:  6.78, pre_tax_profit: -2.84, net_debt:   8.35, compare_division: "league-one" } },
  blackpool:      { revenue:  8.82, wage_bill:  9.95, operating_profit:  -7.10, profit_from_player_sales:  2.80, pre_tax_profit:  -4.31, net_debt:  28.06, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  9.70, wage_bill:  9.51, wage_ratio:  98, operating_profit: -6.22, profit_from_player_sales:  2.28, pre_tax_profit: -3.94, net_debt:  23.79, compare_division: "league-one" } },
  bolton:         { revenue: 20.46, wage_bill: 18.47, operating_profit: -13.96, profit_from_player_sales: null, pre_tax_profit: -14.36, net_debt:  40.24, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 21.30, wage_bill: 16.10, wage_ratio:  76, operating_profit: -10.45, profit_from_player_sales: null, pre_tax_profit: -11.15, net_debt:  27.32 } },
  bradford:       { revenue:  8.69, wage_bill: null,  operating_profit:  -2.98, profit_from_player_sales: null, pre_tax_profit:  -2.99, net_debt:  10.93, cash: null, fiscal_year_end: "2025-06-30", compare_division: "league-two",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.64, wage_bill:  6.10, wage_ratio:  71, operating_profit: -0.99, profit_from_player_sales:  0.37, pre_tax_profit: -1.00, net_debt:   7.44, compare_division: "league-two" } },
  burton:         { revenue:  6.41, wage_bill:  8.23, operating_profit:  -8.58, profit_from_player_sales:  0.23, pre_tax_profit:  -8.34, net_debt:  13.41, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.38, wage_bill:  5.36, wage_ratio:  84, operating_profit: -1.77, profit_from_player_sales:  0.47, pre_tax_profit: -1.29, net_debt:   4.28 } },
  cardiff:        { revenue: 21.68, wage_bill: 26.80, operating_profit: -19.50, profit_from_player_sales:  7.25, pre_tax_profit: -17.16, net_debt:  98.58, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 22.55, wage_bill: 28.42, wage_ratio: 126, operating_profit: -20.57, profit_from_player_sales:  5.17, pre_tax_profit: -19.84, net_debt:  82.48, compare_division: "championship" } },
  doncaster:      { revenue: null,  wage_bill: null,  operating_profit:  null,  profit_from_player_sales: null, pre_tax_profit:  -3.20, net_debt:  12.23, cash: null, fiscal_year_end: "2025-06-30", compare_division: "league-two",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  5.60, wage_bill: null,  wage_ratio: null, operating_profit: -3.06, profit_from_player_sales: null, pre_tax_profit: null, net_debt:   8.25, compare_division: "league-two" } },
  exeter:         { revenue:  8.21, wage_bill:  6.88, operating_profit:  -4.39, profit_from_player_sales:  4.93, pre_tax_profit:   0.53, net_debt:   3.64, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.57, wage_bill:  5.13, wage_ratio:  78, operating_profit: -2.95, profit_from_player_sales:  3.11, pre_tax_profit:  0.18, net_debt:   2.61 } },
  huddersfield:   { revenue: 10.63, wage_bill: 16.90, operating_profit: -20.06, profit_from_player_sales:  1.58, pre_tax_profit: -22.39, net_debt:  91.78, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 18.16, wage_bill: 23.00, wage_ratio: 127, operating_profit: -13.26, profit_from_player_sales:  4.37, pre_tax_profit: -15.00, net_debt:  75.07 } },
  leyton_orient:  { revenue:  9.43, wage_bill: null,  operating_profit:  -4.62, profit_from_player_sales: null, pre_tax_profit:  -4.61, net_debt:   4.42, cash: null, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  7.72, wage_bill: null,  wage_ratio: null, operating_profit: -3.75, profit_from_player_sales: null, pre_tax_profit: -3.74, net_debt:  22.40 } },
  lincoln:        { revenue:  8.48, wage_bill:  7.53, operating_profit:  -2.87, profit_from_player_sales: null, pre_tax_profit:  -2.88, net_debt:   5.14, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.98, wage_bill:  6.94, wage_ratio:  99, operating_profit: -2.97, profit_from_player_sales: null, pre_tax_profit: -2.98, net_debt:   4.64 } },
  luton:          { revenue: 66.82, wage_bill: 39.50, operating_profit:  17.15, profit_from_player_sales: 17.22, pre_tax_profit:  17.87, net_debt:  17.98, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 132.32, wage_bill: 56.88, wage_ratio:  43, operating_profit: 48.88, profit_from_player_sales:  1.22, pre_tax_profit: 49.47, net_debt:  16.35, compare_division: "premier-league" } },
  northampton:    { revenue:  7.38, wage_bill:  6.56, operating_profit:  -2.54, profit_from_player_sales:  1.49, pre_tax_profit:  -1.18, net_debt:   6.86, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.05, wage_bill:  5.27, wage_ratio:  87, operating_profit: -2.37, profit_from_player_sales:  1.86, pre_tax_profit: -0.66, net_debt:   5.95 } },
  peterborough:   { revenue: 15.92, wage_bill:  8.52, operating_profit:   4.22, profit_from_player_sales:  6.55, pre_tax_profit:   2.91, net_debt:  27.13, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 10.17, wage_bill:  7.34, wage_ratio:  72, operating_profit: -1.24, profit_from_player_sales:  4.07, pre_tax_profit: -2.32, net_debt:  27.32 } },
  plymouth:       { revenue: 28.83, wage_bill: 21.25, operating_profit:   0.22, profit_from_player_sales:  8.87, pre_tax_profit:   0.32, net_debt:   0.07, cash:  2.68, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 25.58, wage_bill: 16.84, wage_ratio:  66, operating_profit: -2.65, profit_from_player_sales: null, pre_tax_profit: -2.40, net_debt:  -1.70, compare_division: "championship" } },
  reading:        { revenue:  9.81, wage_bill: 12.41, operating_profit:  -3.76, profit_from_player_sales:  9.51, pre_tax_profit:  -3.88, net_debt: 135.43, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 10.00, wage_bill: 15.82, wage_ratio: 158, operating_profit: -12.98, profit_from_player_sales:  3.99, pre_tax_profit: -13.06, net_debt: 134.43 } },
  rotherham:      { revenue: 10.52, wage_bill:  8.58, operating_profit:  -4.65, profit_from_player_sales: null, pre_tax_profit:  -4.65, net_debt:  11.63, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 19.17, wage_bill: 12.95, wage_ratio:  68, operating_profit: -1.70, profit_from_player_sales: null, pre_tax_profit: -1.70, net_debt:   8.40, compare_division: "championship" } },
  stockport:      { revenue:  9.20, wage_bill: null,  operating_profit:  -7.00, profit_from_player_sales: null, pre_tax_profit:  null,  net_debt:   7.88, cash: null, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.60, wage_bill: null,  wage_ratio: null, operating_profit: -4.70, profit_from_player_sales: null, pre_tax_profit: null,  net_debt:   5.16 } },
  wigan:          { revenue:  7.25, wage_bill:  9.90, operating_profit:  -7.97, profit_from_player_sales:  7.57, pre_tax_profit:  -0.40, net_debt:  21.45, cash: null, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  9.25, wage_bill: 11.70, wage_ratio: 127, operating_profit: -8.98, profit_from_player_sales:  0.75, pre_tax_profit: -8.23, net_debt:  18.48 } },
  wycombe:        { revenue: null,  wage_bill: null,  operating_profit:  null,  profit_from_player_sales: null, pre_tax_profit:  -9.80, net_debt:  26.05, cash: null, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: null,  wage_bill: null,  wage_ratio: null, operating_profit: null,  profit_from_player_sales: null, pre_tax_profit: -3.80, net_debt:   8.00 } },
};

// ─── League Two 2025/26 ───────────────────────────────────────────────────────
// Promoted to L1: AFC Wimbledon, Bradford City, Doncaster Rovers, Port Vale
// Relegated from L1: Bristol Rovers, Cambridge Utd, Crawley Town, Shrewsbury Town
// Promoted from National League: Barnet, Oldham Athletic
// Relegated to National League: Carlisle Utd, Morecambe (+ 2 others)
const l2Raw: Record<string, RawEntry> = {
  bristol_rovers: { revenue:   8.11, wage_bill:   8.91, operating_profit:   -6.47, pre_tax_profit:   -7.90, net_debt:   -0.77, cash:    1.31, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one" },
  bromley:        { revenue:   5.27, wage_bill:   null, operating_profit:   -1.06, pre_tax_profit:   -1.09, net_debt:    0.42, cash:    0.50, fiscal_year_end: "2024-12-31" },
  cambridge:      { revenue:   9.25, wage_bill:   6.66, operating_profit:   -3.74, pre_tax_profit:   -3.74, net_debt:   -0.26, cash:    0.30, fiscal_year_end: "2025-06-30", compare_division: "league-one" },
  chesterfield:   { revenue:   7.80, wage_bill:   6.04, operating_profit:   -2.22, pre_tax_profit:   -2.38, net_debt:    2.27, cash:    1.48, fiscal_year_end: "2025-06-30", data_confidence: "medium" },
  crewe:          { revenue:   5.20, wage_bill:   null, operating_profit:   -1.16, pre_tax_profit:   -1.16, net_debt:    4.56, cash:    0.10, fiscal_year_end: "2025-06-30" },
  gillingham:     { revenue:   7.53, wage_bill:   6.77, operating_profit:   -5.72, pre_tax_profit:   -5.74, net_debt:    6.99, cash:    0.08, fiscal_year_end: "2025-06-30", data_confidence: "high" },
  harrogate:      { revenue:   4.06, wage_bill:   3.53, operating_profit:   -2.17, pre_tax_profit:   -2.17, net_debt:    6.30, cash:    0.11, fiscal_year_end: "2025-06-30" },
  mk_dons:        { revenue:   5.72, wage_bill:   5.22, operating_profit:   -3.70, pre_tax_profit:   -2.20, net_debt:    null, cash:    0.33, fiscal_year_end: "2024-06-30" },
  shrewsbury:     { revenue:   7.21, wage_bill:   5.35, operating_profit:   -0.92, pre_tax_profit:   -0.93, net_debt:    1.25, cash:    0.07, fiscal_year_end: "2025-06-30", compare_division: "league-one" },
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
  luton: "Luton Town",            northampton: "Northampton",
  peterborough: "Peterborough Utd", plymouth: "Plymouth Argyle",
  reading: "Reading",             rotherham: "Rotherham Utd",
  stockport: "Stockport County",
  wigan: "Wigan Athletic",        wycombe: "Wycombe Wanderers",
  // League Two 2025/26
  bristol_rovers: "Bristol Rovers", bromley: "Bromley",
  cambridge: "Cambridge Utd",    chesterfield: "Chesterfield",
  crewe: "Crewe Alexandra",      gillingham: "Gillingham",
  harrogate: "Harrogate Town",   mk_dons: "MK Dons",
  shrewsbury: "Shrewsbury Town", tranmere: "Tranmere Rovers",
  walsall: "Walsall",
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
