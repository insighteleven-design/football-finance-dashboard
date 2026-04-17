"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubFinancials, Division } from "@/lib/clubs";
import { EUClub, EU_COUNTRY_CONFIG } from "@/lib/euClubs";

// ─── helpers ──────────────────────────────────────────────────────────────────

function hasEuFinancialData(club: EUClub): boolean {
  const f = club.financials;
  return (
    f.revenue !== null || f.net_profit !== null || f.wage_bill !== null ||
    f.equity !== null || f.total_liabilities !== null ||
    club.historical.some((h) => h.revenue !== null)
  );
}

const EN_DIVISIONS: { key: Division; label: string }[] = [
  { key: "premier-league", label: "Premier League" },
  { key: "championship",   label: "Championship" },
  { key: "league-one",     label: "League One" },
  { key: "league-two",     label: "League Two" },
];

type View =
  | { level: "countries" }
  | { level: "leagues"; country: string; flag: string }
  | { level: "clubs"; country: string; flag: string; leagueKey: string; leagueLabel: string };

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 mb-10 sm:mb-14 group transition-colors"
      style={{ color: "#3a3a3a" }}
    >
      <span className="group-hover:-translate-x-0.5 transition-transform inline-block" style={{ fontSize: "1rem" }}>←</span>
      <span
        className="group-hover:text-[#666666] transition-colors"
        style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Level 1: Countries ───────────────────────────────────────────────────────

