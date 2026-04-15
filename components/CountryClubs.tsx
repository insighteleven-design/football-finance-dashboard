"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubFinancials, Division } from "@/lib/clubs";
import { EUClub, EU_COUNTRY_CONFIG } from "@/lib/euClubs";

function hasEuFinancialData(club: EUClub): boolean {
  const f = club.financials;
  return (
    f.revenue !== null ||
    f.net_profit !== null ||
    f.wage_bill !== null ||
    f.equity !== null ||
    f.total_liabilities !== null ||
    club.historical.some((h) => h.revenue !== null)
  );
}

const LEAGUE_COLORS = [
  "text-[#8888cc]",
  "text-[#6699bb]",
  "text-[#aaaa66]",
  "text-[#66aa88]",
];

const EN_DIVISIONS: { key: Division; label: string }[] = [
  { key: "premier-league", label: "Premier League" },
  { key: "championship",   label: "Championship" },
  { key: "league-one",     label: "League One" },
  { key: "league-two",     label: "League Two" },
];

type CountryKey = "England" | "Germany" | "Netherlands" | "Belgium" | "Austria";

// ─── England club grid ────────────────────────────────────────────────────────

function EnglishClubs({ clubs }: { clubs: ClubFinancials[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {EN_DIVISIONS.map((div, i) => {
        const divClubs = clubs
          .filter((c) => c.division === div.key)
          .sort((a, b) => a.name.localeCompare(b.name));
        return (
          <div key={div.key}>
            <p className={`text-[9px] font-medium uppercase tracking-[0.2em] mb-4 ${LEAGUE_COLORS[i]}`}>
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
  );
}

// ─── European country club grid ───────────────────────────────────────────────

function EuropeanClubs({
  config,
  clubs,
}: {
  config: typeof EU_COUNTRY_CONFIG[number];
  clubs: EUClub[];
}) {
  const countryClubs = clubs.filter((c) => c.country === config.country && hasEuFinancialData(c));
  const cols = Math.min(config.leagues.length, 4);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: "2rem",
      }}
    >
      {config.leagues.map((league, li) => {
        const leagueClubs = countryClubs
          .filter((c) => c.league === league.key)
          .sort((a, b) => a.name.localeCompare(b.name));
        return (
          <div key={league.key}>
            <p className={`text-[9px] font-medium uppercase tracking-[0.2em] mb-4 ${LEAGUE_COLORS[li % 4]}`}>
              {league.label}
            </p>
            <ul className="space-y-2">
              {leagueClubs.map((club) => (
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
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CountryClubs({
  clubs,
  euClubs,
}: {
  clubs: ClubFinancials[];
  euClubs: EUClub[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs: { key: CountryKey; flag: string }[] = [
    { key: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    ...EU_COUNTRY_CONFIG.map((c) => ({
      key: c.country as CountryKey,
      flag: c.flag,
    })),
  ];

  const prev = () => setActiveIndex((i) => (i - 1 + tabs.length) % tabs.length);
  const next = () => setActiveIndex((i) => (i + 1) % tabs.length);

  const active = tabs[activeIndex];
  const activeEuConfig = EU_COUNTRY_CONFIG.find((c) => c.country === active.key);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Carousel selector */}
      <div className="flex items-stretch border border-[#2a2a2a] bg-[#0a0a0a] mb-2">
        <button
          onClick={prev}
          className="px-5 flex items-center text-[#444444] hover:text-white border-r border-[#2a2a2a] transition-colors"
          aria-label="Previous country"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 flex flex-col items-center gap-2 py-7">
          <span className="text-4xl leading-none">{active.flag}</span>
          <span className="text-sm font-light tracking-[0.1em] text-white">{active.key}</span>
          <div className="flex gap-2 mt-1">
            {tabs.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === activeIndex ? "bg-[#888888]" : "bg-[#2a2a2a] hover:bg-[#444444]"
                }`}
                aria-label={`Go to ${tabs[i].key}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={next}
          className="px-5 flex items-center text-[#444444] hover:text-white border-l border-[#2a2a2a] transition-colors"
          aria-label="Next country"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Club panel */}
      <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-8">
        {active.key === "England" ? (
          <EnglishClubs clubs={clubs} />
        ) : activeEuConfig ? (
          <EuropeanClubs config={activeEuConfig} clubs={euClubs} />
        ) : null}
      </div>
    </div>
  );
}
