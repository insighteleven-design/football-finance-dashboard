"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubFinancials, Division } from "@/lib/clubs";
import { EUClub, EU_COUNTRY_CONFIG } from "@/lib/euClubs";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

const EN_DIVISIONS: { key: Division; label: string; color: string }[] = [
  { key: "premier-league", label: "Premier League", color: "#8888cc" },
  { key: "championship",   label: "Championship",   color: "#6699bb" },
  { key: "league-one",     label: "League One",     color: "#88aa77" },
  { key: "league-two",     label: "League Two",     color: "#aa8866" },
];

const LEAGUE_COLORS = ["#8888cc", "#6699bb", "#88aa77", "#aa8866"];

// ─── England ──────────────────────────────────────────────────────────────────

function EnglishClubs({ clubs }: { clubs: ClubFinancials[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8">
      {EN_DIVISIONS.map((div) => {
        const divClubs = clubs
          .filter((c) => c.division === div.key)
          .sort((a, b) => a.name.localeCompare(b.name));
        return (
          <div key={div.key}>
            <div
              className="flex items-center gap-2 mb-4 pb-3"
              style={{ borderBottom: "1px solid #1a1a1a" }}
            >
              <span
                className="w-1 h-3 rounded-full shrink-0"
                style={{ backgroundColor: div.color }}
              />
              <p
                className="text-[9px] font-medium tracking-[0.22em] uppercase"
                style={{ color: "#444444" }}
              >
                {div.label}
              </p>
            </div>
            <ul className="space-y-2.5">
              {divClubs.map((club) => (
                <li key={club.slug}>
                  <Link
                    href={`/clubs/${club.slug}`}
                    className="block text-[12px] leading-tight transition-colors hover:text-white"
                    style={{ color: "#666666" }}
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

// ─── European country ─────────────────────────────────────────────────────────

function EuropeanClubs({
  config,
  clubs,
}: {
  config: (typeof EU_COUNTRY_CONFIG)[number];
  clubs: EUClub[];
}) {
  const countryClubs = clubs.filter(
    (c) => c.country === config.country && hasEuFinancialData(c)
  );
  const cols = Math.min(config.leagues.length, 4);
  const colClass =
    cols === 1 ? "grid-cols-1" :
    cols === 2 ? "grid-cols-1 sm:grid-cols-2" :
    cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
                 "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-8 ${colClass}`}>
      {config.leagues.map((league, li) => {
        const leagueClubs = countryClubs
          .filter((c) => c.league === league.key)
          .sort((a, b) => a.name.localeCompare(b.name));
        const color = LEAGUE_COLORS[li % LEAGUE_COLORS.length];
        return (
          <div key={league.key}>
            <div
              className="flex items-center gap-2 mb-4 pb-3"
              style={{ borderBottom: "1px solid #1a1a1a" }}
            >
              <span
                className="w-1 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <p
                className="text-[9px] font-medium tracking-[0.22em] uppercase"
                style={{ color: "#444444" }}
              >
                {league.label}
              </p>
            </div>
            <ul className="space-y-2.5">
              {leagueClubs.map((club) => (
                <li key={club.slug}>
                  <Link
                    href={`/clubs/${club.slug}`}
                    className="block text-[12px] leading-tight transition-colors hover:text-white"
                    style={{ color: "#666666" }}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function CountryClubs({
  clubs,
  euClubs,
}: {
  clubs: ClubFinancials[];
  euClubs: EUClub[];
}) {
  const countries = [
    { key: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    ...EU_COUNTRY_CONFIG.map((c) => ({ key: c.country as string, flag: c.flag })),
  ];

  const [active, setActive] = useState<string>("England");
  const activeEuConfig = EU_COUNTRY_CONFIG.find((c) => c.country === active);

  return (
    <div>
      {/* ── Country tabs ──────────────────────────────────────── */}
      <div
        className="flex items-center overflow-x-auto mb-8 sm:mb-10 scrollbar-none"
        style={{ borderBottom: "1px solid #1a1a1a", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {countries.map(({ key, flag }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium tracking-[0.1em] uppercase whitespace-nowrap shrink-0 transition-colors"
              style={{
                color: isActive ? "#ffffff" : "#444444",
                borderBottom: isActive ? "2px solid #ffffff" : "2px solid transparent",
                marginBottom: "-1px",
                background: "none",
                cursor: "pointer",
                padding: "0.625rem 0.875rem",
              }}
            >
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>{flag}</span>
              {key}
            </button>
          );
        })}
      </div>

      {/* ── Club list ─────────────────────────────────────────── */}
      {active === "England" ? (
        <EnglishClubs clubs={clubs} />
      ) : activeEuConfig ? (
        <EuropeanClubs config={activeEuConfig} clubs={euClubs} />
      ) : null}
    </div>
  );
}
