"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export interface TabDef {
  key: string;
  label: string;
  labelFull?: string;
  content: ReactNode | null;
}

export default function ClubProfileTabs({ tabs }: { tabs: TabDef[] }) {
  const visible = tabs.filter((t) => t.content != null);
  const [active, setActive] = useState<string>(() => visible[0]?.key ?? "");

  if (!visible.length) return null;

  return (
    <div>
      <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
        {visible.map(({ key, label, labelFull }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`px-5 sm:px-7 py-4 text-base font-bold tracking-[0.04em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
              active === key
                ? "border-[#111111] text-[#111111]"
                : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
            }`}
          >
            {labelFull ? (
              <>
                <span className="sm:hidden">{label}</span>
                <span className="hidden sm:inline">{labelFull}</span>
              </>
            ) : (
              label
            )}
          </button>
        ))}
      </div>
      {visible.find((t) => t.key === active)?.content}
    </div>
  );
}
