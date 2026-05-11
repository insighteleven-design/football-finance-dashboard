import { notFound } from "next/navigation";
import Link from "next/link";
import { clubs, getClub, type ClubFinancials } from "@/lib/clubs";
import { euClubs, getEuClub, type EUClub } from "@/lib/euClubs";
import { japanClubs, getJapanClub, J_DIVISION_LABELS, type JapanClub } from "@/lib/japanClubs";
import { brazilClubs, getBrazilClub, BR_DIVISION_LABELS, type BrazilClub } from "@/lib/brClubs";
import ClubProfileTabs from "@/components/ClubProfileTabs";
import MarketContextSection, { type MarketLeagueEntry } from "@/components/MarketContextSection";
import EUFinancialsSection from "@/components/EUFinancialsSection";
import JapanFinancialsSection from "@/components/JapanFinancialsSection";
import BrazilFinancialsSection from "@/components/BrazilFinancialsSection";
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
  const brazilSlugs = brazilClubs
    .filter((c) => c.data_confidence !== "VERY_LOW")
    .map((c) => ({ slug: c.slug }));
  return [...englishSlugs, ...euSlugs, ...japanSlugs, ...brazilSlugs];
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

const BRAZIL_DIVISION_COLORS: Record<string, string> = {
  "serie-a": "#009c3b",
  "serie-b": "#009c3b",
};

// ─── Shared league display map (EU + H2H) ────────────────────────────────────
const LEAGUE_DISPLAY: Record<string, string> = {
  "norwegian-eliteserien": "Eliteserien",
  "1. Bundesliga":         "Bundesliga",
  "2. Bundesliga":         "2. Bundesliga",
  "Austrian Bundesliga":   "Austrian Bundesliga",
  "Austrian 2. Liga":      "Austrian 2. Liga",
  "Super League":          "Swiss Super League",
};

// ─── Module-level peer helpers ────────────────────────────────────────────────

function expiryPct(s: string): number | null {
  const sq = squadProfiles[s];
  if (!sq?.contract_expiry) return null;
  const ex = sq.contract_expiry;
  const total = (ex["0-12m"] ?? 0) + (ex["12-24m"] ?? 0) + (ex["24m+"] ?? 0);
  if (total === 0) return null;
  return Math.round((ex["0-12m"] / total) * 100);
}

function transferStats(slug: string): { net_5yr: number | null; spend_5yr: number | null } {
  const ta = squadProfiles[slug]?.transfer_activity;
  if (!ta || ta.length === 0) return { net_5yr: null, spend_5yr: null };
  const net   = ta.reduce((s, r) => s + (r.net_eur_m         ?? 0), 0);
  const spend = ta.reduce((s, r) => s + (r.gross_spend_eur_m ?? 0), 0);
  return { net_5yr: Math.round(net * 10) / 10, spend_5yr: Math.round(spend * 10) / 10 };
}

function toDivPeer(c: ClubFinancials): DivisionPeer {
  const sq = squadProfiles[c.slug];
  const st = stadiumData[c.slug];
  const ts = transferStats(c.slug);
  return {
    slug:                     c.slug,
    name:                     c.name,
    revenue:                  c.revenue,
    wage_bill:                c.wage_bill,
    wage_ratio:               c.wage_ratio,
    operating_profit:         c.operating_profit,
    pre_tax_profit:           c.pre_tax_profit,
    net_debt:                 c.net_debt,
    squad_value_eur_m:        sq?.squad_value_eur_m ?? null,
    squad_size:               sq?.squad_size ?? null,
    avg_age:                  sq?.avg_age ?? null,
    expiry_0_12m_pct:         expiryPct(c.slug),
    capacity:                 st?.capacity ?? null,
    attendance_pct:           st?.attendance_pct ?? null,
    transfer_net_5yr_eur_m:   ts.net_5yr,
    transfer_spend_5yr_eur_m: ts.spend_5yr,
  };
}

