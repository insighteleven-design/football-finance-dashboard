import { notFound } from "next/navigation";
import Link from "next/link";
import { clubs, getClub, type ClubFinancials, type FinancialSnapshot } from "@/lib/clubs";
import { euClubs, getEuClub, type EUClub } from "@/lib/euClubs";
import { japanClubs, getJapanClub, J_DIVISION_LABELS } from "@/lib/japanClubs";
import { japanDeepDive } from "@/lib/japanDeepDive";
import { deepDive } from "@/lib/deepDive";
import { fixedAssets } from "@/lib/fixedAssets";
import { marketContext, ENGLAND_BENCHMARKS } from "@/lib/marketContext";
import FinancialYearTabs from "@/components/FinancialYearTabs";
import ClubProfileTabs from "@/components/ClubProfileTabs";
import FixedAssetsPanel from "@/components/FixedAssetsPanel";
import MarketContextPanel from "@/components/MarketContextPanel";
import EUFinancialsSection from "@/components/EUFinancialsSection";
import EUClubInfoPanel from "@/components/EUClubInfoPanel";
import EUMarketContextPanel from "@/components/EUMarketContextPanel";
import JapanFinancialsSection from "@/components/JapanFinancialsSection";
import ComingSoonPanel from "@/components/ComingSoonPanel";
import CashFlowSection, { CashFlowSectionSimple } from "@/components/CashFlowSection";
import ClubCashFlowSection, { ClubCashFlowSectionSimple } from "@/components/ClubCashFlowSection";
import { cashFlowData } from "@/lib/cashFlowData";
import CopyLinkButton from "@/components/CopyLinkButton";
import ImmigrationBadge from "@/components/ImmigrationBadge";
import SquadProfileSection from "@/components/SquadProfileSection";
import { squadProfiles, type SquadProfile } from "@/lib/squadProfile";

function hasEuFinancialData(club: EUClub): boolean {
  const f = club.financials;
  return (
    f.revenue !== null ||
    f.net_profit !== null ||
    f.wage_bill !== null ||
    f.equity !== null ||
    f.total_liabilities !== null ||
    club.historical.some((h) => h.revenue !== null)
  );
}

