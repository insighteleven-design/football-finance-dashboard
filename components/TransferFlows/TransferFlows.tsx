"use client";

import { useEffect, useState, useCallback } from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Flow {
  nationality:          string;
  competition:          string;
  competition_id:       string;
  player_count:         number;
  avg_market_value_eur: number | null;
  top_clubs:            string[];
}

interface ApiResponse {
  flows:               Flow[];
  total_players:       number;
  total_nationalities: number;
  season:              string;
}

interface SankeyNode {
  name: string;
  type: "nationality" | "league";
  competition_id?: string;
}

interface SankeyLink {
  source:      number;
  target:      number;
  value:       number;
  nationality: string;
  competition: string;
  avg_market_value_eur: number | null;
  top_clubs:   string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LEAGUE_COLORS: Record<string, string> = {
  GB1: "#5B21B6",
  L1:  "#B91C1C",
  ES1: "#C2410C",
  IT1: "#1D4ED8",
  FR1: "#0F766E",
};

const COMPETITIONS = [
  { id: "GB1", name: "Premier League"  },
  { id: "L1",  name: "Bundesliga"      },
  { id: "ES1", name: "La Liga"         },
  { id: "IT1", name: "Serie A"         },
  { id: "FR1", name: "Ligue 1"         },
];

function fmtValue(eur: number | null): string {
  if (!eur) return "—";
  if (eur >= 1_000_000) return `€${(eur / 1_000_000).toFixed(1)}m`;
  if (eur >= 1_000)     return `€${(eur / 1_000).toFixed(0)}k`;
  return `€${eur}`;
}

// ── Sankey conversion ─────────────────────────────────────────────────────────

function buildSankeyData(flows: Flow[]): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const natSet  = new Set<string>();
  const leagSet = new Map<string, string>(); // id → name

  flows.forEach((f) => {
    natSet.add(f.nationality);
    leagSet.set(f.competition_id, f.competition);
  });

  const natNodes: SankeyNode[]  = [...natSet].map((n)  => ({ name: n, type: "nationality" }));
  const leagNodes: SankeyNode[] = [...leagSet.entries()].map(([id, name]) => ({
    name, type: "league", competition_id: id,
  }));

  const nodes = [...natNodes, ...leagNodes];
  const natIndex  = new Map(natNodes.map((n, i)  => [n.name, i]));
  const leagIndex = new Map(leagNodes.map((n, i) => [n.competition_id!, natNodes.length + i]));

  const links: SankeyLink[] = flows
    .filter((f) => natIndex.has(f.nationality) && leagIndex.has(f.competition_id))
    .map((f) => ({
      source:              natIndex.get(f.nationality)!,
      target:              leagIndex.get(f.competition_id)!,
      value:               f.player_count,
      nationality:         f.nationality,
      competition:         f.competition,
      avg_market_value_eur: f.avg_market_value_eur,
      top_clubs:           f.top_clubs,
    }));

  return { nodes, links };
}

// ── Custom renderers ──────────────────────────────────────────────────────────

function SankeyNodeRenderer(props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; type?: string; competition_id?: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", type, competition_id } = props;
  const color = type === "league" && competition_id
    ? LEAGUE_COLORS[competition_id] ?? "#555"
    : "#374151";

  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={color} rx={2} />
      <text
        x={type === "league" ? x + width + 8 : x - 8}
        y={y + height / 2}
        dy="0.35em"
        textAnchor={type === "league" ? "start" : "end"}
        fontSize={11}
        fill="#374151"
        fontFamily="system-ui, sans-serif"
      >
        {name}
      </text>
    </g>
  );
}

