// Shared type + utility used by ClubVsClub and RankingsTable

export const FX_GBP_TO_USD = 1.27;
export const FX_EUR_TO_USD = 1.09;

export function toUSD(v: number | null, currency: "GBP" | "EUR" | "USD"): number | null {
  if (v === null) return null;
  if (currency === "GBP") return v * FX_GBP_TO_USD;
  if (currency === "EUR") return v * FX_EUR_TO_USD;
  return v;
}

export function fmtUSD(v: number | null): string {
  if (v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}$${abs.toFixed(1)}m`;
}

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
