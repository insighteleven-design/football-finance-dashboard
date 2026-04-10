"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { ClubFinancials, METRICS, fmt } from "@/lib/clubs";

interface Props { clubs: ClubFinancials[] }

export default function MetricChart({ clubs }: Props) {
  const [metricKey, setMetricKey] = useState<keyof ClubFinancials>("revenue");
  const isRatio = metricKey === "wage_ratio";

  const metric = METRICS.find((m) => m.key === metricKey)!;

  const data = [...clubs]
    .filter((c) => c[metricKey] !== null && c[metricKey] !== undefined)
    .sort((a, b) => ((b[metricKey] as number) ?? 0) - ((a[metricKey] as number) ?? 0))
    .map((c) => ({
      name: c.name,
      value: c[metricKey] as number,
      slug: c.slug,
    }));

  const barColor = (v: number) => {
    if (metricKey === "net_debt") return v > 0 ? "#f87171" : "#4ade80";
    if (metricKey === "operating_profit" || metricKey === "pre_tax_profit")
      return v >= 0 ? "#4ade80" : "#f87171";
    return "#3b82f6";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
            <option key={m.key as string} value={m.key as string}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Parent div must have an explicit pixel height for ResponsiveContainer to expand into */}
      <div style={{ height: Math.max(600, data.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 80, left: 110, bottom: 4 }}>
          <XAxis
            type="number"
            tickFormatter={(v) => fmt(v, isRatio)}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            interval={0}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={115}
          />
          <Tooltip
            formatter={(v) => [fmt(v as number, isRatio), metric.label]}
            contentStyle={{
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 12,
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            }}
            cursor={{ fill: "rgba(59,130,246,0.05)" }}
          />
          <ReferenceLine x={0} stroke="#e5e7eb" strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={20}>
            {data.map((entry) => (
              <Cell key={entry.slug} fill={barColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
