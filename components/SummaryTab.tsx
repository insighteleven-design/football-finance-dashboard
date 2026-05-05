import Link from "next/link";
import { clubs, type ClubFinancials } from "@/lib/clubs";
import { squadProfiles } from "@/lib/squadProfile";
import { stadiumData } from "@/lib/stadiumData";
import { marketData } from "@/lib/marketData";
import { nearbyClubs } from "@/lib/nearbyClubs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const v = n % 100;
  const s = ["th", "st", "nd", "rd"];
  return (s[(v - 20) % 10] || s[v] || s[0]) as string;
}

// ─── Financial health score ───────────────────────────────────────────────────

type ScoreComp = { name: string; score: number };

function calcHealthScore(club: ClubFinancials): {
  total: number;
  partial: boolean;
  components: ScoreComp[];
} {
  const comps: ScoreComp[] = [];
  let possible = 0;

  function add(name: string, score: number) {
    comps.push({ name, score });
    possible += 2;
  }

  if (club.wage_ratio != null) {
    const wr = club.wage_ratio;
    add("Wage efficiency", wr < 50 ? 2 : wr < 60 ? 1.5 : wr < 70 ? 1 : wr < 80 ? 0.5 : 0);
  }

  if (club.operating_profit != null && club.revenue != null) {
    const m = (club.operating_profit / club.revenue) * 100;
    add("Profitability", m > 0 ? 2 : m >= -10 ? 1.5 : m >= -25 ? 1 : m >= -50 ? 0.5 : 0);
  }

  if (club.net_debt != null && club.revenue != null) {
    const mult = club.net_debt / club.revenue;
    add("Debt position", mult < 0 ? 2 : mult < 0.25 ? 1.5 : mult < 0.5 ? 1 : mult < 1 ? 0.5 : 0);
  }

  if (club.prior_year?.revenue != null && club.revenue != null) {
    const g = ((club.revenue - club.prior_year.revenue) / club.prior_year.revenue) * 100;
    add("Revenue trajectory", g > 15 ? 2 : g > 5 ? 1.5 : g >= 0 ? 1 : g >= -10 ? 0.5 : 0);
  }

  if (club.pre_tax_profit != null && club.prior_year?.pre_tax_profit != null) {
    const cur = club.pre_tax_profit;
    const prv = club.prior_year.pre_tax_profit;
    const imp = cur > prv;
    const s =
      imp && cur > 0       ? 2   :
      imp                  ? 1.5 :
      Math.abs(cur - prv) < 2 ? 1   :
      prv > 0 && cur <= 0  ? 0.5 : 0;
    add("Pre-tax trend", s);
  }

  if (possible === 0) return { total: 0, partial: false, components: comps };
  const rawSum = comps.reduce((a, c) => a + c.score, 0);
  const total  = parseFloat(((rawSum / possible) * 10).toFixed(1));
  return { total, partial: possible < 10, components: comps };
}

function scoreStyle(t: number): { text: string; bg: string; border: string } {
  if (t >= 7.5) return { text: "#2e7d52", bg: "#f2fbf5", border: "#4a9a6a" };
  if (t >= 5)   return { text: "#c47900", bg: "#fdfaf0", border: "#c8884a" };
  return               { text: "#9a3030", bg: "#fdf3f3", border: "#9a4a4a" };
}

// ─── Insights ─────────────────────────────────────────────────────────────────

type Insight = { title: string; body: string; sentiment: "green" | "red" | "amber" };

function insightBorder(s: Insight["sentiment"]): string {
  return s === "green" ? "#4a9a6a" : s === "red" ? "#9a4a4a" : "#c8884a";
}

