"use client";

import { useState } from "react";
import { ClubFinancials, Division } from "@/lib/clubs";
import SortableTable from "./SortableTable";
import MetricChart from "./MetricChart";

type Filter = Division | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",            label: "All Clubs" },
  { value: "premier-league", label: "Premier League" },
  { value: "championship",   label: "Championship" },
  { value: "league-one",     label: "League One" },
  { value: "league-two",     label: "League Two" },
];

export default function DashboardView({
  clubs,
  initialDivision = "premier-league",
}: {
  clubs: ClubFinancials[];
  initialDivision?: string;
}) {
  const [active, setActive] = useState<Filter>(
    (FILTERS.find((f) => f.value === initialDivision)?.value ?? "premier-league") as Filter
  );

  const visible = active === "all" ? clubs : clubs.filter((c) => c.division === active);

  return (
    <div>
      {/* Division filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              active === f.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-xs tabular-nums ${active === f.value ? "text-gray-400" : "text-gray-400"}`}>
              {f.value === "all"
                ? clubs.length
                : clubs.filter((c) => c.division === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <MetricChart clubs={visible} />
      </section>

      {/* Table */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            {FILTERS.find(f => f.value === active)?.label ?? "All Clubs"}
            <span className="ml-2 text-sm font-normal text-gray-400">{visible.length} clubs</span>
          </h2>
          <span className="text-xs text-gray-400 hidden sm:block">
            Click a column header to sort · Click a club name for full profile
          </span>
        </div>
        <SortableTable clubs={visible} />
      </section>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Positive value
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Negative value / net debt
        </span>
        <span>— Not available</span>
      </div>
    </div>
  );
}
