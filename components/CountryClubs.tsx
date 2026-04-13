"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubFinancials, Division } from "@/lib/clubs";

const DIVISIONS: { key: Division; label: string; color: string }[] = [
  { key: "premier-league", label: "Premier League", color: "text-purple-700" },
  { key: "championship",   label: "Championship",   color: "text-sky-700"    },
  { key: "league-one",     label: "League One",     color: "text-amber-700"  },
  { key: "league-two",     label: "League Two",     color: "text-emerald-700"},
];

export default function CountryClubs({ clubs }: { clubs: ClubFinancials[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setExpanded((e) => !e)}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full border text-sm font-medium transition-all ${
            expanded
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
          <span>England</span>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {DIVISIONS.map((div) => {
            const divClubs = clubs
              .filter((c) => c.division === div.key)
              .sort((a, b) => a.name.localeCompare(b.name));
            return (
              <div key={div.key}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${div.color}`}>
                  {div.label}
                </p>
                <ul className="space-y-1.5">
                  {divClubs.map((club) => (
                    <li key={club.slug}>
                      <Link
                        href={`/clubs/${club.slug}`}
                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors leading-tight"
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
