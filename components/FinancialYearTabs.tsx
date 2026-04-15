"use client";

import { useState } from "react";
import MetricsGrid from "./MetricsGrid";
import YearOnYearSection from "./YearOnYearSection";
import type { ClubFinancials, FinancialSnapshot } from "@/lib/clubs";
import type { RevenueBreakdown } from "@/lib/deepDive";

interface Props {
  club: ClubFinancials;
  // Current year
  currentData: FinancialSnapshot;
  currentDivisionData: FinancialSnapshot[];
  currentLabel: string;
  compareLabel: string;
  breakdown: RevenueBreakdown | null;
  // Prior year (null = no prior year available for this club)
  priorData: FinancialSnapshot | null;
  priorDivisionData: FinancialSnapshot[];
  priorLabel: string | null;
  priorCompareLabel: string;
}

type TabKey = "year1" | "year2" | "yoy";

function hasFinancialData(snap: FinancialSnapshot): boolean {
  return (
    snap.revenue !== null ||
    snap.wage_bill !== null ||
    snap.operating_profit !== null ||
    snap.pre_tax_profit !== null ||
    snap.net_debt !== null
  );
}

export default function FinancialYearTabs({
  club,
  currentData,
  currentDivisionData,
  currentLabel,
  compareLabel,
  breakdown,
  priorData,
  priorDivisionData,
  priorLabel,
  priorCompareLabel,
}: Props) {
  const hasPriorYear = priorData !== null;
  const [tab, setTab] = useState<TabKey>("year2");

  type TabDef = { key: TabKey; short: string; full: string };
  const tabs: TabDef[] = [
    ...(hasPriorYear
      ? [{ key: "year1" as TabKey, short: priorLabel ?? "Prior Year", full: priorLabel ?? "Prior Year" }]
      : []),
    { key: "year2", short: currentLabel, full: currentLabel },
    ...(hasPriorYear ? [{ key: "yoy" as TabKey, short: "YoY", full: "Year on Year" }] : []),
  ];

  return (
    <div>
      {/* Inner tab bar — only rendered when prior year data exists */}
      {hasPriorYear && (
        <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
          {tabs.map(({ key, short, full }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 sm:px-5 py-2.5 text-xs font-medium tracking-[0.08em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                tab === key
                  ? "border-[#111111] text-[#111111]"
                  : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
              }`}
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{full}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {tab === "year2" && (
        hasFinancialData(currentData) ? (
          <MetricsGrid
            data={currentData}
            divisionData={currentDivisionData}
            compareLabel={compareLabel}
            breakdown={breakdown}
          />
        ) : (
          <p className="text-sm text-[#aaaaaa] italic py-4">No financial data available for this club.</p>
        )
      )}

      {tab === "year1" && priorData && (
        hasFinancialData(priorData) ? (
          <MetricsGrid
            data={priorData}
            divisionData={priorDivisionData}
            compareLabel={priorCompareLabel}
          />
        ) : (
          <p className="text-sm text-[#aaaaaa] italic py-4">No financial data available for this year.</p>
        )
      )}

      {tab === "yoy" && <YearOnYearSection club={club} />}
    </div>
  );
}
