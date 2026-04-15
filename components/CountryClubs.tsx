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

type CountryKey = "England" | "Germany" | "Austria";

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
  const countryClubs = clubs.filter(
    (c) => c.country === config.country && hasEuFinancialData(c)
  );
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
  const [open, setOpen] = useState(false);

  const tabs: { key: CountryKey; flag: string }[] = [
    { key: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    ...EU_COUNTRY_CONFIG.map((c) => ({
      key: c.country as CountryKey,
      flag: c.flag,
    })),
  ];

  const active = tabs[activeIndex];
  const activeEuConfig = EU_COUNTRY_CONFIG.find((c) => c.country === active.key);

  const goTo = (i: number) => {
    if (i === activeIndex) {
      setOpen((o) => !o);
    } else {
      setActiveIndex(i);
      setOpen(true);
    }
  };

  const prev = () =>
    setActiveIndex((i) => (i - 1 + tabs.length) % tabs.length);
  const next = () =>
    setActiveIndex((i) => (i + 1) % tabs.length);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Carousel — no border, click centre to open/close */}
      <div className="flex items-center gap-6">
        <button
          onClick={prev}
          className="shrink-0 text-[#3a3a3a] hover:text-white transition-colors p-2"
          aria-label="Previous country"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => goTo(activeIndex)}
          className="flex-1 flex flex-col items-center gap-2.5 py-6 group"
        >
          <span className="text-5xl leading-none">{active.flag}</span>
          <span className="flex items-center gap-1.5 text-sm font-light tracking-[0.1em] text-[#888888] group-hover:text-white transition-colors">
            {active.key}
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
          {/* Position dots */}
          <div className="flex gap-2">
            {tabs.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${
                  i === activeIndex ? "bg-[#666666]" : "bg-[#2a2a2a]"
                }`}
              />
            ))}
          </div>
        </button>

        <button
          onClick={next}
          className="shrink-0 text-[#3a3a3a] hover:text-white transition-colors p-2"
          aria-label="Next country"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Club list — expands on click */}
      <div
        className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{ maxHeight: open ? "2400px" : "0px" }}
      >
        <div className="pt-8 pb-2">
          {active.key === "England" ? (
            <EnglishClubs clubs={clubs} />
          ) : activeEuConfig ? (
            <EuropeanClubs config={activeEuConfig} clubs={euClubs} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
