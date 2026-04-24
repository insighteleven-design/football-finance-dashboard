"use client";

import { useState } from "react";
import { clubs as allClubs, type ClubFinancials, type PriorYearFinancials } from "@/lib/clubs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricConfig {
  key: keyof PriorYearFinancials;
  label: string;
  shortLabel: string;
  isRatio?: boolean;
  higherBetter: boolean | null;
}

const METRICS: MetricConfig[] = [
  { key: "revenue",                  label: "Revenue",                   shortLabel: "Revenue",      higherBetter: true },
  { key: "wage_bill",                label: "Wage Bill",                 shortLabel: "Wages",        higherBetter: false },
  { key: "wage_ratio",               label: "Wage Ratio",                shortLabel: "Wage %",       isRatio: true, higherBetter: false },
  { key: "operating_profit",         label: "Operating Profit / (Loss)", shortLabel: "Op. Profit",   higherBetter: true },
  { key: "profit_from_player_sales", label: "Player Sales Revenue",      shortLabel: "Player Sales", higherBetter: null },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",   shortLabel: "Pre-tax",      higherBetter: true },
  { key: "net_debt",                 label: "Net Debt",                  shortLabel: "Net Debt",     higherBetter: false },
];

type MetricValues = Partial<Record<keyof PriorYearFinancials, number | null>>;
type YearSnap    = { label: string; data: MetricValues };
type YearSlot    = "data2022" | "data2023" | "prior_year" | "current";

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtMoney(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}£${abs.toFixed(1)}m`;
}
function fmtRatio(v: number | null): string {
  if (v === null) return "—";
  return `${v.toFixed(1)}%`;
}
function fmt(v: number | null, isRatio?: boolean): string {
  return isRatio ? fmtRatio(v) : fmtMoney(v);
}
function fyLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
function fmtTick(v: number, isRatio?: boolean): string {
  if (isRatio) return `${v}%`;
  if (Math.abs(v) >= 1000) return `£${(v / 1000).toFixed(1)}bn`;
  return `£${v}m`;
}
function fmtLabel(v: number, isRatio?: boolean): string {
  if (isRatio) return `${v.toFixed(1)}%`;
  return `£${v.toFixed(0)}m`;
}

// ─── Change badge ─────────────────────────────────────────────────────────────

function isImprovement(a: number | null, b: number | null, hb: boolean | null): boolean | null {
  if (a === null || b === null || hb === null || a === b) return null;
  return hb ? a > b : a < b;
}

function ChgBadge({ current, prior, higherBetter, isRatio }: {
  current: number | null; prior: number | null;
  higherBetter: boolean | null; isRatio?: boolean;
}) {
  if (current === null || prior === null)
    return <span style={{ color: "#cccccc", fontSize: "14px" }}>—</span>;

  const improved = isImprovement(current, prior, higherBetter);
  let label: string;
  if (isRatio) {
    const diff = current - prior;
    label = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp`;
  } else {
    if (prior === 0) return <span style={{ color: "#cccccc", fontSize: "14px" }}>—</span>;
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

// ─── Club years ───────────────────────────────────────────────────────────────

function pyToMetrics(py: PriorYearFinancials): MetricValues {
  return {
    revenue: py.revenue, wage_bill: py.wage_bill, wage_ratio: py.wage_ratio,
    operating_profit: py.operating_profit, profit_from_player_sales: py.profit_from_player_sales,
    pre_tax_profit: py.pre_tax_profit, net_debt: py.net_debt,
  };
}

type SlottedYear = { slot: YearSlot; label: string; data: MetricValues };

function buildSlottedYears(club: ClubFinancials): SlottedYear[] {
  const out: SlottedYear[] = [];
  if (club.data2022)   out.push({ slot: "data2022",   label: fyLabel(club.data2022.fiscal_year_end),   data: pyToMetrics(club.data2022) });
  if (club.data2023)   out.push({ slot: "data2023",   label: fyLabel(club.data2023.fiscal_year_end),   data: pyToMetrics(club.data2023) });
  if (club.prior_year) out.push({ slot: "prior_year", label: fyLabel(club.prior_year.fiscal_year_end), data: pyToMetrics(club.prior_year) });
  out.push({
    slot: "current", label: fyLabel(club.fiscal_year_end),
    data: {
      revenue: club.revenue, wage_bill: club.wage_bill, wage_ratio: club.wage_ratio,
      operating_profit: club.operating_profit, profit_from_player_sales: club.profit_from_player_sales ?? null,
      pre_tax_profit: club.pre_tax_profit, net_debt: club.net_debt,
    },
  });
  return out;
}

// ─── League average computation ───────────────────────────────────────────────

function mean(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => x !== null && x !== undefined && isFinite(x as number));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function currentVal(c: ClubFinancials, key: keyof MetricValues): number | null {
  switch (key) {
    case "revenue":                  return c.revenue;
    case "wage_bill":                return c.wage_bill;
    case "wage_ratio":               return c.wage_ratio;
    case "operating_profit":         return c.operating_profit;
    case "profit_from_player_sales": return c.profit_from_player_sales ?? null;
    case "pre_tax_profit":           return c.pre_tax_profit;
    case "net_debt":                 return c.net_debt;
    default:                         return null;
  }
}

const METRIC_KEYS: (keyof MetricValues)[] = [
  "revenue", "wage_bill", "wage_ratio", "operating_profit",
  "profit_from_player_sales", "pre_tax_profit", "net_debt",
];

function buildLeagueAvgSnap(slot: YearSlot, label: string, club: ClubFinancials): YearSnap {
  const data: MetricValues = {};

  const div =
    slot === "data2022"   ? (club.data2022?.compare_division   ?? club.compare_division ?? club.division) :
    slot === "data2023"   ? (club.data2023?.compare_division   ?? club.compare_division ?? club.division) :
    slot === "prior_year" ? (club.prior_year?.compare_division ?? club.compare_division ?? club.division) :
                            (club.compare_division ?? club.division);

  for (const key of METRIC_KEYS) {
    let vals: (number | null | undefined)[];

    if (slot === "data2022") {
      vals = allClubs
        .filter(c => c.data2022 && (c.data2022.compare_division ?? c.compare_division ?? c.division) === div)
        .map(c => c.data2022![key as keyof PriorYearFinancials] as number | null);
    } else if (slot === "data2023") {
      vals = allClubs
        .filter(c => c.data2023 && (c.data2023.compare_division ?? c.compare_division ?? c.division) === div)
        .map(c => c.data2023![key as keyof PriorYearFinancials] as number | null);
    } else if (slot === "prior_year") {
      vals = allClubs
        .filter(c => c.prior_year && (c.prior_year.compare_division ?? c.compare_division ?? c.division) === div)
        .map(c => c.prior_year![key as keyof PriorYearFinancials] as number | null);
    } else {
      vals = allClubs
        .filter(c => (c.compare_division ?? c.division) === div)
        .map(c => currentVal(c, key));
    }

    data[key] = mean(vals);
  }

  return { label, data };
}

function buildLeagueYears(slottedYears: SlottedYear[], club: ClubFinancials): YearSnap[] {
  return slottedYears.map(({ slot, label }) => buildLeagueAvgSnap(slot, label, club));
}

// ─── Table columns ────────────────────────────────────────────────────────────

type YearColumn = { label: string; snap: MetricValues; isCurrent?: boolean };

function buildColumns(club: ClubFinancials): YearColumn[] {
  const cols: YearColumn[] = [];
  if (club.data2022)   cols.push({ label: fyLabel(club.data2022.fiscal_year_end),   snap: pyToMetrics(club.data2022) });
  if (club.data2023)   cols.push({ label: fyLabel(club.data2023.fiscal_year_end),   snap: pyToMetrics(club.data2023) });
  if (club.prior_year) cols.push({ label: fyLabel(club.prior_year.fiscal_year_end), snap: pyToMetrics(club.prior_year) });
  cols.push({
    label: fyLabel(club.fiscal_year_end),
    snap: {
      revenue: club.revenue, wage_bill: club.wage_bill, wage_ratio: club.wage_ratio,
      operating_profit: club.operating_profit, profit_from_player_sales: club.profit_from_player_sales ?? null,
      pre_tax_profit: club.pre_tax_profit, net_debt: club.net_debt,
    },
    isCurrent: true,
  });
  return cols;
}

// ─── SVG line chart ───────────────────────────────────────────────────────────

const ML = 68;
const MR = 20;
const MT = 36;
const MB = 48;
const VW = 700;
const VH = 300;
const PW = VW - ML - MR;
const PH = VH - MT - MB;

function niceStep(range: number): number {
  if (range === 0) return 1;
  const raw  = range / 4;
  const mag  = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
}

function buildTicks(min: number, max: number): number[] {
  const step  = niceStep(max - min);
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.01; v = Math.round((v + step) * 1e9) / 1e9) ticks.push(v);
  if (ticks.length > 6) {
    const every = Math.ceil(ticks.length / 5);
    return ticks.filter((_, i) => i % every === 0);
  }
  return ticks;
}

