"use client";

import { useState, useMemo } from "react";
import RadarChart from "@/components/RadarChart";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DivisionPeer = {
  slug:                     string;
  name:                     string;
  revenue:                  number | null;
  wage_bill:                number | null;
  wage_ratio:               number | null;
  operating_profit:         number | null;
  pre_tax_profit:           number | null;
  net_debt:                 number | null;
  squad_value_eur_m:        number | null;
  squad_size:               number | null;
  avg_age:                  number | null;
  expiry_0_12m_pct:         number | null;
  capacity:                 number | null;
  attendance_pct:           number | null;
  transfer_net_5yr_eur_m:   number | null;
  transfer_spend_5yr_eur_m: number | null;
};

export type PriorYearSnap = {
  revenue:    number | null;
  wage_ratio: number | null;
  net_debt:   number | null;
};

export type H2HPeer = DivisionPeer & {
  country:       string;
  divisionLabel: string;
  currency:      "GBP" | "EUR" | "USD" | "BRL";
};

type CompareMode = "benchmark" | "h2h";
type H2HView     = "table" | "radar";
type MetricKey   =
  | "revenue" | "wage_ratio" | "net_debt" | "squad_value"
  | "squad_size" | "avg_age" | "expiry" | "attendance"
  | "transfer_net" | "transfer_spend";

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
const FX_GBP_TO_USD = 1.27;
const FX_EUR_TO_USD = 1.09;
// BRL stored in thousands; 1 BRL_thousand = 1/5.8 USD ≈ 0.1724 USD million
const FX_BRL_THOU_TO_USD = 1 / 5.8;

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", France: "🇫🇷", Germany: "🇩🇪",
  Austria: "🇦🇹", Switzerland: "🇨🇭", Denmark: "🇩🇰",
  Norway: "🇳🇴", Sweden: "🇸🇪", Japan: "🇯🇵", Brazil: "🇧🇷",
};

