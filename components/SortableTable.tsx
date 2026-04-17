"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubFinancials, METRICS, fmt } from "@/lib/clubs";

type SortDir = "asc" | "desc";

function ValueCell({ value, metricKey }: { value: number | null; metricKey: keyof ClubFinancials }) {
  if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
  const isRatio = metricKey === "wage_ratio";
  const formatted = fmt(value, isRatio);

  // For most metrics, negative = bad (red). For net_debt, negative = net cash position (good = green).
  let cls = "text-gray-900";
  if (metricKey === "net_debt") {
    cls = value > 0 ? "text-red-600" : value < 0 ? "text-green-600" : "text-gray-900";
  } else if (["operating_profit", "pre_tax_profit"].includes(metricKey as string)) {
    cls = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-900";
  }

  return <span className={cls}>{formatted}</span>;
}

export default function SortableTable({ clubs }: { clubs: ClubFinancials[] }) {
  const [sortKey, setSortKey] = useState<keyof ClubFinancials>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: keyof ClubFinancials) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...clubs].sort((a, b) => {
    const av = a[sortKey] as number | null;
    const bv = b[sortKey] as number | null;
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const columns: { key: keyof ClubFinancials; label: string }[] = [
    { key: "revenue",          label: "Revenue" },
    { key: "wage_bill",        label: "Wages" },
    { key: "wage_ratio",       label: "Wage Ratio" },
    { key: "operating_profit", label: "Op. Profit / (Loss)" },
    { key: "pre_tax_profit",   label: "Pre-tax P / (L)" },
    { key: "net_debt",         label: "Net Debt" },
    { key: "cash",             label: "Cash" },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Club
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              FY End
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-blue-600 select-none"
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  {col.label}
                  {sortKey === col.key ? (
                    <span className="text-blue-600">{sortDir === "desc" ? " ↓" : " ↑"}</span>
                  ) : (
                    <span className="text-gray-300"> ↕</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((club, i) => (
            <tr key={club.slug} className={`hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
              <td className="sticky left-0 bg-inherit px-4 py-3 font-medium whitespace-nowrap">
                <Link href={`/clubs/${club.slug}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                  {club.name}
                </Link>
              </td>
              <td className="px-3 py-3 text-gray-500 whitespace-nowrap text-xs">
                {new Date(club.fiscal_year_end).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </td>
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-3 text-right tabular-nums whitespace-nowrap font-mono text-xs">
                  <ValueCell value={club[col.key] as number | null} metricKey={col.key} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
