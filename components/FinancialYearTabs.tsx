"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import MetricsGrid from "./MetricsGrid";
import YearOnYearSection from "./YearOnYearSection";
import type { ClubFinancials, FinancialSnapshot } from "@/lib/clubs";
import type { RevenueBreakdown, DebtBreakdown } from "@/lib/deepDive";

interface Props {
  club: ClubFinancials;
  // Current year
  currentData: FinancialSnapshot;
  currentDivisionData: FinancialSnapshot[];
  currentLabel: string;
  compareLabel: string;
  breakdown: RevenueBreakdown | null;
  debtBreakdown: DebtBreakdown | null;
  extraSection?: ReactNode;
  priorExtraSection?: ReactNode;
  // Prior year (null = no prior year available for this club)
  priorData: FinancialSnapshot | null;
  priorDivisionData: FinancialSnapshot[];
  priorLabel: string | null;
  priorCompareLabel: string;
  // FY2023 year
  data2023?: FinancialSnapshot | null;
  data2023DivisionData?: FinancialSnapshot[];
  data2023Label?: string | null;
  data2023CompareLabel?: string;
  // FY2022 year
  data2022?: FinancialSnapshot | null;
  data2022DivisionData?: FinancialSnapshot[];
  data2022Label?: string | null;
  data2022CompareLabel?: string;
}

type TabKey = "year4" | "year3" | "year1" | "year2" | "yoy";

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
  debtBreakdown,
  extraSection,
  priorExtraSection,
  priorData,
  priorDivisionData,
  priorLabel,
  priorCompareLabel,
  data2023,
  data2023DivisionData,
  data2023Label,
  data2023CompareLabel,
  data2022,
  data2022DivisionData,
  data2022Label,
  data2022CompareLabel,
}: Props) {
  const hasPriorYear = priorData !== null;
  const has2023 = !!data2023;
  const has2022 = !!data2022;

  const [tab, setTab] = useState<TabKey>(hasPriorYear ? "yoy" : "year2");

  type TabDef = { key: TabKey; short: string; full: string };
  const tabs: TabDef[] = [
    ...(has2022 && data2022Label ? [{ key: "year4" as TabKey, short: data2022Label, full: data2022Label }] : []),
    ...(has2023 && data2023Label ? [{ key: "year3" as TabKey, short: data2023Label, full: data2023Label }] : []),
    ...(hasPriorYear
      ? [{ key: "year1" as TabKey, short: priorLabel ?? "Prior Year", full: priorLabel ?? "Prior Year" }]
      : []),
    { key: "year2", short: currentLabel, full: currentLabel },
    ...(hasPriorYear ? [{ key: "yoy" as TabKey, short: "YoY", full: "Year on Year" }] : []),
  ];

  return (
    <div>
      {/* Inner tab bar */}
      {(hasPriorYear || has2023 || has2022) && (
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
          <>
            <MetricsGrid
              data={currentData}
              divisionData={currentDivisionData}
              compareLabel={compareLabel}
              breakdown={breakdown}
              debtBreakdown={debtBreakdown}
            />
            {extraSection}
          </>
        ) : (
          <p className="text-sm text-[#aaaaaa] italic py-4">No financial data available for this club.</p>
        )
      )}

      {tab === "year1" && priorData && (
        hasFinancialData(priorData) ? (
          <>
            <MetricsGrid
              data={priorData}
              divisionData={priorDivisionData}
              compareLabel={priorCompareLabel}
            />
            {priorExtraSection}
          </>
        ) : (
          <p className="text-sm text-[#aaaaaa] italic py-4">No financial data available for this year.</p>
        )
      )}

      {tab === "year3" && data2023 && (
        hasFinancialData(data2023) ? (
          <MetricsGrid
            data={data2023}
            divisionData={data2023DivisionData ?? []}
            compareLabel={data2023CompareLabel ?? ""}
          />
        ) : (
          <p className="text-sm text-[#aaaaaa] italic py-4">No financial data available for this year.</p>
        )
      )}

      {tab === "year4" && data2022 && (
        hasFinancialData(data2022) ? (
          <MetricsGrid
            data={data2022}
            divisionData={data2022DivisionData ?? []}
            compareLabel={data2022CompareLabel ?? ""}
          />
        ) : (
          <p className="text-sm text-[#aaaaaa] italic py-4">No financial data available for this year.</p>
        )
      )}

      {tab === "yoy" && <YearOnYearSection club={club} />}
    </div>
  );
}
