"use client";

import { useState } from "react";
import { type ComparableClub, fmtVal } from "@/lib/comparable";

const RANKING_METRICS: {
  key: keyof ComparableClub;
  label: string;
  isRatio?: boolean;
}[] = [
  { key: "revenue",        label: "Revenue" },
  { key: "wage_bill",      label: "Wage Bill" },
  { key: "wage_ratio",     label: "Wage Ratio",    isRatio: true },
  { key: "pre_tax_profit", label: "Pre-tax Result" },
  { key: "net_debt",       label: "Net Debt" },
];

const DIVERGING = new Set(["pre_tax_profit", "net_debt"]);

function barColor(metricKey: string, value: number): string {
  if (metricKey === "pre_tax_profit") return value >= 0 ? "#22c55e" : "#ef4444";
  if (metricKey === "net_debt")       return value >  0 ? "#ef4444" : "#22c55e";
  return "#4A90D9";
}

export default function RankingsTable({ allClubs }: { allClubs: ComparableClub[] }) {
  const [metricKey, setMetricKey] = useState<keyof ComparableClub>("revenue");
  const [showAll, setShowAll]     = useState(false);
  const DEFAULT_ROWS = 30;

  const metric = RANKING_METRICS.find((m) => m.key === metricKey)!;

  const ranked = [...allClubs]
    .filter((c) => (c[metricKey] as number | null) !== null)
    .sort((a, b) => (b[metricKey] as number) - (a[metricKey] as number));

  const displayed = showAll ? ranked : ranked.slice(0, DEFAULT_ROWS);
  const maxAbs    = Math.max(...ranked.map((c) => Math.abs(c[metricKey] as number)), 0.01);

  return (
    <div>
      {/* Metric tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid #e8e8e8", marginBottom: "1.5rem" }}>
        {RANKING_METRICS.map((m) => {
          const active = m.key === metricKey;
          return (
            <button
              key={m.key as string}
              onClick={() => { setMetricKey(m.key); setShowAll(false); }}
              style={{
                padding: "0.625rem 1rem",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: active ? "#111111" : "#999999",
                borderBottom: `2px solid ${active ? "#111111" : "transparent"}`,
                marginBottom: "-1px",
                background: "none",
                border: "none",
                borderBottomStyle: "solid",
                borderBottomWidth: "2px",
                borderBottomColor: active ? "#111111" : "transparent",
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div>
        {displayed.map((club, i) => {
          const value    = club[metricKey] as number;
          const barPct   = Math.min((Math.abs(value) / maxAbs) * 100, 100);
          const isDiverg = DIVERGING.has(metricKey as string);
          const color    = isDiverg ? barColor(metricKey as string, value) : "#4A90D9";
          const isNeg    = value < 0;
          const valueColor = isDiverg
            ? (metricKey === "net_debt"
                ? (isNeg ? "#22c55e" : "#ef4444")
                : (isNeg ? "#ef4444" : "#22c55e"))
            : "#111111";

          return (
            <div
              key={club.slug}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid #f5f5f5" }}
            >
              <span style={{ fontSize: "10px", fontVariantNumeric: "tabular-nums", width: "1.5rem", textAlign: "right", flexShrink: 0, color: "#cccccc" }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", color: "#111111" }}>{club.name}</span>
                  <span style={{ fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#cccccc" }}>
                    {club.divisionLabel}
                  </span>
                </div>
                <div style={{ marginTop: "4px", height: "4px", backgroundColor: "#f0f0f0", maxWidth: "280px", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: color, opacity: 0.7, borderRadius: "2px" }} />
                </div>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 500, fontVariantNumeric: "tabular-nums", flexShrink: 0, width: "5.5rem", textAlign: "right", color: valueColor }}>
                {fmtVal(value, metric.isRatio, club.currency)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Show all */}
      {!showAll && ranked.length > DEFAULT_ROWS && (
        <button
          onClick={() => setShowAll(true)}
          style={{ marginTop: "1rem", fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "#999999", cursor: "pointer", background: "none", border: "none", padding: 0 }}
        >
          Show all {ranked.length} clubs ↓
        </button>
      )}
    </div>
  );
}
