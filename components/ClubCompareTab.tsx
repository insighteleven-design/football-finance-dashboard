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
type H2HView     = "table" | "radar";
type MetricKey   =
  | "revenue" | "wage_ratio" | "net_debt" | "squad_value"
  | "squad_size" | "avg_age" | "expiry" | "attendance";

// ─── Colours ─────────────────────────────────────────────────────────────────

const SIG_GREEN = "#2e7d52";
const SIG_AMBER = "#c47900";
const SIG_RED   = "#9a3030";
const SIG_BG: Record<string, string> = {
  [SIG_GREEN]: "#f2fbf5",
  [SIG_AMBER]: "#fdfaf0",
  [SIG_RED]:   "#fdf3f3",
};
const HIGHLIGHT = "#3b82f6";
const H2H_CLR   = "#e05252";
const C_WIN     = "#2e7d52";
const C_LOSE    = "#9a3030";
const BG_WIN    = "#f2fbf5";
const BG_LOSE   = "#fdf3f3";
const FX_GBP    = 1.17;
const FX_USD    = 0.92;

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", France: "🇫🇷", Germany: "🇩🇪",
  Austria: "🇦🇹", Switzerland: "🇨🇭", Denmark: "🇩🇰",
  Norway: "🇳🇴", Sweden: "🇸🇪", Japan: "🇯🇵",
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

function divRankAge(peers: DivisionPeer[], slug: string): { rank: number | null; total: number } {
  const valid  = peers.filter(p => p.avg_age !== null);
  const sorted = [...valid].sort((a, b) => Math.abs(a.avg_age! - 26) - Math.abs(b.avg_age! - 26));
  const idx = sorted.findIndex(p => p.slug === slug);
  return { rank: idx === -1 ? null : idx + 1, total: valid.length };
}

