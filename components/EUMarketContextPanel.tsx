"use client";

import { useState, useRef } from "react";
import { euClubs, type EUClub } from "@/lib/euClubs";
import { euMarketContext } from "@/lib/euMarketContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPop(m: number): string {
  if (m >= 1) return `${m.toFixed(1)}m`;
  if (m >= 0.1) return `${Math.round(m * 1000)}k`;
  return `${Math.round(m * 1000)}k`;
}

function leagueColor(league: string): string {
  if (league.includes("1. Bundesliga")) return "#3b82f6";
  if (league.includes("2. Bundesliga") || league === "2. Liga") return "#f59e0b";
  if (league.includes("3. Liga")) return "#10b981";
  if (league === "Bundesliga") return "#3b82f6"; // Austrian Bundesliga
  if (league === "Ligue 1") return "#cc6688";
  if (league === "Ligue 2") return "#e07a9a";
  return "#8b5cf6";
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function ComparisonPill({ value, benchmark }: { value: number; benchmark: number }) {
  const diff = Math.round(((value - benchmark) / benchmark) * 100);
  const isAbove = diff >= 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${
        isAbove ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fee2e2] text-[#991b1b]"
      }`}
    >
      {isAbove ? "+" : ""}
      {diff}%
    </span>
  );
}

function MetricBar({ value, benchmark, color }: { value: number; benchmark: number; color: string }) {
  const max = Math.max(value, benchmark) * 1.15;
  const valPct  = Math.min((value / max) * 100, 100);
  const benchPct = Math.min((benchmark / max) * 100, 100);
  const isAbove = value >= benchmark;
  return (
    <div className="mt-3">
      <div className="relative h-2 bg-[#f0f0f0] rounded-full" style={{ maxWidth: "320px" }}>
        <div
          className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-[#cccccc] z-10 rounded-full"
          style={{ left: `${benchPct}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
          style={{ width: `${valPct}%`, backgroundColor: isAbove ? color : "#d1d5db" }}
        />
      </div>
    </div>
  );
}

// ─── Scatter plot ─────────────────────────────────────────────────────────────

