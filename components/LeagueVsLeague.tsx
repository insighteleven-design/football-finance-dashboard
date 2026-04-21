"use client";

import { useState, useMemo } from "react";
import { type ComparableClub, fmtVal } from "@/lib/comparable";
import RadarChart from "@/components/RadarChart";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LEAGUES = 4;
const SLOT_LABELS = ["A", "B", "C", "D"];
const SLOT_COLORS = ["#4A90D9", "#E05252", "#E8A838", "#9B59B6"];
const SLOT_STYLES = [
  { border: "#4A90D9", bg: "#EBF3FC", text: "#4A90D9" },
  { border: "#E05252", bg: "#FCEAEA", text: "#E05252" },
  { border: "#E8A838", bg: "#FDF5E6", text: "#E8A838" },
  { border: "#9B59B6", bg: "#F5EEF8", text: "#9B59B6" },
];

const COUNTRY_ORDER = ["England", "Germany", "Spain", "Italy", "France", "Netherlands", "Belgium", "Austria", "Denmark", "Norway", "Sweden", "Japan"];
const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Germany: "🇩🇪", Spain: "🇪🇸", Italy: "🇮🇹",
  France: "🇫🇷", Netherlands: "🇳🇱", Belgium: "🇧🇪", Austria: "🇦🇹",
  Denmark: "🇩🇰", Norway: "🇳🇴", Sweden: "🇸🇪", Japan: "🇯🇵",
};

const LEAGUE_METRICS: {
  key: keyof LeagueData;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter: boolean | null;
}[] = [
  { key: "avgRevenue",          label: "Avg Revenue",                higherBetter: true },
  { key: "avgWageBill",         label: "Avg Wage Bill",              higherBetter: false },
  { key: "avgWageRatio",        label: "Avg Wage Ratio",  isRatio: true, higherBetter: false },
  { key: "pctProfitable",       label: "% Clubs Profitable", isRatio: true, higherBetter: true },
  { key: "avgOperatingProfit",  label: "Avg Operating Profit / (Loss)", diverging: true, higherBetter: true },
  { key: "avgPreTaxProfit",     label: "Avg Pre-tax Profit / (Loss)",   diverging: true, higherBetter: true },
  { key: "avgNetDebt",          label: "Avg Net Debt",    diverging: true, higherBetter: false },
];

// ─── Data computation ─────────────────────────────────────────────────────────

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

  return [...map.entries()]
    .map(([id, members]) => {
      const [country, divisionLabel] = id.split("::");
      const displayName = divisionLabel.replace(/ · \w+$/, "");
      const currency = members[0].currency;
      const withProfitData = members.filter((m) => m.pre_tax_profit !== null);
      const pctProfitable = withProfitData.length
        ? (withProfitData.filter((m) => m.pre_tax_profit! > 0).length / withProfitData.length) * 100
        : null;
      return {
        id,
        country,
        divisionLabel,
        displayName,
        clubCount: members.length,
        currency,
        avgRevenue:          avg(members, "revenue"),
        avgWageBill:         avg(members, "wage_bill"),
        avgWageRatio:        avg(members, "wage_ratio"),
        avgOperatingProfit:  avg(members, "operating_profit"),
        avgPreTaxProfit:     avg(members, "pre_tax_profit"),
        avgNetDebt:          avg(members, "net_debt"),
        pctProfitable,
      };
    })
    .sort((a, b) => {
      const ci = COUNTRY_ORDER.indexOf(a.country) - COUNTRY_ORDER.indexOf(b.country);
      return ci !== 0 ? ci : a.divisionLabel.localeCompare(b.divisionLabel);
    });
}

function fmtLeagueVal(league: LeagueData, key: keyof LeagueData): string {
  const val = league[key] as number | null;
  if (val === null) return "—";
  if (key === "pctProfitable" || key === "avgWageRatio") return `${val.toFixed(1)}%`;
  return fmtVal(val, false, league.currency);
}

// ─── League slot ──────────────────────────────────────────────────────────────

