"use client";

import { useState, useMemo } from "react";
import RadarChart from "@/components/RadarChart";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DivisionPeer = {
  slug:              string;
  name:              string;
  revenue:           number | null;
  wage_bill:         number | null;
  wage_ratio:        number | null;
  operating_profit:  number | null;
  pre_tax_profit:    number | null;
  net_debt:          number | null;
  squad_value_eur_m: number | null;
  squad_size:        number | null;
  avg_age:           number | null;
  expiry_0_12m_pct:  number | null;
  capacity:          number | null;
  attendance_pct:    number | null;
};

export type PriorYearSnap = {
  revenue:    number | null;
  wage_ratio: number | null;
  net_debt:   number | null;
};

export type H2HPeer = DivisionPeer & {
  country:       string;
  divisionLabel: string;
  currency:      "GBP" | "EUR" | "USD";
};

type CompareMode = "benchmark" | "h2h";
type H2HView    = "radar" | "table";

// ─── Colours ─────────────────────────────────────────────────────────────────

const SIG_GREEN  = "#2e7d52";
const SIG_AMBER  = "#c47900";
const SIG_RED    = "#9a3030";
const SIG_BG: Record<string, string> = {
  [SIG_GREEN]: "#f2fbf5",
  [SIG_AMBER]: "#fdfaf0",
  [SIG_RED]:   "#fdf3f3",
};

const HIGHLIGHT  = "#3b82f6";
const H2H_CLR    = "#e05252";
const C_WIN      = "#2e7d52";
const C_LOSE     = "#9a3030";
const BG_WIN     = "#f2fbf5";
const BG_LOSE    = "#fdf3f3";
const FX_GBP     = 1.17;
const FX_USD     = 0.92;

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Spain: "🇪🇸", Italy: "🇮🇹",
  France: "🇫🇷", Germany: "🇩🇪", Austria: "🇦🇹",
  Switzerland: "🇨🇭", Denmark: "🇩🇰", Norway: "🇳🇴",
  Sweden: "🇸🇪", Japan: "🇯🇵",
};

const COUNTRY_ORDER = [
  "England", "Spain", "Italy", "Germany", "France",
  "Austria", "Switzerland", "Denmark", "Norway", "Sweden", "Japan",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtGBP(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}£${abs.toFixed(1)}m`;
}

function fmtEUR(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}€${abs.toFixed(1)}m`;
}

function fmtPct(v: number | null, digits = 1): string {
  if (v === null) return "—";
  return `${v.toFixed(digits)}%`;
}

function toEUR(v: number | null, currency: "GBP" | "EUR" | "USD"): number | null {
  if (v === null) return null;
  if (currency === "GBP") return v * FX_GBP;
  if (currency === "USD") return v * FX_USD;
  return v;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function rankColor(rank: number | null): string {
  if (rank === null) return "#cccccc";
  if (rank <= 5)  return SIG_GREEN;
  if (rank <= 10) return SIG_AMBER;
  return SIG_RED;
}

// Standard rank: sort by value, higherBetter determines order
function divRank(
  peers: DivisionPeer[],
  slug: string,
  getValue: (p: DivisionPeer) => number | null,
  higherBetter: boolean,
): { rank: number | null; total: number } {
  const valid  = peers.filter(p => getValue(p) !== null);
  const sorted = [...valid].sort((a, b) =>
    higherBetter ? getValue(b)! - getValue(a)! : getValue(a)! - getValue(b)!,
  );
  const idx = sorted.findIndex(p => p.slug === slug);
  return { rank: idx === -1 ? null : idx + 1, total: valid.length };
}

// Age rank: closest to 26 = rank 1
function divRankAge(
  peers: DivisionPeer[],
  slug: string,
): { rank: number | null; total: number } {
  const valid  = peers.filter(p => p.avg_age !== null);
  const sorted = [...valid].sort((a, b) =>
    Math.abs(a.avg_age! - 26) - Math.abs(b.avg_age! - 26),
  );
  const idx = sorted.findIndex(p => p.slug === slug);
  return { rank: idx === -1 ? null : idx + 1, total: valid.length };
}

// Percentile rank (for callout stats)
function pctRank(v: number, sorted: number[]): number {
  if (sorted.length === 0) return 0.5;
  let below = 0, equal = 0;
  for (const x of sorted) {
    if (x < v) below++;
    else if (x === v) equal++;
  }
  return (below + 0.5 * equal) / sorted.length;
}

// ─── Scorecard ────────────────────────────────────────────────────────────────
// Split layout: left = metric value, right = league ranking panel.
// Bottom accent bar colour-coded by rank position.

function ScoreCard({
  label, value, yoyStr, yoyColor,
  rank, total,
}: {
  label:    string;
  value:    string;
  yoyStr:   string | null;
  yoyColor: string;
  rank:     number | null;
  total:    number;
}) {
  const rColor = rankColor(rank);
  const rBg    = SIG_BG[rColor] ?? "#fafafa";

  return (
    <div style={{
      border:        "1px solid #eeeeee",
      background:    "white",
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden",
    }}>
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left — metric */}
        <div style={{ flex: 1, minWidth: 0, padding: "20px 16px 16px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#888888", margin: "0 0 10px 0",
          }}>
            {label}
          </p>
          <p style={{
            fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 700,
            color: "#111111", fontVariantNumeric: "tabular-nums",
            lineHeight: 1, margin: "0 0 8px 0",
          }}>
            {value}
          </p>
          {yoyStr !== null ? (
            <p style={{ fontSize: "12px", fontWeight: 600, color: yoyColor, margin: 0, lineHeight: 1.4 }}>
              {yoyStr} vs prior year
            </p>
          ) : (
            <p style={{ fontSize: "12px", color: "#dddddd", margin: 0 }}>—</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", background: "#eeeeee", flexShrink: 0 }} />

        {/* Right — ranking */}
        <div style={{
          width: "82px", flexShrink: 0,
          padding: "14px 10px 12px",
          background: rBg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "4px",
        }}>
          <p style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: rColor, opacity: 0.7,
            margin: 0, textAlign: "center", lineHeight: 1.3,
          }}>
            League<br />ranking
          </p>
          <p style={{
            fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 700,
            color: rColor, fontVariantNumeric: "tabular-nums",
            lineHeight: 1, margin: 0,
          }}>
            {rank !== null ? ordinal(rank) : "—"}
          </p>
          <p style={{
            fontSize: "11px", color: rColor, opacity: 0.6, margin: 0,
          }}>
            of {total}
          </p>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{ height: "3px", background: rColor, opacity: rank !== null ? 1 : 0.15 }} />
    </div>
  );
}

