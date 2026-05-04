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
  data2023?: PriorYearFinancials | null;
  data2022?: PriorYearFinancials | null;
}

export const METRICS: { key: keyof ClubFinancials; label: string; description: string }[] = [
  { key: "revenue",                    label: "Revenue",                    description: "Total revenue / turnover" },
  { key: "wage_bill",                  label: "Wage Bill",                  description: "Total staff costs" },
  { key: "operating_profit",         label: "Operating Profit / (Loss)", description: "Profit / loss from operations (after amortisation, before player sales)" },
  { key: "profit_from_player_sales", label: "Player Sales Revenue",       description: "Revenue generated from selling player registrations" },
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
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  613.5, wage_bill:  327.8, wage_ratio:  53, operating_profit:  -49.7, profit_from_player_sales:   51.1, pre_tax_profit:   -17.7, net_debt:   275.0, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-05-31", revenue:  429.9, wage_bill:  225.4, wage_ratio:  52, operating_profit:   96.3, profit_from_player_sales:   10.7, pre_tax_profit:   -54.3, net_debt:   -32.1, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-05-31", revenue:  342.2, wage_bill:  205.5, wage_ratio:  60, operating_profit:   60.8, profit_from_player_sales:   22.1, pre_tax_profit:   -46.7, net_debt:   -26.2, compare_division: "premier-league" } },
  "aston-villa":    { revenue: 310.08, wage_bill: 245.96, operating_profit:  -64.64, profit_from_player_sales:  51.98, pre_tax_profit:  -22.49, net_debt:  148.85, cash:    0.00, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  246.81, wage_bill:  230.82, wage_ratio:  94, operating_profit:  -93.94, profit_from_player_sales:   64.71, pre_tax_profit:   -35.40, net_debt:  190.43, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  260.7, wage_bill:  179.1, wage_ratio:  69, operating_profit:  -23.8, profit_from_player_sales:   22.5, pre_tax_profit:    -5.3, net_debt:    null, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  107.8, wage_bill:  124.3, wage_ratio: 115, operating_profit: -104.2, profit_from_player_sales:   97.4, pre_tax_profit:    -8.1, net_debt:    null, compare_division: "premier-league" } },
  bournemouth:    { revenue: 181.70, wage_bill: 158.40, operating_profit:  -62.70, profit_from_player_sales:  91.00, pre_tax_profit:   14.90, net_debt:    4.40, cash:   47.24, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  160.8, wage_bill:  136.2, wage_ratio:  85, operating_profit:  -55.9, profit_from_player_sales:    0.3, pre_tax_profit:   -66.3, net_debt:   118.8, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  141.0, wage_bill:  100.1, wage_ratio:  71, operating_profit:  -21.3, profit_from_player_sales:    1.9, pre_tax_profit:    44.5, net_debt:    15.0, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:   53.2, wage_bill:   61.4, wage_ratio: 115, operating_profit:  -55.6, profit_from_player_sales:    6.9, pre_tax_profit:   -55.5, net_debt:    17.9, compare_division: "championship" } },
  brentford:      { revenue: 173.10, wage_bill: 130.80, operating_profit:  -48.80, profit_from_player_sales:  27.20, pre_tax_profit:  -20.50, net_debt:  130.10, cash:    1.98, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  166.5, wage_bill:  114.4, wage_ratio:  69, operating_profit:  -29.2, profit_from_player_sales:   25.2, pre_tax_profit:    -7.9, net_debt:    90.9, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  166.5, wage_bill:   98.8, wage_ratio:  59, operating_profit:    4.4, profit_from_player_sales:    5.6, pre_tax_profit:     9.2, net_debt:   -14.5, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  140.9, wage_bill:   68.2, wage_ratio:  48, operating_profit:   25.1, profit_from_player_sales:    4.6, pre_tax_profit:    29.9, net_debt:   -15.0, compare_division: "premier-league" } },
  brighton:       { revenue: 221.06, wage_bill: 158.68, operating_profit:  -88.22, profit_from_player_sales:  56.91, pre_tax_profit:  -32.01, net_debt:  296.23, cash:   39.836, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  222.5, wage_bill:  146.2, wage_ratio:  66, operating_profit:  -35.6, profit_from_player_sales:  110.3, pre_tax_profit:    75.1, net_debt:   281.3, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  203.6, wage_bill:  124.4, wage_ratio:  61, operating_profit:  139.5, profit_from_player_sales:  121.4, pre_tax_profit:   142.0, net_debt:   -15.2, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  167.4, wage_bill:  112.7, wage_ratio:  67, operating_profit:   25.5, profit_from_player_sales:   62.4, pre_tax_profit:    27.4, net_debt:   -11.2, compare_division: "premier-league" } },
  burnley:        { revenue: 133.60, wage_bill:  93.40, operating_profit:  -26.50, profit_from_player_sales:  15.10, pre_tax_profit:  -28.40, net_debt:  103.50, cash:    8.91, fiscal_year_end: "2024-07-31", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2023-07-31", revenue:   64.9, wage_bill:   57.6, wage_ratio:  89, operating_profit:  -40.7, profit_from_player_sales:   11.4, pre_tax_profit:   -36.0, net_debt:    81.3, compare_division: "championship" },
    data2023:   { fiscal_year_end: "2023-07-31", revenue:   64.9, wage_bill:   53.7, wage_ratio:  83, operating_profit:  -18.6, profit_from_player_sales:   11.4, pre_tax_profit:   -36.0, net_debt:    49.5, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-07-31", revenue:  123.4, wage_bill:   92.0, wage_ratio:  75, operating_profit:   12.7, profit_from_player_sales:   54.3, pre_tax_profit:    36.3, net_debt:    32.1, compare_division: "premier-league" } },
  chelsea:        { revenue: 490.86, wage_bill: 359.27, operating_profit: -308.16, profit_from_player_sales:  57.91, pre_tax_profit: -262.44, net_debt:  -49.01, cash:   49.009, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  468.5, wage_bill:  338.0, wage_ratio:  72, operating_profit: -213.0, profit_from_player_sales:  152.5, pre_tax_profit:   128.4, net_debt:   267.2, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  512.5, wage_bill:  404.0, wage_ratio:  79, operating_profit:  -14.7, profit_from_player_sales:   62.9, pre_tax_profit:   -90.1, net_debt:    null, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  481.3, wage_bill:  340.2, wage_ratio:  71, operating_profit:   null, profit_from_player_sales:  123.2, pre_tax_profit:  -121.4, net_debt:    null, compare_division: "premier-league" } },
  "crystal-palace": { revenue: 195.30, wage_bill: 145.48, operating_profit:  -42.72, profit_from_player_sales:  66.08, pre_tax_profit:    8.07, net_debt:  140.18, cash:   13.69, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  190.20, wage_bill:  133.70, wage_ratio:  70, operating_profit:  -20.70, profit_from_player_sales:    1.30, pre_tax_profit:   -32.90, net_debt:   148.90, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  179.5, wage_bill:  129.7, wage_ratio:  72, operating_profit:  -19.6, profit_from_player_sales:    0.3, pre_tax_profit:   -27.2, net_debt:    -8.1, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  160.0, wage_bill:  123.8, wage_ratio:  77, operating_profit:  -19.8, profit_from_player_sales:    0.0, pre_tax_profit:   -24.2, net_debt:    -2.4, compare_division: "premier-league" } },
  everton:        { revenue: 196.70, wage_bill: 152.06, operating_profit:  -75.93, profit_from_player_sales:  31.33, pre_tax_profit:   -8.61, net_debt:  389.40, cash:   79.14, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  186.90, wage_bill:  156.60, wage_ratio:  84, operating_profit:  -92.70, profit_from_player_sales:   48.50, pre_tax_profit:   -53.20, net_debt:  1018.10, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  172.2, wage_bill:  159.0, wage_ratio:  92, operating_profit:  -41.0, profit_from_player_sales:   47.5, pre_tax_profit:   -89.1, net_debt:   330.6, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  181.0, wage_bill:  162.0, wage_ratio:  90, operating_profit:  -24.5, profit_from_player_sales:   67.7, pre_tax_profit:   -38.4, net_debt:   141.7, compare_division: "premier-league" } },
  fulham:         { revenue: 194.79, wage_bill: 166.51, operating_profit:  -80.57, profit_from_player_sales:  41.04, pre_tax_profit:  -39.01, net_debt:   84.90, cash:   13.17, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  181.60, wage_bill:  154.80, wage_ratio:  85, operating_profit:  -64.90, profit_from_player_sales:   32.70, pre_tax_profit:   -32.10, net_debt:    92.20, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  182.3, wage_bill:  139.1, wage_ratio:  76, operating_profit:  -35.7, profit_from_player_sales:    8.7, pre_tax_profit:   -26.6, net_debt:   -51.5, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:   71.6, wage_bill:   90.4, wage_ratio: 126, operating_profit:  -70.4, profit_from_player_sales:   12.5, pre_tax_profit:   -57.9, net_debt:   -30.8, compare_division: "championship" } },
  leeds:          { revenue: 137.00, wage_bill: 102.70, operating_profit:  -68.40, profit_from_player_sales:  24.80, pre_tax_profit:  -49.20, net_debt:   24.90, cash:   33.95, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  127.6, wage_bill:   84.0, wage_ratio:  66, operating_profit:  -76.3, profit_from_player_sales:   33.7, pre_tax_profit:   -60.8, net_debt:    55.3, compare_division: "championship" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  189.7, wage_bill:  145.9, wage_ratio:  77, operating_profit: -106.0, profit_from_player_sales:   73.3, pre_tax_profit:   -33.7, net_debt:    40.0, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  189.2, wage_bill:  121.4, wage_ratio:  64, operating_profit:  -34.5, profit_from_player_sales:    0.9, pre_tax_profit:   -36.7, net_debt:    34.1, compare_division: "premier-league" } },
  liverpool:      { revenue: 703.00, wage_bill: 428.00, operating_profit:  -30.00, profit_from_player_sales:  53.00, pre_tax_profit:   15.00, net_debt:  282.72, cash:    2.54, fiscal_year_end: "2025-05-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  613.8, wage_bill:  386.1, wage_ratio:  63, operating_profit:  -69.7, profit_from_player_sales:   22.0, pre_tax_profit:   -57.1, net_debt:   306.8, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-05-31", revenue:  593.8, wage_bill:  372.9, wage_ratio:  63, operating_profit:   -4.5, profit_from_player_sales:   33.8, pre_tax_profit:    -9.0, net_debt:   193.4, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-05-31", revenue:  594.3, wage_bill:  366.1, wage_ratio:  62, operating_profit:   10.0, profit_from_player_sales:   28.1, pre_tax_profit:     7.5, net_debt:   145.0, compare_division: "premier-league" } },
  "man-city":       { revenue: 694.00, wage_bill: 408.00, operating_profit:  -93.00, profit_from_player_sales:  95.00, pre_tax_profit:  -10.00, net_debt:  328.00, cash:  173.72, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  715.0, wage_bill:  412.6, wage_ratio:  58, operating_profit:  -60.5, profit_from_player_sales:  139.0, pre_tax_profit:    73.8, net_debt:     9.6, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-05-31", revenue:  712.8, wage_bill:  422.9, wage_ratio:  59, operating_profit:  -35.6, profit_from_player_sales:  121.7, pre_tax_profit:    80.4, net_debt:   -79.3, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-05-31", revenue:  613.0, wage_bill:  353.9, wage_ratio:  58, operating_profit:  -21.4, profit_from_player_sales:   67.7, pre_tax_profit:    41.7, net_debt:   -77.8, compare_division: "premier-league" } },
  "man-united":     { revenue: 667.00, wage_bill: 313.00, operating_profit:  -31.00, profit_from_player_sales:  49.00, pre_tax_profit:  -40.00, net_debt:  550.90, cash:   74.15, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  661.8, wage_bill:  364.7, wage_ratio:  55, operating_profit: -106.8, profit_from_player_sales:   37.4, pre_tax_profit:  -130.7, net_debt:   473.1, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  601.3, wage_bill:  313.8, wage_ratio:  52, operating_profit:   -6.9, profit_from_player_sales:   19.5, pre_tax_profit:   -25.1, net_debt:   545.1, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  540.0, wage_bill:  372.5, wage_ratio:  69, operating_profit:  -92.3, profit_from_player_sales:   21.8, pre_tax_profit:  -147.1, net_debt:   534.5, compare_division: "premier-league" } },
  newcastle:      { revenue: 335.00, wage_bill: 243.00, operating_profit: -109.00, profit_from_player_sales:  20.00, pre_tax_profit:   35.00, net_debt:   52.00, cash:   12.70, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  320.3, wage_bill:  218.7, wage_ratio:  68, operating_profit:  -68.7, profit_from_player_sales:   69.8, pre_tax_profit:   -11.1, net_debt:    34.3, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  250.3, wage_bill:  186.7, wage_ratio:  75, operating_profit:  -66.5, profit_from_player_sales:    2.8, pre_tax_profit:   -73.3, net_debt:    36.0, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  180.0, wage_bill:  170.2, wage_ratio:  95, operating_profit:  -71.7, profit_from_player_sales:    5.8, pre_tax_profit:   -72.9, net_debt:    -5.1, compare_division: "premier-league" } },
  "nottm-forest":   { revenue: 221.70, wage_bill: 166.70, operating_profit:  -64.90, profit_from_player_sales:   7.00, pre_tax_profit:  -78.90, net_debt:   85.80, cash:   13.22, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  189.6, wage_bill:  166.4, wage_ratio:  88, operating_profit:  -73.3, profit_from_player_sales:  100.5, pre_tax_profit:    12.1, net_debt:    96.2, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  154.8, wage_bill:  144.9, wage_ratio:  94, operating_profit:  -59.6, profit_from_player_sales:    2.6, pre_tax_profit:   -67.2, net_debt:    57.0, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:   29.7, wage_bill:   58.6, wage_ratio: 197, operating_profit:  -49.5, profit_from_player_sales:    4.1, pre_tax_profit:   -46.2, net_debt:     7.9, compare_division: "championship" } },
  sunderland:     { revenue:  39.42, wage_bill:  52.90, operating_profit:   -0.33, profit_from_player_sales:  45.84, pre_tax_profit:   -3.28, net_debt:   24.33, cash:   20.71, fiscal_year_end: "2025-07-31", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-07-31", revenue:   37.45, wage_bill:   30.46, wage_ratio:  81, operating_profit:   -8.49, profit_from_player_sales:    8.82, pre_tax_profit:    -9.07, net_debt:    28.10, compare_division: "championship" },
    data2023:   { fiscal_year_end: "2023-07-31", revenue:   35.1, wage_bill:   25.3, wage_ratio:  72, operating_profit:   null, profit_from_player_sales:    1.0, pre_tax_profit:    -9.7, net_debt:    -2.1, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-07-31", revenue:   25.9, wage_bill:   16.1, wage_ratio:  62, operating_profit:   null, profit_from_player_sales:    1.2, pre_tax_profit:    -7.9, net_debt:    -1.6, compare_division: "league-one" } },
  tottenham:      { revenue: 565.00, wage_bill: 256.00, operating_profit:  -91.00, profit_from_player_sales:  53.00, pre_tax_profit: -121.00, net_debt:  831.00, cash:   20.41, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  528.2, wage_bill:  221.9, wage_ratio:  42, operating_profit:  -61.0, profit_from_player_sales:   82.3, pre_tax_profit:   -26.0, net_debt:   772.5, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  549.6, wage_bill:  251.1, wage_ratio:  46, operating_profit:  -49.9, profit_from_player_sales:   15.5, pre_tax_profit:   -94.7, net_debt:   677.4, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  444.0, wage_bill:  209.2, wage_ratio:  47, operating_profit:  -20.7, profit_from_player_sales:   19.2, pre_tax_profit:   -61.3, net_debt:   626.1, compare_division: "premier-league" } },
  "west-ham":       { revenue: 226.06, wage_bill: 173.34, operating_profit: -109.47, profit_from_player_sales:  19.95, pre_tax_profit: -108.84, net_debt:  216.22, cash:    0.42, fiscal_year_end: "2025-05-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  269.7, wage_bill:  161.0, wage_ratio:  60, operating_profit:  -30.8, profit_from_player_sales:   96.3, pre_tax_profit:    57.2, net_debt:   -32.5, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-05-31", revenue:  235.4, wage_bill:  135.3, wage_ratio:  57, operating_profit:  -15.9, profit_from_player_sales:   17.0, pre_tax_profit:   -17.4, net_debt:    19.9, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-05-31", revenue:  251.8, wage_bill:  134.4, wage_ratio:  53, operating_profit:   20.1, profit_from_player_sales:    0.7, pre_tax_profit:    13.3, net_debt:   -41.5, compare_division: "premier-league" } },
  wolves:         { revenue: 172.00, wage_bill: 162.09, operating_profit: -117.30, profit_from_player_sales: 116.98, pre_tax_profit:  -11.63, net_debt:   67.95, cash:   33.44, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  177.70, wage_bill:  141.90, wage_ratio:  80, operating_profit:  -73.30, profit_from_player_sales:   64.60, pre_tax_profit:   -14.30, net_debt:    72.70, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-05-31", revenue:  168.6, wage_bill:  141.6, wage_ratio:  84, operating_profit:  -97.5, profit_from_player_sales:   43.9, pre_tax_profit:   -64.1, net_debt:    81.1, compare_division: "premier-league" },
    data2022:   { fiscal_year_end: "2022-05-31", revenue:  165.7, wage_bill:  120.2, wage_ratio:  73, operating_profit:  -52.5, profit_from_player_sales:   15.0, pre_tax_profit:   -43.1, net_debt:    73.1, compare_division: "premier-league" } },
};

// ─── Championship 2025/26 ─────────────────────────────────────────────────────
// Promoted to PL: Burnley, Leeds United, Sunderland
// Relegated from PL: Ipswich Town, Leicester City, Southampton
// Promoted from L1: Birmingham City, Charlton Athletic, Wrexham
// Relegated to L1: Cardiff City, Luton Town, Plymouth Argyle
const chRaw: Record<string, RawEntry> = {
  birmingham:     { revenue:  35.64, wage_bill:  35.70, operating_profit:  -39.42, profit_from_player_sales:  14.27, pre_tax_profit:  -34.56, net_debt:  183.16, cash:   14.23, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  28.72, wage_bill:  33.72, wage_ratio: 117, operating_profit:  -32.59, profit_from_player_sales:  15.41, pre_tax_profit:  -16.08, net_debt: 142.81, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 18.99, wage_bill: 27.63, wage_ratio: 145, operating_profit: -26.51, profit_from_player_sales:  2.13, pre_tax_profit: -25.37, net_debt:   1.51, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 17.55, wage_bill: 31.11, wage_ratio: 177, operating_profit: -26.93, profit_from_player_sales:  3.11, pre_tax_profit: -24.83, net_debt:   6.45, compare_division: "championship" } },
  blackburn:      { revenue:  23.70, wage_bill:  28.22, operating_profit:  -21.41, profit_from_player_sales:  13.02, pre_tax_profit:  -10.42, net_debt:  151.39, cash:    0.26, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  21.40, wage_bill:  25.44, wage_ratio: 119, operating_profit:  -19.50, profit_from_player_sales:  23.56, pre_tax_profit:    3.33, net_debt: 118.13, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 20.99, wage_bill: 25.79, wage_ratio: 123, operating_profit: -20.91, profit_from_player_sales:  0.35, pre_tax_profit: -20.90, net_debt:  18.14, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 16.90, wage_bill: 24.36, wage_ratio: 144, operating_profit: -21.48, profit_from_player_sales: 10.05, pre_tax_profit: -11.24, net_debt:  17.44, compare_division: "championship" } },
  "bristol-city":   { revenue:  24.06, wage_bill:  25.85, operating_profit:  -18.84, profit_from_player_sales:   5.80, pre_tax_profit:  -13.15, net_debt:   20.74, cash:    0.03, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  20.52, wage_bill:  24.82, wage_ratio: 121, operating_profit:  -21.97, profit_from_player_sales:  21.70, pre_tax_profit:   -0.80, net_debt:  23.43, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 18.57, wage_bill: 26.31, wage_ratio: 141, operating_profit: -28.33, profit_from_player_sales:  9.53, pre_tax_profit: -19.53, net_debt:   5.31, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-05-31", revenue: 16.65, wage_bill: 23.81, wage_ratio: 143, operating_profit: -27.57, profit_from_player_sales:  1.25, pre_tax_profit: -26.81, net_debt:   5.09, compare_division: "championship" } },
  charlton:       { revenue:  11.17, wage_bill:  15.71, operating_profit:  -16.83, profit_from_player_sales:   1.44, pre_tax_profit:  -15.39, net_debt:   31.45, cash:    0.46, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:   8.81, wage_bill:  12.13, wage_ratio: 138, operating_profit:  -14.57, profit_from_player_sales:   0.69, pre_tax_profit:  -13.93, net_debt:  29.77, compare_division: "league-one" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  9.80, wage_bill: 10.28, wage_ratio: 105, operating_profit:  -9.86, profit_from_player_sales:  0.35, pre_tax_profit:  -9.56, net_debt:   6.48, compare_division: "league-one" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  9.80, wage_bill: 11.14, wage_ratio: 114, operating_profit: -10.12, profit_from_player_sales:  3.31, pre_tax_profit:  -7.42, net_debt:   5.11, compare_division: "league-one" } },
  coventry:       { revenue:  34.15, wage_bill:  26.48, operating_profit:  -24.78, profit_from_player_sales:   3.13, pre_tax_profit:  -21.60, net_debt:   49.40, cash:    0.37, fiscal_year_end: "2025-05-31",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  29.31, wage_bill:  23.41, wage_ratio:  80, operating_profit:  -14.96, profit_from_player_sales:  23.68, pre_tax_profit:    8.69, net_debt:  56.81, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-05-31", revenue: 20.37, wage_bill: 18.46, wage_ratio:  91, operating_profit:  -7.89, profit_from_player_sales:  2.37, pre_tax_profit:  -4.91, net_debt:  -0.45, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-05-31", revenue: 18.09, wage_bill: 15.67, wage_ratio:  87, operating_profit:  -5.58, profit_from_player_sales:  0.49, pre_tax_profit:  -6.96, net_debt:   1.02, compare_division: "championship" } },
  derby:          { revenue:  31.87, wage_bill:  31.53, operating_profit:  -11.07, profit_from_player_sales:  10.30, pre_tax_profit:  -11.07, net_debt:   61.89, cash:    1.62, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  19.40, wage_bill:  21.98, wage_ratio: 113, operating_profit:  -14.17, profit_from_player_sales:   4.63, pre_tax_profit:  -14.18, net_debt:  60.34, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 20.44, wage_bill: 17.21, wage_ratio:  84, operating_profit: -12.19, profit_from_player_sales:  1.58, pre_tax_profit: -30.36, net_debt:  -4.18, compare_division: "championship" } },
  hull:           { revenue:  25.82, wage_bill:  36.68, operating_profit:   -8.63, profit_from_player_sales:  33.05, pre_tax_profit:  -10.22, net_debt:   76.47, cash:    0.09, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  21.23, wage_bill:  29.56, wage_ratio: 139, operating_profit:  -18.13, profit_from_player_sales:   8.34, pre_tax_profit:  -18.85, net_debt:  78.25, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 18.09, wage_bill: 23.65, wage_ratio: 131, operating_profit: -20.60, profit_from_player_sales: 15.19, pre_tax_profit:  -5.22, net_debt:  21.63, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 15.37, wage_bill: 12.70, wage_ratio:  83, operating_profit:  -7.87, profit_from_player_sales:  2.33, pre_tax_profit:  13.94, net_debt:  22.95, compare_division: "championship" } },
  ipswich:        { revenue: 155.42, wage_bill:  77.14, operating_profit:   -6.21, profit_from_player_sales:  15.40, pre_tax_profit:    4.01, net_debt:    0.00, cash:   13.67, fiscal_year_end: "2025-06-30", compare_division: "premier-league",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  37.31, wage_bill:  44.53, wage_ratio: 119, operating_profit:  -40.48, profit_from_player_sales:   1.23, pre_tax_profit:  -39.28, net_debt:  62.30, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 21.75, wage_bill: 19.80, wage_ratio:  91, operating_profit: -19.84, profit_from_player_sales:  2.27, pre_tax_profit: -18.17, net_debt:   5.81, compare_division: "league-one" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 14.44, wage_bill: 16.43, wage_ratio: 114, operating_profit: -14.39, profit_from_player_sales:  2.34, pre_tax_profit: -12.65, net_debt:   6.90, compare_division: "league-one" } },
  leicester:      { revenue: 105.35, wage_bill: 107.16, operating_profit:   -8.98, profit_from_player_sales:  71.84, pre_tax_profit:  -19.43, net_debt:  218.88, cash:    7.09, fiscal_year_end: "2024-06-30", compare_division: "premier-league",
    prior_year: { fiscal_year_end: "2023-06-30", revenue: 177.33, wage_bill: 205.78, wage_ratio: 116, operating_profit: -152.01, profit_from_player_sales: 74.77, pre_tax_profit:  -89.72, net_debt:  58.47, compare_division: "premier-league" },
    data2022: { fiscal_year_end: "2022-05-31", revenue: 214.59, wage_bill: 181.97, wage_ratio:  85, operating_profit:  -82.82, profit_from_player_sales:  9.21, pre_tax_profit:  -92.50, net_debt:  46.37, compare_division: "premier-league" } },
  middlesbrough:  { revenue:  32.48, wage_bill:  36.36, operating_profit:  -10.34, profit_from_player_sales:  26.34, pre_tax_profit:  -11.42, net_debt:   11.37, cash:    0.16, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  32.25, wage_bill:  31.39, wage_ratio:  97, operating_profit:  -11.92, profit_from_player_sales:  17.11, pre_tax_profit:  -12.43, net_debt:  58.21, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 28.59, wage_bill: 26.11, wage_ratio:  91, operating_profit: -29.05, profit_from_player_sales: 22.32, pre_tax_profit:  -6.40, net_debt:   9.51, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 26.89, wage_bill: 25.04, wage_ratio:  93, operating_profit: -20.79, profit_from_player_sales:  1.35, pre_tax_profit: -19.46, net_debt:   5.77, compare_division: "championship" } },
  millwall:       { revenue:  23.86, wage_bill:  28.63, operating_profit:    1.05, profit_from_player_sales:  21.62, pre_tax_profit:    0.18, net_debt:  177.43, cash:    0.79, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  21.41, wage_bill:  25.58, wage_ratio: 119, operating_profit:  -18.29, profit_from_player_sales:   0.00, pre_tax_profit:  -18.59, net_debt: 174.49, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 19.36, wage_bill: 22.58, wage_ratio: 117, operating_profit: -13.70, profit_from_player_sales:  2.51, pre_tax_profit: -12.21, net_debt:   1.85, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 18.59, wage_bill: 22.32, wage_ratio: 120, operating_profit: -11.75, profit_from_player_sales: -0.11, pre_tax_profit: -12.60, net_debt:   5.03, compare_division: "championship" } },
  norwich:        { revenue:  39.28, wage_bill:  48.08, operating_profit:  -14.38, profit_from_player_sales:  23.21, pre_tax_profit:  -20.67, net_debt:   54.43, cash:    2.00, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  73.14, wage_bill:  45.86, wage_ratio:  63, operating_profit:   -6.97, profit_from_player_sales:  13.38, pre_tax_profit:  -14.37, net_debt: 132.30, compare_division: "premier-league" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 75.64, wage_bill: 50.16, wage_ratio:  66, operating_profit: -24.75, profit_from_player_sales:  3.63, pre_tax_profit: -27.20, net_debt:  45.24, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 133.87, wage_bill: 105.83, wage_ratio: 79, operating_profit: -20.51, profit_from_player_sales: -0.05, pre_tax_profit: -23.58, net_debt:  63.93, compare_division: "premier-league" } },
  "oxford-utd":     { revenue:  19.00, wage_bill:  21.66, operating_profit:  -17.46, profit_from_player_sales:   0.08, pre_tax_profit:  -17.48, net_debt:   -0.21, cash:    0.24, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:   8.44, wage_bill:  11.25, wage_ratio: 133, operating_profit:  -15.72, profit_from_player_sales:   0.62, pre_tax_profit:  -15.85, net_debt:  47.45, compare_division: "league-one" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  7.49, wage_bill: null, wage_ratio: null, operating_profit:  -7.76, profit_from_player_sales:  1.63, pre_tax_profit:  -6.18, net_debt:  -0.06, compare_division: "league-one" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  6.89, wage_bill: null, wage_ratio: null, operating_profit:  -5.73, profit_from_player_sales:  1.63, pre_tax_profit:  -4.13, net_debt:  -0.29, compare_division: "league-one" } },
  portsmouth:     { revenue:  24.57, wage_bill:  17.43, operating_profit:   -4.20, profit_from_player_sales:   0.39, pre_tax_profit:   -4.36, net_debt:    6.15, cash:    2.04, fiscal_year_end: "2025-06-30", data_confidence: "medium",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  13.62, wage_bill:  10.57, wage_ratio:  78, operating_profit:   -3.79, profit_from_player_sales:   0.03, pre_tax_profit:   -5.61, net_debt:   8.28, compare_division: "league-one" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 12.50, wage_bill:  8.29, wage_ratio:  66, operating_profit:  -3.84, profit_from_player_sales:  0.75, pre_tax_profit:  -3.09, net_debt:  -2.80, compare_division: "league-one" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 11.95, wage_bill:  7.87, wage_ratio:  66, operating_profit:  -2.91, profit_from_player_sales: -0.17, pre_tax_profit:  -2.91, net_debt:  -2.79, compare_division: "league-one" } },
  preston:        { revenue:  18.88, wage_bill:  25.67, operating_profit:  -16.02, profit_from_player_sales:   0.00, pre_tax_profit:  -15.98, net_debt:    null, cash:    2.37, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  15.31, wage_bill:  21.29, wage_ratio: 139, operating_profit:  -12.35, profit_from_player_sales:   0.38, pre_tax_profit:  -12.32, net_debt:   5.34, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 14.03, wage_bill: 20.99, wage_ratio: 150, operating_profit: -13.51, profit_from_player_sales:  0.79, pre_tax_profit: -12.72, net_debt:  -1.50, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 12.41, wage_bill: 23.97, wage_ratio: 193, operating_profit: -19.19, profit_from_player_sales:  0.30, pre_tax_profit: -18.89, net_debt:  -2.17, compare_division: "championship" } },
  qpr:            { revenue:  28.00, wage_bill:  27.50, operating_profit:  -20.70, profit_from_player_sales:   2.26, pre_tax_profit:  -20.30, net_debt:    6.14, cash:    0.07, fiscal_year_end: "2025-05-31",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  25.89, wage_bill:  23.78, wage_ratio:  92, operating_profit:  -15.18, profit_from_player_sales:   2.20, pre_tax_profit:  -13.53, net_debt: 117.42, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-05-31", revenue: 23.28, wage_bill: 25.41, wage_ratio: 109, operating_profit: -22.18, profit_from_player_sales:  1.05, pre_tax_profit: -20.34, net_debt:   8.19, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-05-31", revenue: 22.12, wage_bill: 27.56, wage_ratio: 125, operating_profit: -24.24, profit_from_player_sales:  0.22, pre_tax_profit: -24.67, net_debt:   4.75, compare_division: "championship" } },
  "sheff-utd":      { revenue:  79.33, wage_bill:  45.97, operating_profit:  -16.64, profit_from_player_sales:  25.38, pre_tax_profit:    2.59, net_debt:   53.68, cash:    2.78, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 137.60, wage_bill:  63.70, wage_ratio:  46, operating_profit:   -7.45, profit_from_player_sales:  19.35, pre_tax_profit:    3.90, net_debt: 103.38, compare_division: "premier-league" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  63.93, wage_bill:  48.19, wage_ratio:  75, operating_profit:  -32.03, profit_from_player_sales:   4.42, pre_tax_profit:  -31.45, net_debt:  52.53, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  66.68, wage_bill:  42.05, wage_ratio:  63, operating_profit:  -24.10, profit_from_player_sales:  11.17, pre_tax_profit:  -16.03, net_debt:  39.04, compare_division: "championship" } },
  "sheff-wed":      { revenue:  26.34, wage_bill:  21.81, operating_profit:   -9.26, profit_from_player_sales:   0.00, pre_tax_profit:  -10.01, net_debt:    6.85, cash:    0.16, fiscal_year_end: "2024-07-31",
    prior_year: { fiscal_year_end: "2023-07-31", revenue:  19.31, wage_bill:  15.76, wage_ratio:  82, operating_profit:   -6.47, profit_from_player_sales:   0.00, pre_tax_profit:   -7.24, net_debt:  77.81, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-07-31", revenue:  16.36, wage_bill:  12.43, wage_ratio:  76, operating_profit:   -7.31, profit_from_player_sales:   0.96, pre_tax_profit:   -7.35, net_debt:  -0.63, compare_division: "league-one" } },
  southampton:    { revenue: 157.52, wage_bill: 113.96, operating_profit:  -62.25, profit_from_player_sales:  28.44, pre_tax_profit:  -45.29, net_debt:  141.22, cash:    9.35, fiscal_year_end: "2025-06-30", compare_division: "premier-league",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  84.00, wage_bill:  79.01, wage_ratio:  94, operating_profit:   -7.05, profit_from_player_sales: 123.04, pre_tax_profit:   24.09, net_debt: 217.25, compare_division: "premier-league" },
    data2023: { fiscal_year_end: "2023-06-30", revenue: 145.47, wage_bill: 121.11, wage_ratio:  83, operating_profit:  -76.25, profit_from_player_sales:   7.44, pre_tax_profit:  -74.45, net_debt: -13.08, compare_division: "premier-league" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 150.63, wage_bill: 113.45, wage_ratio:  75, operating_profit:  -35.28, profit_from_player_sales:  31.20, pre_tax_profit:   -5.82, net_debt: -20.16, compare_division: "premier-league" } },
  stoke:          { revenue:  35.44, wage_bill:  30.30, operating_profit:  -29.54, profit_from_player_sales:   0.15, pre_tax_profit:  -28.31, net_debt:  119.35, cash:   25.52, fiscal_year_end: "2025-05-31",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  32.27, wage_bill:  31.76, wage_ratio:  98, operating_profit:  -30.71, profit_from_player_sales:   4.41, pre_tax_profit:  -25.86, net_debt: 160.50, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-05-31", revenue:  31.20, wage_bill:  28.23, wage_ratio:  91, operating_profit:  -26.56, profit_from_player_sales:  15.26, pre_tax_profit:  -11.07, net_debt:  -8.85, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-05-31", revenue:  31.17, wage_bill:  35.56, wage_ratio: 114, operating_profit:  -29.02, profit_from_player_sales:  10.94, pre_tax_profit:  101.94, net_debt:  -6.08, compare_division: "championship" } },
  swansea:        { revenue:  21.54, wage_bill:  27.35, operating_profit:  -25.20, profit_from_player_sales:  10.47, pre_tax_profit:  -15.19, net_debt:    0.00, cash:    5.31, fiscal_year_end: "2024-06-30", data_confidence: "medium",
    prior_year: { fiscal_year_end: "2023-06-30", revenue:  21.57, wage_bill:  24.85, wage_ratio: 115, operating_profit:  -21.28, profit_from_player_sales:   4.52, pre_tax_profit:  -17.93, net_debt:  10.77, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-07-31", revenue:  19.70, wage_bill:  26.07, wage_ratio: 132, operating_profit:  -23.22, profit_from_player_sales:  10.88, pre_tax_profit:  -13.22, net_debt:   9.64, compare_division: "championship" } },
  watford:        { revenue:  25.98, wage_bill:  28.12, operating_profit:  -12.47, profit_from_player_sales:  15.83, pre_tax_profit:  -15.95, net_debt:   57.90, cash:    1.31, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  57.59, wage_bill:  33.03, wage_ratio:  57, operating_profit:   -7.05, profit_from_player_sales:  29.26, pre_tax_profit:   12.76, net_debt: 130.61, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  66.20, wage_bill:  48.73, wage_ratio:  74, operating_profit:  -28.17, profit_from_player_sales:  59.16, pre_tax_profit:  24.13, net_debt:  56.00, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue: 128.09, wage_bill:  78.97, wage_ratio:  62, operating_profit:  -24.20, profit_from_player_sales:  15.34, pre_tax_profit: -16.13, net_debt:  77.51, compare_division: "premier-league" } },
  "west-brom":      { revenue:  30.35, wage_bill:  37.05, operating_profit:  -29.44, profit_from_player_sales:   9.20, pre_tax_profit:  -19.99, net_debt:   -0.41, cash:    0.47, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  28.21, wage_bill:  42.90, wage_ratio: 152, operating_profit:  -29.20, profit_from_player_sales:   3.53, pre_tax_profit:  -33.87, net_debt:  73.01, compare_division: "championship" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  56.75, wage_bill:  45.95, wage_ratio:  81, operating_profit:  -18.27, profit_from_player_sales:   6.55, pre_tax_profit: -10.99, net_debt: -12.67, compare_division: "championship" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  65.42, wage_bill:  42.38, wage_ratio:  65, operating_profit:  -11.77, profit_from_player_sales:  16.92, pre_tax_profit:   5.37, net_debt:  -7.34, compare_division: "championship" } },
  wrexham:        { revenue:  33.34, wage_bill:  19.95, operating_profit:  -14.85, profit_from_player_sales:   0.00, pre_tax_profit:  -15.24, net_debt:    0.00, cash:    3.32, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  26.73, wage_bill:  11.04, wage_ratio:  41, operating_profit:   -2.02, profit_from_player_sales:   0.00, pre_tax_profit:   -2.73, net_debt:  25.63, compare_division: "league-one" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  10.48, wage_bill:   6.91, wage_ratio:  66, operating_profit:   -4.70, profit_from_player_sales:   0.00, pre_tax_profit:  -5.11, net_debt:  -1.37, compare_division: "league-two" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:   5.97, wage_bill:   4.05, wage_ratio:  68, operating_profit:   -2.87, profit_from_player_sales:   0.00, pre_tax_profit:  -2.91, net_debt:  -1.25 } },
};

