import { Suspense } from "react";
import { clubs } from "@/lib/clubs";
import { euClubs, type EUClub } from "@/lib/euClubs";
import { itClubs } from "@/lib/itClubs";
import { esClubs } from "@/lib/esClubs";
import { noClubs } from "@/lib/noClubs";
import { swClubs } from "@/lib/swClubs";
import { japanClubs, J_DIVISION_LABELS } from "@/lib/japanClubs";
import CompareWrapper from "@/components/CompareWrapper";
import { type ComparableClub } from "@/lib/comparable";

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
  "France":      "FRA",
  "Denmark":     "DEN",
  "Norway":      "NOR",
  "Sweden":      "SWE",
  "Italy":       "ITA",
  "Spain":       "ESP",
};

const LEAGUE_DISPLAY: Record<string, string> = {
  "Bundesliga":              "Austrian Bundesliga",
  "2. Liga":                 "Austrian 2. Liga",
  "norwegian-eliteserien":   "Eliteserien",
};

function euDivisionLabel(c: EUClub): string {
  const league = LEAGUE_DISPLAY[c.league] ?? c.league;
  if (c.country === "Germany") return league;
  return `${league} · ${COUNTRY_CODES[c.country] ?? c.country}`;
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

const euComparable: ComparableClub[] = [...euClubs, ...itClubs, ...esClubs, ...noClubs, ...swClubs]
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

const japanComparable: ComparableClub[] = japanClubs.map((c) => ({
  slug:             c.slug,
  name:             c.name,
  country:          "Japan",
  divisionLabel:    J_DIVISION_LABELS[c.division],
  currency:         "USD" as const,
  revenue:          c.revenue,
  wage_bill:        c.wage_bill,
  wage_ratio:       c.wage_ratio,
  operating_profit: c.operating_profit,
  pre_tax_profit:   c.pre_tax_profit,
  net_debt:         c.net_debt,
}));

const allComparable = [...englishComparable, ...euComparable, ...japanComparable];

export default function ComparePage() {
  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <div className="px-6 lg:px-12 pt-10 sm:pt-14 pb-10 sm:pb-14">
        <h1
          className="font-serif font-normal leading-none mb-2"
          style={{ color: "#111111", fontSize: "clamp(40px, 10vw, 140px)", letterSpacing: "-0.03em" }}
        >
          Compare
        </h1>
        <p
          className="mb-6 sm:mb-8"
          style={{ color: "#999999", fontSize: "clamp(14px, 2vw, 20px)", letterSpacing: "0.01em" }}
        >
          Head-to-head financial benchmarking across clubs and leagues
        </p>
        <Suspense fallback={<div className="text-sm" style={{ color: "#999999" }}>Loading…</div>}>
          <CompareWrapper allClubs={allComparable} />
        </Suspense>
      </div>
    </div>
  );
}
