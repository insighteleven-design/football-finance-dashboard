"use client";

import { useState } from "react";
import type { RevenueBreakdown } from "@/lib/deepDive";

interface Props {
  breakdown: RevenueBreakdown | null;
  /** Club's total revenue from the main financials (used to show "other/unallocated" slice) */
  totalRevenue: number | null;
}

const SEGMENTS = [
  { key: "matchday",      label: "Matchday",      color: "#4A90D9" },
  { key: "broadcasting",  label: "Broadcasting",  color: "#9B59B6" },
  { key: "commercial",    label: "Commercial",    color: "#E8A838" },
] as const;

function fmt(v: number): string {
  return `£${v.toFixed(1)}m`;
}

export default function RevenueBreakdownSection({ breakdown, totalRevenue }: Props) {
  const [open, setOpen] = useState(false);

  const hasData = breakdown !== null &&
    (breakdown.matchday !== null || breakdown.broadcasting !== null || breakdown.commercial !== null);

  // Compute the denominator for percentages
  const knownSum =
    (breakdown?.matchday ?? 0) +
    (breakdown?.broadcasting ?? 0) +
    (breakdown?.commercial ?? 0);

  // Use totalRevenue if segments don't fully account for it (missing segments)
  const denominator = totalRevenue && totalRevenue > knownSum ? totalRevenue : knownSum;
  const otherAmount = denominator - knownSum;

  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-[#fafafa] transition-colors"
        aria-expanded={open}
      >
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">
          Revenue Breakdown
        </p>
        <span
          className="text-[11px] text-[#cccccc] transition-transform duration-200 shrink-0"
          style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          →
        </span>
      </button>

      {/* Expandable content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "600px" : "0px" }}
      >
        <div className="px-6 py-5 border-t border-[#e0e0e0] bg-white">
          {!hasData ? (
            <p className="text-sm text-[#aaaaaa] italic">
              Revenue breakdown not disclosed in this filing.
            </p>
          ) : (
            <>
              {/* Stacked bar */}
              <div className="h-8 flex overflow-hidden mb-5" style={{ borderRadius: "2px" }}>
                {SEGMENTS.map(({ key, color }) => {
                  const val = breakdown![key];
                  if (val === null || denominator === 0) return null;
                  const pct = (val / denominator) * 100;
                  return (
                    <div
                      key={key}
                      className="h-full"
                      style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? 2 : 0 }}
                      title={`${key}: ${fmt(val)}`}
                    />
                  );
                })}
                {otherAmount > 0.5 && denominator > 0 && (
                  <div
                    className="h-full"
                    style={{
                      width: `${(otherAmount / denominator) * 100}%`,
                      backgroundColor: "#dddddd",
                      minWidth: 2,
                    }}
                    title={`Other / unallocated: ${fmt(otherAmount)}`}
                  />
                )}
                {/* Background fill for missing segments */}
                {knownSum === 0 && (
                  <div className="h-full flex-1 bg-[#eeeeee]" />
                )}
              </div>

              {/* Legend rows */}
              <div className="space-y-2.5">
                {SEGMENTS.map(({ key, label, color }) => {
                  const val = breakdown![key];
                  const pct = val !== null && denominator > 0 ? (val / denominator) * 100 : null;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 shrink-0"
                        style={{ backgroundColor: color, borderRadius: "50%" }}
                      />
                      <span className="text-[11px] text-[#666666] w-28">{label}</span>
                      <span className="text-[11px] font-light tabular-nums text-[#111111] w-14">
                        {val !== null ? fmt(val) : "—"}
                      </span>
                      <span className="text-[11px] text-[#aaaaaa] tabular-nums">
                        {pct !== null ? `${pct.toFixed(0)}%` : "—"}
                      </span>
                    </div>
                  );
                })}
                {otherAmount > 0.5 && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 shrink-0"
                      style={{ backgroundColor: "#dddddd", borderRadius: "50%" }}
                    />
                    <span className="text-[11px] text-[#999999] w-28">Other / unallocated</span>
                    <span className="text-[11px] font-light tabular-nums text-[#aaaaaa] w-14">
                      {fmt(otherAmount)}
                    </span>
                    <span className="text-[11px] text-[#cccccc] tabular-nums">
                      {denominator > 0 ? `${((otherAmount / denominator) * 100).toFixed(0)}%` : "—"}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