// ─── League One 2025/26 ───────────────────────────────────────────────────────
// Promoted to Championship: Birmingham City, Charlton Athletic, Wrexham
// Relegated from Championship: Cardiff City, Luton Town, Plymouth Argyle
// Promoted from L2: AFC Wimbledon, Bradford City, Port Vale
// Relegated to L2: Bristol Rovers, Cambridge Utd, Crawley Town, Shrewsbury Town
const l1Raw: Record<string, RawEntry> = {
  "afc-wimbledon":  { revenue:  9.78, wage_bill:  5.74, operating_profit:  -1.40, profit_from_player_sales:  0.97, pre_tax_profit:  -1.30, net_debt:  -1.26, cash:  1.34, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "league-two",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.69, wage_bill:  5.14, wage_ratio:  59, operating_profit:  0.34, profit_from_player_sales:  3.28, pre_tax_profit:  0.38, net_debt:  22.86, compare_division: "league-two" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  7.28, wage_bill:  3.72, wage_ratio:  51, operating_profit:  -1.55, profit_from_player_sales:  2.64, pre_tax_profit:  1.08, net_debt:  -1.78, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  8.06, wage_bill:  4.08, wage_ratio:  51, operating_profit:  -0.47, profit_from_player_sales:  0.73, pre_tax_profit:  0.24, net_debt:  -2.58, compare_division: "league-one" } },
  barnsley:       { revenue: 10.28, wage_bill: 11.46, operating_profit:  -6.28, profit_from_player_sales: -0.17, pre_tax_profit:  -6.58, net_debt:  -0.88, cash:  0.88, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.97, wage_bill: 11.25, wage_ratio: 125, operating_profit: -9.66, profit_from_player_sales:  6.78, pre_tax_profit: -2.84, net_debt:   8.35, compare_division: "league-one" },
    data2023:   { fiscal_year_end: "2023-05-31", revenue:  9.54, wage_bill:  8.33, wage_ratio:  87, operating_profit:  -5.86, profit_from_player_sales:  1.85, pre_tax_profit: -4.01, net_debt:  -0.76, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-05-31", revenue: 14.97, wage_bill: 11.58, wage_ratio:  77, operating_profit:  -6.80, profit_from_player_sales: -0.24, pre_tax_profit: -7.03, net_debt:   0.14, compare_division: "championship" } },
  blackpool:      { revenue:  8.82, wage_bill:  9.95, operating_profit:  -7.10, profit_from_player_sales:  2.80, pre_tax_profit:  -4.31, net_debt:  -1.42, cash:  1.42, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  9.70, wage_bill:  9.51, wage_ratio:  98, operating_profit: -6.22, profit_from_player_sales:  2.28, pre_tax_profit: -3.94, net_debt:  23.79, compare_division: "league-one" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 17.26, wage_bill: 12.21, wage_ratio:  71, operating_profit:  -3.19, profit_from_player_sales:  2.93, pre_tax_profit: -0.26, net_debt:  -0.89, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue: 15.29, wage_bill: 10.34, wage_ratio:  68, operating_profit:  -1.39, profit_from_player_sales:  1.96, pre_tax_profit:  0.57, net_debt:  -1.65, compare_division: "championship" } },
  bolton:         { revenue: 20.46, wage_bill: 18.47, operating_profit: -13.96, profit_from_player_sales: null, pre_tax_profit: -14.36, net_debt:  10.07, cash:  0.46, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 21.30, wage_bill: 16.10, wage_ratio:  76, operating_profit: -10.45, profit_from_player_sales: null, pre_tax_profit: -11.15, net_debt:   9.91 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 19.43, wage_bill: 11.52, wage_ratio:  59, operating_profit:  -5.17, profit_from_player_sales: null, pre_tax_profit: -5.46, net_debt:   5.70, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue: 13.83, wage_bill:  9.19, wage_ratio:  66, operating_profit:  -5.75, profit_from_player_sales: null, pre_tax_profit: -3.69, net_debt:   4.14, compare_division: "league-one" } },
  bradford:       { revenue:  8.69, wage_bill: null,  operating_profit:  -2.98, profit_from_player_sales: null, pre_tax_profit:  -2.99, net_debt:   0.00, cash:  0.17, fiscal_year_end: "2025-06-30", compare_division: "league-two",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.64, wage_bill:  6.10, wage_ratio:  71, operating_profit: -0.99, profit_from_player_sales:  0.37, pre_tax_profit: -1.00, net_debt:   7.44, compare_division: "league-two" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  8.54, wage_bill: null, wage_ratio: null, operating_profit:  -0.37, profit_from_player_sales: null, pre_tax_profit: -0.37, net_debt:   1.53, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  7.10, wage_bill: null, wage_ratio: null, operating_profit:  -0.30, profit_from_player_sales: null, pre_tax_profit: -0.30, net_debt:   1.51, compare_division: "league-two" } },
  burton:         { revenue:  6.41, wage_bill:  8.23, operating_profit:  -8.58, profit_from_player_sales:  0.23, pre_tax_profit:  -8.34, net_debt:  -0.66, cash:  0.67, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.38, wage_bill:  5.36, wage_ratio:  84, operating_profit: -1.77, profit_from_player_sales:  0.47, pre_tax_profit: -1.29, net_debt:   4.28 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  6.15, wage_bill:  4.41, wage_ratio:  72, operating_profit:  -1.11, profit_from_player_sales:  0.97, pre_tax_profit: -0.13, net_debt:   0.36, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  5.78, wage_bill:  4.58, wage_ratio:  79, operating_profit:  -0.58, profit_from_player_sales:  0.14, pre_tax_profit: -0.45, net_debt:   0.19, compare_division: "league-one" } },
  cardiff:        { revenue: 25.76, wage_bill: 29.19, operating_profit: -27.49, profit_from_player_sales:  6.10, pre_tax_profit: -34.48, net_debt:  -1.00, cash: 1.38, fiscal_year_end: "2025-05-31", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-05-31", revenue: 22.55, wage_bill: 28.42, wage_ratio: 126, operating_profit: -20.57, profit_from_player_sales:  5.17, pre_tax_profit: -19.84, net_debt:  -2.56, compare_division: "championship" },
    data2023:   { fiscal_year_end: "2023-05-31", revenue: 26.23, wage_bill: 22.29, wage_ratio:  85, operating_profit: -11.09, profit_from_player_sales:  1.66, pre_tax_profit: -11.40, net_debt:  -2.99, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-05-31", revenue: 19.88, wage_bill: 29.22, wage_ratio: 147, operating_profit: -29.03, profit_from_player_sales:  4.23, pre_tax_profit: -30.42, net_debt:   1.94, compare_division: "championship" } },
  exeter:         { revenue:  8.21, wage_bill:  6.88, operating_profit:  -4.39, profit_from_player_sales:  4.93, pre_tax_profit:   0.53, net_debt:  -0.35, cash:  0.35, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.57, wage_bill:  5.13, wage_ratio:  78, operating_profit: -2.95, profit_from_player_sales:  3.11, pre_tax_profit:  0.18, net_debt:   2.61 },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  4.53, wage_bill:  4.01, wage_ratio:  89, operating_profit:  -0.27, profit_from_player_sales:  1.50, pre_tax_profit:  1.23, net_debt:  -3.00, compare_division: "league-two" } },
  huddersfield:   { revenue: 10.63, wage_bill: 16.90, operating_profit: -20.06, profit_from_player_sales:  1.58, pre_tax_profit: -22.39, net_debt:  -3.23, cash:  3.23, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 18.16, wage_bill: 23.00, wage_ratio: 127, operating_profit: -13.26, profit_from_player_sales:  4.37, pre_tax_profit: -15.00, net_debt:  -4.87 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 18.12, wage_bill: 21.52, wage_ratio: 119, operating_profit: -13.76, profit_from_player_sales:  8.88, pre_tax_profit: -6.63, net_debt:  -4.45, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue: 31.39, wage_bill: 20.26, wage_ratio:  65, operating_profit:  -3.31, profit_from_player_sales:  0.91, pre_tax_profit: -3.77, net_debt:   0.52, compare_division: "championship" } },
  "leyton-orient":  { revenue:  9.43, wage_bill: null,  operating_profit:  -4.62, profit_from_player_sales:  0.50, pre_tax_profit:  -4.61, net_debt:  -0.74, cash:  0.74, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  7.72, wage_bill: null,  wage_ratio: null, operating_profit: -3.75, profit_from_player_sales: null, pre_tax_profit: -3.74, net_debt:  -0.94 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  5.90, wage_bill: null, wage_ratio: null, operating_profit:  -4.11, profit_from_player_sales:  0.20, pre_tax_profit: -3.91, net_debt:  -1.22, compare_division: "league-two" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  5.60, wage_bill: null, wage_ratio: null, operating_profit:  -2.79, profit_from_player_sales:  0.50, pre_tax_profit: -2.29, net_debt:  -0.43, compare_division: "league-two" } },
  lincoln:        { revenue:  8.48, wage_bill:  7.53, operating_profit:  -2.87, profit_from_player_sales:  0.53, pre_tax_profit:  -2.88, net_debt:  -0.99, cash:  1.61, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.98, wage_bill:  6.94, wage_ratio:  99, operating_profit: -2.97, profit_from_player_sales: null, pre_tax_profit: -2.98, net_debt:  -0.68 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  6.53, wage_bill:  5.93, wage_ratio:  91, operating_profit:  -3.20, profit_from_player_sales:  0.60, pre_tax_profit: -2.64, net_debt:  -0.84, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  6.98, wage_bill:  6.24, wage_ratio:  89, operating_profit:  -2.37, profit_from_player_sales:  0.35, pre_tax_profit: -2.05, net_debt:   0.07, compare_division: "league-one" } },
  luton:          { revenue: 66.82, wage_bill: 39.50, operating_profit:  17.15, profit_from_player_sales: 17.22, pre_tax_profit:  17.87, net_debt:  -1.34, cash:  1.34, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 132.32, wage_bill: 56.88, wage_ratio:  43, operating_profit: 48.88, profit_from_player_sales:  1.22, pre_tax_profit: 49.47, net_debt:  -1.64, compare_division: "premier-league" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 18.43, wage_bill: 27.59, wage_ratio: 150, operating_profit: -21.01, profit_from_player_sales:  4.72, pre_tax_profit: -16.29, net_debt:   0.54, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue: 17.66, wage_bill: 17.82, wage_ratio: 101, operating_profit:  -7.45, profit_from_player_sales:  1.07, pre_tax_profit: -6.38, net_debt:   2.27, compare_division: "championship" } },
  northampton:    { revenue:  7.54, wage_bill:  6.22, operating_profit:  -3.00, profit_from_player_sales:  0.48, pre_tax_profit:  -3.00, net_debt:  -0.20, cash:  0.20, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.74, wage_bill:  5.13, wage_ratio:  76, operating_profit: -2.03, profit_from_player_sales:  0.26, pre_tax_profit: -2.03, net_debt:  -0.02 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue:  5.15, wage_bill:  4.63, wage_ratio:  90, operating_profit:  -2.24, profit_from_player_sales:  1.21, pre_tax_profit: -1.03, net_debt:  -0.03, compare_division: "league-two" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  5.29, wage_bill:  3.80, wage_ratio:  72, operating_profit:  -0.93, profit_from_player_sales:  0.78, pre_tax_profit: -0.15, net_debt:  -0.21, compare_division: "league-two" } },
  peterborough:   { revenue: 15.92, wage_bill:  8.52, operating_profit:   4.22, profit_from_player_sales:  6.55, pre_tax_profit:   2.91, net_debt:   7.24, cash:  0.15, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 10.17, wage_bill:  7.34, wage_ratio:  72, operating_profit: -1.24, profit_from_player_sales:  4.07, pre_tax_profit: -2.32, net_debt:   7.07 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 10.54, wage_bill:  7.75, wage_ratio:  73, operating_profit:  -5.46, profit_from_player_sales:  3.24, pre_tax_profit: -3.53, net_debt:   5.08, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue: 18.08, wage_bill:  9.14, wage_ratio:  51, operating_profit:  -0.16, profit_from_player_sales:  1.39, pre_tax_profit:  0.86, net_debt:   0.92, compare_division: "championship" } },
  plymouth:       { revenue: 28.83, wage_bill: 21.25, operating_profit:   0.22, profit_from_player_sales:  8.87, pre_tax_profit:   0.32, net_debt:   0.07, cash:  2.68, fiscal_year_end: "2025-06-30", data_confidence: "high", compare_division: "championship",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 25.58, wage_bill: 16.84, wage_ratio:  66, operating_profit: -2.65, profit_from_player_sales: null, pre_tax_profit: -2.40, net_debt:  -1.70, compare_division: "championship" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 14.66, wage_bill:  9.12, wage_ratio:  62, operating_profit:  -3.86, profit_from_player_sales:  0.29, pre_tax_profit: -3.45, net_debt:  -5.19, compare_division: "league-one" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue: 11.32, wage_bill:  6.02, wage_ratio:  53, operating_profit:  -0.70, profit_from_player_sales:  0.45, pre_tax_profit: -0.25, net_debt:  -6.60, compare_division: "league-one" } },
  reading:        { revenue:  9.81, wage_bill: 12.41, operating_profit:  -3.76, profit_from_player_sales:  9.51, pre_tax_profit:  -3.88, net_debt:  -0.26, cash:  0.27, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 10.00, wage_bill: 15.82, wage_ratio: 158, operating_profit: -12.98, profit_from_player_sales:  3.99, pre_tax_profit: -13.06, net_debt:  -0.70 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 18.68, wage_bill: 24.47, wage_ratio: 131, operating_profit: -23.32, profit_from_player_sales:  1.65, pre_tax_profit: -21.72, net_debt:   0.01, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue: 16.91, wage_bill: 25.32, wage_ratio: 150, operating_profit: -25.35, profit_from_player_sales:  8.09, pre_tax_profit: -17.26, net_debt:  -0.66, compare_division: "championship" } },
  rotherham:      { revenue: 10.52, wage_bill:  8.58, operating_profit:  -4.65, profit_from_player_sales:  0.41, pre_tax_profit:  -4.65, net_debt:  -0.29, cash:  0.29, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue: 19.17, wage_bill: 12.95, wage_ratio:  68, operating_profit: -1.70, profit_from_player_sales: null, pre_tax_profit: -1.70, net_debt:   8.40, compare_division: "championship" },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 15.69, wage_bill: 10.34, wage_ratio:  66, operating_profit:  -1.95, profit_from_player_sales:  0.87, pre_tax_profit: -1.08, net_debt:   1.67, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  9.85, wage_bill:  6.59, wage_ratio:  67, operating_profit:  -2.78, profit_from_player_sales:  1.09, pre_tax_profit: -1.69, net_debt:   2.06, compare_division: "league-one" } },
  wigan:          { revenue:  7.25, wage_bill:  9.85, operating_profit:  -7.97, profit_from_player_sales:  7.57, pre_tax_profit:  -0.40, net_debt:  -0.60, cash:  0.60, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  9.25, wage_bill: 11.70, wage_ratio: 127, operating_profit: -8.98, profit_from_player_sales:  0.75, pre_tax_profit: -8.23, net_debt:  18.48 },
    data2023:   { fiscal_year_end: "2023-06-30", revenue: 15.87, wage_bill: 23.24, wage_ratio: 146, operating_profit: -13.75, profit_from_player_sales:  0.38, pre_tax_profit: -13.37, net_debt:  -0.34, compare_division: "championship" },
    data2022:   { fiscal_year_end: "2022-06-30", revenue:  8.31, wage_bill: 13.01, wage_ratio: 157, operating_profit: -10.51, profit_from_player_sales:  2.85, pre_tax_profit: -7.66, net_debt:  -0.26, compare_division: "league-one" } },
};