const COUNTRY_ORDER = [
  "England", "Spain", "Italy", "Germany", "France",
  "Austria", "Switzerland", "Denmark", "Norway", "Sweden", "Japan", "Brazil",
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

function toEUR(v: number | null, currency: "GBP" | "EUR" | "USD" | "BRL"): number | null {
  if (v === null) return null;
  if (currency === "GBP") return v * (FX_GBP_TO_USD / FX_EUR_TO_USD);
  if (currency === "USD") return v / FX_EUR_TO_USD;
  if (currency === "BRL") return v * FX_BRL_THOU_TO_USD / FX_EUR_TO_USD;
  return v;
}

function toUSD(v: number | null, currency: "GBP" | "EUR" | "USD" | "BRL"): number | null {
  if (v === null) return null;
  if (currency === "GBP") return v * FX_GBP_TO_USD;
  if (currency === "EUR") return v * FX_EUR_TO_USD;
  if (currency === "BRL") return v * FX_BRL_THOU_TO_USD;
  return v;
}

function fmtUSD(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}$${abs.toFixed(1)}m`;
}

function fmtBRL(v: number | null): string {
  if (v === null) return "—";
  // v is in BRL thousands — display as BRL millions
  const millions = v / 1000;
  const abs = Math.abs(millions);
  const str = abs >= 1000 ? `${(abs / 1000).toFixed(1)}bn` : `${abs.toFixed(0)}m`;
  return `${millions < 0 ? "-" : ""}R$${str}`;
}

function fmtNative(v: number | null, currency: "GBP" | "EUR" | "USD" | "BRL"): string {
  if (currency === "GBP") return fmtGBP(v);
  if (currency === "EUR") return fmtEUR(v);
  if (currency === "BRL") return fmtBRL(v);
  return fmtUSD(v);
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
    <div className="px-3 py-3 sm:px-5 sm:pt-4 sm:pb-3.5" style={{ background: "#f9f9f9", marginTop: "-1px", border: "1px solid #bbbbbb", borderTop: "none" }}>
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
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-bold text-[#cccccc] w-[14px] sm:w-[22px] flex-shrink-0 text-right tabular-nums text-[10px] sm:text-[11px]">
                  {rankPos}
                </span>
                <span
                  className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] sm:text-[13px]"
                  style={{ fontWeight: isHL ? 700 : 400, color: isHL ? HIGHLIGHT : "#444444" }}
                >
                  {d.name}
                </span>
                <div className="w-5 sm:w-10 flex-shrink-0">
                  <div className="h-[4px] sm:h-[5px] bg-[#e8e8e8] rounded-sm overflow-hidden">
                    <div style={{ height: "100%", width: `${barPct}%`, background: isHL ? HIGHLIGHT : "#cccccc", borderRadius: "2px" }} />
                  </div>
                </div>
                <span
                  className="tabular-nums text-right flex-shrink-0 text-[11px] sm:text-[12px] w-[44px] sm:w-[56px]"
                  style={{ fontWeight: isHL ? 700 : 400, color: isHL ? HIGHLIGHT : "#777777" }}
                >
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
      className="flex flex-col overflow-hidden cursor-pointer select-none"
      style={{ border: `1px solid ${expanded ? "#bbbbbb" : "#eeeeee"}`, background: "white" }}
    >
      {/* Body: stacked on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row flex-1">

        {/* Metric section */}
        <div className="flex-1 min-w-0 px-4 py-5 sm:px-5 sm:pt-7 sm:pb-6">
          <div className="flex items-start justify-between gap-1 mb-2.5">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#888888] m-0 leading-tight">
              {label}
            </p>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              className="flex-shrink-0 mt-0.5"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
            >
              <path d="M2 4.5L6 8L10 4.5" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-bold tabular-nums leading-none mb-2 text-[#111111]"
             style={{ fontSize: "clamp(22px, 5vw, 42px)" }}>
            {value}
          </p>
          {yoyStr !== null ? (
            <p className="text-[11px] sm:text-[12px] font-semibold m-0 leading-snug" style={{ color: yoyColor }}>
              {yoyStr} vs prior year
            </p>
          ) : (
            <p className="text-[11px] sm:text-[12px] text-[#dddddd] m-0">—</p>
          )}
          {note && (
            <p className="text-[10px] text-[#bbbbbb] m-0 mt-1">{note}</p>
          )}
        </div>

        {/* Vertical divider — sm+ only */}
        <div className="hidden sm:block w-px bg-[#eeeeee] flex-shrink-0" />
        {/* Horizontal divider — mobile only */}
        <div className="sm:hidden h-px bg-[#eeeeee]" />

        {/* Ranking section: horizontal row on mobile, vertical column on sm+ */}
        <div
          className="flex flex-row items-center justify-between gap-2 px-4 py-3
                     sm:flex-col sm:w-[120px] sm:flex-shrink-0 sm:px-[14px] sm:py-[22px]
                     sm:justify-center sm:items-center sm:gap-1"
          style={{ background: rBg }}
        >
          <p className="text-[9px] font-bold tracking-[0.14em] uppercase leading-tight m-0 sm:text-center"
             style={{ color: rColor, opacity: 0.7 }}>
            League ranking
          </p>
          {/* rank + "of N" — inline on mobile, stacked on sm+ */}
          <div className="flex items-baseline gap-1 sm:flex-col sm:items-center sm:gap-0.5">
            <p className="font-bold tabular-nums leading-none m-0 whitespace-nowrap"
               style={{ fontSize: "clamp(20px, 3.5vw, 36px)", color: rColor }}>
              {rank !== null ? ordinal(rank) : "—"}
            </p>
            <p className="text-[11px] m-0" style={{ color: rColor, opacity: 0.6 }}>
              of {total}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="h-[3px]" style={{ background: rColor, opacity: rank !== null ? 1 : 0.15 }} />
    </div>
  );
}

// ─── Division Benchmark View ──────────────────────────────────────────────────

const ROW1: MetricKey[] = ["revenue", "wage_ratio", "net_debt", "squad_value"];
const ROW2: MetricKey[] = ["squad_size", "avg_age", "expiry", "attendance"];

function DivisionBenchmarkView({
  slug, divisionLabel, divisionPeers, priorYear, currency,
}: {
  slug:          string;
  divisionLabel: string;
  divisionPeers: DivisionPeer[];
  priorYear:     PriorYearSnap | null;
  currency:      "GBP" | "EUR" | "USD" | "BRL";
}) {
  const ccySymbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "BRL" ? "R$" : "$";
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
  const svR   = divRank(divisionPeers, slug, p => p.squad_value_eur_m,        true);
  const ssR   = divRank(divisionPeers, slug, p => p.squad_size,               true);
  const ageR  = divRankAge(divisionPeers, slug);
  const exR   = divRank(divisionPeers, slug, p => p.expiry_0_12m_pct,         false);
  const utilR = divRank(divisionPeers, slug, p => p.attendance_pct,           true);
  const tnR   = divRank(divisionPeers, slug, p => p.transfer_net_5yr_eur_m,   true);
  const tsR   = divRank(divisionPeers, slug, p => p.transfer_spend_5yr_eur_m, false);

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
      revenue:     { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.revenue })),           formatFn: v => fmtNative(v, currency),                           higherBetter: true  },
      wage_ratio:  { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.wage_ratio })),        formatFn: v => fmtPct(v),                                        higherBetter: false, note: "Lower is better" },
      net_debt:    { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.net_debt })),          formatFn: v => fmtNative(v, currency),                           higherBetter: false, note: "Lower is better" },
      squad_value:     { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.squad_value_eur_m })),        formatFn: v => `€${Math.round(v).toLocaleString("en-GB")}m`,                              higherBetter: true  },
      squad_size:      { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.squad_size })),               formatFn: v => `${Math.round(v)}`,                                                        higherBetter: true  },
      expiry:          { data: divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.expiry_0_12m_pct })),         formatFn: v => fmtPct(v, 0),                                                              higherBetter: false, note: "Lower is better" },
      attendance:      { data: divisionPeers.filter(p => p.attendance_pct !== null).map(p => ({ slug: p.slug, name: p.name, value: p.attendance_pct })), formatFn: v => fmtPct(v),                                   higherBetter: true  },
      transfer_net:    { data: divisionPeers.filter(p => p.transfer_net_5yr_eur_m !== null).map(p => ({ slug: p.slug, name: p.name, value: p.transfer_net_5yr_eur_m })),   formatFn: v => `${v >= 0 ? "+" : "-"}€${Math.abs(v).toFixed(0)}m`, higherBetter: true,  note: "Higher = net seller" },
      transfer_spend:  { data: divisionPeers.filter(p => p.transfer_spend_5yr_eur_m !== null).map(p => ({ slug: p.slug, name: p.name, value: p.transfer_spend_5yr_eur_m })), formatFn: v => `€${Math.round(v)}m`,                             higherBetter: false, note: "Lower is better" },
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

  const groupLabel = (text: string) => (
    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#aaaaaa", margin: "0 0 8px 0" }}>
      {text}
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      <div>
        <SectionHeading>Division Standing · {divisionLabel}</SectionHeading>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── Financial ──────────────────────────────────────────────────── */}
          <div>
            {groupLabel("Financial")}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ alignItems: "start" }}>
              <div>
                <ScoreCard
                  label="Revenue" value={fmtNative(club.revenue, currency)}
                  yoyStr={revYoy !== null ? `${revYoy >= 0 ? "+" : ""}${revYoy.toFixed(1)}%` : null}
                  yoyColor={revYoy === null ? "#cccccc" : revYoy >= 0 ? C_WIN : C_LOSE}
                  rank={revR.rank} total={revR.total}
                  expanded={expanded === "revenue"} onToggle={() => toggle("revenue")}
                />
                {expanded === "revenue" && expandedPanel("revenue")}
              </div>
              <div>
                <ScoreCard
                  label="Wage Ratio" value={fmtPct(club.wage_ratio)}
                  yoyStr={wrYoy !== null ? `${wrYoy >= 0 ? "+" : ""}${wrYoy.toFixed(1)}pp` : null}
                  yoyColor={wrYoy === null ? "#cccccc" : wrYoy <= 0 ? C_WIN : C_LOSE}
                  rank={wrR.rank} total={wrR.total} note="Lower is better"
                  expanded={expanded === "wage_ratio"} onToggle={() => toggle("wage_ratio")}
                />
                {expanded === "wage_ratio" && expandedPanel("wage_ratio")}
              </div>
              <div>
                <ScoreCard
                  label="Net Debt" value={fmtNative(club.net_debt, currency)}
                  yoyStr={ndYoy !== null ? `${ndYoy >= 0 ? "+" : ""}${ccySymbol}${Math.abs(ndYoy).toFixed(1)}m` : null}
                  yoyColor={ndYoy === null ? "#cccccc" : ndYoy <= 0 ? C_WIN : C_LOSE}
                  rank={ndR.rank} total={ndR.total} note="Lower is better"
                  expanded={expanded === "net_debt"} onToggle={() => toggle("net_debt")}
                />
                {expanded === "net_debt" && expandedPanel("net_debt")}
              </div>
              <div>
                <ScoreCard
                  label="Est. Squad Value" value={svFmt}
                  yoyStr={null} yoyColor="#cccccc"
                  rank={svR.rank} total={svR.total}
                  expanded={expanded === "squad_value"} onToggle={() => toggle("squad_value")}
                />
                {expanded === "squad_value" && expandedPanel("squad_value")}
              </div>
            </div>
          </div>

          {/* ── Squad & Contracts ───────────────────────────────────────────── */}
          <div>
            {groupLabel("Squad & Contracts")}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ alignItems: "start" }}>
              <div>
                <ScoreCard
                  label="Squad Size"
                  value={club.squad_size !== null ? `${club.squad_size}` : "—"}
                  yoyStr={null} yoyColor="#cccccc"
                  rank={ssR.rank} total={ssR.total}
                  expanded={expanded === "squad_size"} onToggle={() => toggle("squad_size")}
                />
                {expanded === "squad_size" && expandedPanel("squad_size")}
              </div>
              <div>
                <ScoreCard
                  label="Average Age"
                  value={club.avg_age !== null ? club.avg_age.toFixed(1) : "—"}
                  yoyStr={null} yoyColor="#cccccc"
                  rank={ageR.rank} total={ageR.total}
                  expanded={expanded === "avg_age"} onToggle={() => toggle("avg_age")}
                />
                {expanded === "avg_age" && expandedPanel("avg_age")}
              </div>
              <div>
                <ScoreCard
                  label="Expiry Risk" value={fmtPct(club.expiry_0_12m_pct, 0)}
                  yoyStr={null} yoyColor="#cccccc"
                  rank={exR.rank} total={exR.total} note="Lower is better"
                  expanded={expanded === "expiry"} onToggle={() => toggle("expiry")}
                />
                {expanded === "expiry" && expandedPanel("expiry")}
              </div>
              <div>
                <ScoreCard
                  label="Stadium Utilisation" value={fmtPct(club.attendance_pct)}
                  yoyStr={null} yoyColor="#cccccc"
                  rank={utilR.rank} total={utilR.total}
                  expanded={expanded === "attendance"} onToggle={() => toggle("attendance")}
                />
                {expanded === "attendance" && expandedPanel("attendance")}
              </div>
            </div>
          </div>

          {/* ── Transfer Activity ───────────────────────────────────────────── */}
          <div>
            {groupLabel("Transfer Activity · 5-Season Totals (€)")}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ alignItems: "start" }}>
              <div>
                <ScoreCard
                  label="Net Position" value={
                    club.transfer_net_5yr_eur_m !== null
                      ? `${club.transfer_net_5yr_eur_m >= 0 ? "+" : ""}${fmtEUR(club.transfer_net_5yr_eur_m)}`
                      : "—"
                  }
                  yoyStr={null} yoyColor="#cccccc"
                  rank={tnR.rank} total={tnR.total} note="Higher = net seller"
                  expanded={expanded === "transfer_net"} onToggle={() => toggle("transfer_net")}
                />
                {expanded === "transfer_net" && expandedPanel("transfer_net")}
              </div>
              <div>
                <ScoreCard
                  label="Gross Spend" value={
                    club.transfer_spend_5yr_eur_m !== null
                      ? `€${Math.round(club.transfer_spend_5yr_eur_m)}m`
                      : "—"
                  }
                  yoyStr={null} yoyColor="#cccccc"
                  rank={tsR.rank} total={tsR.total} note="Lower is better"
                  expanded={expanded === "transfer_spend"} onToggle={() => toggle("transfer_spend")}
                />
                {expanded === "transfer_spend" && expandedPanel("transfer_spend")}
              </div>
            </div>
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

// ─── H2H Two-Column View (changes 3, 4, 5) ───────────────────────────────────

function H2HTwoCol({
  main, other, query, onQueryChange, onSelect, onClear,
}: {
  main:          H2HPeer;
  other:         H2HPeer | null;
  query:         string;
  onQueryChange: (q: string) => void;
  onSelect:      (slug: string) => void;
  onClear:       () => void;
}) {
  const [dropOpen, setDropOpen] = useState(false);

  const sameCurrency = !other || main.currency === other.currency;
  // Always fall back to USD for cross-currency H2H (including BRL)
  const targetCcy: "GBP" | "EUR" | "USD" | "BRL" = sameCurrency ? main.currency : "USD";
  const ccySymbol = targetCcy === "GBP" ? "£" : targetCcy === "EUR" ? "€" : targetCcy === "BRL" ? "R$" : "$";

  function displayMoney(v: number | null, fromCcy: "GBP" | "EUR" | "USD" | "BRL"): { str: string; converted: boolean } {
    if (v === null) return { str: "—", converted: false };
    if (targetCcy === "USD" && fromCcy !== "USD") {
      const usd = toUSD(v, fromCcy);
      return { str: fmtUSD(usd), converted: true };
    }
    return { str: fmtNative(v, fromCcy), converted: false };
  }

  function displaySquadValue(v: number | null): { str: string; converted: boolean } {
    if (v === null) return { str: "—", converted: false };
    if (targetCcy === "USD") {
      const usd = v * FX_EUR_TO_USD;
      return { str: `$${usd.toFixed(1)}m`, converted: true };
    }
    if (targetCcy === "EUR") return { str: `€${Math.round(v)}m`, converted: false };
    if (targetCcy === "BRL") {
      const usd = v * FX_EUR_TO_USD;
      return { str: `$${usd.toFixed(1)}m`, converted: true };
    }
    // GBP: convert from EUR
    const gbp = v / (FX_GBP_TO_USD / FX_EUR_TO_USD);
    return { str: `£${gbp.toFixed(1)}m`, converted: true };
  }

  function wins(mV: number | null, oV: number | null, higherBetter: boolean, agePeak = false): boolean | null {
    if (mV === null || oV === null || other === null) return null;
    if (agePeak) return Math.abs(mV - 26) < Math.abs(oV - 26);
    return higherBetter ? mV > oV : mV < oV;
  }

  // Normalise money to target currency for comparison
  function normMoney(v: number | null, fromCcy: "GBP" | "EUR" | "USD" | "BRL"): number | null {
    if (v === null) return null;
    if (targetCcy === "USD") return toUSD(v, fromCcy);
    if (targetCcy === "EUR") return toEUR(v, fromCcy);
    if (targetCcy === "BRL") return fromCcy === "BRL" ? v : toUSD(v, fromCcy);
    // GBP target
    if (fromCcy === "GBP") return v;
    if (fromCcy === "EUR") return v / (FX_GBP_TO_USD / FX_EUR_TO_USD);
    return v / FX_GBP_TO_USD;
  }

  const VAL = "clamp(20px, 2.8vw, 28px)";
  const LBL = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#aaaaaa", margin: "0 0 4px 0" };
  const BANNER = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#aaaaaa" };

  function MetricRow({
    label, mainVal, otherVal, higherBetter, fmt, isAgePeak,
  }: {
    label:        string;
    mainVal:      number | null;
    otherVal:     number | null;
    higherBetter: boolean;
    fmt:          (v: number | null, side: "main" | "other") => { str: string; converted: boolean };
    isAgePeak?:   boolean;
  }) {
    const mWins = wins(mainVal, otherVal, higherBetter, isAgePeak);
    const mBg  = mWins === true  ? BG_WIN  : mWins === false ? BG_LOSE : undefined;
    const oBg  = mWins === false ? BG_WIN  : mWins === true  ? BG_LOSE : undefined;
    const mClr = mWins === true  ? C_WIN   : mWins === false ? C_LOSE  : "#111111";
    const oClr = mWins === false ? C_WIN   : mWins === true  ? C_LOSE  : "#111111";

    const mFmt = fmt(mainVal,  "main");
    const oFmt = fmt(otherVal, "other");

    return (
      <>
        {/* Main cell */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f5f5f5", background: mBg }}>
          <p style={LBL}>{label}</p>
          <p style={{ fontSize: VAL, fontWeight: 700, color: mClr, fontVariantNumeric: "tabular-nums", margin: 0, lineHeight: 1.1 }}>
            {mFmt.str}
            {mFmt.converted && <span style={{ fontSize: "10px", color: "#bbbbbb", marginLeft: "5px" }}>fx</span>}
          </p>
        </div>
        {/* Other cell */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f5f5f5", borderLeft: "1px solid #f0f0f0", background: oBg }}>
          {other ? (
            <>
              <p style={LBL}>{label}</p>
              <p style={{ fontSize: VAL, fontWeight: 700, color: oClr, fontVariantNumeric: "tabular-nums", margin: 0, lineHeight: 1.1 }}>
                {oFmt.str}
                {oFmt.converted && <span style={{ fontSize: "10px", color: "#bbbbbb", marginLeft: "5px" }}>fx</span>}
              </p>
            </>
          ) : (
            <p style={{ fontSize: VAL, fontWeight: 300, color: "#e0e0e0", margin: 0, lineHeight: 1.1 }}>—</p>
          )}
        </div>
      </>
    );
  }

  // Search dropdown state
  const searchPool = useMemo(() => [] as H2HPeer[], []); // populated via prop
  const showDrop = dropOpen && query.trim().length > 0;
  void searchPool; // declared for clarity; actual filtering happens in HeadToHeadView

  // Section banner helper
  function SectionBanner({ label }: { label: string }) {
    return (
      <>
        <div style={{ padding: "8px 20px", background: "#f9f9f9", borderBottom: "1px solid #eeeeee" }}>
          <span style={BANNER}>{label}</span>
        </div>
        <div style={{ padding: "8px 20px", background: "#f9f9f9", borderBottom: "1px solid #eeeeee", borderLeft: "1px solid #eeeeee" }}>
          <span style={BANNER}>&nbsp;</span>
        </div>
      </>
    );
  }

  const moneyFmt = (fromCcy: "GBP" | "EUR" | "USD" | "BRL") =>
    (v: number | null) => displayMoney(v, fromCcy);

  const mainMoneyFmt = (v: number | null, _side: "main" | "other") => displayMoney(v, main.currency);
  const otherMoneyFmt = (v: number | null, _side: "main" | "other") =>
    _side === "main" ? displayMoney(v, main.currency) : displayMoney(v, other?.currency ?? main.currency);

  void moneyFmt;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #e0e0e0", overflow: "hidden" }}>

        {/* ── Column headers ── */}
        <div style={{ padding: "16px 20px", borderBottom: "2px solid #e0e0e0", background: "white" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: HIGHLIGHT, margin: "0 0 2px 0" }}>{main.name}</p>
          <p style={{ fontSize: "11px", color: "#aaaaaa", margin: 0 }}>{main.divisionLabel}</p>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "2px solid #e0e0e0", borderLeft: "1px solid #e0e0e0", background: "white" }}>
          {other ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: H2H_CLR, margin: "0 0 2px 0" }}>{other.name}</p>
                  <p style={{ fontSize: "11px", color: "#aaaaaa", margin: 0 }}>
                    {COUNTRY_FLAGS[other.country] ?? ""} {other.divisionLabel}
                  </p>
                </div>
                <button
                  onClick={onClear}
                  style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaaaaa", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", flexShrink: 0, marginTop: "2px" }}
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={query}
                onChange={e => { onQueryChange(e.target.value); setDropOpen(true); }}
                onFocus={() => setDropOpen(true)}
                onBlur={() => setTimeout(() => setDropOpen(false), 150)}
                placeholder="Search a club..."
                autoComplete="off"
                style={{
                  width: "100%", border: "1px solid #d0d0d0",
                  padding: "9px 14px", fontSize: "13px", color: "#111111",
                  background: "white", outline: "none", fontWeight: 500,
                  boxSizing: "border-box",
                }}
              />
              {showDrop && (
                <div style={{
                  position: "absolute", top: "100%", left: 0,
                  width: "280px", border: "1px solid #e0e0e0", borderTop: "none",
                  maxHeight: "300px", overflowY: "auto",
                  background: "white", zIndex: 20,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}>
                  <p style={{ padding: "12px 14px", fontSize: "12px", color: "#aaaaaa", margin: 0 }}>
                    Type to search clubs…
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Financial ── */}
        <SectionBanner label="Financial" />

        <MetricRow
          label="Revenue" higherBetter={true}
          mainVal={main.revenue} otherVal={other?.revenue ?? null}
          fmt={(v, side) => displayMoney(v, side === "main" ? main.currency : (other?.currency ?? main.currency))}
        />
        <MetricRow
          label="Wage Bill" higherBetter={false}
          mainVal={main.wage_bill} otherVal={other?.wage_bill ?? null}
          fmt={(v, side) => displayMoney(v, side === "main" ? main.currency : (other?.currency ?? main.currency))}
        />
        <MetricRow
          label="Wage Ratio" higherBetter={false}
          mainVal={main.wage_ratio} otherVal={other?.wage_ratio ?? null}
          fmt={(v) => ({ str: fmtPct(v), converted: false })}
        />
        <MetricRow
          label="Op. Profit" higherBetter={true}
          mainVal={normMoney(main.operating_profit, main.currency)}
          otherVal={normMoney(other?.operating_profit ?? null, other?.currency ?? main.currency)}
          fmt={(v, side) => displayMoney(
            side === "main" ? main.operating_profit : (other?.operating_profit ?? null),
            side === "main" ? main.currency : (other?.currency ?? main.currency),
          )}
        />
        <MetricRow
          label="Pre-tax Profit" higherBetter={true}
          mainVal={normMoney(main.pre_tax_profit, main.currency)}
          otherVal={normMoney(other?.pre_tax_profit ?? null, other?.currency ?? main.currency)}
          fmt={(v, side) => displayMoney(
            side === "main" ? main.pre_tax_profit : (other?.pre_tax_profit ?? null),
            side === "main" ? main.currency : (other?.currency ?? main.currency),
          )}
        />
        <MetricRow
          label="Net Debt" higherBetter={false}
          mainVal={normMoney(main.net_debt, main.currency)}
          otherVal={normMoney(other?.net_debt ?? null, other?.currency ?? main.currency)}
          fmt={(v, side) => displayMoney(
            side === "main" ? main.net_debt : (other?.net_debt ?? null),
            side === "main" ? main.currency : (other?.currency ?? main.currency),
          )}
        />

        {/* ── Squad ── */}
        <SectionBanner label="Squad" />

        <MetricRow
          label={`Est. Squad Value (${ccySymbol})`} higherBetter={true}
          mainVal={main.squad_value_eur_m} otherVal={other?.squad_value_eur_m ?? null}
          fmt={(v) => displaySquadValue(v)}
        />
        <MetricRow
          label="Squad Size" higherBetter={true}
          mainVal={main.squad_size} otherVal={other?.squad_size ?? null}
          fmt={(v) => ({ str: v !== null ? `${Math.round(v)}` : "—", converted: false })}
        />
        <MetricRow
          label="Avg Age" higherBetter={false} isAgePeak={true}
          mainVal={main.avg_age} otherVal={other?.avg_age ?? null}
          fmt={(v) => ({ str: v !== null ? v.toFixed(1) : "—", converted: false })}
        />
        <MetricRow
          label="Expiry Risk" higherBetter={false}
          mainVal={main.expiry_0_12m_pct} otherVal={other?.expiry_0_12m_pct ?? null}
          fmt={(v) => ({ str: fmtPct(v, 0), converted: false })}
        />

        {/* ── Transfers ── */}
        <SectionBanner label="Transfers (5yr, €)" />

        <MetricRow
          label="Net Position" higherBetter={true}
          mainVal={main.transfer_net_5yr_eur_m} otherVal={other?.transfer_net_5yr_eur_m ?? null}
          fmt={(v) => ({ str: v !== null ? `${v >= 0 ? "+" : "-"}€${Math.abs(v).toFixed(0)}m` : "—", converted: false })}
        />
        <MetricRow
          label="Gross Spend" higherBetter={false}
          mainVal={main.transfer_spend_5yr_eur_m} otherVal={other?.transfer_spend_5yr_eur_m ?? null}
          fmt={(v) => ({ str: v !== null ? `€${Math.round(v)}m` : "—", converted: false })}
        />

        {/* ── Stadium ── */}
        <SectionBanner label="Stadium" />

        <MetricRow
          label="Capacity" higherBetter={true}
          mainVal={main.capacity} otherVal={other?.capacity ?? null}
          fmt={(v) => ({ str: v !== null ? Math.round(v).toLocaleString("en-GB") : "—", converted: false })}
        />
        <MetricRow
          label="Utilisation" higherBetter={true}
          mainVal={main.attendance_pct} otherVal={other?.attendance_pct ?? null}
          fmt={(v) => ({ str: fmtPct(v), converted: false })}
        />

      </div>

      {/* ── Footer ── */}
      <p style={{ fontSize: "10px", color: "#cccccc", margin: "8px 0 0 0" }}>
        {sameCurrency
          ? `Values shown in native currency (${ccySymbol}) · green = better for that metric`
          : `Values shown in ${targetCcy} · GBP ×${FX_GBP_TO_USD} · EUR ×${FX_EUR_TO_USD} · green = better for that metric`
        }
      </p>
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

  function handleSelect(slug: string) {
    setSlug(slug);
    setQuery("");
    setDropOpen(false);
    setView("table");
  }

  function handleClear() {
    setSlug(null);
    setQuery("");
    setView("table");
  }

  return (
    <div>
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>

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
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#888888", margin: 0 }}>
              {mainPeer.name} · {mainPeer.divisionLabel}
            </p>
          )}
        </div>

        {/* Right: view toggles (when club selected) + search/change */}
        {otherPeer && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
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
            <div style={{ position: "relative" }}>
              <button
                onClick={handleClear}
                style={{
                  padding: "8px 14px", fontSize: "13px", color: "#555555",
                  background: "white", border: "1px solid #e0e0e0", cursor: "pointer",
                }}
              >
                Change club
              </button>
              <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 20 }}>
                {/* Dropdown handled by H2HTwoCol header cell when no club selected */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Radar view (when club selected) ─────────────────────────────── */}
      {otherPeer && view === "radar" ? (
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
        /* ── Table view — always two columns ──────────────────────────── */
        <div>
          {/* Global search dropdown (no club selected) */}
          {!otherPeer && (
            <div style={{ position: "relative", marginBottom: "0px" }}>
              {showDrop && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  width: "280px", border: "1px solid #e0e0e0",
                  maxHeight: "320px", overflowY: "auto",
                  background: "white", zIndex: 20,
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
                          onMouseDown={() => handleSelect(p.slug)}
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
            </div>
          )}

          <H2HTwoCol
            main={mainPeer}
            other={otherPeer}
            query={query}
            onQueryChange={q => { setQuery(q); setDropOpen(true); }}
            onSelect={handleSelect}
            onClear={handleClear}
          />

          {otherPeer && callouts.length > 0 && (
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
  slug, divisionLabel, priorYear, divisionPeers, allH2HPeers, currency,
}: {
  slug:          string;
  divisionLabel: string;
  priorYear:     PriorYearSnap | null;
  divisionPeers: DivisionPeer[];
  allH2HPeers:   H2HPeer[];
  currency:      "GBP" | "EUR" | "USD" | "BRL";
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
          currency={currency}
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
