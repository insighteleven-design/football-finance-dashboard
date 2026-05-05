import { notFound } from "next/navigation";
import Link from "next/link";
import { clubs, getClub, type ClubFinancials } from "@/lib/clubs";
import { euClubs, getEuClub, type EUClub } from "@/lib/euClubs";
import { japanClubs, getJapanClub, J_DIVISION_LABELS } from "@/lib/japanClubs";
import ClubProfileTabs from "@/components/ClubProfileTabs";
import MarketContextSection, { type MarketLeagueEntry } from "@/components/MarketContextSection";
import EUFinancialsSection from "@/components/EUFinancialsSection";
import JapanFinancialsSection from "@/components/JapanFinancialsSection";
import CopyLinkButton from "@/components/CopyLinkButton";
import SquadProfileSection from "@/components/SquadProfileSection";
import FinancialsSection from "@/components/FinancialsSection";
import { squadProfiles, type SquadProfile } from "@/lib/squadProfile";
import { stadiumData } from "@/lib/stadiumData";
import ClubCompareTab, { type DivisionPeer, type PriorYearSnap, type H2HPeer } from "@/components/ClubCompareTab";

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

const DIVISION_COLORS: Record<string, string> = {
  "premier-league": "#3b82f6",
  "championship":   "#f59e0b",
  "league-one":     "#10b981",
  "league-two":     "#8b5cf6",
};

function euLeagueColor(league: string): string {
  const map: Record<string, string> = {
    "Ligue 1":            "#cc6688",
    "Ligue 2":            "#e07a9a",
    "1. Bundesliga":      "#e8a020",
    "2. Bundesliga":      "#f0bc5a",
    "Austrian Bundesliga":"#cc4444",
    "Austrian 2. Liga":   "#e06060",
    "Super League":       "#cc3333",
  };
  return map[league] ?? "#8b5cf6";
}