// ─── League Two 2025/26 ───────────────────────────────────────────────────────
// Promoted to L1: AFC Wimbledon, Bradford City, Port Vale
// Relegated from L1: Bristol Rovers, Cambridge Utd, Crawley Town, Shrewsbury Town
// Promoted from National League: Barnet, Oldham Athletic
// Relegated to National League: Carlisle Utd, Morecambe (+ 2 others)
const l2Raw: Record<string, RawEntry> = {
  cambridge:      { revenue:   9.25, wage_bill:   6.66, operating_profit:   -3.74, pre_tax_profit:   -3.74, net_debt:   -0.26, cash:    0.30, fiscal_year_end: "2025-06-30", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.30, wage_bill:  5.38, wage_ratio:  65, operating_profit: -2.58, profit_from_player_sales:  null, pre_tax_profit: -2.57, net_debt: -0.93, compare_division: "league-one" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  7.09, wage_bill:  4.89, wage_ratio:  69, operating_profit: -1.75, profit_from_player_sales:  null, pre_tax_profit: -1.75, net_debt: -2.92, compare_division: "league-one" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  7.69, wage_bill:  4.11, wage_ratio:  53, operating_profit:  0.33, profit_from_player_sales:  null, pre_tax_profit:  0.33, net_debt: -5.52, compare_division: "league-one" } },
  chesterfield:   { revenue:   7.80, wage_bill:   6.04, operating_profit:   -2.22, pre_tax_profit:   -2.38, net_debt:    0.56, cash:    1.48, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  5.60, wage_bill:  4.53, wage_ratio:  81, operating_profit: -3.19, profit_from_player_sales:  null, pre_tax_profit: -3.31, net_debt:  1.80, compare_division: "league-two" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  4.58, wage_bill:  3.90, wage_ratio:  85, operating_profit: -2.01, profit_from_player_sales:  null, pre_tax_profit: -2.15, net_debt:  2.17 },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  3.93, wage_bill:  3.42, wage_ratio:  87, operating_profit: -2.37, profit_from_player_sales:  null, pre_tax_profit: -2.37, net_debt:  0.93 } },
  gillingham:     { revenue:   7.53, wage_bill:   6.77, operating_profit:   -5.72, pre_tax_profit:   -5.74, net_debt:    0.02, cash:    0.08, fiscal_year_end: "2025-06-30", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  8.22, wage_bill:  5.86, wage_ratio:  71, operating_profit: -4.32, profit_from_player_sales:  null, pre_tax_profit: -4.35, net_debt:  2.63, compare_division: "league-two" },
    data2023: { fiscal_year_end: "2023-05-31", revenue:  6.32, wage_bill:  4.49, wage_ratio:  71, operating_profit: -2.10, profit_from_player_sales:  null, pre_tax_profit: -2.15, net_debt: -0.91, compare_division: "league-two" },
    data2022: { fiscal_year_end: "2022-05-31", revenue:  5.55, wage_bill:  4.03, wage_ratio:  73, operating_profit: -0.85, profit_from_player_sales:  null, pre_tax_profit: -0.90, net_debt:  0.16, compare_division: "league-one" } },
  "mk-dons":        { revenue:   5.72, wage_bill:   5.22, operating_profit:   -3.70, profit_from_player_sales:  0.64, pre_tax_profit:   -3.09, net_debt:   -0.33, cash:    0.33, fiscal_year_end: "2024-06-30",
    prior_year: { fiscal_year_end: "2023-06-30", revenue:  6.96, wage_bill:  null, wage_ratio:  null, operating_profit: -3.43, profit_from_player_sales:  1.23, pre_tax_profit: -2.22, net_debt: -0.68, compare_division: "league-one" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  6.47, wage_bill:  4.54, wage_ratio:  70, operating_profit: -1.81, profit_from_player_sales:  5.45, pre_tax_profit:  3.64, net_debt: -0.59, compare_division: "league-one" } },
  shrewsbury:     { revenue:   7.21, wage_bill:   5.35, operating_profit:   -0.92, pre_tax_profit:   -0.93, net_debt:   -0.06, cash:    0.07, fiscal_year_end: "2025-06-30", compare_division: "league-one",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  6.82, wage_bill:  5.42, wage_ratio:  79, operating_profit: -1.85, profit_from_player_sales:  0.28, pre_tax_profit: -1.58, net_debt: -0.10, compare_division: "league-one" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  6.21, wage_bill:  5.73, wage_ratio:  92, operating_profit: -3.03, profit_from_player_sales:  null, pre_tax_profit: -3.03, net_debt: -0.08, compare_division: "league-one" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  6.18, wage_bill:  4.87, wage_ratio:  79, operating_profit: -0.88, profit_from_player_sales:  0.25, pre_tax_profit: -0.63, net_debt: -1.58, compare_division: "league-one" } },
  tranmere:       { revenue:   5.76, wage_bill:   5.17, operating_profit:   -2.80, pre_tax_profit:   -2.92, net_debt:   -0.30, cash:    0.38, fiscal_year_end: "2025-06-30",
    prior_year: { fiscal_year_end: "2024-06-30", revenue:  5.98, wage_bill:  4.39, wage_ratio:  73, operating_profit: -1.28, profit_from_player_sales:  null, pre_tax_profit: -1.38, net_debt:  0.49, compare_division: "league-two" },
    data2023: { fiscal_year_end: "2023-06-30", revenue:  5.45, wage_bill:  3.95, wage_ratio:  73, operating_profit: -1.33, profit_from_player_sales:  null, pre_tax_profit: -1.37, net_debt:  0.62, compare_division: "league-two" },
    data2022: { fiscal_year_end: "2022-06-30", revenue:  5.48, wage_bill:  3.84, wage_ratio:  70, operating_profit: -0.29, profit_from_player_sales:  null, pre_tax_profit: -0.34, net_debt:  0.71, compare_division: "league-two" } },
  walsall:        { revenue:   8.23, wage_bill:   5.88, operating_profit:   -1.34, pre_tax_profit:   -1.97, net_debt:    3.70, cash:    0.00, fiscal_year_end: "2025-05-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-05-31", revenue:  6.74, wage_bill:  5.06, wage_ratio:  75, operating_profit: -1.36, profit_from_player_sales:  null, pre_tax_profit: -1.78, net_debt:  5.36, compare_division: "league-two" },
    data2023: { fiscal_year_end: "2023-05-31", revenue:  7.62, wage_bill:  4.46, wage_ratio:  59, operating_profit:  0.18, profit_from_player_sales:  null, pre_tax_profit:  0.01, net_debt:  5.54, compare_division: "league-two" },
    data2022: { fiscal_year_end: "2022-05-31", revenue:  6.35, wage_bill:  4.16, wage_ratio:  65, operating_profit: -0.64, profit_from_player_sales:  null, pre_tax_profit: -0.74, net_debt:  2.34, compare_division: "league-two" } },
};

