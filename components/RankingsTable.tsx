"use client";

import { useState, useMemo } from "react";
import { type ComparableClub, fmtVal } from "@/lib/comparable";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "clubs" | "leagues";

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
  { key: "wage_ratio",       label: "Wage Ratio",    isRatio: true, lowerIsBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax Result", diverging: true },
  { key: "net_debt",         label: "Net Debt",       diverging: true, lowerIsBetter: true },
];

const LEAGUE_METRICS: {
  key: keyof LeagueData;
  label: string;
  isRatio?: boolean;
  lowerIsBetter?: boolean;
  diverging?: boolean;
}[] = [
  { key: "avgRevenue",         label: "Avg Revenue" },
  { key: "avgWageBill",        label: "Avg Wage Bill" },
  { key: "avgWageRatio",       label: "Avg Wage Ratio",    isRatio: true, lowerIsBetter: true },
  { key: "pctProfitable",      label: "% Profitable",      isRatio: true },
  { key: "avgPreTaxProfit",    label: "Avg Pre-tax Result", diverging: true },
  { key: "avgNetDebt",         label: "Avg Net Debt",       diverging: true, lowerIsBetter: true },
];

// ─── League computation ───────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Germany: "🇩🇪", Spain: "🇪🇸", Italy: "🇮🇹",
  France: "🇫🇷", Netherlands: "🇳🇱", Belgium: "🇧🇪", Austria: "🇦🇹",
  Denmark: "🇩🇰", Norway: "🇳🇴", Sweden: "🇸🇪", Japan: "🇯🇵",
};

function avg(members: ComparableClub[], key: keyof ComparableClub): number | null {
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
      avgRevenue:         avg(members, "revenue"),
      avgWageBill:        avg(members, "wage_bill"),
      avgWageRatio:       avg(members, "wage_ratio"),
      avgOperatingProfit: avg(members, "operating_profit"),
      avgPreTaxProfit:    avg(members, "pre_tax_profit"),
      avgNetDebt:         avg(members, "net_debt"),
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

// ─── Shared bar row ───────────────────────────────────────────────────────────

function BarRow({
  rank, name, subtitle, value, formattedValue, barPct, color, isDiverg,
}: {
  rank: number;
  name: string;
  subtitle: string;
  value: number;
  formattedValue: string;
  barPct: number;
  color: string;
  isDiverg: boolean;
}) {
  const isNeg = value < 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.7rem 0", borderBottom: "1px solid #f5f5f5" }}>
      <span style={{ fontSize: "15px", fontVariantNumeric: "tabular-nums", width: "2rem", textAlign: "right", flexShrink: 0, color: "#cccccc", fontWeight: 500 }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "16px", color: "#111111", fontWeight: 500 }}>{name}</span>
          <span style={{ fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#bbbbbb" }}>
            {subtitle}
          </span>
        </div>
        <div style={{ marginTop: "6px", height: "4px", backgroundColor: "#f0f0f0", maxWidth: "360px", borderRadius: "2px", overflow: "hidden" }}>
          {isDiverg ? (
            <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: color, opacity: 0.75, marginLeft: isNeg ? "auto" : 0, borderRadius: "2px" }} />
          ) : (
            <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: color, opacity: 0.75, borderRadius: "2px" }} />
          )}
        </div>
      </div>
      <span style={{ fontSize: "16px", fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: "5.5rem", textAlign: "right", color }}>
        {formattedValue}
      </span>
    </div>
  );
}

// ─── Club rankings ────────────────────────────────────────────────────────────