function pctRank(v: number, sorted: number[]): number {
  if (sorted.length === 0) return 0.5;
  let below = 0, equal = 0;
  for (const x of sorted) {
    if (x < v) below++;
    else if (x === v) equal++;
  }
  return (below + 0.5 * equal) / sorted.length;
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

// ─── InlineRanking ────────────────────────────────────────────────────────────
// Full-width panel rendered below a scorecard row when expanded.

type RankEntry = { slug: string; name: string; value: number | null };

function InlineRanking({
  data, highlightSlug, formatFn, higherBetter, note, preSorted = false,
}: {
  data:          RankEntry[];
  highlightSlug: string;
  formatFn:      (v: number) => string;
  higherBetter:  boolean;
  note?:         string;
  preSorted?:    boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const valid = data.filter(d => d.value !== null);
    if (preSorted) return valid;
    return [...valid].sort((a, b) =>
      higherBetter ? b.value! - a.value! : a.value! - b.value!,
    );
  }, [data, higherBetter, preSorted]);

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
    <div style={{ background: "#f9f9f9", padding: "16px 20px 14px", borderTop: "1px solid #e8e8e8" }}>
      {note && <p style={{ fontSize: "10px", color: "#aaaaaa", margin: "0 0 10px 0" }}>{note}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {displayed.map((d, listIdx) => {
          const isHL       = d.slug === highlightSlug;
          const showDvdr   = !showAll && !hlInTop5 && isHL && listIdx > 0;
          const rankPos    = sorted.findIndex(x => x.slug === d.slug) + 1;
          const barPct     = d.value !== null ? Math.min((Math.abs(d.value) / maxVal) * 100, 100) : 0;
          return (
            <div key={d.slug}>
              {showDvdr && <div style={{ borderTop: "1px dashed #e0e0e0", marginBottom: "8px" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 700, color: "#cccccc",
                  width: "22px", flexShrink: 0, textAlign: "right", fontVariantNumeric: "tabular-nums",
                }}>
                  {rankPos}
                </span>
                <span style={{
                  fontSize: "13px", fontWeight: isHL ? 700 : 400,
                  color: isHL ? HIGHLIGHT : "#444444",
                  flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {d.name}
                </span>
                <div style={{ width: "56px", flexShrink: 0 }}>
                  <div style={{ height: "5px", background: "#e8e8e8", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${barPct}%`,
                      background: isHL ? HIGHLIGHT : "#cccccc", borderRadius: "2px",
                    }} />
                  </div>
                </div>
                <span style={{
                  fontSize: "12px", fontWeight: isHL ? 700 : 400,
                  color: isHL ? HIGHLIGHT : "#777777",
                  fontVariantNumeric: "tabular-nums",
                  width: "56px", textAlign: "right", flexShrink: 0,
                }}>
                  {d.value !== null ? formatFn(d.value) : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {sorted.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            marginTop: "10px", fontSize: "10px", fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#aaaaaa", background: "none", border: "none",
            cursor: "pointer", padding: 0,
            textDecoration: "underline", textUnderlineOffset: "2px",
          }}
        >
          {showAll ? "Show top 5" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}

// ─── ScoreCard ────────────────────────────────────────────────────────────────

function ScoreCard({
  label, value, yoyStr, yoyColor, rank, total, note, expanded, onToggle,
}: {
  label:    string;
  value:    string;
  yoyStr:   string | null;
  yoyColor: string;
  rank:     number | null;
  total:    number;
  note?:    string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rColor = rankColor(rank);
  const rBg    = SIG_BG[rColor] ?? "#fafafa";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
      style={{
        border: `1px solid ${expanded ? "#bbbbbb" : "#eeeeee"}`,
        background: "white", display: "flex", flexDirection: "column",
        overflow: "hidden", cursor: "pointer", userSelect: "none",
      }}
    >
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left — metric */}
        <div style={{ flex: 1, minWidth: 0, padding: "22px 16px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "4px", marginBottom: "10px" }}>
            <p style={{
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "#888888", margin: 0,
            }}>
              {label}
            </p>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s", marginTop: "2px" }}
            >
              <path d="M2 4.5L6 8L10 4.5" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{
            fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700,
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
          {note && (
            <p style={{ fontSize: "10px", color: "#bbbbbb", margin: "5px 0 0 0" }}>{note}</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", background: "#eeeeee", flexShrink: 0 }} />

        {/* Right — ranking */}
        <div style={{
          width: "82px", flexShrink: 0, padding: "18px 10px 14px",
          background: rBg, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "4px",
        }}>
          <p style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: rColor, opacity: 0.7,
            margin: 0, textAlign: "center", lineHeight: 1.3,
          }}>
            League<br />ranking
          </p>
          <p style={{
            fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700,
            color: rColor, fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: 0,
          }}>
            {rank !== null ? ordinal(rank) : "—"}
          </p>
          <p style={{ fontSize: "11px", color: rColor, opacity: 0.6, margin: 0 }}>
            of {total}
          </p>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{ height: "3px", background: rColor, opacity: rank !== null ? 1 : 0.15 }} />
    </div>
  );
}

// ─── Division Benchmark View ──────────────────────────────────────────────────

const ROW1: MetricKey[] = ["revenue", "wage_ratio", "net_debt", "squad_value"];
const ROW2: MetricKey[] = ["squad_size", "avg_age", "expiry", "attendance"];

function DivisionBenchmarkView({
  slug, divisionLabel, divisionPeers, priorYear,
}: {
  slug:          string;
  divisionLabel: string;
  divisionPeers: DivisionPeer[];
  priorYear:     PriorYearSnap | null;
}) {
  const [expanded, setExpanded] = useState<MetricKey | null>(null);

  const club = divisionPeers.find(p => p.slug === slug);
  if (!club) return null;

  function toggle(key: MetricKey) {
    setExpanded(prev => prev === key ? null : key);
  }

  // ── Ranks ──────────────────────────────────────────────────────────────────
  const revR  = divRank(divisionPeers, slug, p => p.revenue,           true);
  const wrR   = divRank(divisionPeers, slug, p => p.wage_ratio,        false);
  const ndR   = divRank(divisionPeers, slug, p => p.net_debt,          false);
  const svR   = divRank(divisionPeers, slug, p => p.squad_value_eur_m, true);
  const ssR   = divRank(divisionPeers, slug, p => p.squad_size,        true);
  const ageR  = divRankAge(divisionPeers, slug);
  const exR   = divRank(divisionPeers, slug, p => p.expiry_0_12m_pct,  false);
  const utilR = divRank(divisionPeers, slug, p => p.attendance_pct,    true);

  // ── YoY ────────────────────────────────────────────────────────────────────
  const revYoy = priorYear?.revenue    != null && club.revenue    != null
    ? ((club.revenue - priorYear.revenue) / Math.abs(priorYear.revenue)) * 100 : null;
  const wrYoy  = priorYear?.wage_ratio != null && club.wage_ratio != null
    ? club.wage_ratio - priorYear.wage_ratio : null;
  const ndYoy  = priorYear?.net_debt   != null && club.net_debt   != null
    ? club.net_debt - priorYear.net_debt : null;

  // ── Ranking data per metric ─────────────────────────────────────────────────
  const ageRankData: RankEntry[] = divisionPeers
    .filter(p => p.avg_age !== null)
    .sort((a, b) => Math.abs(a.avg_age! - 26) - Math.abs(b.avg_age! - 26))
    .map(p => ({ slug: p.slug, name: p.name, value: p.avg_age }));

  function expandedPanel(key: MetricKey) {
    if (expanded !== key) return null;
    if (key === "avg_age") {
      return (
        <InlineRanking
          data={ageRankData}
          highlightSlug={slug}
          formatFn={v => v.toFixed(1)}
          higherBetter={false}
          preSorted={true}
        />
      );
    }
    const cfgs: Record<Exclude<MetricKey, "avg_age">, { data: RankEntry[]; formatFn: (v: number) => string; higherBetter: boolean; note?: string }> = {
      revenue:     { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.revenue })),           formatFn: v => fmtGBP(v),                                        higherBetter: true  },
      wage_ratio:  { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.wage_ratio })),        formatFn: v => fmtPct(v),                                        higherBetter: false, note: "Lower is better" },
      net_debt:    { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.net_debt })),          formatFn: v => fmtGBP(v),                                        higherBetter: false, note: "Lower is better" },
      squad_value: { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.squad_value_eur_m })), formatFn: v => `€${Math.round(v).toLocaleString("en-GB")}m`,     higherBetter: true  },
      squad_size:  { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.squad_size })),        formatFn: v => `${Math.round(v)}`,                               higherBetter: true  },
      expiry:      { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.expiry_0_12m_pct })),  formatFn: v => fmtPct(v, 0),                                     higherBetter: false, note: "Lower is better" },
      attendance:  { data: divisionPeers.filter(p => p.attendance_pct !== null).map(p => ({ slug: p.slug, name: p.name, value: p.attendance_pct })), formatFn: v => fmtPct(v),   higherBetter: true  },
    };
    const cfg = cfgs[key as Exclude<MetricKey, "avg_age">];
    return (
      <InlineRanking
        data={cfg.data}
        highlightSlug={slug}
        formatFn={cfg.formatFn}
        higherBetter={cfg.higherBetter}
        note={cfg.note}
      />
    );
  }

  const svFmt = club.squad_value_eur_m !== null
    ? `€${Math.round(club.squad_value_eur_m).toLocaleString("en-GB")}m` : "—";

  const expandedInRow1 = ROW1.includes(expanded as MetricKey) ? expanded : null;
  const expandedInRow2 = ROW2.includes(expanded as MetricKey) ? expanded : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      <div>
        <SectionHeading>Division Standing · {divisionLabel}</SectionHeading>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Row 1 — Financial */}
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <ScoreCard
                label="Revenue" value={fmtGBP(club.revenue)}
                yoyStr={revYoy !== null ? `${revYoy >= 0 ? "+" : ""}${revYoy.toFixed(1)}%` : null}
                yoyColor={revYoy === null ? "#cccccc" : revYoy >= 0 ? C_WIN : C_LOSE}
                rank={revR.rank} total={revR.total}
                expanded={expanded === "revenue"} onToggle={() => toggle("revenue")}
              />
              <ScoreCard
                label="Wage Ratio" value={fmtPct(club.wage_ratio)}
                yoyStr={wrYoy !== null ? `${wrYoy >= 0 ? "+" : ""}${wrYoy.toFixed(1)}pp` : null}
                yoyColor={wrYoy === null ? "#cccccc" : wrYoy <= 0 ? C_WIN : C_LOSE}
                rank={wrR.rank} total={wrR.total} note="Lower is better"
                expanded={expanded === "wage_ratio"} onToggle={() => toggle("wage_ratio")}
              />
              <ScoreCard
                label="Net Debt" value={fmtGBP(club.net_debt)}
                yoyStr={ndYoy !== null ? `${ndYoy >= 0 ? "+" : ""}£${Math.abs(ndYoy).toFixed(1)}m` : null}
                yoyColor={ndYoy === null ? "#cccccc" : ndYoy <= 0 ? C_WIN : C_LOSE}
                rank={ndR.rank} total={ndR.total} note="Lower is better"
                expanded={expanded === "net_debt"} onToggle={() => toggle("net_debt")}
              />
              <ScoreCard
                label="Est. Squad Value" value={svFmt}
                yoyStr={null} yoyColor="#cccccc"
                rank={svR.rank} total={svR.total}
                expanded={expanded === "squad_value"} onToggle={() => toggle("squad_value")}
              />
            </div>
            {expandedInRow1 && expandedPanel(expandedInRow1)}
          </div>

          {/* Row 2 — Squad + Stadium */}
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <ScoreCard
                label="Squad Size"
                value={club.squad_size !== null ? `${club.squad_size}` : "—"}
                yoyStr={null} yoyColor="#cccccc"
                rank={ssR.rank} total={ssR.total}
                expanded={expanded === "squad_size"} onToggle={() => toggle("squad_size")}
              />
              <ScoreCard
                label="Average Age"
                value={club.avg_age !== null ? club.avg_age.toFixed(1) : "—"}
                yoyStr={null} yoyColor="#cccccc"
                rank={ageR.rank} total={ageR.total}
                expanded={expanded === "avg_age"} onToggle={() => toggle("avg_age")}
              />
              <ScoreCard
                label="Expiry Risk" value={fmtPct(club.expiry_0_12m_pct, 0)}
                yoyStr={null} yoyColor="#cccccc"
                rank={exR.rank} total={exR.total} note="Lower is better"
                expanded={expanded === "expiry"} onToggle={() => toggle("expiry")}
              />
              <ScoreCard
                label="Stadium Utilisation" value={fmtPct(club.attendance_pct)}
                yoyStr={null} yoyColor="#cccccc"
                rank={utilR.rank} total={utilR.total}
                expanded={expanded === "attendance"} onToggle={() => toggle("attendance")}
              />
            </div>
            {expandedInRow2 && expandedPanel(expandedInRow2)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Radar populations type ───────────────────────────────────────────────────

type RadarPops = {
  revenueEur: number[];
  wageRatio:  number[];
  squadValue: number[];
  ageDev:     number[];
  capacity:   number[];
  attendance: number[];
};

// ─── H2H callout stats ────────────────────────────────────────────────────────

function generateCallouts(main: H2HPeer, other: H2HPeer, pops: RadarPops): string[] {
  type Gap = { gap: number; sentence: string };
  const results: Gap[] = [];

  function maybe(
    mainRaw: number | null, otherRaw: number | null, pop: number[],
    invert: boolean, mkSentence: (m: number, o: number) => string,
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
    const hN = m >= o ? main.name : other.name;
    const lN = m >= o ? other.name : main.name;
    if (lo > 0 && hi / lo >= 1.5) return `${hN}'s revenue is ${(hi / lo).toFixed(1)}× ${lN}'s (€${hi.toFixed(0)}m vs €${lo.toFixed(0)}m)`;
    return `${hN} generate €${(hi - lo).toFixed(0)}m more revenue than ${lN} annually`;
  });

  maybe(main.wage_ratio, other.wage_ratio, pops.wageRatio, true, (m, o) => {
    const lo = Math.min(m, o), hi = Math.max(m, o);
    const bN = m <= o ? main.name : other.name;
    const wN = m <= o ? other.name : main.name;
    return `${bN} are more wage-efficient at ${lo.toFixed(1)}% of revenue, vs ${hi.toFixed(1)}% for ${wN}`;
  });

  maybe(main.squad_value_eur_m, other.squad_value_eur_m, pops.squadValue, false, (m, o) => {
    const hi = Math.max(m, o), lo = Math.min(m, o);
    const hN = m >= o ? main.name : other.name;
    const lN = m >= o ? other.name : main.name;
    if (lo > 0 && hi / lo >= 1.5) return `${hN}'s squad is valued at ${(hi / lo).toFixed(1)}× ${lN}'s (€${Math.round(hi)}m vs €${Math.round(lo)}m)`;
    return `${hN}'s squad is €${Math.round(Math.abs(m - o))}m more valuable than ${lN}'s`;
  });

  const mAgeDev = main.avg_age  !== null ? Math.abs(main.avg_age  - 26) : null;
  const oAgeDev = other.avg_age !== null ? Math.abs(other.avg_age - 26) : null;
  maybe(mAgeDev, oAgeDev, pops.ageDev, true, (_m, _o) => {
    const closer  = mAgeDev! <= oAgeDev! ? main  : other;
    const further = mAgeDev! <= oAgeDev! ? other : main;
    return `${closer.name}'s average squad age (${closer.avg_age!.toFixed(1)}) is closer to peak than ${further.name}'s (${further.avg_age!.toFixed(1)})`;
  });

  maybe(main.capacity, other.capacity, pops.capacity, false, (m, o) => {
    const hi = Math.max(m, o), lo = Math.min(m, o);
    const hN = m >= o ? main.name : other.name;
    const lN = m >= o ? other.name : main.name;
    return `${hN}'s stadium holds ${Math.round(hi - lo).toLocaleString("en-GB")} more fans than ${lN}'s`;
  });

  maybe(main.attendance_pct, other.attendance_pct, pops.attendance, false, (m, o) => {
    const hi = Math.max(m, o), lo = Math.min(m, o);
    const hN = m >= o ? main.name : other.name;
    const lN = m >= o ? other.name : main.name;
    return `${hN} fill their stadium at ${hi.toFixed(1)}%, ${(hi - lo).toFixed(1)}pp ahead of ${lN} (${lo.toFixed(1)}%)`;
  });

  return results.sort((a, b) => b.gap - a.gap).slice(0, 3).map(r => r.sentence);
}

// ─── Arsenal solo stats (H2H default state) ───────────────────────────────────

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eeeeee", padding: "16px 18px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888888", margin: "0 0 6px 0" }}>
        {label}
      </p>
      <p style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontVariantNumeric: "tabular-nums", margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaaaaa", margin: "0 0 10px 0" }}>
      {children}
    </p>
  );
}

function ArsenalSoloView({ peer }: { peer: H2HPeer }) {
  const fmtMoney = (v: number | null) =>
    peer.currency === "GBP" ? fmtGBP(v)
    : peer.currency === "EUR" ? fmtEUR(v)
    : fmtEUR(toEUR(v, peer.currency));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <SubLabel>Financial</SubLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile label="Revenue"        value={fmtMoney(peer.revenue)} />
          <StatTile label="Wage Bill"      value={fmtMoney(peer.wage_bill)} />
          <StatTile label="Wage Ratio"     value={fmtPct(peer.wage_ratio)} />
          <StatTile label="Op. Profit"     value={fmtMoney(peer.operating_profit)} />
          <StatTile label="Pre-tax Profit" value={fmtMoney(peer.pre_tax_profit)} />
          <StatTile label="Net Debt"       value={fmtMoney(peer.net_debt)} />
        </div>
      </div>
      <div>
        <SubLabel>Squad</SubLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Squad Value" value={peer.squad_value_eur_m !== null ? `€${Math.round(peer.squad_value_eur_m)}m` : "—"} />
          <StatTile label="Squad Size"  value={peer.squad_size !== null ? `${peer.squad_size}` : "—"} />
          <StatTile label="Avg Age"     value={peer.avg_age !== null ? peer.avg_age.toFixed(1) : "—"} />
          <StatTile label="Expiry Risk" value={fmtPct(peer.expiry_0_12m_pct, 0)} />
        </div>
      </div>
      <div>
        <SubLabel>Stadium</SubLabel>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Capacity"    value={peer.capacity !== null ? peer.capacity.toLocaleString("en-GB") : "—"} />
          <StatTile label="Utilisation" value={fmtPct(peer.attendance_pct)} />
        </div>
      </div>
    </div>
  );
}

// ─── H2H Table ────────────────────────────────────────────────────────────────

function H2HTable({ main, other }: { main: H2HPeer; other: H2HPeer }) {
  const mainFX  = main.currency  !== "EUR";
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

  function rowWinner(def: RowDef, mV: number | null, oV: number | null): boolean | null {
    if (mV === null || oV === null) return null;
    if (def.isAgePeak) return Math.abs(mV - 26) < Math.abs(oV - 26);
    return def.higherBetter ? mV > oV : mV < oV;
  }

  function TableRow({ def }: { def: RowDef }) {
    const mEur = def.isRatio || def.isPlain || def.isEURDirect ? def.mainVal  : toEUR(def.mainVal,  main.currency);
    const oEur = def.isRatio || def.isPlain || def.isEURDirect ? def.otherVal : toEUR(def.otherVal, other.currency);
    const mWins = rowWinner(def, mEur, oEur);
    const mBg  = mWins === true  ? BG_WIN  : mWins === false ? BG_LOSE : undefined;
    const oBg  = mWins === false ? BG_WIN  : mWins === true  ? BG_LOSE : undefined;
    const mClr = mWins === true  ? C_WIN   : mWins === false ? C_LOSE  : "#111111";
    const oClr = mWins === false ? C_WIN   : mWins === true  ? C_LOSE  : "#111111";

    function display(val: number | null, isOther: boolean): string {
      if (val === null) return "—";
      if (def.isRatio) return fmtPct(val);
      if (def.isPlain && def.plainFmt) return def.plainFmt(val);
      if (def.isEURDirect) return fmtEUR(val);
      return fmtEUR(toEUR(val, isOther ? other.currency : main.currency));
    }

    const showMFX = !def.isRatio && !def.isPlain && !def.isEURDirect && mainFX  && def.mainVal  !== null;
    const showOFX = !def.isRatio && !def.isPlain && !def.isEURDirect && otherFX && def.otherVal !== null;

    return (
      <div style={{ display: "flex", borderBottom: "1px solid #f5f5f5" }}>
        <div style={{ width: "120px", padding: "10px 14px", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999999" }}>{def.label}</span>
        </div>
        <div style={{ flex: 1, padding: "10px 14px", borderLeft: "1px solid #f0f0f0", background: mBg }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: mClr, fontVariantNumeric: "tabular-nums" }}>{display(def.mainVal, false)}</span>
          {showMFX && <span style={{ fontSize: "10px", color: "#bbbbbb", marginLeft: "6px" }}>fx</span>}
        </div>
        <div style={{ flex: 1, padding: "10px 14px", borderLeft: "1px solid #f0f0f0", background: oBg }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: oClr, fontVariantNumeric: "tabular-nums" }}>{display(def.otherVal, true)}</span>
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
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaaaaa" }}>{label}</span>
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
    { label: "Squad Size",  mainVal: main.squad_size,        otherVal: other.squad_size,        higherBetter: true,  isPlain: true, plainFmt: v => `${Math.round(v)}` },
    { label: "Avg Age",     mainVal: main.avg_age,           otherVal: other.avg_age,           higherBetter: false, isPlain: true, isAgePeak: true, plainFmt: v => v.toFixed(1) },
    { label: "Expiry Risk", mainVal: main.expiry_0_12m_pct,  otherVal: other.expiry_0_12m_pct,  higherBetter: false, isRatio: true },
  ];
  const stadiumRows: RowDef[] = [
    { label: "Capacity",    mainVal: main.capacity,       otherVal: other.capacity,       higherBetter: true, isPlain: true, plainFmt: v => Math.round(v).toLocaleString("en-GB") },
    { label: "Utilisation", mainVal: main.attendance_pct, otherVal: other.attendance_pct, higherBetter: true, isRatio: true },
  ];

  return (
    <div style={{ border: "1px solid #e0e0e0", overflow: "hidden" }}>
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
  const [query,        setQuery]   = useState("");
  const [selectedSlug, setSlug]    = useState<string | null>(null);
  const [view,         setView]    = useState<H2HView>("table");
  const [dropOpen,     setDropOpen]= useState(false);

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

  const showDrop = dropOpen && query.trim().length > 0;

  return (
    <div>
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>

        {/* Left: identity / vs label */}
        <div>
          {otherPeer ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: HIGHLIGHT }}>{mainPeer.name}</span>
              <span style={{ color: "#cccccc", fontSize: "12px" }}>vs</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: H2H_CLR }}>{otherPeer.name}</span>
              <span style={{ fontSize: "11px", color: "#aaaaaa" }}>
                {COUNTRY_FLAGS[otherPeer.country] ?? ""} {otherPeer.divisionLabel}
              </span>
              <button
                onClick={() => { setSlug(null); setQuery(""); setView("table"); }}
                style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaaaaa", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                Clear
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#888888", margin: 0 }}>
              {mainPeer.name} · {mainPeer.divisionLabel}
            </p>
          )}
        </div>

        {/* Right: view toggle + search */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {otherPeer && (
            <div style={{ display: "flex" }}>
              {(["table", "radar"] as H2HView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "7px 16px", fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: view === v ? "#111111" : "#ffffff",
                    color:      view === v ? "#ffffff" : "#999999",
                    border: "1px solid #e0e0e0",
                    marginLeft: v === "radar" ? "-1px" : 0,
                    cursor: "pointer",
                  }}
                >
                  {v === "table" ? "Table" : "Radar"}
                </button>
              ))}
            </div>
          )}

          <div style={{ position: "relative" }}>
            {otherPeer ? (
              <button
                onClick={() => { setSlug(null); setQuery(""); setView("table"); }}
                style={{
                  padding: "8px 14px", fontSize: "13px", color: "#555555",
                  background: "white", border: "1px solid #e0e0e0", cursor: "pointer",
                }}
              >
                Change club
              </button>
            ) : (
              <>
                <input
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setDropOpen(true); }}
                  onFocus={() => setDropOpen(true)}
                  onBlur={() => setTimeout(() => setDropOpen(false), 150)}
                  placeholder="Compare with another club..."
                  autoComplete="off"
                  style={{
                    width: "240px", border: "1px solid #d0d0d0",
                    padding: "9px 14px", fontSize: "13px", color: "#111111",
                    background: "white", outline: "none", fontWeight: 500,
                  }}
                  onFocusCapture={e => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                  onBlurCapture={e => { (e.target as HTMLElement).style.borderColor = "#d0d0d0"; }}
                />
                {showDrop && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0,
                    width: "280px", border: "1px solid #e0e0e0", borderTop: "none",
                    maxHeight: "320px", overflowY: "auto",
                    background: "white", zIndex: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}>
                    {grouped.length === 0 ? (
                      <p style={{ padding: "12px 14px", fontSize: "13px", color: "#aaaaaa", margin: 0 }}>No clubs match.</p>
                    ) : grouped.map(([country, peers]) => (
                      <div key={country}>
                        <div style={{ padding: "6px 14px 4px", background: "#f9f9f9", borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbbbbb" }}>
                            {COUNTRY_FLAGS[country] ?? ""} {country}
                          </span>
                        </div>
                        {peers.map(p => (
                          <button
                            key={p.slug}
                            onMouseDown={() => { setSlug(p.slug); setQuery(""); setDropOpen(false); }}
                            style={{
                              width: "100%", textAlign: "left", padding: "9px 14px",
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
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {otherPeer ? (
        <div>
          {view === "table" && <H2HTable main={mainPeer} other={otherPeer} />}
          {view === "radar" && (
            <RadarChart
              axes={radarAxes}
              series={[
                { name: mainPeer.name,  color: HIGHLIGHT, values: radarValues(mainPeer)  },
                { name: otherPeer.name, color: H2H_CLR,   values: radarValues(otherPeer) },
              ]}
            />
          )}
          {callouts.length > 0 && (
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {callouts.map((text, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "3px", flexShrink: 0, minHeight: "20px",
                    background: i === 0 ? HIGHLIGHT : i === 1 ? H2H_CLR : "#e0e0e0",
                    borderRadius: "2px", alignSelf: "stretch",
                  }} />
                  <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#333333", margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ArsenalSoloView peer={mainPeer} />
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
  slug, divisionLabel, priorYear, divisionPeers, allH2HPeers,
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
