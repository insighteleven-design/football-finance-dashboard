"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubFinancials, Division } from "@/lib/clubs";

const DIVISIONS: { key: Division; label: string; color: string }[] = [
  { key: "premier-league", label: "Premier League", color: "text-[#8888cc]" },
  { key: "championship",   label: "Championship",   color: "text-[#6699bb]" },
  { key: "league-one",     label: "League One",     color: "text-[#aaaa66]" },
  { key: "league-two",     label: "League Two",     color: "text-[#66aa88]" },
];

export default function CountryClubs({ clubs }: { clubs: ClubFinancials[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center mb-10">
        <button
          onClick={() => setExpanded((e) => !e)}
          className={`flex items-center gap-3 px-6 py-3 rounded-sm border text-sm font-light tracking-[0.05em] transition-all ${
            expanded
              ? "border-white text-white bg-[#111111]"
              : "border-[#2a2a2a] text-[#888888] bg-[#0a0a0a] hover:border-[#555555] hover:text-white"
          }`}
        >
          <span className="text-base">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
          <span>England</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border border-[#2a2a2a] rounded-sm bg-[#0a0a0a] p-8">
          {DIVISIONS.map((div) => {
            const divClubs = clubs
              .filter((c) => c.division === div.key)
              .sort((a, b) => a.name.localeCompare(b.name));
            return (
              <div key={div.key}>
                <p className={`text-[9px] font-medium uppercase tracking-[0.2em] mb-4 ${div.color}`}>
                  {div.label}
                </p>
                <ul className="space-y-2">
                  {divClubs.map((club) => (
                    <li key={club.slug}>
                      <Link
                        href={`/clubs/${club.slug}`}
                        className="text-sm text-[#888888] hover:text-white transition-colors leading-tight"
                      >
                        {club.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