function euToDivPeer(c: EUClub): DivisionPeer {
  const sq = squadProfiles[c.slug];
  const st = stadiumData[c.slug];
  const ts = transferStats(c.slug);
  return {
    slug:                     c.slug,
    name:                     c.name,
    revenue:                  c.financials.revenue,
    wage_bill:                c.financials.wage_bill,
    wage_ratio:               c.financials.wage_to_revenue_pct,
    operating_profit:         c.financials.operating_profit ?? null,
    pre_tax_profit:           c.financials.pre_tax_profit ?? c.financials.net_profit,
    net_debt:                 c.financials.net_debt ?? null,
    squad_value_eur_m:        sq?.squad_value_eur_m ?? null,
    squad_size:               sq?.squad_size ?? null,
    avg_age:                  sq?.avg_age ?? null,
    expiry_0_12m_pct:         expiryPct(c.slug),
    capacity:                 st?.capacity ?? null,
    attendance_pct:           st?.attendance_pct ?? null,
    transfer_net_5yr_eur_m:   ts.net_5yr,
    transfer_spend_5yr_eur_m: ts.spend_5yr,
  };
}

function jpToDivPeer(c: JapanClub): DivisionPeer {
  const sq = squadProfiles[c.slug];
  const st = stadiumData[c.slug];
  const ts = transferStats(c.slug);
  return {
    slug:                     c.slug,
    name:                     c.name,
    revenue:                  c.revenue,
    wage_bill:                c.wage_bill,
    wage_ratio:               c.wage_ratio,
    operating_profit:         c.operating_profit,
    pre_tax_profit:           c.pre_tax_profit,
    net_debt:                 c.net_debt,
    squad_value_eur_m:        sq?.squad_value_eur_m ?? null,
    squad_size:               sq?.squad_size ?? null,
    avg_age:                  sq?.avg_age ?? null,
    expiry_0_12m_pct:         expiryPct(c.slug),
    capacity:                 st?.capacity ?? null,
    attendance_pct:           st?.attendance_pct ?? null,
    transfer_net_5yr_eur_m:   ts.net_5yr,
    transfer_spend_5yr_eur_m: ts.spend_5yr,
  };
}

function brToDivPeer(c: BrazilClub): DivisionPeer {
  const sq = squadProfiles[c.slug];
  const st = stadiumData[c.slug];
  const ts = transferStats(c.slug);
  // Convert BRL thousands to a comparable unit: BRL millions / ~5.8 (approx EUR rate) — rough
  // For H2H display we store raw BRL thousands; currency label handles display
  return {
    slug:                     c.slug,
    name:                     c.name,
    revenue:                  c.revenue,
    wage_bill:                c.wage_bill,
    wage_ratio:               c.wage_ratio !== null ? c.wage_ratio * 100 : null,
    operating_profit:         c.operating_profit,
    pre_tax_profit:           c.pre_tax_profit,
    net_debt:                 c.net_debt,
    squad_value_eur_m:        sq?.squad_value_eur_m ?? null,
    squad_size:               sq?.squad_size ?? null,
    avg_age:                  sq?.avg_age ?? null,
    expiry_0_12m_pct:         expiryPct(c.slug),
    capacity:                 st?.capacity ?? null,
    attendance_pct:           st?.attendance_pct ?? null,
    transfer_net_5yr_eur_m:   ts.net_5yr,
    transfer_spend_5yr_eur_m: ts.spend_5yr,
  };
}

