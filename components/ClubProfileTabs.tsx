"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export default function ClubProfileTabs({
  financial,
  assets,
}: {
  financial: ReactNode;
  assets: ReactNode;
}) {
  const [tab, setTab] = useState<"financial" | "assets">("financial");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[#e0e0e0] mb-6">
        {(
          [
            { key: "financial", label: "Financial Information" },
            { key: "assets",    label: "Fixed Assets" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-xs font-medium tracking-[0.08em] uppercase border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-[#111111] text-[#111111]"
                : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "financial" ? financial : assets}
    </div>
  );
}
