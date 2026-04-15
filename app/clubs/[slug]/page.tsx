import { notFound } from "next/navigation";
import Link from "next/link";
import { clubs, getClub, type ClubFinancials, type FinancialSnapshot } from "@/lib/clubs";
import { euClubs, getEuClub } from "@/lib/euClubs";
import { deepDive } from "@/lib/deepDive";
import { fixedAssets } from "@/lib/fixedAssets";
import { marketContext, ENGLAND_BENCHMARKS } from "@/lib/marketContext";
import FinancialYearTabs from "@/components/FinancialYearTabs";
import ClubProfileTabs from "@/components/ClubProfileTabs";
import FixedAssetsPanel from "@/components/FixedAssetsPanel";
import MarketContextPanel from "@/components/MarketContextPanel";
import EuropeanClubProfile from "@/components/EuropeanClubProfile";

export function generateStaticParams() {
  const englishSlugs = clubs.map((c) => ({ slug: c.slug }));
  const euSlugs = euClubs.map((c) => ({ slug: c.slug }));
  return [...englishSlugs, ...euSlugs];
}

const DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

function HealthBadges({ club }: { club: ClubFinancials }) {
  const issues: string[] = [];
  const positives: string[] = [];

  if (club.pre_tax_profit !== null && club.pre_tax_profit < 0) issues.push("Loss-making");
  if (club.pre_tax_profit !== null && club.pre_tax_profit > 0) positives.push("Profitable");
  if (club.net_debt !== null && club.net_debt > 300) issues.push("High debt");
  if (club.net_debt !== null && club.net_debt < 0) positives.push("Net cash");
  if (club.wage_ratio !== null && club.wage_ratio > 100) issues.push("Wages exceed revenue");
  else if (club.wage_ratio !== null && club.wage_ratio > 80) issues.push("High wage ratio");
  if (club.wage_ratio !== null && club.wage_ratio < 60) positives.push("Lean wage bill");

  if (!issues.length && !positives.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {positives.map((p) => (
        <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#4a9a6a] text-[#4a9a6a]">
          {p}
        </span>
      ))}
      {issues.map((i) => (
        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#9a4a4a] text-[#9a4a4a]">
          {i}
        </span>
      ))}
    </div>
  );
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // ─── European club fast-path ────────────────────────────────────────────────
  const euClub = getEuClub(slug);
  if (euClub) {
    const LEAGUE_DISPLAY: Record<string, string> = {
      "Bundesliga": "Austrian Bundesliga",
      "2. Liga": "Austrian 2. Liga",
    };
    const leagueLabel =
      euClub.country === "Austria"
        ? (LEAGUE_DISPLAY[euClub.league] ?? euClub.league)
        : euClub.league;
    const allEuSlugs = euClubs.map((c) => c.slug);
    const idx = allEuSlugs.indexOf(slug);
    const nextEu = euClubs[(idx + 1) % euClubs.length];
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999999] hover:text-[#111111] mb-6 group transition-colors"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          All clubs
        </Link>
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-serif font-light text-[#111111] tracking-tight">
                  {euClub.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-[10px] font-medium tracking-[0.1em] uppercase text-[#666666]">
                  {leagueLabel}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-[10px] font-medium tracking-[0.1em] uppercase text-[#aaaaaa]">
                  {euClub.country}
                </span>
              </div>
              {euClub.city && (
                <p className="text-sm text-[#999999]">{euClub.city}</p>
              )}
            </div>
            <Link
              href={`/clubs/${nextEu.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors shrink-0"
            >
              Next club →
            </Link>
          </div>
        </div>
        <EuropeanClubProfile club={euClub} />
      </div>
    );
  }

  const club = getClub(slug);
  if (!club) notFound();

  const dd       = deepDive[slug] ?? null;
  const assets   = fixedAssets[slug] ?? null;
  const ctx      = marketContext[slug] ?? null;

  const currentIndex = clubs.findIndex((c) => c.slug === slug);
  const nextClub     = clubs[(currentIndex + 1) % clubs.length];

  const compareDivision = club.compare_division ?? club.division;
  const compareLabel    = DIVISION_LABELS[compareDivision];

  const fyDate = new Date(club.fiscal_year_end).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ─── Financial year tabs data ────────────────────────────────────────────────

  function fyLabel(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }

  function toSnapshot(c: {
    revenue: number | null;
    wage_bill: number | null;
    wage_ratio: number | null;
    operating_profit: number | null;
    profit_from_player_sales?: number | null;
    pre_tax_profit: number | null;
    net_debt: number | null;
  }): FinancialSnapshot {
    return {
      revenue:                  c.revenue,
      wage_bill:                c.wage_bill,
      wage_ratio:               c.wage_ratio,
      operating_profit:         c.operating_profit,
      profit_from_player_sales: c.profit_from_player_sales ?? null,
      pre_tax_profit:           c.pre_tax_profit,
      net_debt:                 c.net_debt,
    };
  }

  // Current year
  const currentData    = toSnapshot(club);
  const currentLabel   = fyLabel(club.fiscal_year_end);
  const currentDivData = clubs
    .filter((c) => (c.compare_division ?? c.division) === compareDivision)
    .map(toSnapshot);

  // Prior year
  const py = club.prior_year ?? null;
  const priorData = py
    ? {
        revenue:                  py.revenue,
        wage_bill:                py.wage_bill,
        wage_ratio:               py.wage_ratio,
        operating_profit:         py.operating_profit,
        profit_from_player_sales: py.profit_from_player_sales,
        pre_tax_profit:           py.pre_tax_profit,
        net_debt:                 py.net_debt,
      }
    : null;
  const priorLabel          = py ? fyLabel(py.fiscal_year_end) : null;
  const priorCompareDivision = py?.compare_division ?? compareDivision;
  const priorCompareLabel    = DIVISION_LABELS[priorCompareDivision];
  const priorDivData = clubs
    .filter((c) => c.prior_year?.compare_division === priorCompareDivision)
    .map((c) => {
      const p = c.prior_year!;
      return {
        revenue:                  p.revenue,
        wage_bill:                p.wage_bill,
        wage_ratio:               p.wage_ratio,
        operating_profit:         p.operating_profit,
        profit_from_player_sales: p.profit_from_player_sales,
        pre_tax_profit:           p.pre_tax_profit,
        net_debt:                 p.net_debt,
      } satisfies FinancialSnapshot;
    });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#999999] hover:text-[#111111] mb-6 group transition-colors"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        All clubs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-serif font-light text-[#111111] tracking-tight">
                {club.name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-[10px] font-medium tracking-[0.1em] uppercase text-[#666666]">
                {DIVISION_LABELS[club.division]}
              </span>
            </div>
            <p className="text-sm text-[#999999]">
              Financial year ending <span className="text-[#666666]">{fyDate}</span>
              {club.data_confidence !== "high" && (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-[10px] text-[#999999]">
                  {club.data_confidence === "medium"
                    ? "Extracted · not independently verified"
                    : club.data_confidence === "abridged"
                    ? "Abridged accounts filed at Companies House"
                    : "No financial data available"}
                </span>
              )}
            </p>
            <HealthBadges club={club} />
          </div>

          <Link
            href={`/clubs/${nextClub.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors shrink-0"
          >
            Next club →
          </Link>
        </div>
      </div>

      <ClubProfileTabs
        financial={
          <FinancialYearTabs
            club={club}
            currentData={currentData}
            currentDivisionData={currentDivData}
            currentLabel={currentLabel}
            compareLabel={compareLabel}
            breakdown={dd?.revenue_breakdown ?? null}
            priorData={priorData}
            priorDivisionData={priorDivData}
            priorLabel={priorLabel}
            priorCompareLabel={priorCompareLabel}
          />
        }
        assets={
          assets ? (
            <FixedAssetsPanel
              assets={assets}
              division={club.division}
              landBuildings={dd?.land_buildings ?? null}
            />
          ) : (
            <p className="text-sm text-[#aaaaaa] italic">No fixed assets data available.</p>
          )
        }
        market={
          ctx ? (
            <MarketContextPanel ctx={ctx} division={club.division} slug={slug} />
          ) : (
            <p className="text-sm text-[#aaaaaa] italic">No market context data available.</p>
          )
        }
      />
    </div>
  );
}
