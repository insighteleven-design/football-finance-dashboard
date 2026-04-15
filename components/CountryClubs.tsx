"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubFinancials, Division } from "@/lib/clubs";
import { EUClub, EU_COUNTRY_CONFIG } from "@/lib/euClubs";

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
  const countryClubs = clubs.filter((c) => c.country === config.country);
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
  const [active, setActive] = useState<CountryKey>("England");

  const tabs: { key: CountryKey; flag: string; count: number }[] = [
    { key: "England",     flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", count: clubs.length },
    ...EU_COUNTRY_CONFIG.map((c) => ({
      key: c.country as CountryKey,
      flag: c.flag,
      count: euClubs.filter((ec) => ec.country === c.country).length,
    })),
  ];

  const activeEuConfig = EU_COUNTRY_CONFIG.find((c) => c.country === active);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Country selector tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex flex-col items-center gap-2.5 px-3 py-5 border transition-all ${
                isActive
                  ? "border-[#444444] bg-[#111111] text-white"
                  : "border-[#1e1e1e] bg-[#0a0a0a] text-[#555555] hover:border-[#333333] hover:text-[#888888]"
              }`}
            >
              <span className="text-3xl leading-none">{tab.flag}</span>
              <span className="text-xs font-light tracking-[0.06em]">{tab.key}</span>
              <span className={`text-[10px] tabular-nums ${isActive ? "text-[#555555]" : "text-[#333333]"}`}>
                {tab.count} clubs
              </span>
            </button>
          );
        })}
      </div>

      {/* Club panel */}
      <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-8">
        {active === "England" ? (
          <EnglishClubs clubs={clubs} />
        ) : activeEuConfig ? (
          <EuropeanClubs config={activeEuConfig} clubs={euClubs} />
        ) : null}
      </div>
    </div>
  );
}
