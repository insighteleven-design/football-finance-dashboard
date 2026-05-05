"use client";

import { useState } from "react";
import type { JapanClub } from "@/lib/japanClubs";
import { fmtJpy, J_DIVISION_LABELS } from "@/lib/japanClubs";

// ─── Signal colours + tints ───────────────────────────────────────────────────
const GREEN = "#2e7d52";
const RED   = "#9a3030";
const AMBER = "#c47900";

const SIGNAL_BG: Record<string, string> = {
  [GREEN]: "#f2fbf5",
  [RED]:   "#fdf3f3",
  [AMBER]: "#fdfaf0",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Snap = {
  revenue: number | null;
  wage_bill: number | null;
  wage_ratio: number | null;
  operating_profit: number | null;
  profit_from_player_sales: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
};

type YearSnap = { label: string; snap: Snap };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fyLabel(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function snapFromClub(c: JapanClub): Snap {
  return {
    revenue: c.revenue, wage_bill: c.wage_bill, wage_ratio: c.wage_ratio,
    operating_profit: c.operating_profit, profit_from_player_sales: c.profit_from_player_sales,
    pre_tax_profit: c.pre_tax_profit, net_debt: c.net_debt,
  };
}

function snapFromPrior(py: NonNullable<JapanClub["prior_year"]>): Snap {
  return {
    revenue: py.revenue, wage_bill: py.wage_bill, wage_ratio: py.wage_ratio,
    operating_profit: py.operating_profit, profit_from_player_sales: py.profit_from_player_sales,
    pre_tax_profit: py.pre_tax_profit, net_debt: py.net_debt,
  };
}

// ─── Signal helpers ───────────────────────────────────────────────────────────

function wageSignal(ratio: number | null): string {
  if (ratio === null) return "#cccccc";
  return ratio < 55 ? GREEN : ratio < 70 ? AMBER : RED;
}
function profitSignal(v: number | null): string {
  if (v === null) return "#cccccc";
  return v >= 0 ? GREEN : RED;
}
function debtDotSignal(v: number | null): string {
  if (v === null) return "#cccccc";
  return v <= 0 ? GREEN : RED;
}
function debtCardSignal(current: number | null, prior: number | null): string {
  if (current === null) return "#cccccc";
  if (current <= 0) return GREEN;
  if (prior !== null && prior > 0) {
    const growth = (current - prior) / Math.abs(prior);
    if (growth <= 0) return GREEN;
    if (growth <= 0.15) return AMBER;
  }
  return RED;
}

// ─── Subtext helpers ─────────────────────────────────────────────────────────

function wageSubtext(current: number | null, prior: number | null): string {
  if (current === null) return "";
  const dir = prior === null ? "" : current < prior ? "Improving" : current > prior ? "Worsening" : "Stable";
  const pos = current < 55 ? "well below 55% threshold" : current < 70 ? "above 55% threshold" : "exceeds 70%";
  return dir ? `${dir} · ${pos}` : pos;
}
function profitSubtext(current: number | null, prior: number | null): string {
  if (current === null) return "";
  if (current >= 0) return prior !== null && current > prior ? "Operating profit growing" : "Operating profit";
  if (prior !== null && prior < 0) return current < prior ? "Operating loss widening" : "Operating loss narrowing";
  return prior !== null && prior >= 0 ? "Moved to operating loss" : "Operating loss";
}
function debtSubtext(current: number | null, prior: number | null): string {
  if (current === null) return "";
  if (current <= 0) return "Net cash position";
  if (prior === null || prior <= 0) return `Net debt: $${Math.abs(current).toFixed(1)}m`;
  const diff = current - prior;
  return `Growing · ${diff > 0 ? "up" : "down"} $${Math.abs(diff).toFixed(1)}m YoY`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values, higherBetter }: { values: (number | null)[]; higherBetter: boolean | null }) {
  const nonNull = values
    .map((v, i): { v: number; i: number } | null => v !== null ? { v, i } : null)
    .filter((x): x is { v: number; i: number } => x !== null);

  if (nonNull.length < 2) return <div style={{ height: "26px" }} />;

  const first = nonNull[0].v;
  const last  = nonNull[nonNull.length - 1].v;
  const trendUp   = last > first;
  const trendDown = last < first;

  let stroke = "#cccccc";
  if (trendUp || trendDown) {
    if (higherBetter === true)  stroke = trendUp  ? GREEN : RED;
    if (higherBetter === false) stroke = trendDown ? GREEN : RED;
    if (higherBetter === null)  stroke = trendUp  ? GREEN : "#cccccc";
  }

  const vals = nonNull.map(x => x.v);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV;

  const W = 100, H = 24, PAD = 3;
  const n = nonNull.length;
  const xOf = (pos: number) => (pos / (n - 1)) * W;
  const yOf = (v: number) => range === 0 ? H / 2 : PAD + ((maxV - v) / range) * (H - PAD * 2);

  const points = nonNull.map((x, pos) => `${xOf(pos).toFixed(1)},${yOf(x.v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "26px", display: "block" }}>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "#111111", margin: "0 0 16px 0", paddingBottom: "10px", borderBottom: "2px solid #111111",
    }}>
      {children}
    </p>
  );
}

// ─── Tier 1: KFI card ─────────────────────────────────────────────────────────
function HealthCard({ label, value, subtext, signal, dots }: {
  label: string; value: string; subtext: string; signal: string; dots: string[];
}) {
  const bg = SIGNAL_BG[signal] ?? "white";
  return (
    <div style={{
      borderTop: "1px solid #eeeeee", borderRight: "1px solid #eeeeee",
      borderBottom: "1px solid #eeeeee", borderLeft: `4px solid ${signal}`,
      padding: "28px 24px 22px", background: bg,
    }}>
      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: signal, margin: "0 0 12px 0", opacity: 0.85 }}>
        {label}
      </p>
      <p style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 700, color: signal, fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: "0 0 10px 0" }}>
        {value}
      </p>
      <p style={{ fontSize: "14px", color: signal, margin: "0 0 18px 0", lineHeight: 1.45, opacity: 0.8 }}>
        {subtext}
      </p>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {dots.map((dotColor, i) => (
          <span key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Tier 2: Metric tile ──────────────────────────────────────────────────────
function MetricTile({ label, value, current, prior, higherBetter, sparkValues }: {
  label: string; value: string;
  current: number | null; prior: number | null;
  higherBetter: boolean | null;
  sparkValues: (number | null)[];
}) {
  const pct = current !== null && prior !== null && prior !== 0
    ? ((current - prior) / Math.abs(prior)) * 100
    : null;

  let deltaColor = "#888888";
  if (pct !== null) {
    if (higherBetter !== null) {
      deltaColor = (higherBetter ? current! > prior! : current! < prior!) ? GREEN : RED;
    } else {
      deltaColor = pct >= 0 ? GREEN : RED;
    }
  }

  return (
    <div style={{ border: "1px solid #eeeeee", padding: "18px 18px 14px", background: "white", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888888", margin: "0 0 8px 0" }}>
        {label}
      </p>
      <p style={{ fontSize: "22px", fontWeight: 700, color: "#111111", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, margin: "0 0 4px 0" }}>
        {value}
      </p>
      {pct !== null ? (
        <p style={{ fontSize: "12px", fontWeight: 600, color: deltaColor, margin: "0 0 10px 0" }}>
          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}% YoY
        </p>
      ) : (
        <div style={{ marginBottom: "10px" }} />
      )}
      <Sparkline values={sparkValues} higherBetter={higherBetter} />
    </div>
  );
}

// ─── Metrics config ───────────────────────────────────────────────────────────

const METRICS: {
  key: keyof Snap;
  label: string;
  shortLabel: string;
  isRatio?: boolean;
  higherBetter: boolean | null;
}[] = [
  { key: "revenue",                  label: "Revenue",                    shortLabel: "Revenue",       higherBetter: true },
  { key: "wage_bill",                label: "Wage Bill",                  shortLabel: "Wages",         higherBetter: false },
  { key: "wage_ratio",               label: "Wage Ratio",                 shortLabel: "Wage %",        isRatio: true, higherBetter: false },
  { key: "operating_profit",         label: "Operating Profit / (Loss)",  shortLabel: "Op. Profit",    higherBetter: true },
  { key: "profit_from_player_sales", label: "Net Transfer Cash Flow",     shortLabel: "Transfers",     higherBetter: null },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",    shortLabel: "Pre-tax",       higherBetter: true },
  { key: "net_debt",                 label: "Net Debt (proxy)",           shortLabel: "Net Debt",      higherBetter: false },
];

// ─── Change badge ─────────────────────────────────────────────────────────────

function ChgBadge({
  current, prior, higherBetter, isRatio,
}: {
  current: number | null; prior: number | null;
  higherBetter: boolean | null; isRatio?: boolean;
}) {
  if (current === null || prior === null)
    return <span style={{ color: "#cccccc", fontSize: "13px" }}>—</span>;
  const improved =
    higherBetter === null || current === prior
      ? null
      : higherBetter ? current > prior : current < prior;
  let label: string;
  if (isRatio) {
    const diff = current - prior;
    label = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp`;
  } else {
    if (prior === 0) return <span style={{ color: "#cccccc", fontSize: "13px" }}>—</span>;
    const pct = ((current - prior) / Math.abs(prior)) * 100;
    label = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  }
  const color = improved === true ? "#2e7d52" : improved === false ? "#9a3030" : "#888888";
  const bg    = improved === true ? "#edf7f1" : improved === false ? "#fdf1f1" : "#f5f5f5";
  return (
    <span style={{ color, background: bg, fontSize: "13px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", display: "inline-block" }}>
      {label}
    </span>
  );
}

// ─── SVG trend chart ──────────────────────────────────────────────────────────

const ML = 56, MR = 16, MT = 28, MB = 36, VW = 560, VH = 200;
const PW = VW - ML - MR, PH = VH - MT - MB;

function niceStep(range: number): number {
  if (range === 0) return 1;
  const raw = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
}

function buildTicks(min: number, max: number): number[] {
  const step = niceStep(max - min);
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.01; v = Math.round((v + step) * 1e9) / 1e9) ticks.push(v);
  if (ticks.length > 6) {
    const every = Math.ceil(ticks.length / 5);
    return ticks.filter((_, i) => i % every === 0);
  }
  return ticks;
}

