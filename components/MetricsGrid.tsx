"use client";

import { Fragment, useState } from "react";
import { clubs, fmt, type ClubFinancials, type Division } from "@/lib/clubs";
import type { RevenueBreakdown } from "@/lib/deepDive";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  club: ClubFinancials;
  compareDivision: Division;
  compareLabel: string;
  breakdown: RevenueBreakdown | null;
}

// ─── Metrics config ───────────────────────────────────────────────────────────

const ALL_METRICS: {
  key: keyof ClubFinancials;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter: boolean | null;
  expandable?: "revenue" | "debt";
}[] = [
  { key: "revenue",                    label: "Revenue",                    higherBetter: true,  expandable: "revenue" },
  { key: "wage_bill",                  label: "Wage Bill",                  higherBetter: false },
  { key: "wage_ratio",                 label: "Wage Ratio",                 isRatio: true, higherBetter: false },
  { key: "operating_profit",           label: "Operating Profit / (Loss)",  diverging: true, higherBetter: true },
  { key: "profit_from_player_sales",   label: "Player Sales Profit",        diverging: true, higherBetter: null },
  { key: "pre_tax_profit",             label: "Pre-tax Profit / (Loss)",    diverging: true, higherBetter: true },
  { key: "net_debt",                   label: "Net Cash / (Debt)",          diverging: true, higherBetter: false },
];

// ─── Division stats ───────────────────────────────────────────────────────────

function divisionStats(division: string, key: keyof ClubFinancials) {
  const vals = clubs
    .filter((c) => c.division === division && c[key] !== null)
    .map((c) => c[key] as number);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);
  const sorted = [...vals].sort((a, b) => b - a);
  return { avg, maxAbs, sorted, count: vals.length };
}

function vsAvgColor(value: number, avg: number, higherBetter: boolean | null): string {
  if (higherBetter === null) return "#aaaaaa";
  return (higherBetter ? value > avg : value < avg) ? "#4a9a6a" : "#9a4a4a";
}

// ─── Bar primitives ───────────────────────────────────────────────────────────

function StandardBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-7 bg-[#eeeeee] overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function DivergingBar({ value, scale, color }: { value: number; scale: number; color: string }) {
  const pct = Math.min((Math.abs(value) / scale) * 100, 100);
  const isPositive = value >= 0;
  return (
    <div className="flex-1 flex h-7">
      <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
        {!isPositive && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
      <div className="w-px bg-[#e0e0e0] shrink-0" />
      <div className="flex-1 overflow-hidden bg-[#eeeeee]">
        {isPositive && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
    </div>
  );
}

// ─── Revenue breakdown panel ─────────────────────────────────────────────────

const REV_SEGMENTS = [
  { key: "matchday",     label: "Matchday",     color: "#4A90D9" },
  { key: "broadcasting", label: "Broadcasting", color: "#9B59B6" },
  { key: "commercial",   label: "Commercial",   color: "#E8A838" },
] as const;

function fmtGbp(v: number) {
  return `£${v.toFixed(1)}m`;
}

function RevenuePanel({ breakdown, totalRevenue }: { breakdown: RevenueBreakdown | null; totalRevenue: number | null }) {
  const hasData =
    breakdown !== null &&
    (breakdown.matchday !== null || breakdown.broadcasting !== null || breakdown.commercial !== null);

  const knownSum =
    (breakdown?.matchday ?? 0) + (breakdown?.broadcasting ?? 0) + (breakdown?.commercial ?? 0);
  const denominator = totalRevenue && totalRevenue > knownSum ? totalRevenue : knownSum;
  const otherAmount = denominator - knownSum;

  if (!hasData) {
    return (
      <p className="text-sm text-[#aaaaaa] italic">Revenue breakdown not disclosed in this filing.</p>
    );
  }

  return (
    <>
      {/* Stacked bar */}
      <div className="h-7 flex overflow-hidden mb-5" style={{ borderRadius: "2px" }}>
        {REV_SEGMENTS.map(({ key, color }) => {
          const val = breakdown![key];
          if (val === null || denominator === 0) return null;
          const pct = (val / denominator) * 100;
          return (
            <div
              key={key}
              className="h-full"
              style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? 2 : 0 }}
            />
          );
        })}
        {otherAmount > 0.5 && denominator > 0 && (
          <div
            className="h-full"
            style={{ width: `${(otherAmount / denominator) * 100}%`, backgroundColor: "#dddddd", minWidth: 2 }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {REV_SEGMENTS.map(({ key, label, color }) => {
          const val = breakdown![key];
          const pct = val !== null && denominator > 0 ? (val / denominator) * 100 : null;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-[#666666] w-28">{label}</span>
              <span className="text-[11px] font-light tabular-nums text-[#111111] w-14">
                {val !== null ? fmtGbp(val) : "—"}
              </span>
              <span className="text-[11px] text-[#aaaaaa] tabular-nums">
                {pct !== null ? `${pct.toFixed(0)}%` : "—"}
              </span>
            </div>
          );
        })}
        {otherAmount > 0.5 && (
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#dddddd" }} />
            <span className="text-[11px] text-[#999999] w-28">Other / unallocated</span>
            <span className="text-[11px] font-light tabular-nums text-[#aaaaaa] w-14">{fmtGbp(otherAmount)}</span>
            <span className="text-[11px] text-[#cccccc] tabular-nums">
              {denominator > 0 ? `${((otherAmount / denominator) * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Breakdown badge ──────────────────────────────────────────────────────────

function BreakdownBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] uppercase border transition-colors shrink-0 ${
        open
          ? "border-[#4A90D9] bg-[#EBF3FC] text-[#4A90D9]"
          : "border-[#e0e0e0] text-[#aaaaaa]"
      }`}
    >
      Breakdown
      <span
        className="inline-block transition-transform duration-200"
        style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
      >
        →
      </span>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MetricsGrid({ club, compareDivision, compareLabel, breakdown }: Props) {
  const [revenueOpen, setRevenueOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">
      {/* Column headers */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-r border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">Financial Figures</p>
      </div>
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">
          vs {compareLabel} Average
        </p>
      </div>

      {/* Metric rows */}
      {ALL_METRICS.map((m) => {
        const val = club[m.key] as number | null;
        const stats = divisionStats(compareDivision, m.key);
        const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;

        const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01) : 1;
        const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
        const avgPct = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;

        const barColor = val !== null && stats ? vsAvgColor(val, stats.avg, m.higherBetter) : "#cccccc";

        const isRevenue = m.expandable === "revenue";
        const expandOpen = isRevenue ? revenueOpen : false;
        const toggleExpand = isRevenue ? () => setRevenueOpen((o) => !o) : undefined;

        return (
          <Fragment key={m.key as string}>
            {/* Left cell */}
            <div
              className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-r border-[#e0e0e0] bg-white${toggleExpand ? " cursor-pointer hover:bg-[#fafafa] transition-colors" : ""}`}
              onClick={toggleExpand}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999]">{m.label}</p>
                {toggleExpand && <BreakdownBadge open={expandOpen} />}
              </div>
              {val !== null ? (
                <p className="text-xl sm:text-2xl font-light tabular-nums text-[#111111]">{fmt(val, m.isRatio)}</p>
              ) : (
                <p className="text-xl sm:text-2xl font-light text-[#cccccc]">—</p>
              )}
              {stats && rank !== null && (
                <p className="text-[10px] text-[#aaaaaa] mt-1.5">
                  #{rank} <span className="text-[#cccccc]">of {stats.count}</span>
                </p>
              )}
            </div>

            {/* Right cell */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e0e0e0] bg-white">
              <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">{m.label}</p>

              {/* Club bar */}
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging ? (
                    <DivergingBar value={val ?? 0} scale={scale / 2} color={val !== null ? barColor : "#cccccc"} />
                  ) : (
                    <StandardBar pct={clubPct} color={val !== null ? barColor : "#eeeeee"} />
                  )}
                  <span className="text-xs font-medium tabular-nums text-[#111111] w-14 text-right shrink-0">
                    {fmt(val, m.isRatio)}
                  </span>
                </div>
                <p className="text-[9px] text-[#aaaaaa] tracking-[0.05em]">This club</p>
              </div>

              {/* Division avg bar */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging && stats ? (
                    <DivergingBar value={stats.avg} scale={scale / 2} color="#cccccc" />
                  ) : (
                    <StandardBar pct={avgPct} color="#cccccc" />
                  )}
                  <span className="text-xs tabular-nums text-[#aaaaaa] w-14 text-right shrink-0">
                    {stats ? fmt(stats.avg, m.isRatio) : "—"}
                  </span>
                </div>
                <p className="text-[9px] text-[#cccccc] tracking-[0.05em]">Division avg</p>
              </div>
            </div>

            {/* Inline expansion panels */}
            {isRevenue && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: revenueOpen ? "600px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">Revenue Breakdown</p>
                  <RevenuePanel breakdown={breakdown} totalRevenue={club.revenue} />
                </div>
              </div>
            )}

          </Fragment>
        );
      })}
    </div>
  );
}
