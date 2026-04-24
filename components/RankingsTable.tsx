"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type ComparableClub, fmtVal } from "@/lib/comparable";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "clubs" | "by-league" | "leagues";

interface LeagueData {
  id: string;
  country: string;
  divisionLabel: string;
  displayName: string;
  clubCount: number;
  currency: "GBP" | "EUR" | "USD";
  avgRevenue: number | null;
  avgWageBill: number | null;
  avgWageRatio: number | null;
  avgOperatingProfit: number | null;
  avgPreTaxProfit: number | null;
  avgNetDebt: number | null;
  pctProfitable: number | null;
}

// ─── Metrics config ───────────────────────────────────────────────────────────

const CLUB_METRICS: {
  key: keyof ComparableClub;
  label: string;
  isRatio?: boolean;
  lowerIsBetter?: boolean;
  diverging?: boolean;
}[] = [
  { key: "revenue",          label: "Revenue" },
  { key: "wage_bill",        label: "Wage Bill" },
  { key: "wage_ratio",       label: "Wage Ratio",     isRatio: true, lowerIsBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax Result",  diverging: true },
  { key: "net_debt",         label: "Net Debt",        diverging: true, lowerIsBetter: true },
];

const LEAGUE_METRICS: {
  key: keyof LeagueData;
  label: string;
  isRatio?: boolean;
  lowerIsBetter?: boolean;
  diverging?: boolean;
}[] = [
  { key: "avgRevenue",      label: "Avg Revenue" },
  { key: "avgWageBill",     label: "Avg Wage Bill" },
  { key: "avgWageRatio",    label: "Avg Wage Ratio", isRatio: true, lowerIsBetter: true },
  { key: "pctProfitable",   label: "% Profitable",   isRatio: true },
  { key: "avgPreTaxProfit", label: "Avg Pre-tax",     diverging: true },
  { key: "avgNetDebt",      label: "Avg Net Debt",    diverging: true, lowerIsBetter: true },
];

// ─── League computation ───────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Germany: "🇩🇪", Spain: "🇪🇸", Italy: "🇮🇹",
  France: "🇫🇷", Netherlands: "🇳🇱", Belgium: "🇧🇪", Austria: "🇦🇹",
  Denmark: "🇩🇰", Norway: "🇳🇴", Sweden: "🇸🇪", Japan: "🇯🇵",
};

const COUNTRY_ORDER = ["England","Germany","Spain","Italy","France","Netherlands","Belgium","Austria","Denmark","Norway","Sweden","Japan"];