// Pre-built once at module init — covers all 337 clubs across three regions
const ALL_H2H_PEERS: H2HPeer[] = [
  ...clubs.map((c): H2HPeer => ({
    ...toDivPeer(c),
    country:       "England",
    divisionLabel: DIVISION_LABELS[c.division] ?? c.division,
    currency:      "GBP",
  })),
  ...euClubs
    .filter(hasEuFinancialData)
    .map((c): H2HPeer => ({
      ...euToDivPeer(c),
      country:       c.country,
      divisionLabel: LEAGUE_DISPLAY[c.league] ?? c.league,
      currency:      c.currency === "USD" ? "USD" : "EUR",
    })),
  ...japanClubs.map((c): H2HPeer => ({
    ...jpToDivPeer(c),
    country:       "Japan",
    divisionLabel: J_DIVISION_LABELS[c.division],
    currency:      "USD",
  })),
  ...brazilClubs
    .filter((c) => c.data_confidence !== "VERY_LOW")
    .map((c): H2HPeer => ({
      ...brToDivPeer(c),
      country:       "Brazil",
      divisionLabel: BR_DIVISION_LABELS[c.division],
      currency:      "BRL",
    })),
];

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

    // ── EU Compare tab data ────────────────────────────────────────────────
    const euDivPeers: DivisionPeer[] = euClubs
      .filter(c => c.league === euClub.league && c.country === euClub.country && hasEuFinancialData(c))
      .map(euToDivPeer);

    const euPriorYear: PriorYearSnap | null = euClub.prior_year
      ? {
          revenue:    euClub.prior_year.revenue,
          wage_ratio: euClub.prior_year.wage_to_revenue_pct ?? null,
          net_debt:   euClub.prior_year.net_debt ?? null,
        }
      : null;

    const euCurrency: "EUR" | "USD" = euClub.currency === "USD" ? "USD" : "EUR";

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
          requestAccessHref={`/request-access?from=/clubs/${slug}`}
          tabs={[
            {
              key:     "financials",
              label:   "Financials",
              labelFull: "Financial Information",
              gated:   true,
              content: <EUFinancialsSection club={euClub} leagueClubs={leagueClubs} leagueLabel={leagueLabel} />,
            },
            {
              key:     "squad",
              label:   "Squad",
              labelFull: "Squad Profile",
              gated:   true,
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
              key:     "market",
              label:   "Market",
              labelFull: "Market Context",
              gated:   true,
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
            {
              key:     "compare",
              label:   "Compare",
              gated:   true,
              content: (
                <ClubCompareTab
                  slug={slug}
                  divisionLabel={leagueLabel}
                  priorYear={euPriorYear}
                  divisionPeers={euDivPeers}
                  allH2HPeers={ALL_H2H_PEERS}
                  currency={euCurrency}
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

    // ── Japan Compare tab data ─────────────────────────────────────────────
    const jpDivPeers: DivisionPeer[] = japanClubs
      .filter(c => c.division === japanClub.division)
      .map(jpToDivPeer);

    const _jpPy = japanClub.prior_years[0] ?? null;
    const jpPriorYear: PriorYearSnap | null = _jpPy
      ? {
          revenue:    _jpPy.revenue,
          wage_ratio: _jpPy.wage_ratio ?? null,
          net_debt:   _jpPy.net_debt ?? null,
        }
      : null;

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
          requestAccessHref={`/request-access?from=/clubs/${slug}`}
          tabs={[
            {
              key:     "financials",
              label:   "Financials",
              labelFull: "Financial Information",
              gated:   true,
              content: <JapanFinancialsSection club={japanClub} leagueClubs={leagueClubs} />,
            },
            {
              key:     "squad",
              label:   "Squad",
              labelFull: "Squad Profile",
              gated:   true,
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
              key:     "market",
              label:   "Market",
              labelFull: "Market Context",
              gated:   true,
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
            {
              key:     "compare",
              label:   "Compare",
              gated:   true,
              content: (
                <ClubCompareTab
                  slug={slug}
                  divisionLabel={divisionLabel}
                  priorYear={jpPriorYear}
                  divisionPeers={jpDivPeers}
                  allH2HPeers={ALL_H2H_PEERS}
                  currency="USD"
                />
              ),
            },
          ]}
        />
      </div>
    );
  }

  // ─── Brazil club fast-path ───────────────────────────────────────────────────
  const brazilClub = getBrazilClub(slug);
  if (brazilClub) {
    if (brazilClub.data_confidence === "VERY_LOW") notFound();

    const divisionLabel = BR_DIVISION_LABELS[brazilClub.division];
    const leagueClubs = brazilClubs.filter(
      (c) => c.division === brazilClub.division && c.data_confidence !== "VERY_LOW"
    );

    const brMarketLeagueEntries: MarketLeagueEntry[] = leagueClubs
      .map((c) => ({ slug: c.slug, name: c.name, revenueMunits: c.revenue }));

    // Sort to match directory: division (serie-a → serie-b) → name
    const visibleBrazilClubs = brazilClubs
      .filter((c) => c.data_confidence !== "VERY_LOW")
      .sort((a, b) => a.division.localeCompare(b.division) || a.name.localeCompare(b.name));
    const brIdx = visibleBrazilClubs.findIndex((c) => c.slug === slug);
    const nextBr = visibleBrazilClubs[(brIdx + 1) % visibleBrazilClubs.length];
    const prevBr = visibleBrazilClubs[(brIdx - 1 + visibleBrazilClubs.length) % visibleBrazilClubs.length];

    const fyDate = brazilClub.fiscal_year_end
      ? new Date(brazilClub.fiscal_year_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null;

    const brIssues: string[] = [];
    const brPositives: string[] = [];
    if (brazilClub.pre_tax_profit !== null && brazilClub.pre_tax_profit < 0) brIssues.push("Loss-making");
    if (brazilClub.pre_tax_profit !== null && brazilClub.pre_tax_profit > 0) brPositives.push("Profitable");
    if (brazilClub.net_debt !== null && brazilClub.net_debt < 0) brPositives.push("Net cash");
    if (brazilClub.wage_ratio !== null && brazilClub.wage_ratio > 1) brIssues.push("Wages exceed revenue");
    else if (brazilClub.wage_ratio !== null && brazilClub.wage_ratio > 0.8) brIssues.push("High wage ratio");
    if (brazilClub.wage_ratio !== null && brazilClub.wage_ratio < 0.6) brPositives.push("Lean wage bill");

    // ── Brazil Compare tab data ────────────────────────────────────────────
    const brDivPeers: DivisionPeer[] = leagueClubs.map(brToDivPeer);

    return (
      <div className="px-6 lg:px-12 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-3xl sm:text-5xl font-serif font-normal text-[#111111] tracking-tight">
                  {brazilClub.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.1em] uppercase text-[#666666]">
                  {divisionLabel}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.1em] uppercase text-[#aaaaaa]">
                  Brazil
                </span>
              </div>
              {fyDate && (
                <p className="text-sm text-[#999999]">
                  Financial year ending <span className="text-[#666666]">{fyDate}</span>
                </p>
              )}
              {brazilClub.league_notes && (
                <p className="text-sm text-[#aaaaaa] mt-1">{brazilClub.league_notes}</p>
              )}
              {(brIssues.length > 0 || brPositives.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {brPositives.map((p) => (
                    <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#4a9a6a] text-[#4a9a6a]">{p}</span>
                  ))}
                  {brIssues.map((i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#9a4a4a] text-[#9a4a4a]">{i}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CopyLinkButton />
              <Link
                href={`/directory?country=Brazil&league=${encodeURIComponent(brazilClub.division)}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                All clubs
              </Link>
              <Link
                href={`/clubs/${prevBr.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                ← Prev
              </Link>
              <Link
                href={`/clubs/${nextBr.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                Next →
              </Link>
            </div>
          </div>
        </div>
        <ClubProfileTabs
          requestAccessHref={`/request-access?from=/clubs/${slug}`}
          tabs={[
            {
              key:       "financials",
              label:     "Financials",
              labelFull: "Financial Information",
              gated:     true,
              content:   <BrazilFinancialsSection club={brazilClub} leagueClubs={leagueClubs} />,
            },
            {
              key:       "squad",
              label:     "Squad",
              labelFull: "Squad Profile",
              gated:     true,
              content: (
                <SquadProfileSection
                  currentSlug={slug}
                  profile={squadProfiles[slug]}
                  clubName={brazilClub.name}
                  leagueEntries={[]}
                  leagueLabel={divisionLabel}
                />
              ),
            },
            {
              key:       "market",
              label:     "Market",
              labelFull: "Market Context",
              gated:     true,
              content: (
                <MarketContextSection
                  slug={slug}
                  country="Brazil"
                  leagueClubs={brMarketLeagueEntries}
                  leagueLabel={divisionLabel}
                  currencySymbol="R$"
                  color={BRAZIL_DIVISION_COLORS[brazilClub.division] ?? "#009c3b"}
                />
              ),
            },
            {
              key:   "compare",
              label: "Compare",
              gated: true,
              content: (
                <ClubCompareTab
                  slug={slug}
                  divisionLabel={divisionLabel}
                  priorYear={null}
                  divisionPeers={brDivPeers}
                  allH2HPeers={ALL_H2H_PEERS}
                  currency="BRL"
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
        requestAccessHref={`/request-access?from=/clubs/${slug}`}
        tabs={[
          {
            key:     "financials",
            label:   "Financials",
            labelFull: "Financial Information",
            gated:   club.division !== "premier-league",
            content: <FinancialsSection club={club} />,
          },
          {
            key:     "squad",
            label:   "Squad",
            labelFull: "Squad Profile",
            gated:   true,
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
            key:     "market",
            label:   "Market",
            labelFull: "Market Context",
            gated:   true,
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
            key:     "compare",
            label:   "Compare",
            gated:   true,
            content: (
              <ClubCompareTab
                slug={slug}
                divisionLabel={compareLabel}
                priorYear={priorYear}
                divisionPeers={divisionPeers}
                allH2HPeers={ALL_H2H_PEERS}
                currency="GBP"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