// ─── Ranking Panel ────────────────────────────────────────────────────────────
// Compact panel used in the 2-column grid. Thin 5px bars.

type RankEntry = { slug: string; name: string; value: number | null };

function RankingPanel({
  title, note, data, highlightSlug, formatFn, higherBetter,
}: {
  title:         string;
  note?:         string;
  data:          RankEntry[];
  highlightSlug: string;
  formatFn:      (v: number) => string;
  higherBetter:  boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const valid = data.filter(d => d.value !== null);
    return [...valid].sort((a, b) =>
      higherBetter ? b.value! - a.value! : a.value! - b.value!,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, higherBetter]);

  const maxVal = useMemo(
    () => Math.max(...sorted.map(d => Math.abs(d.value ?? 0)), 0.01),
    [sorted],
  );

  const hlInTop5 = sorted.slice(0, 5).some(d => d.slug === highlightSlug);

  const displayed = useMemo(() => {
    if (showAll) return sorted;
    const top5 = sorted.slice(0, 5);
    if (hlInTop5) return top5;
    const hl = sorted.find(d => d.slug === highlightSlug);
    return hl ? [...top5, hl] : top5;
  }, [sorted, showAll, highlightSlug, hlInTop5]);

  if (sorted.length === 0) return null;

  return (
    <div style={{ border: "1px solid #eeeeee", padding: "16px 18px 14px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "8px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555555", margin: 0 }}>
            {title}
          </p>
          {note && (
            <p style={{ fontSize: "10px", color: "#aaaaaa", margin: "3px 0 0 0" }}>{note}</p>
          )}
        </div>
        {sorted.length > 5 && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "#aaaaaa", background: "none",
              border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap",
              textDecoration: "underline", textUnderlineOffset: "2px", flexShrink: 0,
            }}
          >
            {showAll ? "Show top 5" : `Show all ${sorted.length}`}
          </button>
        )}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {displayed.map((d, listIdx) => {
          const isHL  = d.slug === highlightSlug;
          const isFirst = listIdx === 0;
          const showDivider = !showAll && !hlInTop5 && isHL && !isFirst;
          const barPct = d.value !== null ? Math.min((Math.abs(d.value) / maxVal) * 100, 100) : 0;

          return (
            <div key={d.slug}>
              {showDivider && (
                <div style={{ borderTop: "1px dashed #e0e0e0", marginBottom: "8px" }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Club name */}
                <span style={{
                  fontSize: "13px",
                  fontWeight: isHL ? 700 : 400,
                  color: isHL ? HIGHLIGHT : "#444444",
                  flex: 1, minWidth: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {d.name}
                </span>
                {/* Thin bar */}
                <div style={{ width: "48px", flexShrink: 0 }}>
                  <div style={{ height: "5px", background: "#eeeeee", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${barPct}%`,
                      background: isHL ? HIGHLIGHT : "#cccccc",
                      borderRadius: "2px",
                    }} />
                  </div>
                </div>
                {/* Value */}
                <span style={{
                  fontSize: "12px",
                  fontWeight: isHL ? 700 : 400,
                  color: isHL ? HIGHLIGHT : "#777777",
                  fontVariantNumeric: "tabular-nums",
                  width: "52px", textAlign: "right", flexShrink: 0,
                }}>
                  {d.value !== null ? formatFn(d.value) : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "#111111",
      margin: "0 0 16px 0", paddingBottom: "10px", borderBottom: "2px solid #111111",
    }}>
      {children}
    </p>
  );
}

// ─── Division Benchmark View ──────────────────────────────────────────────────

function DivisionBenchmarkView({
  slug, divisionLabel, divisionPeers, priorYear,
}: {
  slug:          string;
  divisionLabel: string;
  divisionPeers: DivisionPeer[];
  priorYear:     PriorYearSnap | null;
}) {
  const club = divisionPeers.find(p => p.slug === slug);
  if (!club) return null;

  // ── Scorecard data helpers ────────────────────────────────────────────────

  // Revenue
  const revR  = divRank(divisionPeers, slug, p => p.revenue, true);
  const revYoy = priorYear?.revenue != null && club.revenue != null
    ? ((club.revenue - priorYear.revenue) / Math.abs(priorYear.revenue)) * 100 : null;
  const revYoyStr   = revYoy !== null ? `${revYoy >= 0 ? "+" : ""}${revYoy.toFixed(1)}%` : null;
  const revYoyColor = revYoy === null ? "#cccccc" : revYoy >= 0 ? C_WIN : C_LOSE;

  // Wage Ratio
  const wrR   = divRank(divisionPeers, slug, p => p.wage_ratio, false);
  const wrYoy = priorYear?.wage_ratio != null && club.wage_ratio != null
    ? club.wage_ratio - priorYear.wage_ratio : null;
  const wrYoyStr   = wrYoy !== null ? `${wrYoy >= 0 ? "+" : ""}${wrYoy.toFixed(1)}pp` : null;
  const wrYoyColor = wrYoy === null ? "#cccccc" : wrYoy <= 0 ? C_WIN : C_LOSE;

  // Net Debt
  const ndR   = divRank(divisionPeers, slug, p => p.net_debt, false);
  const ndYoy = priorYear?.net_debt != null && club.net_debt != null
    ? club.net_debt - priorYear.net_debt : null;
  const ndYoyStr   = ndYoy !== null
    ? `${ndYoy >= 0 ? "+" : ""}£${Math.abs(ndYoy).toFixed(1)}m` : null;
  const ndYoyColor = ndYoy === null ? "#cccccc" : ndYoy <= 0 ? C_WIN : C_LOSE;

  // Est. Squad Value
  const svR   = divRank(divisionPeers, slug, p => p.squad_value_eur_m, true);
  const svFmt = club.squad_value_eur_m !== null
    ? `€${Math.round(club.squad_value_eur_m).toLocaleString("en-GB")}m` : "—";

  // Squad Size (Row 2, slot 1 — replaces duplicate Est. Squad Value)
  const ssR   = divRank(divisionPeers, slug, p => p.squad_size, true);

  // Avg Age (closest to 26 = rank 1)
  const ageR  = divRankAge(divisionPeers, slug);

  // Contract Expiry Risk
  const exR   = divRank(divisionPeers, slug, p => p.expiry_0_12m_pct, false);

  // Stadium Utilisation
  const utilR = divRank(divisionPeers, slug, p => p.attendance_pct, true);

  // ── Data for ranking panels ───────────────────────────────────────────────

  const plRevData    = divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.revenue }));
  const plWrData     = divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.wage_ratio }));
  const plSvData     = divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.squad_value_eur_m }));
  const plUtilData   = divisionPeers.filter(p => p.attendance_pct !== null).map(p => ({ slug: p.slug, name: p.name, value: p.attendance_pct }));
  const plNdData     = divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.net_debt }));
  const plWbData     = divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.wage_bill }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

      {/* ── Section 1: Division Standing ─────────────────────────────── */}
      <div>
        <SectionHeading>Division Standing</SectionHeading>

        {/* Row 1 — Financial */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <ScoreCard
            label="Revenue"
            value={fmtGBP(club.revenue)}
            yoyStr={revYoyStr}
            yoyColor={revYoyColor}
            rank={revR.rank}
            total={revR.total}
          />
          <ScoreCard
            label="Wage Ratio"
            value={fmtPct(club.wage_ratio)}
            yoyStr={wrYoyStr}
            yoyColor={wrYoyColor}
            rank={wrR.rank}
            total={wrR.total}
          />
          <ScoreCard
            label="Net Debt"
            value={fmtGBP(club.net_debt)}
            yoyStr={ndYoyStr}
            yoyColor={ndYoyColor}
            rank={ndR.rank}
            total={ndR.total}
          />
          <ScoreCard
            label="Est. Squad Value"
            value={svFmt}
            yoyStr={null}
            yoyColor="#cccccc"
            rank={svR.rank}
            total={svR.total}
          />
        </div>

        {/* Row 2 — Squad + Stadium */}
        {/* Note: Squad Size replaces duplicate Est. Squad Value in this row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ScoreCard
            label="Squad Size"
            value={club.squad_size !== null ? `${club.squad_size}` : "—"}
            yoyStr={null}
            yoyColor="#cccccc"
            rank={ssR.rank}
            total={ssR.total}
          />
          <ScoreCard
            label="Average Age"
            value={club.avg_age !== null ? club.avg_age.toFixed(1) : "—"}
            yoyStr={null}
            yoyColor="#cccccc"
            rank={ageR.rank}
            total={ageR.total}
          />
          <ScoreCard
            label="Expiry Risk"
            value={fmtPct(club.expiry_0_12m_pct, 0)}
            yoyStr={null}
            yoyColor="#cccccc"
            rank={exR.rank}
            total={exR.total}
          />
          <ScoreCard
            label="Stadium Utilisation"
            value={fmtPct(club.attendance_pct)}
            yoyStr={null}
            yoyColor="#cccccc"
            rank={utilR.rank}
            total={utilR.total}
          />
        </div>
      </div>

      {/* ── Section 2: Rankings ───────────────────────────────────────── */}
      <div>
        <SectionHeading>Rankings</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RankingPanel
            title="Revenue"
            data={plRevData}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={true}
          />
          <RankingPanel
            title="Wage Ratio"
            note="Lower is better"
            data={plWrData}
            highlightSlug={slug}
            formatFn={v => fmtPct(v)}
            higherBetter={false}
          />
          <RankingPanel
            title="Est. Squad Value"
            data={plSvData}
            highlightSlug={slug}
            formatFn={v => `€${Math.round(v).toLocaleString("en-GB")}m`}
            higherBetter={true}
          />
          <RankingPanel
            title="Stadium Utilisation"
            data={plUtilData}
            highlightSlug={slug}
            formatFn={v => fmtPct(v)}
            higherBetter={true}
          />
          <RankingPanel
            title="Net Debt"
            note="Lower is better"
            data={plNdData}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={false}
          />
          <RankingPanel
            title="Wage Bill"
            note="Lower is better"
            data={plWbData}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─── H2H callout stats ────────────────────────────────────────────────────────

type RadarPops = {
  revenueEur: number[];
  wageRatio:  number[];
  squadValue: number[];
  ageDev:     number[];
  capacity:   number[];
  attendance: number[];
};

function generateCallouts(main: H2HPeer, other: H2HPeer, pops: RadarPops): string[] {
  type Gap = { gap: number; sentence: string };
  const results: Gap[] = [];

  function maybe(
    mainRaw: number | null,
    otherRaw: number | null,
    pop: number[],
    invert: boolean,
    mkSentence: (m: number, o: number) => string,
  ) {
    if (mainRaw === null || otherRaw === null || pop.length === 0) return;
    const sorted = [...pop].sort((a, b) => a - b);
    const mp = pctRank(mainRaw, sorted);
    const op = pctRank(otherRaw, sorted);
    const ms = invert ? 1 - mp : mp;
    const os = invert ? 1 - op : op;
    results.push({ gap: Math.abs(ms - os), sentence: mkSentence(mainRaw, otherRaw) });
  }

  const mainRevEUR  = toEUR(main.revenue, main.currency);
  const otherRevEUR = toEUR(other.revenue, other.currency);
  maybe(mainRevEUR, otherRevEUR, pops.revenueEur, false, (m, o) => {
    const hi = Math.max(m, o), lo = Math.min(m, o);
    const hName = m >= o ? main.name : other.name;
    const lName = m >= o ? other.name : main.name;
    if (lo > 0 && hi / lo >= 1.5)
      return `${hName}'s revenue is ${(hi / lo).toFixed(1)}× ${lName}'s (€${hi.toFixed(0)}m vs €${lo.toFixed(0)}m)`;
    return `${hName} generate €${(hi - lo).toFixed(0)}m more revenue than ${lName} annually`;
  });

  maybe(main.wage_ratio, other.wage_ratio, pops.wageRatio, true, (m, o) => {
    const lo = Math.min(m, o), hi = Math.max(m, o);
    const bName = m <= o ? main.name : other.name;
    const wName = m <= o ? other.name : main.name;
    return `${bName} are more wage-efficient at ${lo.toFixed(1)}% of revenue, vs ${hi.toFixed(1)}% for ${wName}`;
  });

  maybe(main.squad_value_eur_m, other.squad_value_eur_m, pops.squadValue, false, (m, o) => {
    const hi = Math.max(m, o), lo = Math.min(m, o);
    const hName = m >= o ? main.name : other.name;
    const lName = m >= o ? other.name : main.name;
    if (lo > 0 && hi / lo >= 1.5)
      return `${hName}'s squad is valued at ${(hi / lo).toFixed(1)}× ${lName}'s (€${Math.round(hi)}m vs €${Math.round(lo)}m)`;
    return `${hName}'s squad is €${Math.round(Math.abs(m - o))}m more valuable than ${lName}'s`;
  });

  const mAgeDev = main.avg_age !== null ? Math.abs(main.avg_age - 26) : null;
  const oAgeDev = other.avg_age !== null ? Math.abs(other.avg_age - 26) : null;
  maybe(mAgeDev, oAgeDev, pops.ageDev, true, (_m, _o) => {
    const closerClub = mAgeDev! <= oAgeDev! ? main : other;
    const furtherClub= mAgeDev! <= oAgeDev! ? other : main;
    return `${closerClub.name}'s average squad age (${closerClub.avg_age!.toFixed(1)}) is closer to peak than ${furtherClub.name}'s (${furtherClub.avg_age!.toFixed(1)})`;
  });

  maybe(main.capacity, other.capacity, pops.capacity, false, (m, o) => {
    const hi = Math.max(m, o), lo = Math.min(m, o);
    const hName = m >= o ? main.name : other.name;
    const lName = m >= o ? other.name : main.name;
    return `${hName}'s stadium holds ${Math.round(hi - lo).toLocaleString("en-GB")} more fans than ${lName}'s`;
  });

  maybe(main.attendance_pct, other.attendance_pct, pops.attendance, false, (m, o) => {
    const hi = Math.max(m, o), lo = Math.min(m, o);
    const hName = m >= o ? main.name : other.name;
    const lName = m >= o ? other.name : main.name;
    return `${hName} fill their stadium at ${hi.toFixed(1)}%, ${(hi - lo).toFixed(1)}pp ahead of ${lName} (${lo.toFixed(1)}%)`;
  });

  return results
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map(r => r.sentence);
}

// ─── H2H Table ────────────────────────────────────────────────────────────────

function H2HTable({ main, other }: { main: H2HPeer; other: H2HPeer }) {
  const mainFX  = main.currency !== "EUR";
  const otherFX = other.currency !== "EUR";

  type RowDef = {
    label:        string;
    mainVal:      number | null;
    otherVal:     number | null;
    higherBetter: boolean;
    isRatio?:     boolean;
    isEURDirect?: boolean;
    isPlain?:     boolean;
    plainFmt?:    (v: number) => string;
    isAgePeak?:   boolean;
  };

  function rowWinner(def: RowDef, mEur: number | null, oEur: number | null): boolean | null {
    if (mEur === null || oEur === null) return null;
    if (def.isAgePeak) return Math.abs(mEur - 26) < Math.abs(oEur - 26);
    return def.higherBetter ? mEur > oEur : mEur < oEur;
  }

  function TableRow({ def }: { def: RowDef }) {
    const mEur = def.isRatio || def.isPlain || def.isEURDirect
      ? def.mainVal  : toEUR(def.mainVal,  main.currency);
    const oEur = def.isRatio || def.isPlain || def.isEURDirect
      ? def.otherVal : toEUR(def.otherVal, other.currency);

    const mWins = rowWinner(def, mEur, oEur);
    const mBg   = mWins === true  ? BG_WIN  : mWins === false ? BG_LOSE : undefined;
    const oBg   = mWins === false ? BG_WIN  : mWins === true  ? BG_LOSE : undefined;
    const mClr  = mWins === true  ? C_WIN   : mWins === false ? C_LOSE  : "#111111";
    const oClr  = mWins === false ? C_WIN   : mWins === true  ? C_LOSE  : "#111111";

    function display(val: number | null, isOther: boolean): string {
      if (val === null) return "—";
      if (def.isRatio) return fmtPct(val);
      if (def.isPlain && def.plainFmt) return def.plainFmt(val);
      if (def.isEURDirect) return fmtEUR(val);
      return fmtEUR(toEUR(val, isOther ? other.currency : main.currency));
    }

    const showMFX = !def.isRatio && !def.isPlain && !def.isEURDirect && mainFX  && def.mainVal !== null;
    const showOFX = !def.isRatio && !def.isPlain && !def.isEURDirect && otherFX && def.otherVal !== null;

    return (
      <div style={{ display: "flex", borderBottom: "1px solid #f5f5f5" }}>
        <div style={{ width: "120px", padding: "10px 14px", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999999" }}>
            {def.label}
          </span>
        </div>
        <div style={{ flex: 1, padding: "10px 14px", borderLeft: "1px solid #f0f0f0", background: mBg }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: mClr, fontVariantNumeric: "tabular-nums" }}>
            {display(def.mainVal, false)}
          </span>
          {showMFX && <span style={{ fontSize: "10px", color: "#bbbbbb", marginLeft: "6px" }}>fx</span>}
        </div>
        <div style={{ flex: 1, padding: "10px 14px", borderLeft: "1px solid #f0f0f0", background: oBg }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: oClr, fontVariantNumeric: "tabular-nums" }}>
            {display(def.otherVal, true)}
          </span>
          {showOFX && <span style={{ fontSize: "10px", color: "#bbbbbb", marginLeft: "6px" }}>fx</span>}
        </div>
      </div>
    );
  }

  function SectionHeader({ label }: { label: string }) {
    return (
      <div style={{ display: "flex", background: "#f9f9f9", borderBottom: "1px solid #eeeeee" }}>
        <div style={{ width: "120px", flexShrink: 0 }} />
        <div style={{ flex: 2, padding: "7px 14px", borderLeft: "1px solid #eeeeee" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaaaaa" }}>
            {label}
          </span>
        </div>
      </div>
    );
  }

  const financialRows: RowDef[] = [
    { label: "Revenue",    mainVal: main.revenue,          otherVal: other.revenue,          higherBetter: true  },
    { label: "Wage Bill",  mainVal: main.wage_bill,        otherVal: other.wage_bill,        higherBetter: false },
    { label: "Wage Ratio", mainVal: main.wage_ratio,       otherVal: other.wage_ratio,       higherBetter: false, isRatio: true },
    { label: "Op. Profit", mainVal: main.operating_profit, otherVal: other.operating_profit, higherBetter: true  },
    { label: "Pre-tax",    mainVal: main.pre_tax_profit,   otherVal: other.pre_tax_profit,   higherBetter: true  },
    { label: "Net Debt",   mainVal: main.net_debt,         otherVal: other.net_debt,         higherBetter: false },
  ];
  const squadRows: RowDef[] = [
    { label: "Squad Value", mainVal: main.squad_value_eur_m, otherVal: other.squad_value_eur_m, higherBetter: true,  isEURDirect: true },
    { label: "Avg Age",     mainVal: main.avg_age,           otherVal: other.avg_age,           higherBetter: false, isPlain: true, isAgePeak: true, plainFmt: v => v.toFixed(1) },
    { label: "Expiry Risk", mainVal: main.expiry_0_12m_pct,  otherVal: other.expiry_0_12m_pct,  higherBetter: false, isRatio: true },
  ];
  const stadiumRows: RowDef[] = [
    { label: "Capacity",    mainVal: main.capacity,      otherVal: other.capacity,      higherBetter: true,  isPlain: true, plainFmt: v => Math.round(v).toLocaleString("en-GB") },
    { label: "Utilisation", mainVal: main.attendance_pct,otherVal: other.attendance_pct,higherBetter: true,  isRatio: true },
  ];

  return (
    <div style={{ border: "1px solid #e0e0e0", overflow: "hidden" }}>
      {/* Column headers */}
      <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0" }}>
        <div style={{ width: "120px", flexShrink: 0, padding: "12px 14px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaaaaa" }}>EUR base</span>
        </div>
        <div style={{ flex: 1, padding: "12px 14px", borderLeft: "1px solid #e0e0e0" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: HIGHLIGHT, margin: 0 }}>{main.name}</p>
          <p style={{ fontSize: "11px", color: "#aaaaaa", margin: "2px 0 0 0" }}>{main.divisionLabel}</p>
        </div>
        <div style={{ flex: 1, padding: "12px 14px", borderLeft: "1px solid #e0e0e0" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: H2H_CLR, margin: 0 }}>{other.name}</p>
          <p style={{ fontSize: "11px", color: "#aaaaaa", margin: "2px 0 0 0" }}>
            {COUNTRY_FLAGS[other.country] ?? ""} {other.divisionLabel}
          </p>
        </div>
      </div>

      <SectionHeader label="Financial" />
      {financialRows.map(def => <TableRow key={def.label} def={def} />)}

      <SectionHeader label="Squad" />
      {squadRows.map(def => <TableRow key={def.label} def={def} />)}

      <SectionHeader label="Stadium" />
      {stadiumRows.map(def => <TableRow key={def.label} def={def} />)}

      <div style={{ padding: "8px 14px", background: "#fafafa", borderTop: "1px solid #eeeeee" }}>
        <p style={{ fontSize: "10px", color: "#cccccc", margin: 0 }}>
          EUR base · GBP ×{FX_GBP} · USD ×{FX_USD} · green = better for that metric
        </p>
      </div>
    </div>
  );
}

// ─── Head to Head View ────────────────────────────────────────────────────────

function HeadToHeadView({
  mainSlug, mainPeer, allH2HPeers,
}: {
  mainSlug:    string;
  mainPeer:    H2HPeer;
  allH2HPeers: H2HPeer[];
}) {
  const [query, setQuery]       = useState("");
  const [selectedSlug, setSlug] = useState<string | null>(null);
  const [view, setView]         = useState<H2HView>("radar");

  const otherPeer = selectedSlug
    ? allH2HPeers.find(p => p.slug === selectedSlug) ?? null
    : null;

  const searchPool = useMemo(
    () => allH2HPeers.filter(p => p.slug !== mainSlug),
    [allH2HPeers, mainSlug],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchPool;
    return searchPool.filter(
      p => p.name.toLowerCase().includes(q) || p.divisionLabel.toLowerCase().includes(q),
    );
  }, [searchPool, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, H2HPeer[]>();
    for (const p of filtered) {
      if (!map.has(p.country)) map.set(p.country, []);
      map.get(p.country)!.push(p);
    }
    return COUNTRY_ORDER
      .filter(c => map.has(c))
      .map(c => [c, map.get(c)!] as [string, H2HPeer[]]);
  }, [filtered]);

  const radarPops = useMemo((): RadarPops => ({
    revenueEur: allH2HPeers.map(p => toEUR(p.revenue, p.currency)).filter((v): v is number => v !== null),
    wageRatio:  allH2HPeers.map(p => p.wage_ratio).filter((v): v is number => v !== null),
    squadValue: allH2HPeers.map(p => p.squad_value_eur_m).filter((v): v is number => v !== null),
    ageDev:     allH2HPeers.map(p => p.avg_age !== null ? Math.abs(p.avg_age - 26) : null).filter((v): v is number => v !== null),
    capacity:   allH2HPeers.map(p => p.capacity).filter((v): v is number => v !== null),
    attendance: allH2HPeers.map(p => p.attendance_pct).filter((v): v is number => v !== null),
  }), [allH2HPeers]);

  const callouts = useMemo(() => {
    if (!otherPeer) return [];
    return generateCallouts(mainPeer, otherPeer, radarPops);
  }, [mainPeer, otherPeer, radarPops]);

  function radarValues(peer: H2HPeer): (number | null)[] {
    return [
      toEUR(peer.revenue, peer.currency),
      peer.wage_ratio,
      peer.squad_value_eur_m,
      peer.avg_age !== null ? Math.abs(peer.avg_age - 26) : null,
      peer.capacity,
      peer.attendance_pct,
    ];
  }

  const radarAxes = [
    { label: "Revenue",           invert: false, population: radarPops.revenueEur },
    { label: "Wage\nEfficiency",  invert: true,  population: radarPops.wageRatio  },
    { label: "Squad\nValue",      invert: false, population: radarPops.squadValue  },
    { label: "Peak\nAge",         invert: true,  population: radarPops.ageDev      },
    { label: "Stadium\nCapacity", invert: false, population: radarPops.capacity    },
    { label: "Attendance\nRate",  invert: false, population: radarPops.attendance  },
  ];

  const isSearchOpen = query.trim().length > 0;

  return (
    <div>
      {/* Club search */}
      <div style={{ marginBottom: "24px" }}>
        {!otherPeer && (
          <p style={{ fontSize: "13px", color: "#888888", marginBottom: "10px" }}>
            Search for any club in the database to compare
          </p>
        )}
        <div style={{ position: "relative", display: "inline-block" }}>
          {otherPeer ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: HIGHLIGHT }}>{mainPeer.name}</span>
                <span style={{ color: "#cccccc" }}>vs</span>
                <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: H2H_CLR }}>{otherPeer.name}</span>
                <span style={{ fontSize: "11px", color: "#aaaaaa" }}>
                  {COUNTRY_FLAGS[otherPeer.country] ?? ""} {otherPeer.divisionLabel}
                </span>
              </div>
              <button
                onClick={() => { setSlug(null); setQuery(""); }}
                style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaaaaa", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search clubs…"
                autoComplete="off"
                style={{
                  width: "260px", border: "1px solid #e0e0e0",
                  padding: "8px 12px", fontSize: "14px", color: "#111111",
                  background: "white", outline: "none",
                }}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={e => { (e.target as HTMLElement).style.borderColor = "#e0e0e0"; }}
              />
              {isSearchOpen && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, width: "260px",
                  border: "1px solid #e0e0e0", borderTop: "none",
                  maxHeight: "280px", overflowY: "auto",
                  background: "white", zIndex: 10,
                }}>
                  {grouped.length === 0 && (
                    <p style={{ padding: "12px 14px", fontSize: "13px", color: "#aaaaaa", margin: 0 }}>No clubs match.</p>
                  )}
                  {grouped.map(([country, peers]) => (
                    <div key={country}>
                      <div style={{ padding: "6px 14px 4px", background: "#f9f9f9", borderBottom: "1px solid #f0f0f0" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbbbbb" }}>
                          {COUNTRY_FLAGS[country] ?? ""} {country}
                        </span>
                      </div>
                      {peers.map(p => (
                        <button
                          key={p.slug}
                          onMouseDown={() => { setSlug(p.slug); setQuery(""); }}
                          style={{
                            width: "100%", textAlign: "left", padding: "8px 14px",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: "none", border: "none", borderBottom: "1px solid #f8f8f8",
                            cursor: "pointer", gap: "8px",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <span style={{ fontSize: "13px", color: "#111111" }}>{p.name}</span>
                          <span style={{ fontSize: "10px", color: "#aaaaaa", flexShrink: 0 }}>{p.divisionLabel}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View toggle — only when a club is selected */}
      {otherPeer && (
        <div style={{ display: "flex", gap: 0, marginBottom: "24px" }}>
          {(["radar", "table"] as H2HView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "7px 18px",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                background: view === v ? "#111111" : "#ffffff",
                color:      view === v ? "#ffffff" : "#999999",
                border: "1px solid #e0e0e0",
                marginLeft: v === "table" ? "-1px" : 0,
                cursor: "pointer",
                transition: "all 0.1s",
              }}
            >
              {v === "radar" ? "Radar" : "Table"}
            </button>
          ))}
        </div>
      )}

      {/* Radar view */}
      {otherPeer && view === "radar" && (
        <div>
          <RadarChart
            axes={radarAxes}
            series={[
              { name: mainPeer.name,  color: HIGHLIGHT, values: radarValues(mainPeer)  },
              { name: otherPeer.name, color: H2H_CLR,   values: radarValues(otherPeer) },
            ]}
          />
          {callouts.length > 0 && (
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {callouts.map((text, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "3px", flexShrink: 0, background: i === 0 ? HIGHLIGHT : i === 1 ? H2H_CLR : "#e0e0e0", borderRadius: "2px", alignSelf: "stretch" }} />
                  <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#333333", margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {otherPeer && view === "table" && (
        <H2HTable main={mainPeer} other={otherPeer} />
      )}

      {/* Empty state */}
      {!otherPeer && !isSearchOpen && (
        <div style={{
          border: "1px dashed #e0e0e0",
          padding: "40px 24px", textAlign: "center",
        }}>
          <p style={{ fontSize: "13px", color: "#aaaaaa", margin: 0 }}>
            Search above to select a club and start the head-to-head comparison.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Mode tab ─────────────────────────────────────────────────────────────────

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 28px",
        fontSize: "13px", fontWeight: active ? 700 : 400,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: active ? "#111111" : "#aaaaaa",
        background: "none", border: "none",
        borderBottom: `2px solid ${active ? "#111111" : "transparent"}`,
        marginBottom: "-1px",
        cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function ClubCompareTab({
  slug,
  divisionLabel,
  priorYear,
  divisionPeers,
  allH2HPeers,
}: {
  slug:          string;
  divisionLabel: string;
  priorYear:     PriorYearSnap | null;
  divisionPeers: DivisionPeer[];
  allH2HPeers:   H2HPeer[];
}) {
  const [mode, setMode] = useState<CompareMode>("benchmark");
  const mainPeer = allH2HPeers.find(p => p.slug === slug) ?? null;

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", marginBottom: "32px", overflowX: "auto" }}>
        <ModeTab label="Division Benchmark" active={mode === "benchmark"} onClick={() => setMode("benchmark")} />
        <ModeTab label="Head to Head"        active={mode === "h2h"}       onClick={() => setMode("h2h")}       />
      </div>

      {mode === "benchmark" && (
        <DivisionBenchmarkView
          slug={slug}
          divisionLabel={divisionLabel}
          divisionPeers={divisionPeers}
          priorYear={priorYear}
        />
      )}

      {mode === "h2h" && mainPeer && (
        <HeadToHeadView
          mainSlug={slug}
          mainPeer={mainPeer}
          allH2HPeers={allH2HPeers}
        />
      )}
    </div>
  );
}