const JAPAN_DIVISION_COLORS: Record<string, string> = {
  "j1": "#dc2626",
  "j2": "#ea580c",
  "j3": "#d97706",
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

    const euMarketLeagueEntries: MarketLeagueEntry[] = euClubs
      .filter((c) => c.league === euClub.league && c.country === euClub.country)
      .map((c) => ({ slug: c.slug, name: c.name, revenueMunits: c.financials.revenue }));

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
            {
              key: "market",
              label: "Market",
              labelFull: "Market Context",
              content: (
                <MarketContextSection
                  slug={slug}
                  country={euClub.country}
                  leagueClubs={euMarketLeagueEntries}
                  leagueLabel={leagueLabel}
                  currencySymbol="€"
                  color={euLeagueColor(euClub.league)}
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

    const jpMarketLeagueEntries: MarketLeagueEntry[] = leagueClubs
      .map((c) => ({ slug: c.slug, name: c.name, revenueMunits: c.revenue }));

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
              content: <JapanFinancialsSection club={japanClub} leagueClubs={leagueClubs} />,
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
            {
              key: "market",
              label: "Market",
              labelFull: "Market Context",
              content: (
                <MarketContextSection
                  slug={slug}
                  country="Japan"
                  leagueClubs={jpMarketLeagueEntries}
                  leagueLabel={divisionLabel}
                  currencySymbol="€"
                  color={JAPAN_DIVISION_COLORS[japanClub.division] ?? "#dc2626"}
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

  // ─── Market context data ─────────────────────────────────────────────────────
  const enMarketLeagueEntries: MarketLeagueEntry[] = clubs
    .filter((c) => c.division === compareDivision)
    .map((c) => ({ slug: c.slug, name: c.name, revenueMunits: c.revenue }));

  // ─── Squad profile data ──────────────────────────────────────────────────────
  const enLeagueEntries = clubs
    .filter(c => c.division === compareDivision)
    .map(c => ({ name: c.name, slug: c.slug, profile: squadProfiles[c.slug] }))
    .filter((e): e is { name: string; slug: string; profile: SquadProfile } => e.profile != null);

  // ─── Compare tab data (Arsenal only for initial build) ───────────────────────
  function expiryPct(s: string): number | null {
    const sq = squadProfiles[s];
    if (!sq?.contract_expiry) return null;
    const ex = sq.contract_expiry;
    const total = (ex["0-12m"] ?? 0) + (ex["12-24m"] ?? 0) + (ex["24m+"] ?? 0);
    if (total === 0) return null;
    return Math.round((ex["0-12m"] / total) * 100);
  }

  function toDivPeer(c: ClubFinancials): DivisionPeer {
    const sq = squadProfiles[c.slug];
    const st = stadiumData[c.slug];
    return {
      slug:              c.slug,
      name:              c.name,
      revenue:           c.revenue,
      wage_bill:         c.wage_bill,
      wage_ratio:        c.wage_ratio,
      operating_profit:  c.operating_profit,
      pre_tax_profit:    c.pre_tax_profit,
      net_debt:          c.net_debt,
      squad_value_eur_m: sq?.squad_value_eur_m ?? null,
      avg_age:           sq?.avg_age ?? null,
      expiry_0_12m_pct:  expiryPct(c.slug),
      capacity:          st?.capacity ?? null,
      attendance_pct:    st?.attendance_pct ?? null,
    };
  }

  const divisionPeers: DivisionPeer[] = clubs
    .filter(c => c.division === compareDivision)
    .map(toDivPeer);

  const priorYear: PriorYearSnap | null = club.prior_year
    ? {
        revenue:    club.prior_year.revenue,
        wage_ratio: club.prior_year.wage_ratio ?? null,
        net_debt:   club.prior_year.net_debt ?? null,
      }
    : null;

  // H2H peer list: all English + EU (filtered) + Japan clubs
  const allH2HPeers: H2HPeer[] = [
    ...clubs.map((c): H2HPeer => ({
      ...toDivPeer(c),
      country:       "England",
      divisionLabel: DIVISION_LABELS[c.division] ?? c.division,
      currency:      "GBP",
    })),
    ...euClubs
      .filter(hasEuFinancialData)
      .map((c): H2HPeer => {
        const sq = squadProfiles[c.slug];
        const st = stadiumData[c.slug];
        const LEAGUE_DISPLAY: Record<string, string> = {
          "norwegian-eliteserien": "Eliteserien",
          "1. Bundesliga":         "Bundesliga",
          "2. Bundesliga":         "2. Bundesliga",
          "Austrian Bundesliga":   "Austrian Bundesliga",
          "Austrian 2. Liga":      "Austrian 2. Liga",
          "Super League":          "Swiss Super League",
        };
        const leagueLabel = LEAGUE_DISPLAY[c.league] ?? c.league;
        return {
          slug:              c.slug,
          name:              c.name,
          country:           c.country,
          divisionLabel:     leagueLabel,
          currency:          c.currency === "USD" ? "USD" : "EUR",
          revenue:           c.financials.revenue,
          wage_bill:         c.financials.wage_bill,
          wage_ratio:        c.financials.wage_to_revenue_pct,
          operating_profit:  c.financials.operating_profit ?? null,
          pre_tax_profit:    c.financials.pre_tax_profit ?? c.financials.net_profit,
          net_debt:          c.financials.net_debt ?? null,
          squad_value_eur_m: sq?.squad_value_eur_m ?? null,
          avg_age:           sq?.avg_age ?? null,
          expiry_0_12m_pct:  expiryPct(c.slug),
          capacity:          st?.capacity ?? null,
          attendance_pct:    st?.attendance_pct ?? null,
        };
      }),
    ...japanClubs.map((c): H2HPeer => {
      const sq = squadProfiles[c.slug];
      const st = stadiumData[c.slug];
      return {
        slug:              c.slug,
        name:              c.name,
        country:           "Japan",
        divisionLabel:     J_DIVISION_LABELS[c.division],
        currency:          "USD",
        revenue:           c.revenue,
        wage_bill:         c.wage_bill,
        wage_ratio:        c.wage_ratio,
        operating_profit:  c.operating_profit,
        pre_tax_profit:    c.pre_tax_profit,
        net_debt:          c.net_debt,
        squad_value_eur_m: sq?.squad_value_eur_m ?? null,
        avg_age:           sq?.avg_age ?? null,
        expiry_0_12m_pct:  expiryPct(c.slug),
        capacity:          st?.capacity ?? null,
        attendance_pct:    st?.attendance_pct ?? null,
      };
    }),
  ];

  const showCompareTab = slug === "arsenal";

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
            content: <FinancialsSection club={club} />,
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
          {
            key: "market",
            label: "Market",
            labelFull: "Market Context",
            content: (
              <MarketContextSection
                slug={slug}
                country="England"
                leagueClubs={enMarketLeagueEntries}
                leagueLabel={compareLabel}
                currencySymbol="£"
                color={DIVISION_COLORS[club.division] ?? "#3b82f6"}
              />
            ),
          },
          {
            key: "compare",
            label: "Compare",
            content: showCompareTab ? (
              <ClubCompareTab
                slug={slug}
                divisionLabel={compareLabel}
                priorYear={priorYear}
                divisionPeers={divisionPeers}
                allH2HPeers={allH2HPeers}
              />
            ) : null,
          },
        ]}
      />
    </div>
  );
}
