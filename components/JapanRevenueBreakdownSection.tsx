"use client";

import type { JapanRevenueBreakdown } from "@/lib/japanDeepDive";

const SEGMENTS = [
  { key: "sponsorship",  label: "Sponsorship",        color: "#E8A838" },
  { key: "admission",    label: "Admission",           color: "#4A90D9" },
  { key: "broadcast",    label: "J-League Distribution", color: "#9B59B6" },
  { key: "merchandise",  label: "Merchandise",         color: "#E84A3A" },
  { key: "academy",      label: "Academy",             color: "#4A9A6A" },
  { key: "women",        label: "Women's Team",        color: "#7FBBDA" },
] as const;

function fmtUsd(v: number): string {
  return `$${v.toFixed(1)}m`;
}

interface Props {
  breakdown: JapanRevenueBreakdown | null;
  totalRevenue: number | null;
}

export default function JapanRevenueBreakdownSection({ breakdown, totalRevenue }: Props) {
  const hasData =
    breakdown !== null &&
    Object.values(breakdown).some((v) => v !== null && v > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-[#aaaaaa] italic">Revenue breakdown not available.</p>
    );
  }

  const knownSum =
    (breakdown!.sponsorship ?? 0) +
    (breakdown!.admission ?? 0) +
    (breakdown!.broadcast ?? 0) +
    (breakdown!.merchandise ?? 0) +
    (breakdown!.academy ?? 0) +
    (breakdown!.women ?? 0);

  const denominator = totalRevenue && totalRevenue > knownSum ? totalRevenue : knownSum;
  const otherAmount = Math.max(0, denominator - knownSum);

  return (
    <>
      {/* Stacked bar */}
      <div className="h-7 flex overflow-hidden mb-5" style={{ borderRadius: "2px" }}>
        {SEGMENTS.map(({ key, color }) => {
          const val = breakdown![key];
          if (!val || denominator === 0) return null;
          const pct = (val / denominator) * 100;
          return (
            <div
              key={key}
              className="h-full"
              style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? 2 : 0 }}
            />
          );
        })}
        {otherAmount > 0.005 && denominator > 0 && (
          <div
            className="h-full"
            style={{ width: `${(otherAmount / denominator) * 100}%`, backgroundColor: "#dddddd", minWidth: 2 }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {SEGMENTS.map(({ key, label, color }) => {
          const val = breakdown![key];
          if (!val) return null;
          const pct = denominator > 0 ? (val / denominator) * 100 : null;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-[#666666] w-36">{label}</span>
              <span className="text-[11px] font-light tabular-nums text-[#111111] w-14">{fmtUsd(val)}</span>
              <span className="text-[11px] text-[#aaaaaa] tabular-nums">
                {pct !== null ? `${pct.toFixed(0)}%` : "—"}
              </span>
            </div>
          );
        })}
        {otherAmount > 0.005 && (
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#dddddd" }} />
            <span className="text-[11px] text-[#999999] w-36">Other</span>
            <span className="text-[11px] font-light tabular-nums text-[#aaaaaa] w-14">{fmtUsd(otherAmount)}</span>
            <span className="text-[11px] text-[#cccccc] tabular-nums">
              {denominator > 0 ? `${((otherAmount / denominator) * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