function polySegments(years: YearSnap[], key: keyof MetricValues, xPos: (i: number) => number, yPos: (v: number) => number): string[][] {
  const segs: string[][] = [];
  let seg: string[] = [];
  years.forEach((yr, i) => {
    const v = yr.data[key];
    if (v !== null && v !== undefined) {
      seg.push(`${xPos(i).toFixed(2)},${yPos(v as number).toFixed(2)}`);
    } else {
      if (seg.length) { segs.push(seg); seg = []; }
    }
  });
  if (seg.length) segs.push(seg);
  return segs;
}

function TrendChart({ years, leagueYears, metric }: {
  years: YearSnap[];
  leagueYears: YearSnap[];
  metric: MetricConfig;
}) {
  const key = metric.key;
  const n   = years.length;

  // Collect all non-null values across both series for scale
  const allVals: number[] = [];
  [...years, ...leagueYears].forEach(yr => {
    const v = yr.data[key];
    if (v !== null && v !== undefined) allVals.push(v as number);
  });

  if (allVals.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "280px" }}>
        <p style={{ fontSize: "17px", color: "#cccccc", fontStyle: "italic" }}>No data available</p>
      </div>
    );
  }

  const rawMin  = Math.min(...allVals);
  const rawMax  = Math.max(...allVals);
  const span    = rawMax - rawMin || Math.abs(rawMax) || 10;
  const dataMin = rawMin - span * 0.28;
  const dataMax = rawMax + span * 0.28;
  const ticks   = buildTicks(dataMin, dataMax);
  const yMin    = Math.min(dataMin, ticks[0]);
  const yMax    = Math.max(dataMax, ticks[ticks.length - 1]);

  const xPos = (i: number) => ML + (n <= 1 ? PW / 2 : (i / (n - 1)) * PW);
  const yPos = (v: number) => MT + PH - ((v - yMin) / (yMax - yMin)) * PH;

  const showZero = yMin < 0 && yMax > 0;
  const zeroY    = showZero ? yPos(0) : null;

  // Club line segments + area
  const clubSegs    = polySegments(years, key, xPos, yPos);
  const fillBase    = zeroY ?? yPos(yMin);
  const areaPaths   = clubSegs
    .filter(s => s.length >= 2)
    .map(s => {
      const pts = s.map(pt => pt.split(","));
      return `M ${pts[0][0]},${pts[0][1]}` +
        pts.slice(1).map(([x, y]) => ` L ${x},${y}`).join("") +
        ` L ${pts[pts.length - 1][0]},${fillBase.toFixed(2)}` +
        ` L ${pts[0][0]},${fillBase.toFixed(2)} Z`;
    });

  // League average line segments
  const avgSegs = polySegments(leagueYears, key, xPos, yPos);

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-label={`${metric.label} trend`}
    >
      {/* Grid lines */}
      {ticks.map((tick) => {
        const y = yPos(tick);
        if (y < MT - 1 || y > MT + PH + 1) return null;
        return (
          <g key={tick}>
            <line x1={ML} y1={y} x2={ML + PW} y2={y} stroke="#eeeeee" strokeWidth={1} />
            <text x={ML - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={13} fill="#bbbbbb" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtTick(tick, metric.isRatio)}
            </text>
          </g>
        );
      })}

      {/* Zero baseline */}
      {zeroY !== null && (
        <line x1={ML} y1={zeroY} x2={ML + PW} y2={zeroY} stroke="#cccccc" strokeWidth={1} strokeDasharray="4 3" />
      )}

      {/* Club area fill */}
      {areaPaths.map((d, i) => <path key={i} d={d} fill="rgba(17,17,17,0.04)" />)}

      {/* League average line — rendered before club line so club sits on top */}
      {avgSegs.map((s, i) => (
        <polyline key={i} points={s.join(" ")} fill="none" stroke="#cccccc" strokeWidth={1.25} strokeDasharray="6 5" strokeLinejoin="round" strokeLinecap="round" />
      ))}

      {/* Club line */}
      {clubSegs.map((s, i) => (
        <polyline key={i} points={s.join(" ")} fill="none" stroke="#111111" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      ))}

      {/* Club dots + value labels */}
      {years.map((yr, i) => {
        const v = yr.data[key];
        if (v === null || v === undefined) return null;
        const vn = v as number;
        const cx = xPos(i);
        const cy = yPos(vn);

        const isFirst = i === 0;
        const isLast  = i === n - 1;
        const anchor  = isFirst ? "start" : isLast ? "end" : "middle";
        const lx      = isFirst ? cx + 2 : isLast ? cx - 2 : cx;
        const above   = cy > MT + 22;
        const ly      = above ? cy - 11 : cy + 20;

        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={4} fill="white" stroke="#111111" strokeWidth={2} />
            <text x={lx} y={ly} textAnchor={anchor} fontSize={13} fontWeight={500} fill="#444444" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtLabel(vn, metric.isRatio)}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {years.map((yr, i) => (
        <text key={i} x={xPos(i)} y={MT + PH + 20} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={13} fill="#aaaaaa" fontWeight={500}>
          {yr.label}
        </text>
      ))}

      {/* Axis lines */}
      <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke="#ebebeb" strokeWidth={0.5} />
      <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke="#ebebeb" strokeWidth={0.5} />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function YearOnYearSection({ club }: { club: ClubFinancials }) {
  const slottedYears = buildSlottedYears(club);
  const cols         = buildColumns(club);
  const leagueYears  = buildLeagueYears(slottedYears, club);
  const [activeMetric, setActiveMetric] = useState(0);

  if (cols.length < 2) return null;

  return (
    <div>
      {/* ── Table ── */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${280 + cols.length * 150}px` }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
              <th style={{ textAlign: "left", padding: "14px 16px 12px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888888", whiteSpace: "nowrap", width: "200px" }}>
                Metric
              </th>
              {cols.map((col, ci) => (
                <th key={ci} style={{ textAlign: "right", padding: "14px 16px 12px", fontSize: col.isCurrent ? "16px" : "14px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: col.isCurrent ? "#111111" : "#aaaaaa", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "110px" }}>
                  {col.label}
                </th>
              ))}
              <th style={{ textAlign: "right", padding: "14px 16px 12px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888888", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "90px" }}>
                {cols[cols.length - 2]?.label.split(" ")[1]} → {cols[cols.length - 1]?.label.split(" ")[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, mi) => {
              const values      = cols.map(col => { const v = col.snap[m.key]; return v !== undefined ? v : null; });
              const latest      = values[values.length - 1];
              const penultimate = values[values.length - 2] ?? null;

              return (
                <tr
                  key={m.key as string}
                  style={{ borderBottom: mi < METRICS.length - 1 ? "1px solid #f0f0f0" : "none", background: "white", cursor: "pointer" }}
                  onClick={() => setActiveMetric(mi)}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "white"; }}
                >
                  <td style={{ padding: "16px 16px", fontSize: "15px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: activeMetric === mi ? "#111111" : "#555555", whiteSpace: "nowrap", borderLeft: activeMetric === mi ? "3px solid #111111" : "3px solid transparent" }}>
                    {m.label}
                  </td>
                  {values.map((v, ci) => (
                    <td key={ci} style={{ textAlign: "right", padding: "16px 16px", fontSize: cols[ci].isCurrent ? "19px" : "16px", fontWeight: cols[ci].isCurrent ? 700 : 400, color: cols[ci].isCurrent ? "#111111" : "#999999", borderLeft: "1px solid #eeeeee", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {fmt(v, m.isRatio)}
                    </td>
                  ))}
                  <td style={{ textAlign: "right", padding: "16px 16px", borderLeft: "1px solid #eeeeee", whiteSpace: "nowrap" }}>
                    <ChgBadge current={latest} prior={penultimate} higherBetter={m.higherBetter} isRatio={m.isRatio} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Chart ── */}
      <div style={{ marginTop: "32px", borderTop: "1px solid #eeeeee", paddingTop: "24px" }}>
        {/* Metric selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          {METRICS.map((m, i) => (
            <button
              key={m.key as string}
              onClick={() => setActiveMetric(i)}
              style={{
                padding: "8px 18px", fontSize: "14px", fontWeight: 600, letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: "pointer", transition: "all 0.12s",
                border: activeMetric === i ? "1px solid #111111" : "1px solid #e0e0e0",
                background: activeMetric === i ? "#111111" : "white",
                color: activeMetric === i ? "white" : "#777777",
              }}
            >
              {m.shortLabel}
            </button>
          ))}
        </div>

        {/* Chart header: title + legend */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666666", margin: 0 }}>
            {METRICS[activeMetric].label}
          </p>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <svg width="24" height="12" style={{ display: "block" }}>
                <line x1="0" y1="6" x2="24" y2="6" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="6" r="3" fill="white" stroke="#111111" strokeWidth="2" />
              </svg>
              <span style={{ fontSize: "13px", color: "#333333", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Club</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <svg width="24" height="12" style={{ display: "block" }}>
                <line x1="0" y1="6" x2="24" y2="6" stroke="#aaaaaa" strokeWidth="1.5" strokeDasharray="6 5" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "13px", color: "#888888", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Div Avg</span>
            </span>
          </div>
        </div>

        <TrendChart years={slottedYears} leagueYears={leagueYears} metric={METRICS[activeMetric]} />
      </div>
    </div>
  );
}