export function generateStaticParams() {
  const englishSlugs = clubs.map((c) => ({ slug: c.slug }));
  const euSlugs = euClubs.filter(hasEuFinancialData).map((c) => ({ slug: c.slug }));
  const japanSlugs = japanClubs.map((c) => ({ slug: c.slug }));
  return [...englishSlugs, ...euSlugs, ...japanSlugs];
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
        <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#4a9a6a] text-[#4a9a6a]">
          {p}
        </span>
      ))}
      {issues.map((i) => (
        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#9a4a4a] text-[#9a4a4a]">
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
    if (!hasEuFinancialData(euClub)) notFound();

    const LEAGUE_DISPLAY: Record<string, string> = {
      "norwegian-eliteserien": "Eliteserien",
      "1. Bundesliga":         "Bundesliga",
      "2. Bundesliga":         "2. Bundesliga",
      "Austrian Bundesliga":   "Austrian Bundesliga",
      "Austrian 2. Liga":      "Austrian 2. Liga",
      "Super League":          "Swiss Super League",
    };
    const leagueLabel = LEAGUE_DISPLAY[euClub.league] ?? euClub.league;

    // League peers with financial data (for "vs league avg" comparison)
    const leagueClubs = euClubs.filter(
      (c) => c.league === euClub.league && c.country === euClub.country && hasEuFinancialData(c)
    );

    const euLeagueEntries = leagueClubs
      .map(c => ({ name: c.name, slug: c.slug, profile: squadProfiles[c.slug] }))
      .filter((e): e is { name: string; slug: string; profile: SquadProfile } => e.profile != null);

    // Next/prev club: skip data-less clubs, sort to match directory (country → league → name)
    const visibleEuClubs = euClubs
      .filter(hasEuFinancialData)
      .sort((a, b) => {
        const cc = a.country.localeCompare(b.country);
        if (cc !== 0) return cc;
        const lc = a.league.localeCompare(b.league);
        if (lc !== 0) return lc;
        return a.name.localeCompare(b.name);
      });
    const idx = visibleEuClubs.findIndex((c) => c.slug === slug);
    const nextEu = visibleEuClubs[(idx + 1) % visibleEuClubs.length];
    const prevEu = visibleEuClubs[(idx - 1 + visibleEuClubs.length) % visibleEuClubs.length];

    return (
      <div className="px-6 lg:px-12 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-3xl sm:text-5xl font-serif font-normal text-[#111111] tracking-tight">
                  {euClub.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.1em] uppercase text-[#666666]">
                  {leagueLabel}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.1em] uppercase text-[#aaaaaa]">
                  {euClub.country}
                </span>
                <ImmigrationBadge country={euClub.country} />
              </div>
              {euClub.city && (
                <p className="text-sm text-[#999999]">{euClub.city}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CopyLinkButton />
              <Link
                href={`/directory?country=${encodeURIComponent(euClub.country)}&league=${encodeURIComponent(euClub.league)}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                All clubs
              </Link>
              <Link
                href={`/clubs/${prevEu.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                ← Prev
              </Link>
              <Link
                href={`/clubs/${nextEu.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                Next →
              </Link>
            </div>
          </div>
        </div>
        <ClubProfileTabs
          tabs={[
            {
              key: "financials",
              label: "Financials",
              labelFull: "Financial Information",
              content: <EUFinancialsSection club={euClub} leagueClubs={leagueClubs} leagueLabel={leagueLabel} />,
            },
            {
              key: "market",
              label: "Market",
              labelFull: "Market Context",
              content: <EUMarketContextPanel club={euClub} leagueClubs={leagueClubs} leagueLabel={leagueLabel} />,
            },
            {
              key: "info",
              label: "Info",
              labelFull: "Club Information",
              content: <EUClubInfoPanel club={euClub} />,
            },
            {
              key: "squad",
              label: "Squad",
              labelFull: "Squad Profile",
              content: (
                <SquadProfileSection
                  currentSlug={slug}
                  profile={squadProfiles[slug]}
                  clubName={euClub.name}
                  leagueEntries={euLeagueEntries}
                  leagueLabel={leagueLabel}
                />
              ),
            },
          ]}
        />
      </div>
    );
  }

  // ─── Japan club fast-path ────────────────────────────────────────────────────
  const japanClub = getJapanClub(slug);
  if (japanClub) {
    const divisionLabel = J_DIVISION_LABELS[japanClub.division];
    const leagueClubs = japanClubs.filter((c) => c.division === japanClub.division);

    const jpLeagueEntries = leagueClubs
      .map(c => ({ name: c.name, slug: c.slug, profile: squadProfiles[c.slug] }))
      .filter((e): e is { name: string; slug: string; profile: SquadProfile } => e.profile != null);
    const dd = japanDeepDive[slug] ?? null;

    // Sort to match directory: division (j1 < j2 < j3) → name
    const visibleJapanClubs = [...japanClubs].sort((a, b) =>
      a.division.localeCompare(b.division) || a.name.localeCompare(b.name)
    );
    const jIdx = visibleJapanClubs.findIndex((c) => c.slug === slug);
    const nextJp = visibleJapanClubs[(jIdx + 1) % visibleJapanClubs.length];
    const prevJp = visibleJapanClubs[(jIdx - 1 + visibleJapanClubs.length) % visibleJapanClubs.length];

    const fyDate = new Date(japanClub.fiscal_year_end).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

    const issues: string[] = [];
    const positives: string[] = [];
    if (japanClub.pre_tax_profit !== null && japanClub.pre_tax_profit < 0) issues.push("Loss-making");
    if (japanClub.pre_tax_profit !== null && japanClub.pre_tax_profit > 0) positives.push("Profitable");
    if (japanClub.net_debt !== null && japanClub.net_debt < 0) positives.push("Net cash");
    if (japanClub.wage_ratio !== null && japanClub.wage_ratio > 100) issues.push("Wages exceed revenue");
    else if (japanClub.wage_ratio !== null && japanClub.wage_ratio > 80) issues.push("High wage ratio");
    if (japanClub.wage_ratio !== null && japanClub.wage_ratio < 60) positives.push("Lean wage bill");

    return (
      <div className="px-6 lg:px-12 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-3xl sm:text-5xl font-serif font-normal text-[#111111] tracking-tight">
                  {japanClub.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.1em] uppercase text-[#666666]">
                  {divisionLabel}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.1em] uppercase text-[#aaaaaa]">
                  Japan
                </span>
                <ImmigrationBadge country="Japan" />
              </div>
              <p className="text-sm text-[#999999]">
                Financial year ending <span className="text-[#666666]">{fyDate}</span>
              </p>
              {(issues.length > 0 || positives.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {positives.map((p) => (
                    <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#4a9a6a] text-[#4a9a6a]">{p}</span>
                  ))}
                  {issues.map((i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#9a4a4a] text-[#9a4a4a]">{i}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CopyLinkButton />
              <Link
                href={`/directory?country=Japan&league=${encodeURIComponent(japanClub.division)}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                All clubs
              </Link>
              <Link
                href={`/clubs/${prevJp.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                ← Prev
              </Link>
              <Link
                href={`/clubs/${nextJp.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                Next →
              </Link>
            </div>
          </div>
        </div>
        <ClubProfileTabs
          tabs={[
            {
              key: "financials",
              label: "Financials",
              labelFull: "Financial Information",
              content: <JapanFinancialsSection club={japanClub} leagueClubs={leagueClubs} deepDive={dd} />,
            },
            {
              key: "market",
              label: "Market",
              labelFull: "Market Context",
              content: <ComingSoonPanel label="Market Context" />,
            },
            {
              key: "info",
              label: "Info",
              labelFull: "Club Information",
              content: <ComingSoonPanel label="Club Information" />,
            },
            {
              key: "squad",
              label: "Squad",
              labelFull: "Squad Profile",
              content: (
                <SquadProfileSection
                  currentSlug={slug}
                  profile={squadProfiles[slug]}
                  clubName={japanClub.name}
                  leagueEntries={jpLeagueEntries}
                  leagueLabel={divisionLabel}
                />
              ),
            },
          ]}
        />
      </div>
    );
  }

  const club = getClub(slug);
  if (!club) notFound();

  const dd       = deepDive[slug] ?? null;
  const assets   = fixedAssets[slug] ?? null;
  const ctx      = marketContext[slug] ?? null;
  const cf       = cashFlowData[slug] ?? null;

  // Sort to match directory: division (PL → Championship → L1 → L2) → name
  const divOrder = (d: string) =>
    d === "premier-league" ? 0 : d === "championship" ? 1 : d === "league-one" ? 2 : 3;
  const sortedClubs = [...clubs].sort((a, b) =>
    divOrder(a.division) - divOrder(b.division) || a.name.localeCompare(b.name)
  );
  const currentIndex = sortedClubs.findIndex((c) => c.slug === slug);
  const nextClub     = sortedClubs[(currentIndex + 1) % sortedClubs.length];
  const prevClub     = sortedClubs[(currentIndex - 1 + sortedClubs.length) % sortedClubs.length];

  const compareDivision = club.division;
  const compareLabel    = DIVISION_LABELS[compareDivision];

  const fyDate = new Date(club.fiscal_year_end).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ─── Squad profile data ──────────────────────────────────────────────────────
  const enLeagueEntries = clubs
    .filter(c => c.division === compareDivision)
    .map(c => ({ name: c.name, slug: c.slug, profile: squadProfiles[c.slug] }))
    .filter((e): e is { name: string; slug: string; profile: SquadProfile } => e.profile != null);

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
    .filter((c) => c.division === compareDivision)
    .map(toSnapshot);

  // data2023 year
  const d23 = club.data2023 ?? null;
  const data2023Snap: FinancialSnapshot | null = d23 ? toSnapshot(d23) : null;
  const data2023Label = d23 ? fyLabel(d23.fiscal_year_end) : null;
  const data2023CompareDivision = d23?.compare_division ?? compareDivision;
  const data2023CompareLabel = DIVISION_LABELS[data2023CompareDivision];
  const data2023DivData = clubs
    .filter((c) => c.data2023?.compare_division === data2023CompareDivision)
    .map((c) => toSnapshot(c.data2023!));

  // data2022 year
  const d22 = club.data2022 ?? null;
  const data2022Snap: FinancialSnapshot | null = d22 ? toSnapshot(d22) : null;
  const data2022Label = d22 ? fyLabel(d22.fiscal_year_end) : null;
  const data2022CompareDivision = d22?.compare_division ?? compareDivision;
  const data2022CompareLabel = DIVISION_LABELS[data2022CompareDivision];
  const data2022DivData = clubs
    .filter((c) => c.data2022?.compare_division === data2022CompareDivision)
    .map((c) => toSnapshot(c.data2022!));

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
    <div className="px-6 lg:px-12 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl sm:text-5xl font-serif font-normal text-[#111111] tracking-tight">
                {club.name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.1em] uppercase text-[#666666]">
                {DIVISION_LABELS[club.division]}
              </span>
              <ImmigrationBadge country="England" />
            </div>
            <p className="text-sm text-[#999999]">
              Financial year ending <span className="text-[#666666]">{fyDate}</span>
              {club.data_confidence !== "high" && (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs text-[#999999]">
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

          <div className="flex items-center gap-2 shrink-0">
            <CopyLinkButton />
            <Link
              href={`/directory?country=England&league=${encodeURIComponent(club.division)}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              All clubs
            </Link>
            <Link
              href={`/clubs/${prevClub.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              ← Prev
            </Link>
            <Link
              href={`/clubs/${nextClub.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              Next →
            </Link>
          </div>
        </div>
      </div>

      <ClubProfileTabs
        tabs={[
          {
            key: "financials",
            label: "Financials",
            labelFull: "Financial Information",
            content: (
              <FinancialYearTabs
                club={club}
                currentData={currentData}
                currentDivisionData={currentDivData}
                currentLabel={currentLabel}
                compareLabel={compareLabel}
                breakdown={dd?.revenue_breakdown ?? null}
                debtBreakdown={dd?.debt_breakdown ?? null}
                extraSection={
                  slug === "plymouth" ? <CashFlowSection /> :
                  cf ? <ClubCashFlowSection data={cf} /> :
                  undefined
                }
                priorExtraSection={
                  slug === "plymouth" ? <CashFlowSectionSimple /> :
                  cf ? (
                    <ClubCashFlowSectionSimple
                      value={cf.netOperating.prior}
                      fyLabel={cf.priorFY}
                      scale={Math.max(
                        Math.abs(cf.netOperating.current / 1_000_000),
                        Math.abs(cf.netOperating.prior / 1_000_000),
                        1
                      )}
                    />
                  ) :
                  undefined
                }
                priorData={priorData}
                priorDivisionData={priorDivData}
                priorLabel={priorLabel}
                priorCompareLabel={priorCompareLabel}
                data2023={data2023Snap}
                data2023DivisionData={data2023DivData}
                data2023Label={data2023Label}
                data2023CompareLabel={data2023CompareLabel}
                data2022={data2022Snap}
                data2022DivisionData={data2022DivData}
                data2022Label={data2022Label}
                data2022CompareLabel={data2022CompareLabel}
              />
            ),
          },
          {
            key: "assets",
            label: "Fixed Assets",
            content: assets ? (
              <FixedAssetsPanel
                assets={assets}
                division={club.division}
                landBuildings={dd?.land_buildings ?? null}
              />
            ) : null,
          },
          {
            key: "market",
            label: "Market",
            labelFull: "Market Context",
            content: ctx ? (
              <MarketContextPanel ctx={ctx} division={club.division} slug={slug} />
            ) : null,
          },
          {
            key: "squad",
            label: "Squad",
            labelFull: "Squad Profile",
            content: (
              <SquadProfileSection
                currentSlug={slug}
                profile={squadProfiles[slug]}
                clubName={club.name}
                leagueEntries={enLeagueEntries}
                leagueLabel={compareLabel}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
