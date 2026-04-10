"use client";

import { useState } from "react";
import { ClubFinancials, METRICS, fmt } from "@/lib/clubs";

interface Props { clubs: ClubFinancials[] }

export default function MetricChart({ clubs }: Props) {
  const [metricKey, setMetricKey] = useState<keyof ClubFinancials>("revenue");
  const isRatio = metricKey === "wage_ratio";
  const metric = METRICS.find((m) => m.key === metricKey)!;

  const data = [...clubs]
    .filter((c) => c[metricKey] !== null && c[metricKey] !== undefined)
    .sort((a, b) => ((b[metricKey] as number) ?? 0) - ((a[metricKey] as number) ?? 0))
    .map((c) => ({ name: c.name, slug: c.slug, value: c[metricKey] as number }));

  const hasNegative = data.some((d) => d.value < 0);
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)));

  // Colour logic: positive=green / negative=red for profit/debt metrics; blue otherwise
  function barColor(v: number) {
    if (metricKey === "net_debt")
      return v > 0 ? "#f87171" : "#4ade80";
    if (metricKey === "operating_profit" || metricKey === "pre_tax_profit")
      return v >= 0 ? "#4ade80" : "#f87171";
    return "#3b82f6";
  }

  const BAR_H = "h-5"; // Tailwind class for bar height

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{metric.label} Comparison</h2>
          <p className="text-xs text-gray-500 mt-0.5">{metric.description} — all figures in £m</p>
        </div>
        <select
          value={metricKey as string}
          onChange={(e) => setMetricKey(e.target.value as keyof ClubFinancials)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {METRICS.map((m) => (
            <option key={m.key as string} value={m.key as string}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Chart rows */}
      <div className="space-y-1.5">
        {data.map((d) => {
          const pct = (Math.abs(d.value) / maxAbs) * 100;

          return (
            <div key={d.slug} className="flex items-center gap-2 group">
              {/* Club name */}
              <span className="w-28 shrink-0 text-right text-xs text-gray-600 group-hover:text-gray-900 truncate">
                {d.name}
              </span>

              {hasNegative ? (
                /* Split layout: negative bars grow left, positive bars grow right */
                <div className="flex flex-1 items-center">
                  {/* Left (negative) side */}
                  <div className="flex flex-1 justify-end">
                    {d.value < 0 && (
                      <div
                        className={`${BAR_H} rounded-l-sm`}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: barColor(d.value),
                        }}
                      />
                    )}
                  </div>
                  {/* Zero line */}
                  <div className="w-px self-stretch bg-gray-200 shrink-0" />
                  {/* Right (positive) side */}
                  <div className="flex flex-1 justify-start">
                    {d.value >= 0 && (
                      <div
                        className={`${BAR_H} rounded-r-sm`}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: barColor(d.value),
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Simple left-aligned layout for all-positive metrics */
                <div className="flex flex-1 items-center">
                  <div
                    className={`${BAR_H} rounded-sm`}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor(d.value),
                      minWidth: 2,
                    }}
                  />
                </div>
              )}

              {/* Value label */}
              <span className="w-16 shrink-0 text-right text-xs tabular-nums font-mono text-gray-500 group-hover:text-gray-900">
                {fmt(d.value, isRatio)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
