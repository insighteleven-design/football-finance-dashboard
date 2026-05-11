"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CountryOption {
  country: string;
  transfer_count: number;
}

interface SeasonRow {
  season: string;
  total: number;
  value: number;
  GB1: number;
  L1: number;
  ES1: number;
  IT1: number;
  FR1: number;
}

interface LeagueRow {
  id: string;
  name: string;
  count: number;
  value: number;
}

interface FlowData {
  country: string;
  by_season: SeasonRow[];
  by_league: LeagueRow[];
  total_transfers: number;
  total_value: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const LEAGUE_COLORS: Record<string, string> = {
  GB1: "#5B21B6",
  L1:  "#B91C1C",
  ES1: "#C2410C",
  IT1: "#1D4ED8",
  FR1: "#0F766E",
};

const LEAGUE_NAMES: Record<string, string> = {
  GB1: "Premier League",
  L1:  "Bundesliga",
  ES1: "La Liga",
  IT1: "Serie A",
  FR1: "Ligue 1",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatValue(eur: number): string {
  if (eur >= 1_000_000_000) return `€${(eur / 1_000_000_000).toFixed(1)}bn`;
  if (eur >= 1_000_000)     return `€${Math.round(eur / 1_000_000)}m`;
  return `€${(eur / 1_000).toFixed(0)}k`;
}

function shortSeason(s: string) {
  return `'${s.slice(2, 4)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "20px 24px",
        border: "1px solid #e5e5e5",
        background: "#fafafa",
      }}
    >
      <p style={{ fontSize: 12, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 600, margin: "6px 0 0", color: "#111" }}>
        {value}
      </p>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: "12px 16px", fontSize: 13 }}>
      <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#111" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: "3px 0", color: p.color }}>
          {LEAGUE_NAMES[p.name] ?? p.name}: <strong>{p.value}</strong>
        </p>
      ))}
      <p style={{ margin: "8px 0 0", borderTop: "1px solid #eee", paddingTop: 6, color: "#444" }}>
        Total: <strong>{total}</strong>
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TransferFlows() {
  const [countries, setCountries]     = useState<CountryOption[]>([]);
  const [selected, setSelected]       = useState<string>("");
  const [flowData, setFlowData]       = useState<FlowData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    fetch("/api/transfer-flows")
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []))
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setFlowData(null);
    fetch(`/api/transfer-flows?country=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => setFlowData(d))
      .finally(() => setLoading(false));
  }, [selected]);

  const peakSeason = flowData?.by_season.reduce((best, s) =>
    s.total > (best?.total ?? 0) ? s : best
  , flowData.by_season[0]);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "48px 0 32px" }}>
        <h1
          className="font-serif"
          style={{ fontSize: "clamp(32px, 6vw, 72px)", color: "#111", letterSpacing: "-0.025em", margin: 0 }}
        >
          Transfer Flows
        </h1>
        <p style={{ color: "#666", fontSize: "clamp(14px, 2vw, 18px)", margin: "12px 0 0" }}>
          Player exports from clubs worldwide to Europe&apos;s top five leagues, 2015–16 to 2024–25
        </p>
      </div>

      {/* Country selector */}
      <div style={{ marginBottom: 40 }}>
        <label
          htmlFor="country-select"
          style={{ display: "block", fontSize: 12, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}
        >
          Select country of origin
        </label>
        {loadingCountries ? (
          <p style={{ color: "#999", fontSize: 14 }}>Loading countries…</p>
        ) : (
          <select
            id="country-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{
              fontSize: 16,
              padding: "10px 14px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#111",
              width: "100%",
              maxWidth: 360,
              cursor: "pointer",
            }}
          >
            <option value="">— choose a country —</option>
            {countries.map((c) => (
              <option key={c.country} value={c.country}>
                {c.country} ({c.transfer_count} transfers)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <p style={{ color: "#999", fontSize: 14, marginBottom: 32 }}>Loading…</p>
      )}

      {/* Results */}
      {flowData && !loading && (
        <>
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 48,
            }}
          >
            <StatCard label="Total transfers" value={String(flowData.total_transfers)} />
            <StatCard label="Est. value (10yr)" value={formatValue(flowData.total_value)} />
            <StatCard
              label="Most active league"
              value={
                flowData.by_league[0]
                  ? `${LEAGUE_NAMES[flowData.by_league[0].id] ?? flowData.by_league[0].id} (${flowData.by_league[0].count})`
                  : "—"
              }
            />
            <StatCard
              label="Peak season"
              value={peakSeason?.total ? `${peakSeason.season} (${peakSeason.total})` : "—"}
            />
          </div>

          {/* Bar chart */}
          <div style={{ marginBottom: 48 }}>
            <p
              style={{
                fontSize: 12,
                color: "#888",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Transfers by season
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={flowData.by_season} barCategoryGap="25%">
                <XAxis
                  dataKey="season"
                  tickFormatter={shortSeason}
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e5e5" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f5f5f5" }} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#555", fontSize: 12 }}>
                      {LEAGUE_NAMES[value] ?? value}
                    </span>
                  )}
                />
                {(["GB1", "L1", "ES1", "IT1", "FR1"] as const).map((id) => (
                  <Bar key={id} dataKey={id} stackId="a" fill={LEAGUE_COLORS[id]} radius={0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* League breakdown */}
          {flowData.by_league.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "#888",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Breakdown by league
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {flowData.by_league.map((league, i) => (
                  <div
                    key={league.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 0",
                      borderTop: i === 0 ? "1px solid #e5e5e5" : undefined,
                      borderBottom: "1px solid #e5e5e5",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: LEAGUE_COLORS[league.id] ?? "#999",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "#111", fontSize: 15 }}>{league.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                      <span style={{ color: "#444", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                        {league.count} transfers
                      </span>
                      <span style={{ color: "#888", fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                        {formatValue(league.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!selected && !loadingCountries && (
        <p style={{ color: "#bbb", fontSize: 15 }}>
          Select a country above to see its transfer flows into Europe&apos;s top leagues.
        </p>
      )}
    </div>
  );
}