function EUScatterPlot({
  currentSlug,
  country,
  league,
}: {
  currentSlug: string;
  country: string;
  league: string;
}) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number;
    name: string; pop: number; rev: number; league: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 540, H = 340;
  const PAD = { top: 16, right: 20, bottom: 40, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Collect points: all clubs in same country with revenue + market context
  const points = euClubs
    .filter((c) => c.country === country)
    .flatMap((c) => {
      const ctx = euMarketContext[c.slug];
      const rev = c.financials.revenue;
      if (!ctx || rev === null) return [];
      return [{
        slug: c.slug,
        name: c.name,
        league: c.league,
        pop: ctx.metro_pop_m,
        revenue: rev,
        isCurrent: c.slug === currentSlug,
      }];
    });

  if (points.length < 2) return null;

  const maxRev = Math.max(...points.map((p) => p.revenue), 0.1);
  const LOG_MIN = 0.005, LOG_MAX = 8;
  const logMin = Math.log10(LOG_MIN), logMax = Math.log10(LOG_MAX);

  const sx = (pop: number) =>
    ((Math.log10(Math.max(pop, LOG_MIN)) - logMin) / (logMax - logMin)) * innerW;
  const sy = (rev: number) => innerH - (rev / maxRev) * innerH;

  // Axis ticks
  const xTickVals = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5];
  const maxRevRounded = Math.ceil(maxRev / 100) * 100;
  const yStep = maxRevRounded > 400 ? 200 : maxRevRounded > 100 ? 100 : 50;
  const yTicks: number[] = [];
  for (let v = 0; v <= maxRevRounded; v += yStep) yTicks.push(v);

  // Unique leagues for legend
  const leagues = [...new Set(points.map((p) => p.league))].sort();

  const showTip = (
    p: typeof points[number],
    e: React.MouseEvent
  ) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    setTooltip({
      x: (PAD.left + sx(p.pop)) * scaleX,
      y: (PAD.top + sy(p.revenue)) * scaleY,
      name: p.name, pop: p.pop, rev: p.revenue, league: p.league,
    });
  };

  const currentColor = leagueColor(league);

  return (
    <div className="relative">
      <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-3">
        Revenue vs Metro Population — {country}
      </p>
      <div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ fontFamily: "inherit", display: "block" }}
        >
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* Y grid + labels */}
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={0} y1={sy(v)} x2={innerW} y2={sy(v)} stroke="#f0f0f0" strokeWidth={1} />
                <text x={-6} y={sy(v) + 4} textAnchor="end" fontSize={9} fill="#aaaaaa">
                  {v > 0 ? `€${v}m` : "€0"}
                </text>
              </g>
            ))}

            {/* X grid + labels (log scale) */}
            {xTickVals.map((v) => (
              <g key={v}>
                <line x1={sx(v)} y1={0} x2={sx(v)} y2={innerH} stroke="#f0f0f0" strokeWidth={1} />
                <text x={sx(v)} y={innerH + 14} textAnchor="middle" fontSize={9} fill="#aaaaaa">
                  {fmtPop(v)}
                </text>
              </g>
            ))}

            {/* Axis labels */}
            <text x={innerW / 2} y={innerH + 30} textAnchor="middle" fontSize={9} fill="#888888">
              Metro Population (log scale)
            </text>
            <text
              x={-innerH / 2} y={-38}
              textAnchor="middle" fontSize={9} fill="#888888"
              transform="rotate(-90)"
            >
              Revenue (€m)
            </text>

            {/* Other clubs */}
            {points.filter((p) => !p.isCurrent).map((p) => (
              <circle
                key={p.slug}
                cx={sx(p.pop)} cy={sy(p.revenue)} r={3.5}
                fill={leagueColor(p.league)} opacity={0.45}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => showTip(p, e)}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}

            {/* Current club */}
            {points.filter((p) => p.isCurrent).map((p) => (
              <g key={p.slug}>
                <circle
                  cx={sx(p.pop)} cy={sy(p.revenue)} r={11}
                  fill="none" stroke={currentColor} strokeWidth={1.5} opacity={0.35}
                  onMouseEnter={(e) => showTip(p, e)}
                  onMouseLeave={() => setTooltip(null)}
                />
                <circle
                  cx={sx(p.pop)} cy={sy(p.revenue)} r={7}
                  fill={currentColor} stroke="white" strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => showTip(p, e)}
                  onMouseLeave={() => setTooltip(null)}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-[#e0e0e0] shadow-sm px-2.5 py-2 text-sm z-20"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y,
            transform: "translateY(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          <p className="font-semibold text-[#111111] mb-0.5">{tooltip.name}</p>
          <p className="text-[#888888]">{tooltip.league}</p>
          <p className="text-[#555555]">Pop: {fmtPop(tooltip.pop)}</p>
          <p className="text-[#555555]">Revenue: €{tooltip.rev.toFixed(1)}m</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2">
        {leagues.map((l) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: leagueColor(l), opacity: 0.7 }} />
            <span className="text-xs text-[#666666]">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function EUMarketContextPanel({
  club,
  leagueClubs,
  leagueLabel,
}: {
  club: EUClub;
  leagueClubs: EUClub[];
  leagueLabel: string;
}) {
  const ctx = euMarketContext[club.slug];
  const color = leagueColor(club.league);

  const [benchmark, setBenchmark] = useState<"country" | "league">("country");

  // Country average population
  const countryAvg = (() => {
    const vals = euClubs
      .filter((c) => c.country === club.country)
      .map((c) => euMarketContext[c.slug]?.metro_pop_m)
      .filter((v): v is number => v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();

  // League average population
  const leagueAvg = (() => {
    const vals = leagueClubs
      .map((c) => euMarketContext[c.slug]?.metro_pop_m)
      .filter((v): v is number => v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();

  const benchmarkPop   = benchmark === "country" ? countryAvg : leagueAvg;
  const benchmarkLabel = benchmark === "country"
    ? `${club.country} avg`
    : `${leagueLabel} avg`;

  if (!ctx) {
    return (
      <p className="text-sm text-[#aaaaaa] italic">
        No market context data available for this club.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header: location + benchmark toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#444444]">
            <span className="text-[#888888]">📍</span> {ctx.metro_area}
          </p>
          <p className="text-xs text-[#999999] mt-0.5">{ctx.metro_note}</p>
        </div>

        <div className="flex items-center gap-0 border border-[#e0e0e0] overflow-hidden">
          {(["country", "league"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBenchmark(b)}
              className={`px-3 py-1.5 text-xs font-medium tracking-[0.05em] uppercase transition-colors ${
                benchmark === b
                  ? "text-white"
                  : "text-[#888888] hover:text-[#444444] bg-white"
              }`}
              style={benchmark === b ? { backgroundColor: color } : {}}
            >
              {b === "country" ? `vs ${club.country}` : `vs ${leagueLabel}`}
            </button>
          ))}
        </div>
      </div>

      {/* Population card */}
      <div
        className="bg-white border border-[#e8e8e8] px-5 py-4"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-2">
          Metro Population
        </p>
        <p className="text-2xl font-semibold text-[#111111]">
          {fmtPop(ctx.metro_pop_m)}
        </p>
        {benchmarkPop !== null && (
          <>
            <MetricBar value={ctx.metro_pop_m} benchmark={benchmarkPop} color={color} />
            <div className="flex items-center gap-2 mt-2">
              <ComparisonPill value={ctx.metro_pop_m} benchmark={benchmarkPop} />
              <span className="text-xs text-[#999999]">{benchmarkLabel}</span>
            </div>
          </>
        )}
        <p className="text-xs text-[#bbbbbb] mt-2">{ctx.metro_note}</p>
      </div>

      {/* Scatter plot */}
      <div
        className="bg-white border border-[#e8e8e8] px-5 py-5"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <EUScatterPlot
          currentSlug={club.slug}
          country={club.country}
          league={club.league}
        />
      </div>

      <p className="text-xs text-[#cccccc] leading-relaxed">
        Source: Metro Populations (EU) — DE_Football_DB_v0.8 · FR urban area populations from user-supplied data · definitions vary by city
      </p>
    </div>
  );
}
