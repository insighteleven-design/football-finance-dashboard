import { Suspense } from "react";
import { clubs } from "@/lib/clubs";
import { euClubs, type EUClub } from "@/lib/euClubs";
import RankingsTable from "@/components/RankingsTable";
import { type ComparableClub } from "@/lib/comparable";

const DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

const COUNTRY_CODES: Record<string, string> = {
  "Germany":     "GER",
  "Austria":     "AUT",
  "France":      "FRA",
  "Netherlands": "NED",
  "Belgium":     "BEL",
  "Denmark":     "DEN",
};

function euDivisionLabel(c: EUClub): string {
  if (c.country === "Germany") return c.league;
  return `${c.league} · ${COUNTRY_CODES[c.country] ?? c.country}`;
}

const englishComparable: ComparableClub[] = clubs.map((c) => ({
  slug:             c.slug,
  name:             c.name,
  country:          "England",
  divisionLabel:    DIVISION_LABELS[c.division] ?? c.division,
  currency:         "GBP",
  revenue:          c.revenue,
  wage_bill:        c.wage_bill,
  wage_ratio:       c.wage_ratio,
  operating_profit: c.operating_profit,
  pre_tax_profit:   c.pre_tax_profit,
  net_debt:         c.net_debt,
}));

const euComparable: ComparableClub[] = euClubs
  .filter(
    (c) =>
      c.financials.revenue !== null ||
      c.financials.net_profit !== null ||
      c.financials.wage_bill !== null
  )
  .map((c) => ({
    slug:             c.slug,
    name:             c.name,
    country:          c.country,
    divisionLabel:    euDivisionLabel(c),
    currency:         (c.currency === "USD" ? "USD" : "EUR") as "EUR" | "USD",
    revenue:          c.financials.revenue,
    wage_bill:        c.financials.wage_bill,
    wage_ratio:       c.financials.wage_to_revenue_pct,
    operating_profit: c.financials.operating_profit ?? null,
    pre_tax_profit:   c.financials.pre_tax_profit ?? c.financials.net_profit,
    net_debt:         c.financials.net_debt ?? null,
  }));

const allComparable = [...englishComparable, ...euComparable];

export default function RankingsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-light tracking-tight" style={{ color: "#111111" }}>
          Rankings
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#999999" }}>
          {allComparable.length} clubs · England, Germany, Austria, France, Denmark
        </p>
      </div>
      <Suspense fallback={<div className="text-sm" style={{ color: "#999999" }}>Loading…</div>}>
        <RankingsTable allClubs={allComparable} />
      </Suspense>
    </div>
  );
}