function LeagueSlot({
  slotIndex,
  allLeagues,
  selectedId,
  otherIds,
  onSelect,
  onRemove,
}: {
  slotIndex: number;
  allLeagues: LeagueData[];
  selectedId: string | null;
  otherIds: string[];
  onSelect: (id: string) => void;
  onRemove: () => void;
}) {
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  const style = SLOT_STYLES[slotIndex];
  const color = SLOT_COLORS[slotIndex];
  const label = SLOT_LABELS[slotIndex];

  const available = useMemo(
    () => allLeagues.filter((l) => !otherIds.includes(l.id)),
    [allLeagues, otherIds]
  );

  const countries = useMemo(() => {
    const present = new Set(available.map((l) => l.country));
    return COUNTRY_ORDER.filter((cn) => present.has(cn));
  }, [available]);

  const countryLeagues = useMemo(
    () => (activeCountry ? available.filter((l) => l.country === activeCountry) : []),
    [available, activeCountry]
  );

  function handleSelect(id: string) {
    onSelect(id);
    setActiveCountry(null);
  }

  function handleRemove() {
    onRemove();
    setActiveCountry(null);
  }

  const selected = selectedId ? allLeagues.find((l) => l.id === selectedId) : null;

  // ── Filled ───────────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div style={{ border: `1px solid ${style.border}`, backgroundColor: style.bg, padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: style.text }}>
            League {label}
          </span>
          <button
            onClick={handleRemove}
            style={{ fontSize: "10px", color: style.text, background: "none", border: "none", cursor: "pointer", opacity: 0.7, padding: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
          >
            Remove
          </button>
        </div>
        <p style={{ fontSize: "18px", fontWeight: 400, color: "#111111", lineHeight: 1.2, marginBottom: "0.25rem" }}>
          {selected.displayName}
        </p>
        <p style={{ fontSize: "11px", color: "#888888" }}>
          {COUNTRY_FLAGS[selected.country] ?? ""} {selected.country} · {selected.clubCount} clubs
        </p>
      </div>
    );
  }

  // ── League list ──────────────────────────────────────────────────────────────
  if (activeCountry) {
    return (
      <div style={{ border: "1px solid #e0e0e0", backgroundColor: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid #f0f0f0" }}>
          <button
            onClick={() => setActiveCountry(null)}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "none", cursor: "pointer", color: "#888888", padding: 0, fontSize: "11px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; }}
          >
            <svg style={{ width: "13px", height: "13px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: style.text }}>League {label}</span>
          <span style={{ fontSize: "13px", marginLeft: "auto" }}>{COUNTRY_FLAGS[activeCountry] ?? ""} {activeCountry}</span>
        </div>
        <div>
          {countryLeagues.map((league) => (
            <button
              key={league.id}
              onMouseDown={() => handleSelect(league.id)}
              style={{ width: "100%", textAlign: "left", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", borderBottom: "1px solid #f5f5f5", cursor: "pointer", gap: "0.5rem" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <div>
                <p style={{ fontSize: "14px", color: "#111111", marginBottom: "0.1rem" }}>{league.displayName}</p>
                <p style={{ fontSize: "10px", color: "#aaaaaa" }}>{league.clubCount} clubs</p>
              </div>
              <span style={{ fontSize: "10px", color: color, fontWeight: 500 }}>Select →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Country grid ─────────────────────────────────────────────────────────────
  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "#ffffff", padding: "1.25rem" }}>
      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: style.text, marginBottom: "0.875rem" }}>
        League {label}
      </p>
      <p style={{ fontSize: "13px", color: "#999999", marginBottom: "1rem" }}>
        Select a country to browse leagues
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => setActiveCountry(country)}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.75rem", border: "1px solid #e0e0e0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "12px", color: "#333333", transition: "border-color 0.12s, background-color 0.12s" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.backgroundColor = style.bg; el.style.color = color; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e0e0e0"; el.style.backgroundColor = "#ffffff"; el.style.color = "#333333"; }}
          >
            <span>{COUNTRY_FLAGS[country] ?? ""}</span>
            <span>{country}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────

function LeagueStatsView({ leagues }: { leagues: LeagueData[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
        <thead>
          <tr>
            <th style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaaaaa", textAlign: "left", padding: "0.75rem 0.5rem", borderBottom: "1px solid #e0e0e0", width: "200px" }}>
              Metric
            </th>
            {leagues.map((league, i) => (
              <th key={league.id} style={{ textAlign: "right", padding: "0.75rem 0.5rem", borderBottom: "1px solid #e0e0e0" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: SLOT_COLORS[i], display: "block" }}>{league.displayName}</span>
                <span style={{ fontSize: "9px", color: "#aaaaaa", fontWeight: 400 }}>{COUNTRY_FLAGS[league.country] ?? ""} {league.clubCount} clubs</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LEAGUE_METRICS.map((metric) => {
            const values = leagues.map((l) => l[metric.key] as number | null);
            const valid  = values.filter((v): v is number => v !== null);
            const best   = valid.length && metric.higherBetter !== null
              ? (metric.higherBetter ? Math.max(...valid) : Math.min(...valid))
              : null;

            return (
              <tr key={metric.key as string} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td style={{ fontSize: "11px", color: "#666666", padding: "0.75rem 0.5rem", whiteSpace: "nowrap" }}>{metric.label}</td>
                {leagues.map((league, i) => {
                  const val    = league[metric.key] as number | null;
                  const isBest = val !== null && valid.length > 1 && best !== null && val === best;
                  return (
                    <td key={league.id} style={{ fontSize: "13px", fontWeight: isBest ? 600 : 400, fontVariantNumeric: "tabular-nums", textAlign: "right", padding: "0.75rem 0.5rem", color: isBest ? "#22c55e" : val !== null ? SLOT_COLORS[i] : "#cccccc", backgroundColor: isBest ? "#f0fdf4" : "transparent" }}>
                      {fmtLeagueVal(league, metric.key)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {leagues.length > 1 && (
        <p style={{ fontSize: "10px", color: "#cccccc", marginTop: "0.75rem" }}>
          Green = best in comparison for that metric · Averages exclude clubs with missing data
        </p>
      )}
    </div>
  );
}

// ─── Bar chart view ───────────────────────────────────────────────────────────

function LeagueChartsView({ leagues }: { leagues: LeagueData[] }) {
  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "#ffffff", padding: "0 1.25rem" }}>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", padding: "1.25rem 0", borderBottom: "1px solid #e0e0e0" }}>
        {leagues.map((league, i) => (
          <div key={league.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: SLOT_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: SLOT_COLORS[i] }}>{league.displayName}</span>
            <span style={{ fontSize: "10px", color: "#cccccc" }}>{COUNTRY_FLAGS[league.country] ?? ""}</span>
          </div>
        ))}
        <span style={{ fontSize: "10px", color: "#cccccc", marginLeft: "auto", alignSelf: "center" }}>
          Diverging: left = loss/debt · right = profit/cash
        </span>
      </div>

      {LEAGUE_METRICS.map((metric) => {
        const vals   = leagues.map((l) => l[metric.key] as number | null);
        const absMax = Math.max(...vals.filter((v): v is number => v !== null).map(Math.abs), 0.01);

        return (
          <div key={metric.key as string} style={{ padding: "1.5rem 0", borderBottom: "1px solid #e0e0e0" }}>
            <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999999", marginBottom: "1rem" }}>
              {metric.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {leagues.map((league, i) => {
                const value = league[metric.key] as number | null;
                const color = SLOT_COLORS[i];
                const displayVal = fmtLeagueVal(league, metric.key);

                if (metric.diverging) {
                  const isPos = value !== null && value >= 0;
                  const pct   = value !== null ? Math.min((Math.abs(value) / absMax) * 100, 100) : 0;
                  return (
                    <div key={league.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "12px", width: "9rem", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color }}>{league.displayName}</span>
                      <div style={{ flex: 1, display: "flex", height: "1.75rem" }}>
                        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", overflow: "hidden", backgroundColor: "#eeeeee" }}>
                          {value !== null && !isPos && <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color }} />}
                        </div>
                        <div style={{ width: "1px", backgroundColor: "#e0e0e0", flexShrink: 0 }} />
                        <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#eeeeee" }}>
                          {value !== null && isPos && <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color }} />}
                        </div>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 300, fontVariantNumeric: "tabular-nums", width: "4.5rem", textAlign: "right", flexShrink: 0, color: value !== null ? color : "#aaaaaa" }}>{displayVal}</span>
                    </div>
                  );
                }

                const pct = value !== null ? Math.min((Math.abs(value) / absMax) * 100, 100) : 0;
                return (
                  <div key={league.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "12px", width: "9rem", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color }}>{league.displayName}</span>
                    <div style={{ flex: 1, height: "1.75rem", backgroundColor: "#eeeeee", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 300, fontVariantNumeric: "tabular-nums", width: "4.5rem", textAlign: "right", flexShrink: 0, color }}>{displayVal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type LeagueView = "stats" | "radar" | "charts";

export default function LeagueVsLeague({ allClubs }: { allClubs: ComparableClub[] }) {
  const allLeagues = useMemo(() => computeLeagues(allClubs), [allClubs]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView]               = useState<LeagueView>("stats");

  function setLeague(index: number, id: string) {
    const next = [...selectedIds];
    next[index] = id;
    setSelectedIds(next);
  }

  function removeLeague(index: number) {
    setSelectedIds(selectedIds.filter((_, i) => i !== index));
  }

  const selectedLeagues = selectedIds
    .map((id) => allLeagues.find((l) => l.id === id))
    .filter((l): l is LeagueData => !!l);

  const slotsToShow = Math.min(
    MAX_LEAGUES,
    Math.max(2, selectedIds.length + (selectedIds.length < MAX_LEAGUES ? 1 : 0))
  );

  const views: { id: LeagueView; label: string }[] = [
    { id: "stats",  label: "Side by Side" },
    { id: "radar",  label: "Radar" },
    { id: "charts", label: "Charts" },
  ];

  // Full population per axis — used for percentile-rank normalisation
  const radarPopulations = useMemo(() => {
    function pop(key: keyof LeagueData) {
      return allLeagues.map((l) => l[key] as number | null).filter((v): v is number => v !== null);
    }
    return {
      avgRevenue:         pop("avgRevenue"),
      avgWageRatio:       pop("avgWageRatio"),
      avgOperatingProfit: pop("avgOperatingProfit"),
      avgPreTaxProfit:    pop("avgPreTaxProfit"),
      pctProfitable:      pop("pctProfitable"),
      avgNetDebt:         pop("avgNetDebt"),
    };
  }, [allLeagues]);

  const RADAR_AXES = [
    { label: "Avg\nRevenue",          invert: false, population: radarPopulations.avgRevenue },
    { label: "Wage\nEfficiency",      invert: true,  population: radarPopulations.avgWageRatio },
    { label: "Avg Operating\nProfit", invert: false, population: radarPopulations.avgOperatingProfit },
    { label: "Avg Pre-tax\nProfit",   invert: false, population: radarPopulations.avgPreTaxProfit },
    { label: "% Clubs\nProfitable",   invert: false, population: radarPopulations.pctProfitable },
    { label: "Net Debt\nPosition",    invert: true,  population: radarPopulations.avgNetDebt },
  ];

  const radarSeries = selectedLeagues.map((league, i) => ({
    name:   league.displayName,
    color:  SLOT_COLORS[i],
    values: [
      league.avgRevenue,
      league.avgWageRatio,
      league.avgOperatingProfit,
      league.avgPreTaxProfit,
      league.pctProfitable,
      league.avgNetDebt,
    ],
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "0.5rem" }}>
          League Comparison
        </p>
        <p style={{ fontSize: "22px", fontWeight: 300, color: "#111111", letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Compare leagues by average metrics
        </p>
        <p style={{ fontSize: "13px", color: "#999999" }}>
          Select leagues to compare average financial performance across clubs. Averages are computed from all clubs with available data in each league.
        </p>
      </div>

      {/* Slot grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {Array.from({ length: slotsToShow }).map((_, i) => (
          <LeagueSlot
            key={i}
            slotIndex={i}
            allLeagues={allLeagues}
            selectedId={selectedIds[i] ?? null}
            otherIds={selectedIds.filter((_, j) => j !== i)}
            onSelect={(id) => setLeague(i, id)}
            onRemove={() => removeLeague(i)}
          />
        ))}
      </div>

      {selectedLeagues.length === 1 && (
        <p style={{ fontSize: "13px", color: "#aaaaaa", marginBottom: "1.5rem" }}>
          Select a second league to start the comparison.
        </p>
      )}

      {/* Comparison panel */}
      {selectedLeagues.length >= 2 && (
        <div>
          <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", marginBottom: "1.5rem" }}>
            {views.map(({ id, label }) => {
              const isActive = view === id;
              return (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  style={{ padding: "0.625rem 1.25rem", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: isActive ? "#111111" : "#999999", background: "none", border: "none", borderBottom: `2px solid ${isActive ? "#111111" : "transparent"}`, marginBottom: "-1px", cursor: "pointer", transition: "color 0.15s" }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {view === "stats"  && <LeagueStatsView  leagues={selectedLeagues} />}
          {view === "radar"  && <RadarChart axes={RADAR_AXES} series={radarSeries} />}
          {view === "charts" && <LeagueChartsView leagues={selectedLeagues} />}
        </div>
      )}
    </div>
  );
}