function SankeyLinkRenderer(props: {
  sourceX?: number; sourceY?: number; sourceControlX?: number;
  targetX?: number; targetY?: number; targetControlX?: number;
  linkWidth?: number; payload?: SankeyLink;
}) {
  const {
    sourceX = 0, sourceY = 0, sourceControlX = 0,
    targetX = 0, targetY = 0, targetControlX = 0,
    linkWidth = 0, payload,
  } = props;

  const compId = COMPETITIONS.find((c) => c.name === payload?.competition)?.id;
  const color  = compId ? LEAGUE_COLORS[compId] ?? "#9CA3AF" : "#9CA3AF";

  return (
    <path
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      fill="none"
      stroke={color}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeOpacity={0.25}
      style={{ transition: "stroke-opacity 0.15s" }}
      onMouseEnter={(e) => ((e.target as SVGPathElement).style.strokeOpacity = "0.55")}
      onMouseLeave={(e) => ((e.target as SVGPathElement).style.strokeOpacity = "0.25")}
    />
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function FlowTooltip({ active, payload }: { active?: boolean; payload?: { payload?: SankeyLink }[] }) {
  if (!active || !payload?.length) return null;
  const link = payload[0]?.payload;
  if (!link?.nationality) return null;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        padding: "10px 14px",
        fontSize: 13,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        maxWidth: 240,
      }}
    >
      <p style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>
        {link.nationality} → {link.competition}
      </p>
      <p style={{ color: "#4B5563" }}>{link.value} player{link.value !== 1 ? "s" : ""}</p>
      <p style={{ color: "#4B5563" }}>Avg value: {fmtValue(link.avg_market_value_eur)}</p>
      {link.top_clubs.length > 0 && (
        <p style={{ color: "#6B7280", marginTop: 4, fontSize: 12 }}>
          {link.top_clubs.join(", ")}
        </p>
      )}
    </div>
  );
}

// ── Single-flow detail (both filters active) ──────────────────────────────────

