"use client";

import { Fragment, useState } from "react";
import { fmt } from "@/lib/clubs";
import type { FinancialSnapshot } from "@/lib/clubs";
import type { RevenueBreakdown, DebtBreakdown } from "@/lib/deepDive";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  data: FinancialSnapshot;
  divisionData: FinancialSnapshot[];
  compareLabel: string;
  breakdown?: RevenueBreakdown | null;
  debtBreakdown?: DebtBreakdown | null;
}

// ─── Metrics config ───────────────────────────────────────────────────────────

const ALL_METRICS: {
  key: keyof FinancialSnapshot;
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
  { key: "net_debt",                   label: "Net Debt",          diverging: true, higherBetter: false, expandable: "debt" },
];

// ─── Division stats ───────────────────────────────────────────────────────────

function divisionStats(divisionData: FinancialSnapshot[], key: keyof FinancialSnapshot) {
  const vals = divisionData
    .map((c) => c[key])
    .filter((v): v is number => v !== null);
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

// ─── Debt breakdown panel ─────────────────────────────────────────────────────

const DEBT_COLORS: Record<string, string> = {
  owner_loan:         "#cc8844",
  bank:               "#4A90D9",
  lease:              "#9B59B6",
  pension:            "#999999",
  bond:               "#E84A3A",
  transfer_payables:  "#4A9A6A",
  other:              "#bbbbbb",
};

function DebtPanel({ breakdown }: { breakdown: DebtBreakdown }) {
  const totalGross = breakdown.segments.reduce((s, seg) => s + seg.amount, 0);
  const net = totalGross - (breakdown.cash ?? 0);

  return (
    <>
      {/* Stacked bar — gross debt only */}
      {totalGross > 0 && (
        <div className="h-7 flex overflow-hidden mb-5" style={{ borderRadius: "2px" }}>
          {breakdown.segments.map((seg) => {
            const pct = (seg.amount / totalGross) * 100;
            return (
              <div
                key={seg.label}
                className="h-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: DEBT_COLORS[seg.type] ?? "#aaaaaa",
                  minWidth: pct > 0 ? 2 : 0,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Legend — debt segments */}
      <div className="space-y-2.5">
        {breakdown.segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: DEBT_COLORS[seg.type] ?? "#aaaaaa" }} />
            <span className="text-[11px] text-[#666666] flex-1">{seg.label}</span>
            <span className="text-[11px] font-light tabular-nums text-[#111111] w-16 text-right shrink-0">
              £{seg.amount.toFixed(2)}m
            </span>
            {seg.note && (
              <span className="text-[10px] text-[#aaaaaa] w-36 shrink-0 text-right">{seg.note}</span>
            )}
          </div>
        ))}

        {/* Cash */}
        {breakdown.cash !== null && (
          <div className="flex items-center gap-3 border-t border-[#eeeeee] pt-2.5 mt-1">
            <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#4a9a6a" }} />
            <span className="text-[11px] text-[#666666] flex-1">Cash at bank</span>
            <span className="text-[11px] font-light tabular-nums text-[#4a9a6a] w-16 text-right shrink-0">
              (£{breakdown.cash.toFixed(2)}m)
            </span>
            <span className="w-36 shrink-0" />
          </div>
        )}

        {/* Net */}
        <div className="flex items-center gap-3 border-t border-[#e0e0e0] pt-2.5">
          <div className="w-2.5 h-2.5 shrink-0" />
          <span className="text-[11px] font-medium text-[#111111] flex-1">Net debt / (cash)</span>
          <span
            className={`text-[11px] font-medium tabular-nums w-16 text-right shrink-0 ${
              net <= 0 ? "text-[#4a9a6a]" : "text-[#9a4a4a]"
            }`}
          >
            {net <= 0 ? `(£${Math.abs(net).toFixed(2)}m)` : `£${net.toFixed(2)}m`}
          </span>
          <span className="w-36 shrink-0" />
        </div>
      </div>

      {/* Notes */}
      {breakdown.notes && (
        <p className="text-[10px] text-[#aaaaaa] mt-4 leading-relaxed">{breakdown.notes}</p>
      )}
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

export default function MetricsGrid({ data, divisionData, compareLabel, breakdown, debtBreakdown }: Props) {
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);

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
        const val = data[m.key];
        const stats = divisionStats(divisionData, m.key);
        const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;

        const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01) : 1;
        const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
        const avgPct = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;

        const barColor = val !== null && stats ? vsAvgColor(val, stats.avg, m.higherBetter) : "#cccccc";

        const isRevenue = m.expandable === "revenue";
        const isDebt = m.expandable === "debt";
        const expandOpen = isRevenue ? revenueOpen : isDebt ? debtOpen : false;
        const toggleExpand =
          (isRevenue && breakdown !== undefined)
            ? () => setRevenueOpen((o) => !o)
            : (isDebt && debtBreakdown != null)
            ? () => setDebtOpen((o) => !o)
            : undefined;

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

            {/* Inline expansion panel — Revenue */}
            {isRevenue && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: revenueOpen ? "600px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">Revenue Breakdown</p>
                  <RevenuePanel breakdown={breakdown ?? null} totalRevenue={data.revenue} />
                </div>
              </div>
            )}

            {/* Inline expansion panel — Debt */}
            {isDebt && debtBreakdown != null && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: debtOpen ? "600px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">Debt Breakdown</p>
                  <DebtPanel breakdown={debtBreakdown} />
                </div>
              </div>
            )}

          </Fragment>
        );
      })}
    </div>
  );
}
