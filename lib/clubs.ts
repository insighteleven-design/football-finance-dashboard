export interface ClubFinancials {
  slug: string;
  name: string;
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

const raw: Record<string, Omit<ClubFinancials, "slug" | "name" | "wage_ratio">> = {
  arsenal:        { revenue: 643.29, wage_bill: 331.23, operating_profit: -38.51,  pre_tax_profit:  25.20, net_debt:  292.59, cash:   32.53, fiscal_year_end: "2025-05-31" },
  aston_villa:    { revenue: 246.81, wage_bill: 230.82, operating_profit: -93.94,  pre_tax_profit: -35.40, net_debt:   20.45, cash:    0.00, fiscal_year_end: "2024-06-30" },
  bournemouth:    { revenue: 181.72, wage_bill: 158.42, operating_profit:  28.27,  pre_tax_profit:  14.89, net_debt:  146.64, cash:   47.24, fiscal_year_end: "2025-06-30" },
  brentford:      { revenue: 173.08, wage_bill: 130.78, operating_profit: -12.76,  pre_tax_profit: -20.53, net_debt:  130.10, cash:    1.98, fiscal_year_end: "2025-06-30" },
  brighton:       { revenue: 221.06, wage_bill: 158.68, operating_profit: -31.31,  pre_tax_profit: -32.01, net_debt:  -39.84, cash:   39.84, fiscal_year_end: "2025-06-30" },
  chelsea:        { revenue: 415.01, wage_bill: 296.50, operating_profit: -205.68, pre_tax_profit: -64.74, net_debt: 1641.87, cash:    0.00, fiscal_year_end: "2024-06-30" },
  crystal_palace: { revenue: 189.31, wage_bill: 132.44, operating_profit: -20.00,  pre_tax_profit: -33.56, net_debt:  147.27, cash:    8.86, fiscal_year_end: "2024-06-30" },
  everton:        { revenue: 186.90, wage_bill: 156.63, operating_profit: -92.69,  pre_tax_profit: -53.22, net_debt:  567.35, cash:   26.42, fiscal_year_end: "2024-06-30" },
  fulham:         { revenue: 181.56, wage_bill: 154.75, operating_profit: -69.46,  pre_tax_profit: -31.21, net_debt:   11.63, cash:   32.77, fiscal_year_end: "2024-06-30" },
  ipswich:        { revenue: 155.42, wage_bill:  77.14, operating_profit:  -6.21,  pre_tax_profit:   4.01, net_debt:   -4.59, cash:   13.67, fiscal_year_end: "2025-06-30" },
  leicester:      { revenue: 105.35, wage_bill: 107.16, operating_profit:  -8.98,  pre_tax_profit: -19.43, net_debt:  199.25, cash:    7.09, fiscal_year_end: "2024-06-30" },
  liverpool:      { revenue: 702.72, wage_bill: 427.73, operating_profit:  23.76,  pre_tax_profit:  15.21, net_debt:  282.72, cash:    2.54, fiscal_year_end: "2025-05-31" },
  man_city:       { revenue: 694.09, wage_bill: 408.40, operating_profit: -93.30,  pre_tax_profit:  -9.92, net_debt:    null, cash:  173.72, fiscal_year_end: "2025-06-30" },
  man_united:     { revenue: 600.65, wage_bill: 328.23, operating_profit: -12.86,  pre_tax_profit: -32.75, net_debt:  562.49, cash:   74.15, fiscal_year_end: "2025-06-30" },
  newcastle:      { revenue: 320.31, wage_bill: 218.74, operating_profit:   1.21,  pre_tax_profit: -11.08, net_debt:   34.29, cash:   15.43, fiscal_year_end: "2024-06-30" },
  nottm_forest:   { revenue: 221.75, wage_bill: 166.65, operating_profit: -64.93,  pre_tax_profit: -78.92, net_debt:   85.58, cash:   13.22, fiscal_year_end: "2025-06-30" },
  southampton:    { revenue: 157.52, wage_bill: 113.96, operating_profit: -62.25,  pre_tax_profit: -45.29, net_debt:   -9.35, cash:    9.35, fiscal_year_end: "2025-06-30" },
  tottenham:      { revenue: 528.19, wage_bill: 221.93, operating_profit: -61.02,  pre_tax_profit: -26.03, net_debt:  772.47, cash:   78.97, fiscal_year_end: "2024-06-30" },
  west_ham:       { revenue: 226.06, wage_bill: 173.34, operating_profit: -109.47, pre_tax_profit:-108.84, net_debt:   19.77, cash:    0.42, fiscal_year_end: "2025-05-31" },
  wolves:         { revenue: 171.98, wage_bill: 162.09, operating_profit: -117.30, pre_tax_profit: -11.63, net_debt:   67.96, cash:   33.44, fiscal_year_end: "2025-06-30" },
};

const NAMES: Record<string, string> = {
  arsenal: "Arsenal",         aston_villa: "Aston Villa",
  bournemouth: "Bournemouth", brentford: "Brentford",
  brighton: "Brighton",       chelsea: "Chelsea",
  crystal_palace: "Crystal Palace", everton: "Everton",
  fulham: "Fulham",           ipswich: "Ipswich Town",
  leicester: "Leicester City",liverpool: "Liverpool",
  man_city: "Man City",       man_united: "Man United",
  newcastle: "Newcastle Utd", nottm_forest: "Nott'm Forest",
  southampton: "Southampton", tottenham: "Tottenham",
  west_ham: "West Ham",       wolves: "Wolves",
};

export const clubs: ClubFinancials[] = Object.entries(raw).map(([slug, d]) => ({
  slug,
  name: NAMES[slug],
  ...d,
  wage_ratio:
    d.revenue && d.wage_bill ? Math.round((d.wage_bill / d.revenue) * 1000) / 10 : null,
}));

export function getClub(slug: string): ClubFinancials | undefined {
  return clubs.find((c) => c.slug === slug);
}

export function fmt(value: number | null, isRatio = false): string {
  if (value === null || value === undefined) return "—";
  if (isRatio) return `${value.toFixed(1)}%`;
  const abs = Math.abs(value);
  return `${value < 0 ? "-" : ""}£${abs.toFixed(1)}m`;
}