function CountriesView({
  clubs,
  euClubs,
  onSelect,
}: {
  clubs: ClubFinancials[];
  euClubs: EUClub[];
  onSelect: (country: string, flag: string) => void;
}) {
  const countries = [
    {
      key: "England",
      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      leagueCount: 4,
      clubCount: clubs.length,
    },
    ...EU_COUNTRY_CONFIG.map((c) => ({
      key: c.country,
      flag: c.flag,
      leagueCount: c.leagues.length,
      clubCount: euClubs.filter((cl) => cl.country === c.country && hasEuFinancialData(cl)).length,
    })),
  ].filter((c) => c.clubCount > 0);

  return (
    <div>
      {countries.map((country, i) => (
        <button
          key={country.key}
          onClick={() => onSelect(country.key, country.flag)}
          className="w-full flex items-center justify-between group py-7 sm:py-9 transition-colors"
          style={{
            borderTop: i === 0 ? "1px solid #1a1a1a" : undefined,
            borderBottom: "1px solid #1a1a1a",
          }}
        >
          <div className="flex items-center gap-5 sm:gap-7">
            <span className="shrink-0" style={{ fontSize: "2rem", lineHeight: 1 }}>{country.flag}</span>
            <div className="text-left">
              <p
                className="font-serif font-light leading-none group-hover:text-[#cccccc] transition-colors"
                style={{ color: "#ffffff", fontSize: "clamp(24px, 4vw, 44px)", letterSpacing: "-0.02em" }}
              >
                {country.key}
              </p>
              <p
                className="mt-2 font-medium uppercase"
                style={{ color: "#333333", fontSize: "10px", letterSpacing: "0.18em" }}
              >
                {country.leagueCount} {country.leagueCount === 1 ? "league" : "leagues"} · {country.clubCount} clubs
              </p>
            </div>
          </div>
          <span
            className="shrink-0 group-hover:text-[#666666] transition-colors"
            style={{ color: "#2a2a2a", fontSize: "1.25rem" }}
          >
            →
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Level 2: Leagues ─────────────────────────────────────────────────────────

function LeaguesView({
  country,
  flag,
  clubs,
  euClubs,
  onSelect,
  onBack,
}: {
  country: string;
  flag: string;
  clubs: ClubFinancials[];
  euClubs: EUClub[];
  onSelect: (leagueKey: string, leagueLabel: string) => void;
  onBack: () => void;
}) {
  let leagues: { key: string; label: string; clubCount: number }[];

  if (country === "England") {
    leagues = EN_DIVISIONS.map((d) => ({
      key: d.key,
      label: d.label,
      clubCount: clubs.filter((c) => c.division === d.key).length,
    }));
  } else {
    const config = EU_COUNTRY_CONFIG.find((c) => c.country === country);
    if (!config) return null;
    leagues = config.leagues
      .map((l) => ({
        key: l.key,
        label: l.label,
        clubCount: euClubs.filter(
          (c) => c.country === country && c.league === l.key && hasEuFinancialData(c)
        ).length,
      }))
      .filter((l) => l.clubCount > 0);
  }

  return (
    <div>
      <BackButton label="All countries" onClick={onBack} />
      <div className="flex items-center gap-3 mb-8 sm:mb-10">
        <span style={{ fontSize: "1.5rem" }}>{flag}</span>
        <p
          className="font-serif font-light"
          style={{ color: "#555555", fontSize: "clamp(20px, 3vw, 32px)", letterSpacing: "-0.01em" }}
        >
          {country}
        </p>
      </div>
      {leagues.map((league, i) => (
        <button
          key={league.key}
          onClick={() => onSelect(league.key, league.label)}
          className="w-full flex items-center justify-between group py-7 sm:py-9 transition-colors"
          style={{
            borderTop: i === 0 ? "1px solid #1a1a1a" : undefined,
            borderBottom: "1px solid #1a1a1a",
          }}
        >
          <div className="text-left">
            <p
              className="font-serif font-light leading-none group-hover:text-[#cccccc] transition-colors"
              style={{ color: "#ffffff", fontSize: "clamp(24px, 4vw, 44px)", letterSpacing: "-0.02em" }}
            >
              {league.label}
            </p>
            <p
              className="mt-2 font-medium uppercase"
              style={{ color: "#333333", fontSize: "10px", letterSpacing: "0.18em" }}
            >
              {league.clubCount} clubs
            </p>
          </div>
          <span
            className="shrink-0 group-hover:text-[#666666] transition-colors"
            style={{ color: "#2a2a2a", fontSize: "1.25rem" }}
          >
            →
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Level 3: Clubs ───────────────────────────────────────────────────────────

function ClubsView({
  country,
  flag,
  leagueKey,
  leagueLabel,
  clubs,
  euClubs,
  onBack,
}: {
  country: string;
  flag: string;
  leagueKey: string;
  leagueLabel: string;
  clubs: ClubFinancials[];
  euClubs: EUClub[];
  onBack: () => void;
}) {
  type ClubRow = { name: string; slug: string; revenue: number | null };
  let clubList: ClubRow[];

  if (country === "England") {
    clubList = clubs
      .filter((c) => c.division === leagueKey)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ name: c.name, slug: c.slug, revenue: c.revenue }));
  } else {
    clubList = euClubs
      .filter((c) => c.country === country && c.league === leagueKey && hasEuFinancialData(c))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ name: c.name, slug: c.slug, revenue: c.financials.revenue }));
  }

  return (
    <div>
      <BackButton label={country} onClick={onBack} />
      <div className="flex items-center gap-3 mb-8 sm:mb-10">
        <span style={{ fontSize: "1.5rem" }}>{flag}</span>
        <p
          className="font-serif font-light"
          style={{ color: "#555555", fontSize: "clamp(20px, 3vw, 32px)", letterSpacing: "-0.01em" }}
        >
          {leagueLabel}
        </p>
      </div>
      {clubList.map((club, i) => (
        <Link
          key={club.slug}
          href={`/clubs/${club.slug}`}
          className="flex items-center justify-between group py-5 sm:py-6"
          style={{
            borderTop: i === 0 ? "1px solid #1a1a1a" : undefined,
            borderBottom: "1px solid #1a1a1a",
          }}
        >
          <p
            className="font-serif font-light leading-none group-hover:text-[#cccccc] transition-colors"
            style={{ color: "#ffffff", fontSize: "clamp(18px, 3vw, 32px)", letterSpacing: "-0.02em" }}
          >
            {club.name}
          </p>
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 ml-4">
            {club.revenue != null && (
              <span
                className="tabular-nums font-light hidden sm:block"
                style={{ color: "#333333", fontSize: "13px", letterSpacing: "0.04em" }}
              >
                £{club.revenue.toFixed(1)}m
              </span>
            )}
            <span
              className="group-hover:text-[#666666] transition-colors"
              style={{ color: "#2a2a2a", fontSize: "1.1rem" }}
            >
              →
            </span>
          </div>
        </Link>
      ))}
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
  const [view, setView] = useState<View>({ level: "countries" });

  return (
    <div>
      {view.level === "countries" && (
        <CountriesView
          clubs={clubs}
          euClubs={euClubs}
          onSelect={(country, flag) => setView({ level: "leagues", country, flag })}
        />
      )}
      {view.level === "leagues" && (
        <LeaguesView
          country={view.country}
          flag={view.flag}
          clubs={clubs}
          euClubs={euClubs}
          onSelect={(leagueKey, leagueLabel) =>
            setView({ level: "clubs", country: view.country, flag: view.flag, leagueKey, leagueLabel })
          }
          onBack={() => setView({ level: "countries" })}
        />
      )}
      {view.level === "clubs" && (
        <ClubsView
          country={view.country}
          flag={view.flag}
          leagueKey={view.leagueKey}
          leagueLabel={view.leagueLabel}
          clubs={clubs}
          euClubs={euClubs}
          onBack={() => setView({ level: "leagues", country: view.country, flag: view.flag })}
        />
      )}
    </div>
  );
}