function avgOf(members: ComparableClub[], key: keyof ComparableClub): number | null {
  const vals = members.map((m) => m[key] as number | null).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function computeLeagues(clubs: ComparableClub[]): LeagueData[] {
  const map = new Map<string, ComparableClub[]>();
  for (const c of clubs) {
    const id = `${c.country}::${c.divisionLabel}`;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(c);
  }
  return [...map.entries()].map(([id, members]) => {
    const [country, divisionLabel] = id.split("::");
    const displayName = divisionLabel.replace(/ · \w+$/, "");
    const currency = members[0].currency;
    const withProfitData = members.filter((m) => m.pre_tax_profit !== null);
    const pctProfitable = withProfitData.length
      ? (withProfitData.filter((m) => m.pre_tax_profit! > 0).length / withProfitData.length) * 100
      : null;
    return {
      id, country, divisionLabel, displayName,
      clubCount: members.length, currency,
      avgRevenue:         avgOf(members, "revenue"),
      avgWageBill:        avgOf(members, "wage_bill"),
      avgWageRatio:       avgOf(members, "wage_ratio"),
      avgOperatingProfit: avgOf(members, "operating_profit"),
      avgPreTaxProfit:    avgOf(members, "pre_tax_profit"),
      avgNetDebt:         avgOf(members, "net_debt"),
      pctProfitable,
    };
  });
}

function fmtLeagueVal(league: LeagueData, key: keyof LeagueData): string {
  const val = league[key] as number | null;
  if (val === null) return "—";
  if (key === "pctProfitable" || key === "avgWageRatio") return `${val.toFixed(1)}%`;
  return fmtVal(val, false, league.currency);
}

// ─── Shared metric tab bar ────────────────────────────────────────────────────

function MetricTabs<K extends string>({
  metrics, active, onChange,
}: {
  metrics: { key: K; label: string }[];
  active: K;
  onChange: (k: K) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "2px solid #eeeeee", marginBottom: "1.75rem" }}>
      {metrics.map((m) => {
        const isActive = m.key === active;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            style={{
              padding: "0.9rem 1.5rem",
              fontSize: "13px",
              fontWeight: isActive ? 700 : 400,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isActive ? "#111111" : "#aaaaaa",
              background: "none",
              border: "none",
              borderBottom: `3px solid ${isActive ? "#111111" : "transparent"}`,
              marginBottom: "-2px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Bar row ──────────────────────────────────────────────────────────────────

function BarRow({
  rank, name, slug, subtitle, value, formattedValue, barPct, color, isDiverg,
}: {
  rank: number | string;
  name: string;
  slug?: string;
  subtitle: string;
  value: number;
  formattedValue: string;
  barPct: number;
  color: string;
  isDiverg: boolean;
}) {
  const isNeg = value < 0;
  const nameEl = slug ? (
    <Link href={`/clubs/${slug}`} style={{ fontSize: "20px", color: "#111111", fontWeight: 500, textDecoration: "none" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A90D9"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
    >
      {name}
    </Link>
  ) : (
    <span style={{ fontSize: "20px", color: "#111111", fontWeight: 500 }}>{name}</span>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 0", borderBottom: "1px solid #f5f5f5" }}>
      <span style={{ fontSize: "16px", fontVariantNumeric: "tabular-nums", width: "2.25rem", textAlign: "right", flexShrink: 0, color: "#cccccc", fontWeight: 500 }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.625rem", flexWrap: "wrap" }}>
          {nameEl}
          <span style={{ fontSize: "12px", letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbbbbb" }}>
            {subtitle}
          </span>
        </div>
        <div style={{ marginTop: "7px", height: "6px", backgroundColor: "#f0f0f0", maxWidth: "480px", borderRadius: "3px", overflow: "hidden" }}>
          {isDiverg ? (
            <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: color, opacity: 0.7, marginLeft: isNeg ? "auto" : 0, borderRadius: "3px" }} />
          ) : (
            <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: color, opacity: 0.7, borderRadius: "3px" }} />
          )}
        </div>
      </div>
      <span style={{ fontSize: "20px", fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: "6rem", textAlign: "right", color }}>
        {formattedValue}
      </span>
    </div>
  );
}

// ─── Club rankings (global) ───────────────────────────────────────────────────

function ClubRankings({ allClubs }: { allClubs: ComparableClub[] }) {
  const [metricKey, setMetricKey] = useState<keyof ComparableClub>("revenue");
  const [showAll, setShowAll] = useState(false);
  const DEFAULT_ROWS = 30;

  const metric = CLUB_METRICS.find((m) => m.key === metricKey)!;
  const lowerIsBetter = metric.lowerIsBetter ?? false;

  const ranked = useMemo(() =>
    [...allClubs]
      .filter((c) => (c[metricKey] as number | null) !== null)
      .sort((a, b) =>
        lowerIsBetter
          ? (a[metricKey] as number) - (b[metricKey] as number)
          : (b[metricKey] as number) - (a[metricKey] as number)
      ),
    [allClubs, metricKey, lowerIsBetter]
  );

  const displayed = showAll ? ranked : ranked.slice(0, DEFAULT_ROWS);
  const maxAbs = Math.max(...ranked.map((c) => Math.abs(c[metricKey] as number)), 0.01);

  function barColor(value: number): string {
    if (metricKey === "pre_tax_profit") return value >= 0 ? "#22c55e" : "#ef4444";
    if (metricKey === "net_debt")       return value >  0 ? "#ef4444" : "#22c55e";
    return "#4A90D9";
  }

  return (
    <div>
      <MetricTabs metrics={CLUB_METRICS as { key: keyof ComparableClub; label: string }[]} active={metricKey} onChange={(k) => { setMetricKey(k); setShowAll(false); }} />
      <div>
        {displayed.map((club, i) => {
          const value = club[metricKey] as number;
          return (
            <BarRow
              key={club.slug}
              rank={i + 1}
              name={club.name}
              slug={club.slug}
              subtitle={`${COUNTRY_FLAGS[club.country] ?? ""} ${club.divisionLabel}`}
              value={value}
              formattedValue={fmtVal(value, metric.isRatio, club.currency)}
              barPct={Math.min((Math.abs(value) / maxAbs) * 100, 100)}
              color={barColor(value)}
              isDiverg={!!metric.diverging}
            />
          );
        })}
      </div>
      {!showAll && ranked.length > DEFAULT_ROWS && (
        <button
          onClick={() => setShowAll(true)}
          style={{ marginTop: "1.5rem", fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999999", cursor: "pointer", background: "none", border: "none", padding: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#999999"; }}
        >
          Show all {ranked.length} clubs ↓
        </button>
      )}
    </div>
  );
}

// ─── By-league rankings ───────────────────────────────────────────────────────

function ByLeagueRankings({ allClubs }: { allClubs: ComparableClub[] }) {
  const [metricKey, setMetricKey] = useState<keyof ComparableClub>("revenue");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  const metric = CLUB_METRICS.find((m) => m.key === metricKey)!;
  const lowerIsBetter = metric.lowerIsBetter ?? false;

  const leagueGroups = useMemo(() => {
    const map = new Map<string, { leagueId: string; country: string; divisionLabel: string; displayName: string; clubs: ComparableClub[] }>();
    for (const c of allClubs) {
      const id = `${c.country}::${c.divisionLabel}`;
      if (!map.has(id)) map.set(id, { leagueId: id, country: c.country, divisionLabel: c.divisionLabel, displayName: c.divisionLabel.replace(/ · \w+$/, ""), clubs: [] });
      map.get(id)!.clubs.push(c);
    }
    return [...map.values()].sort((a, b) => {
      const ci = COUNTRY_ORDER.indexOf(a.country) - COUNTRY_ORDER.indexOf(b.country);
      return ci !== 0 ? ci : a.divisionLabel.localeCompare(b.divisionLabel);
    });
  }, [allClubs]);

  const selectedGroup = selectedLeagueId ? leagueGroups.find((g) => g.leagueId === selectedLeagueId) : null;

  const rankedClubs = useMemo(() => {
    if (!selectedGroup) return [];
    return [...selectedGroup.clubs]
      .filter((c) => (c[metricKey] as number | null) !== null)
      .sort((a, b) =>
        lowerIsBetter
          ? (a[metricKey] as number) - (b[metricKey] as number)
          : (b[metricKey] as number) - (a[metricKey] as number)
      );
  }, [selectedGroup, metricKey, lowerIsBetter]);

  const localMax = useMemo(() =>
    Math.max(...rankedClubs.map((c) => Math.abs(c[metricKey] as number)), 0.01),
    [rankedClubs, metricKey]
  );

  function barColor(value: number): string {
    if (metricKey === "pre_tax_profit") return value >= 0 ? "#22c55e" : "#ef4444";
    if (metricKey === "net_debt")       return value >  0 ? "#ef4444" : "#22c55e";
    return "#4A90D9";
  }

  // ── League selector ──────────────────────────────────────────────────────────
  if (!selectedLeagueId) {
    // Group by country for display
    const byCountry = new Map<string, typeof leagueGroups>();
    for (const g of leagueGroups) {
      if (!byCountry.has(g.country)) byCountry.set(g.country, []);
      byCountry.get(g.country)!.push(g);
    }

    return (
      <div>
        <p style={{ fontSize: "15px", color: "#999999", marginBottom: "1.75rem" }}>
          Select a league to see how clubs rank within it.
        </p>
        {[...byCountry.entries()].map(([country, groups]) => (
          <div key={country} style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbbbbb", marginBottom: "0.625rem" }}>
              {COUNTRY_FLAGS[country] ?? ""} {country}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {groups.map((g) => (
                <button
                  key={g.leagueId}
                  onClick={() => setSelectedLeagueId(g.leagueId)}
                  style={{ padding: "0.6rem 1.1rem", border: "1px solid #e0e0e0", background: "#ffffff", cursor: "pointer", fontSize: "15px", color: "#333333", fontWeight: 500, transition: "all 0.12s" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#111111"; el.style.backgroundColor = "#f9f9f9"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e0e0e0"; el.style.backgroundColor = "#ffffff"; }}
                >
                  {g.displayName}
                  <span style={{ fontSize: "12px", color: "#bbbbbb", marginLeft: "0.5rem" }}>{g.clubs.length}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Club list for selected league ────────────────────────────────────────────
  return (
    <div>
      {/* Back + league name */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setSelectedLeagueId(null)}
          style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999999", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#999999"; }}
        >
          ← All leagues
        </button>
        <span style={{ fontSize: "22px", fontWeight: 700, color: "#111111", letterSpacing: "-0.01em" }}>
          {COUNTRY_FLAGS[selectedGroup!.country] ?? ""} {selectedGroup!.displayName}
        </span>
        <span style={{ fontSize: "13px", color: "#aaaaaa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {selectedGroup!.clubs.length} clubs
        </span>
      </div>

      <MetricTabs metrics={CLUB_METRICS as { key: keyof ComparableClub; label: string }[]} active={metricKey} onChange={(k) => setMetricKey(k)} />

      {rankedClubs.length === 0 ? (
        <p style={{ fontSize: "15px", color: "#aaaaaa" }}>No data available for this metric.</p>
      ) : (
        <div>
          {rankedClubs.map((club, i) => {
            const value = club[metricKey] as number;
            return (
              <BarRow
                key={club.slug}
                rank={i + 1}
                name={club.name}
                slug={club.slug}
                subtitle=""
                value={value}
                formattedValue={fmtVal(value, metric.isRatio, club.currency)}
                barPct={Math.min((Math.abs(value) / localMax) * 100, 100)}
                color={barColor(value)}
                isDiverg={!!metric.diverging}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── League rankings ──────────────────────────────────────────────────────────

function LeagueRankings({ allClubs }: { allClubs: ComparableClub[] }) {
  const [metricKey, setMetricKey] = useState<keyof LeagueData>("avgRevenue");

  const allLeagues = useMemo(() => computeLeagues(allClubs), [allClubs]);
  const metric = LEAGUE_METRICS.find((m) => m.key === metricKey)!;
  const lowerIsBetter = metric.lowerIsBetter ?? false;

  const ranked = useMemo(() =>
    [...allLeagues]
      .filter((l) => (l[metricKey] as number | null) !== null)
      .sort((a, b) =>
        lowerIsBetter
          ? (a[metricKey] as number) - (b[metricKey] as number)
          : (b[metricKey] as number) - (a[metricKey] as number)
      ),
    [allLeagues, metricKey, lowerIsBetter]
  );

  const maxAbs = Math.max(...ranked.map((l) => Math.abs(l[metricKey] as number)), 0.01);

  function barColor(value: number): string {
    if (metricKey === "avgPreTaxProfit") return value >= 0 ? "#22c55e" : "#ef4444";
    if (metricKey === "avgNetDebt")      return value >  0 ? "#ef4444" : "#22c55e";
    return "#4A90D9";
  }

  return (
    <div>
      <MetricTabs metrics={LEAGUE_METRICS as { key: keyof LeagueData; label: string }[]} active={metricKey} onChange={(k) => setMetricKey(k as keyof LeagueData)} />
      <div>
        {ranked.map((league, i) => {
          const value = league[metricKey] as number;
          return (
            <BarRow
              key={league.id}
              rank={i + 1}
              name={league.displayName}
              subtitle={`${COUNTRY_FLAGS[league.country] ?? ""} ${league.country} · ${league.clubCount} clubs`}
              value={value}
              formattedValue={fmtLeagueVal(league, metricKey)}
              barPct={Math.min((Math.abs(value) / maxAbs) * 100, 100)}
              color={barColor(value)}
              isDiverg={!!metric.diverging}
            />
          );
        })}
      </div>
      {ranked.length === 0 && (
        <p style={{ fontSize: "15px", color: "#aaaaaa", paddingTop: "1rem" }}>No data available for this metric.</p>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RankingsTable({ allClubs }: { allClubs: ComparableClub[] }) {
  const [mode, setMode] = useState<Mode>("clubs");

  const MODES: { id: Mode; label: string }[] = [
    { id: "clubs",     label: "Club Rankings" },
    { id: "by-league", label: "By League" },
    { id: "leagues",   label: "League Rankings" },
  ];

  return (
    <div>
      {/* Mode switcher */}
      <div style={{ display: "flex", borderBottom: "2px solid #eeeeee", marginBottom: "2rem", overflowX: "auto" }}>
        {MODES.map(({ id, label }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{
                padding: "1.1rem 2.25rem",
                fontSize: "15px",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? "#111111" : "#aaaaaa",
                background: "none",
                border: "none",
                borderBottom: `3px solid ${active ? "#111111" : "transparent"}`,
                marginBottom: "-2px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {mode === "clubs"     && <ClubRankings     allClubs={allClubs} />}
      {mode === "by-league" && <ByLeagueRankings allClubs={allClubs} />}
      {mode === "leagues"   && <LeagueRankings   allClubs={allClubs} />}
    </div>
  );
}
