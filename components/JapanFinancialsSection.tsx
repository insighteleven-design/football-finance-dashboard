"use client";

import { useState, Fragment } from "react";
import type { JapanClub } from "@/lib/japanClubs";
import { fmtJpy, J_DIVISION_LABELS } from "@/lib/japanClubs";
import type { JapanClubDeepDive } from "@/lib/japanDeepDive";
import JapanRevenueBreakdownSection from "./JapanRevenueBreakdownSection";

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

function divStats(snaps: Snap[], key: keyof Snap) {
  const vals = snaps.map((s) => s[key]).filter((v): v is number => v !== null);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);
  const sorted = [...vals].sort((a, b) => b - a);
  return { avg, maxAbs, sorted, count: vals.length };
}

function vsColor(value: number, avg: number, higherBetter: boolean | null): string {
  if (higherBetter === null) return "#aaaaaa";
  return (higherBetter ? value > avg : value < avg) ? "#4a9a6a" : "#9a4a4a";
}

function calcPct(curr: number | null, prior: number | null): number | null {
  if (curr === null || prior === null || prior === 0) return null;
  return ((curr - prior) / Math.abs(prior)) * 100;
}

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

// ─── Bar primitives ───────────────────────────────────────────────────────────

function StdBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-7 bg-[#eeeeee] overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function DivBar({ value, scale, color }: { value: number; scale: number; color: string }) {
  const pct = Math.min((Math.abs(value) / scale) * 100, 100);
  const pos = value >= 0;
  return (
    <div className="flex-1 flex h-7">
      <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
        {!pos && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
      <div className="w-px bg-[#e0e0e0] shrink-0" />
      <div className="flex-1 overflow-hidden bg-[#eeeeee]">
        {pos && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
    </div>
  );
}

// ─── Breakdown badge ──────────────────────────────────────────────────────────

function BreakdownBadge({ open }: { open: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium tracking-[0.08em] uppercase border transition-colors shrink-0 ${open ? "border-[#4A90D9] bg-[#EBF3FC] text-[#4A90D9]" : "border-[#e0e0e0] text-[#aaaaaa]"}`}>
      Breakdown
      <span className="inline-block transition-transform duration-200" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>→</span>
    </span>
  );
}

// ─── Metrics config ───────────────────────────────────────────────────────────

const METRICS: {
  key: keyof Snap;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter: boolean | null;
  expandable?: "revenue" | "transfer";
}[] = [
  { key: "revenue",                  label: "Revenue",                    higherBetter: true,  expandable: "revenue" },
  { key: "wage_bill",                label: "Wage Bill",                  higherBetter: false },
  { key: "wage_ratio",               label: "Wage Ratio",                 isRatio: true, higherBetter: false },
  { key: "operating_profit",         label: "Operating Profit / (Loss)",  diverging: true, higherBetter: true },
  { key: "profit_from_player_sales", label: "Net Transfer Cash Flow",     diverging: true, higherBetter: null, expandable: "transfer" },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",    diverging: true, higherBetter: true },
  { key: "net_debt",                 label: "Net Debt (proxy)",           diverging: true, higherBetter: false },
];

// ─── Transfer panel ───────────────────────────────────────────────────────────

function TransferPanel({ tb }: { tb: JapanClubDeepDive["transfer_breakdown"] }) {
  if (!tb) return null;
  const net = tb.income !== null && tb.expenditure !== null ? Math.round((tb.income - tb.expenditure) * 100) / 100 : null;
  const rows = [
    { label: "Transfer Income",      value: tb.income,      color: "#4a9a6a" },
    { label: "Transfer Expenditure", value: tb.expenditure, color: "#9a4a4a" },
    { label: "Net",                  value: net,            color: net !== null && net >= 0 ? "#4a9a6a" : "#9a4a4a" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="text-sm text-[#666666] w-40 shrink-0">{r.label}</span>
          <span className="text-sm tabular-nums font-medium" style={{ color: r.color }}>
            {r.value !== null ? `$${Math.abs(r.value).toFixed(1)}m${r.value < 0 ? " (net cost)" : ""}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Single-year metrics grid ─────────────────────────────────────────────────

function MetricsGrid({
  data,
  divData,
  compareLabel,
  breakdown,
  totalRevenue,
  transferBreakdown,
}: {
  data: Snap;
  divData: Snap[];
  compareLabel: string;
  breakdown: JapanClubDeepDive["revenue_breakdown"];
  totalRevenue: number | null;
  transferBreakdown: JapanClubDeepDive["transfer_breakdown"];
}) {
  const [revOpen, setRevOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">
      {/* Column headers — aligned with EN/EU */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-r border-[#e0e0e0]">
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555]">Financial Figures</p>
      </div>
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-[#e0e0e0]">
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555]">vs {compareLabel} Average</p>
      </div>

      {METRICS.map((m) => {
        const val = data[m.key];
        const stats = divStats(divData, m.key);
        const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;
        const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01) : 1;
        const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
        const avgPct = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;
        const barColor = val !== null && stats ? vsColor(val, stats.avg, m.higherBetter) : "#cccccc";
        const isRev = m.expandable === "revenue";
        const isTransfer = m.expandable === "transfer";
        const canExpand = (isRev && breakdown != null) || (isTransfer && transferBreakdown != null);
        const toggleExpand = canExpand
          ? () => { if (isRev) setRevOpen((o) => !o); else setTransferOpen((o) => !o); }
          : undefined;
        const expandOpen = isRev ? revOpen : isTransfer ? transferOpen : false;

        return (
          <Fragment key={m.key as string}>
            {/* Left cell — aligned with EN/EU */}
            <div
              className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-r border-[#e0e0e0] bg-white${toggleExpand ? " cursor-pointer hover:bg-[#fafafa] transition-colors" : ""}`}
              onClick={toggleExpand}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555]">{m.label}</p>
                {toggleExpand && <BreakdownBadge open={expandOpen} />}
              </div>
              {val !== null ? (
                <p className="text-3xl sm:text-5xl font-medium tabular-nums text-[#111111]">{fmtJpy(val, m.isRatio)}</p>
              ) : (
                <p className="text-3xl sm:text-5xl font-medium text-[#cccccc]">—</p>
              )}
              {stats && rank !== null && (
                <p className="text-xs text-[#aaaaaa] mt-1.5">#{rank} <span className="text-[#cccccc]">of {stats.count}</span></p>
              )}
            </div>

            {/* Right cell — aligned with EN/EU */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e0e0e0] bg-white">
              <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-3">{m.label}</p>
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging ? (
                    <DivBar value={val ?? 0} scale={scale / 2} color={val !== null ? barColor : "#cccccc"} />
                  ) : (
                    <StdBar pct={clubPct} color={val !== null ? barColor : "#eeeeee"} />
                  )}
                  <span className="text-sm font-semibold tabular-nums text-[#111111] w-16 text-right shrink-0">
                    {fmtJpy(val, m.isRatio)}
                  </span>
                </div>
                <p className="text-sm text-[#999999] tracking-[0.04em]">This club</p>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging && stats ? (
                    <DivBar value={stats.avg} scale={scale / 2} color="#cccccc" />
                  ) : (
                    <StdBar pct={avgPct} color="#cccccc" />
                  )}
                  <span className="text-sm tabular-nums text-[#aaaaaa] w-16 text-right shrink-0">
                    {stats ? fmtJpy(stats.avg, m.isRatio) : "—"}
                  </span>
                </div>
                <p className="text-sm text-[#bbbbbb] tracking-[0.04em]">Division avg</p>
              </div>
            </div>

            {isRev && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: revOpen ? "700px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">Revenue Breakdown</p>
                  <JapanRevenueBreakdownSection breakdown={breakdown ?? null} totalRevenue={totalRevenue} />
                </div>
              </div>
            )}
            {isTransfer && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: transferOpen ? "300px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">Transfer Breakdown</p>
                  <TransferPanel tb={transferBreakdown ?? null} />
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

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

function fmtChartTick(v: number, isRatio?: boolean): string {
  if (isRatio) return `${v}%`;
  return `$${v}m`;
}

function fmtChartLabel(v: number, isRatio?: boolean): string {
  if (isRatio) return `${v.toFixed(1)}%`;
  return `$${v.toFixed(1)}m`;
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
  years,
  leagueYears,
  metricKey,
  isRatio,
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
              {fmtChartTick(tick, isRatio)}
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
              {fmtChartLabel(v, isRatio)}
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

// ─── Year-on-year section ─────────────────────────────────────────────────────

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

function JapanYoYSection({ club, leagueClubs }: { club: JapanClub; leagueClubs: JapanClub[] }) {
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

  const cols = clubSnaps.map((ys, i) => ({
    label: ys.label,
    snap: ys.snap,
    isCurrent: i === clubSnaps.length - 1,
  }));

  return (
    <div>
      {/* ── Table ── */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
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
      </div>

      {/* ── Chart ── */}
      <div style={{ marginTop: "28px", borderTop: "1px solid #eeeeee", paddingTop: "20px" }}>
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
              {m.label.replace(" / (Loss)", "").replace(" (proxy)", "")}
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
      </div>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

type TabKey = "current" | "prior" | "yoy";

export default function JapanFinancialsSection({
  club,
  leagueClubs,
  deepDive,
}: {
  club: JapanClub;
  leagueClubs: JapanClub[];
  deepDive: JapanClubDeepDive | null;
}) {
  const hasPrior = club.prior_year !== null;
  const [tab, setTab] = useState<TabKey>(hasPrior ? "yoy" : "current");

  const TABS: { key: TabKey; label: string }[] = [
    { key: "current", label: fyLabel(club.fiscal_year_end) },
    ...(hasPrior ? [{ key: "prior" as TabKey, label: fyLabel(club.prior_year!.fiscal_year_end) }] : []),
    ...(hasPrior ? [{ key: "yoy" as TabKey, label: "Year on Year" }] : []),
  ];

  const currentSnap = snapFromClub(club);

  const priorSnap: Snap | null = club.prior_year ? snapFromPrior(club.prior_year) : null;

  const currentDivSnaps: Snap[] = leagueClubs.map(snapFromClub);

  const priorDivSnaps: Snap[] = leagueClubs
    .filter((c) => c.prior_year !== null)
    .map((c) => snapFromPrior(c.prior_year!));

  const compareLabel = J_DIVISION_LABELS[club.division];

  return (
    <div>
      {/* Inner tab bar — aligned with EN/EU */}
      {(hasPrior) && (
        <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 sm:px-7 py-3 text-sm font-semibold tracking-[0.08em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                tab === key ? "border-[#111111] text-[#111111]" : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "current" && (
        <MetricsGrid
          data={currentSnap}
          divData={currentDivSnaps}
          compareLabel={compareLabel}
          breakdown={deepDive?.revenue_breakdown ?? null}
          totalRevenue={club.revenue}
          transferBreakdown={deepDive?.transfer_breakdown ?? null}
        />
      )}

      {tab === "prior" && priorSnap && (
        <MetricsGrid
          data={priorSnap}
          divData={priorDivSnaps}
          compareLabel={compareLabel}
          breakdown={deepDive?.revenue_breakdown_prior ?? null}
          totalRevenue={priorSnap.revenue}
          transferBreakdown={null}
        />
      )}

      {tab === "yoy" && hasPrior && (
        <JapanYoYSection club={club} leagueClubs={leagueClubs} />
      )}

      <p className="text-xs text-[#bbbbbb] mt-6 leading-relaxed">
        Figures converted from JPY millions at ¥150/$1. Net Debt shown as a proxy (Total Liabilities minus Current Assets) since individual debt instruments are not disclosed separately in J-League financial disclosures.
      </p>
    </div>
  );
}
