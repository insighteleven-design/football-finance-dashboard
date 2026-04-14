"use client";

import { useState } from "react";
import type { ReactNode } from "react";

const TABS = [
  { key: "financial", label: "Financials",   labelFull: "Financial Information" },
  { key: "assets",    label: "Fixed Assets", labelFull: "Fixed Assets" },
  { key: "market",    label: "Market",       labelFull: "Market Context" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ClubProfileTabs({
  financial,
  assets,
  market,
}: {
  financial: ReactNode;
  assets: ReactNode;
  market: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("financial");

  const content: Record<TabKey, ReactNode> = { financial, assets, market };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
        {TABS.map(({ key, label, labelFull }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 sm:px-5 py-2.5 text-xs font-medium tracking-[0.08em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
              tab === key
                ? "border-[#111111] text-[#111111]"
                : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
            }`}
          >
            <span className="sm:hidden">{label}</span>
            <span className="hidden sm:inline">{labelFull}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {content[tab]}
    </div>
  );
}