function SingleFlowDetail({ flows, nationality, league }: {
  flows: Flow[]; nationality: string; league: string;
}) {
  const flow = flows.find(
    (f) => f.nationality === nationality && f.competition_id === league
  );

  if (!flow) {
    return (
      <div className="py-20 text-center" style={{ color: "#9CA3AF" }}>
        No players found for this combination.
      </div>
    );
  }

  const leagName = COMPETITIONS.find((c) => c.id === league)?.name ?? league;
  const color    = LEAGUE_COLORS[league] ?? "#374151";

  return (
    <div className="py-10 text-center">
      <p style={{ fontSize: "clamp(48px, 10vw, 96px)", fontWeight: 700, color: "#111827", lineHeight: 1 }}>
        {flow.player_count}
      </p>
      <p style={{ color: "#6B7280", fontSize: 16, marginTop: 8 }}>
        <span style={{ color }}>{nationality}</span> players in the{" "}
        <span style={{ color }}>{leagName}</span>
      </p>
      <p style={{ color: "#9CA3AF", fontSize: 14, marginTop: 4 }}>
        Avg market value: {fmtValue(flow.avg_market_value_eur)}
      </p>
      {flow.top_clubs.length > 0 && (
        <div className="mt-6">
          <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 8 }}>Top clubs</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {flow.top_clubs.map((club) => (
              <span
                key={club}
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 4,
                  padding: "4px 12px",
                  fontSize: 13,
                  color: "#374151",
                }}
              >
                {club}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TransferFlows() {
  const [data,          setData]          = useState<ApiResponse | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [leagueFilter,  setLeagueFilter]  = useState("");
  const [natFilter,     setNatFilter]     = useState("");

  const fetchData = useCallback(async (league: string, nationality: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (league)      params.set("league",      league);
      if (nationality) params.set("nationality", nationality);
      const resp = await fetch(`/api/transfer-flows?${params}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json: ApiResponse = await resp.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(leagueFilter, natFilter);
  }, [leagueFilter, natFilter, fetchData]);

  // Build nationality list for dropdown (from loaded data when unfiltered)
  const [allNationalities, setAllNationalities] = useState<string[]>([]);
  useEffect(() => {
    if (!leagueFilter && !natFilter && data?.flows) {
      const nats = [...new Set(data.flows.map((f) => f.nationality))].sort();
      setAllNationalities(nats);
    }
  }, [data, leagueFilter, natFilter]);

  const resetFilters = () => {
    setLeagueFilter("");
    setNatFilter("");
  };

  const hasFilters     = leagueFilter || natFilter;
  const bothFilters    = leagueFilter && natFilter;
  const sankeyData     = data ? buildSankeyData(data.flows) : null;
  const showSankey     = !bothFilters && sankeyData && sankeyData.links.length > 0;

  // Stats
  const sortedFlows   = data ? [...data.flows].sort((a, b) => b.player_count - a.player_count) : [];
  const topNat        = sortedFlows[0]?.nationality ?? "—";
  const topValue      = data
    ? [...data.flows].sort(
        (a, b) => (b.avg_market_value_eur ?? 0) - (a.avg_market_value_eur ?? 0)
      )[0]
    : null;

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <div className="px-6 lg:px-12 pt-10 sm:pt-16 pb-10 sm:pb-20">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <h1
          className="font-serif font-normal leading-none mb-2"
          style={{ color: "#111111", fontSize: "clamp(40px, 10vw, 140px)", letterSpacing: "-0.03em" }}
        >
          Transfer Flows
        </h1>
        <p
          className="mb-10 sm:mb-14"
          style={{ color: "#999999", fontSize: "clamp(14px, 2vw, 20px)", letterSpacing: "0.01em" }}
        >
          Which countries are sending players to Europe&apos;s top five leagues
        </p>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-3 mb-8 pb-8"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          {/* League filter */}
          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            style={{
              appearance: "none",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 32px 8px 12px",
              fontSize: 14,
              color: leagueFilter ? "#111827" : "#6B7280",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="">All Leagues</option>
            {COMPETITIONS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Nationality filter */}
          <select
            value={natFilter}
            onChange={(e) => setNatFilter(e.target.value)}
            style={{
              appearance: "none",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 32px 8px 12px",
              fontSize: 14,
              color: natFilter ? "#111827" : "#6B7280",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="">All Countries</option>
            {allNationalities.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={resetFilters}
              style={{
                fontSize: 13,
                color: "#6B7280",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Reset filters
            </button>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="py-24 text-center" style={{ color: "#9CA3AF", fontSize: 14 }}>
            Loading…
          </div>
        )}

        {error && (
          <div className="py-24 text-center" style={{ color: "#B91C1C", fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Sankey or single-flow detail */}
            {bothFilters ? (
              <SingleFlowDetail
                flows={data.flows}
                nationality={natFilter}
                league={leagueFilter}
              />
            ) : showSankey ? (
              <div style={{ width: "100%", height: 520, marginBottom: 40 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <Sankey
                    data={sankeyData!}
                    nodePadding={14}
                    nodeWidth={10}
                    iterations={64}
                    link={<SankeyLinkRenderer />}
                    node={<SankeyNodeRenderer />}
                    margin={{ top: 10, right: 180, bottom: 10, left: 180 }}
                  >
                    <Tooltip content={<FlowTooltip />} />
                  </Sankey>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-20 text-center" style={{ color: "#9CA3AF", fontSize: 14 }}>
                No data for this filter combination.
              </div>
            )}

            {/* ── League colour legend ────────────────────────────────── */}
            {!bothFilters && (
              <div className="flex flex-wrap gap-5 mb-10">
                {COMPETITIONS.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: LEAGUE_COLORS[c.id],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{c.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Supporting stats ────────────────────────────────────── */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-px"
              style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", backgroundColor: "#e5e7eb" }}
            >
              {[
                {
                  label: "Players represented",
                  value: data.total_players.toLocaleString(),
                },
                {
                  label: "Nationalities",
                  value: data.total_nationalities.toLocaleString(),
                },
                {
                  label: "Most represented",
                  value: topNat,
                },
                {
                  label: "Highest avg value",
                  value: topValue
                    ? `${topValue.nationality} → ${topValue.competition.replace(" League", "").replace("Liga", "La Liga")}`
                    : "—",
                  sub: topValue ? fmtValue(topValue.avg_market_value_eur) : undefined,
                },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ backgroundColor: "#ffffff", padding: "20px 24px" }}>
                  <p style={{ fontSize: 12, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "clamp(18px, 3vw, 28px)", color: "#111827", fontWeight: 600, lineHeight: 1.1 }}>
                    {value}
                  </p>
                  {sub && (
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{sub}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Season label */}
            <p style={{ fontSize: 12, color: "#D1D5DB", marginTop: 16, textAlign: "right" }}>
              Data: {data.season} season · Source: Transfermarkt
            </p>
          </>
        )}
      </div>
    </div>
  );
}