function polySegments(
  years: YearSnap[],
  key: keyof Snap,
  xPos: (i: number) => number,
  yPos: (v: number) => number,
): string[][] {
  const segs: string[][] = [];
  let seg: string[] = [];
  years.forEach((yr, i) => {
    const v = yr.snap[key] as number | null;
    if (v !== null && v !== undefined && isFinite(v)) {
      seg.push(`${xPos(i).toFixed(2)},${yPos(v).toFixed(2)}`);
    } else {
      if (seg.length) { segs.push(seg); seg = []; }
    }
  });
  if (seg.length) segs.push(seg);
  return segs;
}

function JapanTrendChart({
  years, leagueYears, metricKey, isRatio,
}: {
  years: YearSnap[];
  leagueYears: YearSnap[];
  metricKey: keyof Snap;
  isRatio?: boolean;
}) {
  const n = years.length;
  const allVals: number[] = [...years, ...leagueYears]
    .map((y) => y.snap[metricKey] as number | null)
    .filter((v): v is number => v !== null && isFinite(v));

  if (allVals.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${VH}px` }}>
        <p style={{ fontSize: "17px", color: "#cccccc", fontStyle: "italic" }}>No data available</p>
      </div>
    );
  }

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span = rawMax - rawMin || Math.abs(rawMax) || 10;
  const dataMin = rawMin - span * 0.28;
  const dataMax = rawMax + span * 0.28;
  const ticks = buildTicks(dataMin, dataMax);
  const yMin = Math.min(dataMin, ticks[0]);
  const yMax = Math.max(dataMax, ticks[ticks.length - 1]);

  const xPos = (i: number) => ML + (n <= 1 ? PW / 2 : (i / (n - 1)) * PW);
  const yPos = (v: number) => MT + PH - ((v - yMin) / (yMax - yMin)) * PH;

  const showZero = yMin < 0 && yMax > 0;
  const zeroY = showZero ? yPos(0) : null;

  const clubSegs = polySegments(years, metricKey, xPos, yPos);
  const avgSegs  = polySegments(leagueYears, metricKey, xPos, yPos);

  const fillBase = zeroY ?? yPos(yMin);
  const areaPaths = clubSegs
    .filter((s) => s.length >= 2)
    .map((s) => {
      const pts = s.map((pt) => pt.split(","));
      return (
        `M ${pts[0][0]},${pts[0][1]}` +
        pts.slice(1).map(([x, y]) => ` L ${x},${y}`).join("") +
        ` L ${pts[pts.length - 1][0]},${fillBase.toFixed(2)}` +
        ` L ${pts[0][0]},${fillBase.toFixed(2)} Z`
      );
    });

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }} aria-label="Trend chart">
      {ticks.map((tick) => {
        const y = yPos(tick);
        if (y < MT - 1 || y > MT + PH + 1) return null;
        return (
          <g key={tick}>
            <line x1={ML} y1={y} x2={ML + PW} y2={y} stroke="#f0f0f0" strokeWidth={0.5} />
            <text x={ML - 7} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#cccccc" style={{ fontVariantNumeric: "tabular-nums" }}>
              {isRatio ? `${tick}%` : `$${tick}m`}
            </text>
          </g>
        );
      })}
      {zeroY !== null && (
        <line x1={ML} y1={zeroY} x2={ML + PW} y2={zeroY} stroke="#d8d8d8" strokeWidth={0.75} strokeDasharray="3 3" />
      )}
      {areaPaths.map((d, i) => <path key={i} d={d} fill="rgba(17,17,17,0.04)" />)}
      {avgSegs.map((s, i) => (
        <polyline key={i} points={s.join(" ")} fill="none" stroke="#cccccc" strokeWidth={0.75} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {clubSegs.map((s, i) => (
        <polyline key={i} points={s.join(" ")} fill="none" stroke="#111111" strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {years.map((yr, i) => {
        const v = yr.snap[metricKey] as number | null;
        if (v === null || v === undefined || !isFinite(v)) return null;
        const cx = xPos(i);
        const cy = yPos(v);
        const isFirst = i === 0, isLast = i === n - 1;
        const anchor = isFirst ? "start" : isLast ? "end" : "middle";
        const lx = isFirst ? cx + 1 : isLast ? cx - 1 : cx;
        const above = cy > MT + 18;
        const ly = above ? cy - 9 : cy + 17;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={2.5} fill="white" stroke="#111111" strokeWidth={1} />
            <text x={lx} y={ly} textAnchor={anchor} fontSize={11} fontWeight={400} fill="#555555" style={{ fontVariantNumeric: "tabular-nums" }}>
              {isRatio ? `${v.toFixed(1)}%` : `$${v.toFixed(1)}m`}
            </text>
          </g>
        );
      })}
      {years.map((yr, i) => (
        <text key={i} x={xPos(i)} y={MT + PH + 16} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill="#bbbbbb">
          {yr.label}
        </text>
      ))}
      <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke="#ebebeb" strokeWidth={0.5} />
      <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke="#ebebeb" strokeWidth={0.5} />
    </svg>
  );
}

// ─── League average snaps ─────────────────────────────────────────────────────

function buildLeagueAvgSnaps(clubSnaps: YearSnap[], leagueClubs: JapanClub[]): YearSnap[] {
  const hasPrior = clubSnaps.length > 1;
  return clubSnaps.map((ys, i) => {
    const isPriorSlot = hasPrior && i === 0;
    const snapList: Snap[] = isPriorSlot
      ? leagueClubs.filter((c) => c.prior_year !== null).map((c) => snapFromPrior(c.prior_year!))
      : leagueClubs.map(snapFromClub);

    const avg = (key: keyof Snap): number | null => {
      const vals = snapList.map((s) => s[key]).filter((v): v is number => v !== null && isFinite(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    return {
      label: ys.label,
      snap: {
        revenue: avg("revenue"), wage_bill: avg("wage_bill"), wage_ratio: avg("wage_ratio"),
        operating_profit: avg("operating_profit"), profit_from_player_sales: avg("profit_from_player_sales"),
        pre_tax_profit: avg("pre_tax_profit"), net_debt: avg("net_debt"),
      },
    };
  });
}

// ─── Year-on-year section ─────────────────────────────────────────────────────

function JapanYoYSection({
  club, leagueClubs, view = "all",
}: {
  club: JapanClub;
  leagueClubs: JapanClub[];
  view?: "all" | "table" | "chart";
}) {
  const py = club.prior_year;
  if (!py) return <p className="text-sm text-[#aaaaaa] italic">No prior year data available.</p>;

  const clubSnaps: YearSnap[] = [
    { label: fyLabel(py.fiscal_year_end), snap: snapFromPrior(py) },
    { label: fyLabel(club.fiscal_year_end), snap: snapFromClub(club) },
  ];

  const leagueAvgSnaps = buildLeagueAvgSnaps(clubSnaps, leagueClubs);

  const visibleMetrics = METRICS.filter((m) =>
    clubSnaps.some((ys) => {
      const v = ys.snap[m.key];
      return v !== null && isFinite(v as number);
    })
  );

  const [activeMetric, setActiveMetric] = useState(0);
  const [showAllYears, setShowAllYears] = useState(false);

  const showTable = view !== "chart";
  const showChart = view !== "table";

  const cols = clubSnaps.map((ys, i) => ({
    label: ys.label,
    snap: ys.snap,
    isCurrent: i === clubSnaps.length - 1,
  }));

  const fullTable = (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${320 + cols.length * 110}px` }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
          <th style={{ textAlign: "left", padding: "10px 16px 8px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888", whiteSpace: "nowrap", width: "200px" }}>
            Metric
          </th>
          {cols.map((col, ci) => (
            <th key={ci} style={{ textAlign: "right", padding: "10px 12px 8px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: col.isCurrent ? "#111111" : "#aaaaaa", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "110px" }}>
              {col.label}
            </th>
          ))}
          <th style={{ textAlign: "right", padding: "10px 12px 8px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaaaaa", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "70px" }}>
            Change
          </th>
        </tr>
      </thead>
      <tbody>
        {visibleMetrics.map((m, mi) => {
          const values = cols.map((col) => col.snap[m.key] as number | null);
          const latest      = values[values.length - 1];
          const penultimate = values[values.length - 2] ?? null;
          return (
            <tr
              key={m.key as string}
              style={{ borderBottom: mi < visibleMetrics.length - 1 ? "1px solid #f2f2f2" : "none", background: "white", cursor: "pointer" }}
              onClick={() => setActiveMetric(mi)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "white"; }}
            >
              <td style={{ padding: "11px 16px", fontSize: "14px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: activeMetric === mi ? "#111111" : "#666666", whiteSpace: "nowrap", borderLeft: activeMetric === mi ? "2px solid #111111" : "2px solid transparent" }}>
                {m.label}
              </td>
              {values.map((v, ci) => (
                <td key={ci} style={{ textAlign: "right", padding: "11px 12px", fontSize: cols[ci].isCurrent ? "16px" : "14px", fontWeight: cols[ci].isCurrent ? 600 : 400, color: cols[ci].isCurrent ? "#111111" : "#888888", borderLeft: "1px solid #eeeeee", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {fmtJpy(v, m.isRatio)}
                </td>
              ))}
              <td style={{ textAlign: "right", padding: "11px 12px", borderLeft: "1px solid #eeeeee", whiteSpace: "nowrap" }}>
                <ChgBadge current={latest} prior={penultimate} higherBetter={m.higherBetter} isRatio={m.isRatio} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div>
      {/* ── Mobile table ── */}
      {showTable && <div className="sm:hidden">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaaaaa" }}>
            Latest: {cols[cols.length - 1].label}
          </span>
          <button
            onClick={() => setShowAllYears(v => !v)}
            style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#111111", background: "none", border: "1px solid #e0e0e0", padding: "4px 10px", cursor: "pointer" }}
          >
            {showAllYears ? "← Back" : "All years →"}
          </button>
        </div>
        {showAllYears ? (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>{fullTable}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                <th style={{ textAlign: "left", padding: "8px 0 6px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888888" }}>Metric</th>
                <th style={{ textAlign: "right", padding: "8px 0 6px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#111111" }}>Value</th>
                <th style={{ textAlign: "right", padding: "8px 0 6px 8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaaaaa" }}>Chg</th>
              </tr>
            </thead>
            <tbody>
              {visibleMetrics.map((m, mi) => {
                const values = cols.map((col) => col.snap[m.key] as number | null);
                const latest = values[values.length - 1];
                const penultimate = values[values.length - 2] ?? null;
                return (
                  <tr key={m.key as string} style={{ borderBottom: mi < visibleMetrics.length - 1 ? "1px solid #f2f2f2" : "none" }}>
                    <td style={{ padding: "9px 0", fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: "#666666" }}>{m.shortLabel}</td>
                    <td style={{ textAlign: "right", padding: "9px 0", fontSize: "14px", fontWeight: 600, color: "#111111", fontVariantNumeric: "tabular-nums" }}>{fmtJpy(latest, m.isRatio)}</td>
                    <td style={{ textAlign: "right", padding: "9px 0 9px 8px", whiteSpace: "nowrap" }}>
                      <ChgBadge current={latest} prior={penultimate} higherBetter={m.higherBetter} isRatio={m.isRatio} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>}

      {/* ── Desktop table ── */}
      {showTable && <div className="hidden sm:block" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {fullTable}
      </div>}

      {/* ── Chart ── */}
      {showChart && <div style={{ marginTop: showTable ? "28px" : 0, borderTop: showTable ? "1px solid #eeeeee" : "none", paddingTop: showTable ? "20px" : 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "16px" }}>
          {visibleMetrics.map((m, i) => (
            <button
              key={m.key as string}
              onClick={() => setActiveMetric(i)}
              style={{
                padding: "5px 11px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: "pointer", transition: "all 0.12s",
                border: activeMetric === i ? "1px solid #111111" : "1px solid #e0e0e0",
                background: activeMetric === i ? "#111111" : "white",
                color: activeMetric === i ? "white" : "#888888",
              }}
            >
              {m.shortLabel}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888", margin: 0 }}>
            {visibleMetrics[activeMetric]?.label}
          </p>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="20" height="10" style={{ display: "block" }}>
                <line x1="0" y1="5" x2="20" y2="5" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="5" r="2.5" fill="white" stroke="#111111" strokeWidth="1.5" />
              </svg>
              <span style={{ fontSize: "12px", color: "#333333", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Club</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="20" height="10" style={{ display: "block" }}>
                <line x1="0" y1="5" x2="20" y2="5" stroke="#aaaaaa" strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "12px", color: "#888888", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Division Avg</span>
            </span>
          </div>
        </div>
        <JapanTrendChart
          years={clubSnaps}
          leagueYears={leagueAvgSnaps}
          metricKey={visibleMetrics[activeMetric]?.key ?? "revenue"}
          isRatio={visibleMetrics[activeMetric]?.isRatio}
        />
      </div>}
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export default function JapanFinancialsSection({
  club,
  leagueClubs,
}: {
  club: JapanClub;
  leagueClubs: JapanClub[];
}) {
  const py = club.prior_year;
  const [fullView, setFullView] = useState<"table" | "chart">("table");

  // ── Trend dots ────────────────────────────────────────────────────────────
  const snapList = [
    ...(py ? [{ wage_ratio: py.wage_ratio, operating_profit: py.operating_profit, net_debt: py.net_debt }] : []),
    { wage_ratio: club.wage_ratio, operating_profit: club.operating_profit, net_debt: club.net_debt },
  ];

  const wageDots   = snapList.map(s => wageSignal(s.wage_ratio ?? null));
  const profitDots = snapList.map(s => profitSignal(s.operating_profit ?? null));
  const debtDots   = snapList.map(s => debtDotSignal(s.net_debt ?? null));

  // ── Sparkline series (prior + current) ───────────────────────────────────
  const revenueVals: (number | null)[] = [py?.revenue ?? null, club.revenue];
  const wageVals:    (number | null)[] = [py?.wage_bill ?? null, club.wage_bill];
  const playerVals:  (number | null)[] = [py?.profit_from_player_sales ?? null, club.profit_from_player_sales];
  const pretaxVals:  (number | null)[] = [py?.pre_tax_profit ?? null, club.pre_tax_profit];

  // ── Labels ────────────────────────────────────────────────────────────────
  const lastLabel  = fyLabel(club.fiscal_year_end);
  const firstLabel = py ? fyLabel(py.fiscal_year_end) : lastLabel;
  const compareLabel = J_DIVISION_LABELS[club.division];

  return (
    <div>
      {/* ── TIER 1: Key Financial Indicators ─────────────────────────────────── */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeading>Key Financial Indicators</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HealthCard
            label="Wage Efficiency"
            value={club.wage_ratio !== null ? `${club.wage_ratio.toFixed(1)}%` : "—"}
            subtext={wageSubtext(club.wage_ratio, py?.wage_ratio ?? null)}
            signal={wageSignal(club.wage_ratio)}
            dots={wageDots}
          />
          <HealthCard
            label="Profitability"
            value={fmtJpy(club.operating_profit)}
            subtext={profitSubtext(club.operating_profit, py?.operating_profit ?? null)}
            signal={profitSignal(club.operating_profit)}
            dots={profitDots}
          />
          <HealthCard
            label="Debt Position"
            value={fmtJpy(club.net_debt)}
            subtext={debtSubtext(club.net_debt, py?.net_debt ?? null)}
            signal={debtCardSignal(club.net_debt, py?.net_debt ?? null)}
            dots={debtDots}
          />
        </div>
      </div>

      {/* ── TIER 2: Latest Accounts ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeading>Latest Accounts · {lastLabel}</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            label="Revenue"
            value={fmtJpy(club.revenue)}
            current={club.revenue}
            prior={py?.revenue ?? null}
            higherBetter={true}
            sparkValues={revenueVals}
          />
          <MetricTile
            label="Wage Bill"
            value={fmtJpy(club.wage_bill)}
            current={club.wage_bill}
            prior={py?.wage_bill ?? null}
            higherBetter={false}
            sparkValues={wageVals}
          />
          <MetricTile
            label="Net Transfers"
            value={fmtJpy(club.profit_from_player_sales)}
            current={club.profit_from_player_sales}
            prior={py?.profit_from_player_sales ?? null}
            higherBetter={null}
            sparkValues={playerVals}
          />
          <MetricTile
            label="Pre-tax Profit"
            value={fmtJpy(club.pre_tax_profit)}
            current={club.pre_tax_profit}
            prior={py?.pre_tax_profit ?? null}
            higherBetter={true}
            sparkValues={pretaxVals}
          />
        </div>
      </div>

      {/* ── TIER 3: Full Accounts ─────────────────────────────────────────────── */}
      {py && (
        <div>
          <SectionHeading>Full Accounts · {firstLabel} – {lastLabel}</SectionHeading>
          <div className="flex overflow-x-auto" style={{ borderBottom: "1px solid #eeeeee", marginBottom: "20px" }}>
            {(["table", "chart"] as const).map(v => (
              <button
                key={v}
                onClick={() => setFullView(v)}
                style={{
                  padding: "12px 24px", fontSize: "13px", fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase", border: "none",
                  borderBottom: fullView === v ? "2px solid #111111" : "2px solid transparent",
                  marginBottom: "-1px", background: "none",
                  color: fullView === v ? "#111111" : "#aaaaaa",
                  cursor: "pointer", whiteSpace: "nowrap", minHeight: "44px", flexShrink: 0,
                }}
              >
                {v === "table" ? "Table" : "Chart"}
              </button>
            ))}
          </div>
          <JapanYoYSection club={club} leagueClubs={leagueClubs} view={fullView} />
        </div>
      )}

      <p className="text-xs text-[#bbbbbb] mt-6 leading-relaxed">
        Figures converted from JPY millions at ¥150/$1. Net Debt shown as a proxy (Total Liabilities minus Current Assets) since individual debt instruments are not disclosed separately in J-League financial disclosures. Division: {compareLabel}.
      </p>
    </div>
  );
}