const NAMES: Record<string, string> = {
  // Premier League 2025/26
  arsenal: "Arsenal",             "aston-villa": "Aston Villa",
  bournemouth: "Bournemouth",     brentford: "Brentford",
  brighton: "Brighton",           burnley: "Burnley",
  chelsea: "Chelsea",             "crystal-palace": "Crystal Palace",
  everton: "Everton",             fulham: "Fulham",
  leeds: "Leeds United",          liverpool: "Liverpool",
  "man-city": "Man City",           "man-united": "Man United",
  newcastle: "Newcastle Utd",     "nottm-forest": "Nott'm Forest",
  sunderland: "Sunderland",       tottenham: "Tottenham",
  "west-ham": "West Ham",           wolves: "Wolves",
  // Championship 2025/26
  birmingham: "Birmingham City",  blackburn: "Blackburn Rovers",
  "bristol-city": "Bristol City",   charlton: "Charlton Athletic",
  coventry: "Coventry City",      derby: "Derby County",
  hull: "Hull City",              ipswich: "Ipswich Town",
  leicester: "Leicester City",    middlesbrough: "Middlesbrough",
  millwall: "Millwall",           norwich: "Norwich City",
  "oxford-utd": "Oxford United",    portsmouth: "Portsmouth",
  preston: "Preston NE",          qpr: "QPR",
  "sheff-utd": "Sheffield Utd",     "sheff-wed": "Sheffield Wed",
  southampton: "Southampton",     stoke: "Stoke City",
  swansea: "Swansea City",        watford: "Watford",
  "west-brom": "West Brom",         wrexham: "Wrexham",
  // League One 2025/26
  "afc-wimbledon": "AFC Wimbledon", barnsley: "Barnsley",
  blackpool: "Blackpool",         bolton: "Bolton Wanderers",
  bradford: "Bradford City",      burton: "Burton Albion",
  cardiff: "Cardiff City",
  exeter: "Exeter City",          huddersfield: "Huddersfield Town",
  "leyton-orient": "Leyton Orient", lincoln: "Lincoln City",
  luton: "Luton Town",            northampton: "Northampton",
  peterborough: "Peterborough Utd", plymouth: "Plymouth Argyle",
  reading: "Reading",             rotherham: "Rotherham Utd",
  wigan: "Wigan Athletic",
  // League Two 2025/26
  cambridge: "Cambridge Utd",    chesterfield: "Chesterfield",
  gillingham: "Gillingham",
  "mk-dons": "MK Dons",
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