function buildInsights(club: ClubFinancials, plPeers: ClubFinancials[]): Insight[] {
  const candidates: Insight[] = [];

  // Wage ratio — ascending (1 = leanest)
  const wageRankings = plPeers
    .filter(c => c.wage_ratio != null)
    .sort((a, b) => (a.wage_ratio ?? 999) - (b.wage_ratio ?? 999));
  const wageRank  = wageRankings.findIndex(c => c.slug === club.slug) + 1;
  const wageCount = wageRankings.length;
  const wr = club.wage_ratio;

  if (wageRank > 0 && wageRank <= 5 && wr != null) {
    candidates.push({
      title: "Wage efficiency",
      body: `A wage ratio of ${wr.toFixed(0)}% makes Arsenal the ${wageRank === 1 ? "leanest" : `${wageRank}${ordinal(wageRank)}-leanest`} wage structure in the Premier League, generating strong commercial leverage relative to payroll.`,
      sentiment: "green",
    });
  } else if (wageCount > 0 && wageRank > wageCount - 5 && wr != null) {
    candidates.push({
      title: "Wage pressure",
      body: `A wage ratio of ${wr.toFixed(0)}% is among the highest in the Premier League, compressing operating margins and limiting financial flexibility.`,
      sentiment: "red",
    });
  }

  // Net debt — descending (1 = most indebted)
  const debtRankings = plPeers
    .filter(c => c.net_debt != null)
    .sort((a, b) => (b.net_debt ?? 0) - (a.net_debt ?? 0));
  const debtRank = debtRankings.findIndex(c => c.slug === club.slug) + 1;

  if (debtRank > 0 && debtRank <= 5 && club.net_debt != null) {
    const yoy = club.prior_year?.net_debt != null ? club.net_debt - club.prior_year.net_debt : null;
    const yoyStr = yoy != null ? ` (${yoy >= 0 ? "+" : ""}£${Math.abs(yoy).toFixed(0)}m YoY)` : "";
    candidates.push({
      title: "Debt burden",
      body: `Net debt of £${club.net_debt.toFixed(0)}m ranks ${debtRank}${ordinal(debtRank)} highest in the Premier League${yoyStr}, reflecting significant balance sheet leverage.`,
      sentiment: "red",
    });
  }

  // Squad value — descending (1 = highest)
  const squadRankings = plPeers
    .filter(c => (squadProfiles[c.slug]?.squad_value_eur_m ?? null) != null)
    .sort((a, b) => (squadProfiles[b.slug]?.squad_value_eur_m ?? 0) - (squadProfiles[a.slug]?.squad_value_eur_m ?? 0));
  const squadRank = squadRankings.findIndex(c => c.slug === club.slug) + 1;
  const squadVal  = squadProfiles[club.slug]?.squad_value_eur_m;

  if (squadRank > 0 && squadRank <= 3 && squadVal != null) {
    const pos = squadRank === 1 ? "the highest" : squadRank === 2 ? "second highest" : "third highest";
    candidates.push({
      title: "Elite squad asset",
      body: `Arsenal's squad is valued at €${squadVal.toFixed(0)}m — ${pos} in the Premier League — representing a substantial on-pitch asset base.`,
      sentiment: "green",
    });
  }

  // Contract expiry
  const sq = squadProfiles[club.slug];
  const ex = sq?.contract_expiry;
  const exTotal = ex ? ex["0-12m"] + ex["12-24m"] + ex["24m+"] : 0;
  const exPct   = exTotal > 0 && ex ? Math.round((ex["0-12m"] / exTotal) * 100) : null;

  if (exPct != null && exPct < 10) {
    candidates.push({
      title: "Contract stability",
      body: `Only ${exPct}% of squad registrations expire within 12 months, giving Arsenal strong contractual security and limited near-term renewal risk.`,
      sentiment: "green",
    });
  } else if (exPct != null && exPct > 25) {
    candidates.push({
      title: "Renewal risk",
      body: `${exPct}% of squad registrations expire within 12 months, representing elevated renewal and potential asset-value risk.`,
      sentiment: "red",
    });
  }

  // Revenue growth
  const revGrowth =
    club.prior_year?.revenue != null && club.revenue != null
      ? ((club.revenue - club.prior_year.revenue) / club.prior_year.revenue) * 100
      : null;

  if (revGrowth != null && revGrowth > 10) {
    candidates.push({
      title: "Revenue trajectory",
      body: `Revenue grew ${revGrowth.toFixed(0)}% year-on-year to £${club.revenue!.toFixed(0)}m, reflecting commercial expansion and deeper European progression.`,
      sentiment: "green",
    });
  } else if (revGrowth != null && revGrowth < 0) {
    candidates.push({
      title: "Revenue decline",
      body: `Revenue fell ${Math.abs(revGrowth).toFixed(0)}% year-on-year to £${club.revenue!.toFixed(0)}m, weighing on the club's overall financial position.`,
      sentiment: "red",
    });
  }

  // Attendance
  const st = stadiumData[club.slug];
  if (st?.attendance_pct != null && st.attendance_pct > 95) {
    candidates.push({
      title: "Stadium demand",
      body: `${st.stadium_name} operates at ${st.attendance_pct.toFixed(0)}% capacity utilisation, demonstrating near-maximum commercial exploitation of matchday infrastructure.`,
      sentiment: "green",
    });
  } else if (st?.attendance_pct != null && st.attendance_pct < 70) {
    candidates.push({
      title: "Underutilised stadium",
      body: `${st.stadium_name} averages only ${st.attendance_pct.toFixed(0)}% capacity utilisation, indicating untapped matchday revenue potential.`,
      sentiment: "red",
    });
  }

  // Operating margin
  const opMargin =
    club.operating_profit != null && club.revenue != null
      ? (club.operating_profit / club.revenue) * 100
      : null;

  if (opMargin != null && opMargin > 0) {
    candidates.push({
      title: "Operating profitability",
      body: `A positive operating margin of ${opMargin.toFixed(0)}% demonstrates the club's capacity to generate returns from core football operations.`,
      sentiment: "green",
    });
  } else if (opMargin != null && opMargin < -25) {
    candidates.push({
      title: "Operating losses",
      body: `An operating margin of ${opMargin.toFixed(0)}% reflects material structural losses from core operations before player sales and financial items.`,
      sentiment: "red",
    });
  }

  // Red first, then green, then amber
  return [
    ...candidates.filter(c => c.sentiment === "red"),
    ...candidates.filter(c => c.sentiment === "green"),
    ...candidates.filter(c => c.sentiment === "amber"),
  ].slice(0, 3);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | null | undefined;
  sub?: string | null;
  color?: string;
}) {
  if (value == null) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#f0f0f0] last:border-0">
      <span className="text-sm text-[#666666] leading-tight pr-2">{label}</span>
      <div className="text-right shrink-0">
        <span
          className="text-sm font-medium tabular-nums leading-tight"
          style={color ? { color } : undefined}
        >
          {value}
        </span>
        {sub && <p className="text-xs text-[#999999] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e0e0e0] p-4">
      <p className="text-xs font-semibold tracking-[0.08em] uppercase text-[#555555] mb-2 pb-2 border-b border-[#f0f0f0]">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SummaryTab({ club }: { club: ClubFinancials }) {
  const slug = club.slug;

  const squad   = squadProfiles[slug] ?? null;
  const stadium = stadiumData[slug] ?? null;
  const market  = marketData[slug] ?? null;
  const nearby  = nearbyClubs[slug] ?? null;

  const plClubs = clubs.filter(c => c.division === "premier-league");

  // ── Financial colours ────────────────────────────────────────────────────────

  const wageRatioColor =
    club.wage_ratio == null ? undefined :
    club.wage_ratio < 60    ? "#2e7d52" :
    club.wage_ratio < 70    ? "#c47900" : "#9a3030";

  const opProfitColor =
    club.operating_profit == null ? undefined :
    club.operating_profit >= 0    ? "#2e7d52" : "#9a3030";

  const netDebtColor =
    club.net_debt == null ? undefined :
    club.net_debt < 0     ? "#2e7d52" :
    club.net_debt < 150   ? "#c47900" : "#9a3030";

  // ── Squad ────────────────────────────────────────────────────────────────────

  const ex       = squad?.contract_expiry ?? null;
  const exTotal  = ex ? ex["0-12m"] + ex["12-24m"] + ex["24m+"] : 0;
  const expiryPct = exTotal > 0 && ex ? Math.round((ex["0-12m"] / exTotal) * 100) : null;

  const expiryColor =
    expiryPct == null ? undefined :
    expiryPct < 10    ? "#2e7d52" :
    expiryPct < 25    ? "#c47900" : "#9a3030";

  const ageLabel =
    squad?.avg_age == null ? null :
    squad.avg_age < 24     ? "Young squad" :
    squad.avg_age < 27     ? "Peak age"    : "Ageing squad";

  const plBySquadVal = plClubs
    .filter(c => (squadProfiles[c.slug]?.squad_value_eur_m ?? null) != null)
    .sort((a, b) => (squadProfiles[b.slug]?.squad_value_eur_m ?? 0) - (squadProfiles[a.slug]?.squad_value_eur_m ?? 0));
  const squadValRank = plBySquadVal.findIndex(c => c.slug === slug) + 1;
  const squadValSub  = squadValRank > 0 ? `${squadValRank}${ordinal(squadValRank)} in PL` : null;

  // ── Stadium ──────────────────────────────────────────────────────────────────

  const plCapacities = plClubs.map(c => stadiumData[c.slug]?.capacity).filter((v): v is number => v != null);
  const plAttPcts    = plClubs.map(c => stadiumData[c.slug]?.attendance_pct).filter((v): v is number => v != null);
  const plAvgCap     = plCapacities.length ? plCapacities.reduce((s, v) => s + v, 0) / plCapacities.length : null;
  const plAvgAttPct  = plAttPcts.length    ? plAttPcts.reduce((s, v) => s + v, 0) / plAttPcts.length       : null;

  const capDelta = stadium?.capacity != null && plAvgCap != null
    ? Math.round(((stadium.capacity - plAvgCap) / plAvgCap) * 100)
    : null;
  const attDelta = stadium?.attendance_pct != null && plAvgAttPct != null
    ? parseFloat((stadium.attendance_pct - plAvgAttPct).toFixed(1))
    : null;

  const attColor =
    stadium?.attendance_pct == null ? undefined :
    stadium.attendance_pct > 85     ? "#2e7d52" :
    stadium.attendance_pct > 70     ? "#c47900" : "#9a3030";

  // ── Market ───────────────────────────────────────────────────────────────────

  const nearbyCount = nearby?.clubs.length ?? 0;
  const compSignal =
    nearbyCount <= 1 ? { label: "Low competition",      color: "#2e7d52" } :
    nearbyCount <= 4 ? { label: "Moderate competition", color: "#c47900" } :
                       { label: "High competition",     color: "#9a3030" };

  // ── Health score ─────────────────────────────────────────────────────────────

  const score = calcHealthScore(club);
  const sc    = scoreStyle(score.total);

  // ── Badges ───────────────────────────────────────────────────────────────────

  const positives: string[] = [];
  const issues: string[]    = [];
  if (club.pre_tax_profit != null && club.pre_tax_profit > 0) positives.push("Profitable");
  if (club.pre_tax_profit != null && club.pre_tax_profit < 0) issues.push("Loss-making");
  if (club.net_debt != null && club.net_debt < 0)             positives.push("Net cash");
  if (club.net_debt != null && club.net_debt > 300)           issues.push("High debt");
  if (club.wage_ratio != null && club.wage_ratio < 60)        positives.push("Lean wage bill");
  if (club.wage_ratio != null && club.wage_ratio > 100)       issues.push("Wages exceed revenue");
  else if (club.wage_ratio != null && club.wage_ratio > 80)   issues.push("High wage ratio");

  // ── Insights ─────────────────────────────────────────────────────────────────

  const insights = buildInsights(club, plClubs);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header: FY date, badges left — health score right */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <div className="min-w-0">
          {(positives.length > 0 || issues.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-0">
              {positives.map(p => (
                <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#4a9a6a] text-[#4a9a6a]">
                  {p}
                </span>
              ))}
              {issues.map(i => (
                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-[#9a4a4a] text-[#9a4a4a]">
                  {i}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Health score */}
        <div
          className="shrink-0 px-7 py-5 border text-right"
          style={{ borderColor: sc.border, backgroundColor: sc.bg }}
        >
          <p className="text-5xl leading-none font-bold tabular-nums" style={{ color: sc.text }}>
            {score.total.toFixed(1)}
          </p>
          <p className="text-sm font-semibold mt-2" style={{ color: sc.text }}>
            Financial health
          </p>
          <p className="text-xs text-[#999999] mt-0.5">out of 10 · Premier League</p>
          {score.partial && (
            <p className="text-xs text-[#bbbbbb] mt-1.5">Based on partial data</p>
          )}
        </div>
      </div>

      {/* Data snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DataCard title="Financial">
          <MetricRow
            label="Revenue"
            value={club.revenue != null ? `£${club.revenue.toFixed(1)}m` : null}
          />
          <MetricRow
            label="Wage ratio"
            value={club.wage_ratio != null ? `${club.wage_ratio.toFixed(0)}%` : null}
            color={wageRatioColor}
          />
          <MetricRow
            label="Operating profit"
            value={
              club.operating_profit != null
                ? `${club.operating_profit < 0 ? "−" : "+"}£${Math.abs(club.operating_profit).toFixed(1)}m`
                : null
            }
            color={opProfitColor}
          />
          <MetricRow
            label="Net debt"
            value={club.net_debt != null ? `£${club.net_debt.toFixed(0)}m` : null}
            color={netDebtColor}
          />
        </DataCard>

        <DataCard title="Squad">
          <MetricRow
            label="Est. squad value"
            value={squad?.squad_value_eur_m != null ? `€${squad.squad_value_eur_m.toFixed(0)}m` : null}
            sub={squadValSub}
          />
          <MetricRow
            label="Average age"
            value={squad?.avg_age != null ? squad.avg_age.toFixed(1) : null}
            sub={ageLabel}
          />
          <MetricRow
            label="Contract expiry risk"
            value={expiryPct != null ? `${expiryPct}%` : null}
            sub="Within 12 months"
            color={expiryColor}
          />
          <MetricRow
            label="Squad size"
            value={squad?.squad_size != null ? String(squad.squad_size) : null}
          />
        </DataCard>

        <DataCard title="Stadium & Market">
          <MetricRow
            label="Stadium capacity"
            value={stadium?.capacity != null ? stadium.capacity.toLocaleString("en-GB") : null}
            sub={
              stadium?.stadium_name != null
                ? `${stadium.stadium_name}${capDelta != null ? ` · ${capDelta >= 0 ? "+" : ""}${capDelta}% vs PL avg` : ""}`
                : null
            }
          />
          <MetricRow
            label="Attendance"
            value={stadium?.attendance_pct != null ? `${stadium.attendance_pct.toFixed(0)}%` : null}
            sub={attDelta != null ? `${attDelta >= 0 ? "+" : ""}${attDelta}pp vs PL avg` : null}
            color={attColor}
          />
          <MetricRow
            label="Local population"
            value={
              market?.pop_m != null
                ? market.pop_m >= 1 ? `${market.pop_m.toFixed(1)}m` : `${Math.round(market.pop_m * 1000)}k`
                : null
            }
            sub={market?.city ?? null}
          />
          <MetricRow
            label="Local competition"
            value={nearby != null ? `${nearbyCount} clubs within 25 miles` : null}
            sub={compSignal.label}
            color={compSignal.color}
          />
        </DataCard>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="bg-white border border-[#e0e0e0] p-4"
              style={{ borderLeftColor: insightBorder(insight.sentiment), borderLeftWidth: 3 }}
            >
              <p className="text-sm font-semibold text-[#111111] mb-1.5">{insight.title}</p>
              <p className="text-sm text-[#666666] leading-relaxed">{insight.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Access gate */}
      <div className="bg-white border border-[#e0e0e0] p-8 text-center">
        <p className="text-base font-semibold text-[#111111] mb-2">
          Full profile available with access
        </p>
        <p className="text-sm text-[#666666] mb-6 max-w-md mx-auto leading-relaxed">
          Detailed financials, 4-year historical data, squad analysis, market context and
          competitive benchmarking across 300+ clubs.
        </p>
        <Link
          href={`/request-access?from=/clubs/${slug}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
        >
          Request access
        </Link>
      </div>
    </div>
  );
}
