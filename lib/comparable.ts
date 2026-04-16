// Shared type + utility used by ClubVsClub and RankingsTable

export interface ComparableClub {
  slug: string;
  name: string;
  country: string;
  divisionLabel: string;
  currency: "GBP" | "EUR" | "USD";
  revenue: number | null;
  wage_bill: number | null;
  wage_ratio: number | null;
  operating_profit: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
}

export function fmtVal(
  value: number | null,
  isRatio = false,
  currency: "GBP" | "EUR" | "USD" = "GBP"
): string {
  if (value === null || value === undefined) return "—";
  if (isRatio) return `${value.toFixed(1)}%`;
  const abs = Math.abs(value);
  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : "£";
  return `${value < 0 ? "-" : ""}${sym}${abs.toFixed(1)}m`;
}