function ClubRankings({ allClubs }: { allClubs: ComparableClub[] }) {
  const [metricKey, setMetricKey] = useState<keyof ComparableClub>("revenue");
  const [showAll, setShowAll] = useState(false);
  const DEFAULT_ROWS = 30;

  const metric = CLUB_METRICS.find((m) => m.key === metricKey)!;

  const ranked = useMemo(() =>
    [...allClubs]
      .filter((c) => (c[metricKey] as number | null) !== null)
      .sort((a, b) =>
        metric.lowerIsBetter
          ? (a[metricKey] as number) - (b[metricKey] as number)
          : (b[metricKey] as number) - (a[metricKey] as number)
      ),
    [allClubs, metricKey, metric.lowerIsBetter]
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
      {/* Metric tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "2px solid #eeeeee", marginBottom: "1.5rem" }}>
        {CLUB_METRICS.map((m) => {
          const active = m.key === metricKey;
          return (
            <button
              key={m.key as string}
              onClick={() => { setMetricKey(m.key); setShowAll(false); }}
              style={{
                padding: "0.9rem 1.5rem",
                fontSize: "13px",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.1em",
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
              {m.label}
            </button>
          );
        })}
      </div>

      <div>
        {displayed.map((club, i) => {
          const value = club[metricKey] as number;
          const barPct = Math.min((Math.abs(value) / maxAbs) * 100, 100);
          const color = barColor(value);
          return (
            <BarRow
              key={club.slug}
              rank={i + 1}
              name={club.name}
              subtitle={`${COUNTRY_FLAGS[club.country] ?? ""} ${club.divisionLabel}`}
              value={value}
              formattedValue={fmtVal(value, metric.isRatio, club.currency)}
              barPct={barPct}
              color={color}
              isDiverg={!!metric.diverging}
            />
          );
        })}
      </div>

      {!showAll && ranked.length > DEFAULT_ROWS && (
        <button
          onClick={() => setShowAll(true)}
          style={{ marginTop: "1.25rem", fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999999", cursor: "pointer", background: "none", border: "none", padding: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#999999"; }}
        >
          Show all {ranked.length} clubs ↓
        </button>
      )}
    </div>
  );
}

// ─── League rankings ──────────────────────────────────────────────────────────

function LeagueRankings({ allClubs }: { allClubs: ComparableClub[] }) {
  const [metricKey, setMetricKey] = useState<keyof LeagueData>("avgRevenue");

  const allLeagues = useMemo(() => computeLeagues(allClubs), [allClubs]);

  const metric = LEAGUE_METRICS.find((m) => m.key === metricKey)!;

  const ranked = useMemo(() =>
    [...allLeagues]
      .filter((l) => (l[metricKey] as number | null) !== null)
      .sort((a, b) =>
        metric.lowerIsBetter
          ? (a[metricKey] as number) - (b[metricKey] as number)
          : (b[metricKey] as number) - (a[metricKey] as number)
      ),
    [allLeagues, metricKey, metric.lowerIsBetter]
  );

  const maxAbs = Math.max(...ranked.map((l) => Math.abs(l[metricKey] as number)), 0.01);

  function barColor(value: number): string {
    if (metricKey === "avgPreTaxProfit") return value >= 0 ? "#22c55e" : "#ef4444";
    if (metricKey === "avgNetDebt")      return value >  0 ? "#ef4444" : "#22c55e";
    return "#4A90D9";
  }

  return (
    <div>
      {/* Metric tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "2px solid #eeeeee", marginBottom: "1.5rem" }}>
        {LEAGUE_METRICS.map((m) => {
          const active = m.key === metricKey;
          return (
            <button
              key={m.key as string}
              onClick={() => setMetricKey(m.key)}
              style={{
                padding: "0.9rem 1.5rem",
                fontSize: "13px",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.1em",
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
              {m.label}
            </button>
          );
        })}
      </div>

      <div>
        {ranked.map((league, i) => {
          const value = league[metricKey] as number;
          const barPct = Math.min((Math.abs(value) / maxAbs) * 100, 100);
          const color = barColor(value);
          return (
            <BarRow
              key={league.id}
              rank={i + 1}
              name={league.displayName}
              subtitle={`${COUNTRY_FLAGS[league.country] ?? ""} ${league.country} · ${league.clubCount} clubs`}
              value={value}
              formattedValue={fmtLeagueVal(league, metricKey)}
              barPct={barPct}
              color={color}
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

  return (
    <div>
      {/* Mode switcher */}
      <div style={{ display: "flex", borderBottom: "2px solid #eeeeee", marginBottom: "2rem", overflowX: "auto" }}>
        {(["clubs", "leagues"] as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
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
              {m === "clubs" ? "Club Rankings" : "League Rankings"}
            </button>
          );
        })}
      </div>

      {mode === "clubs"   && <ClubRankings   allClubs={allClubs} />}
      {mode === "leagues" && <LeagueRankings allClubs={allClubs} />}
    </div>
  );
}
