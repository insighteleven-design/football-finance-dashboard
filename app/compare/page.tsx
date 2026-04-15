import { Suspense } from "react";
import { clubs } from "@/lib/clubs";
import { euClubs, type EUClub } from "@/lib/euClubs";
import ClubVsClub, { type ComparableClub } from "@/components/ClubVsClub";

const DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

const COUNTRY_CODES: Record<string, string> = {
  "Germany":     "GER",
  "Netherlands": "NED",
  "Belgium":     "BEL",
  "Austria":     "AUT",
};

function euDivisionLabel(c: EUClub): string {
  // Germany's leagues are unambiguous; other countries need a country suffix
  if (c.country === "Germany") return c.league;
  return `${c.league} · ${COUNTRY_CODES[c.country] ?? c.country}`;
}

const englishComparable: ComparableClub[] = clubs.map((c) => ({
  slug: c.slug,
  name: c.name,
  divisionLabel: DIVISION_LABELS[c.division] ?? c.division,
  currency: "GBP",
  revenue: c.revenue,
  wage_bill: c.wage_bill,
  wage_ratio: c.wage_ratio,
  operating_profit: c.operating_profit,
  pre_tax_profit: c.pre_tax_profit,
  net_debt: c.net_debt,
}));

const euComparable: ComparableClub[] = euClubs
  .filter(
    (c) =>
      c.financials.revenue !== null ||
      c.financials.net_profit !== null ||
      c.financials.wage_bill !== null
  )
  .map((c) => ({
    slug: c.slug,
    name: c.name,
    divisionLabel: euDivisionLabel(c),
    currency: "EUR",
    revenue: c.financials.revenue,
    wage_bill: c.financials.wage_bill,
    wage_ratio: c.financials.wage_to_revenue_pct,
    operating_profit: null,
    pre_tax_profit: c.financials.net_profit,
    net_debt: null,
  }));

const allComparable = [...englishComparable, ...euComparable];

export default function ComparePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-serif font-light text-[#111111] tracking-tight">Club Comparison</h1>
        <p className="mt-1 text-sm text-[#666666]">
          Search for two clubs to compare their financials side by side · link is shareable
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-[#999999]">Loading…</div>}>
        <ClubVsClub allClubs={allComparable} />
      </Suspense>
    </div>
  );
}
