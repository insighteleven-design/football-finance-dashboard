"use client";

import { useState, useRef, useEffect } from "react";
import { type MarketContext, ENGLAND_BENCHMARKS } from "@/lib/marketContext";
import { marketContext } from "@/lib/marketContext";
import { clubs } from "@/lib/clubs";

const DIVISION_COLORS: Record<string, string> = {
  "premier-league": "#3b82f6",
  "championship":   "#f59e0b",
  "league-one":     "#10b981",
  "league-two":     "#8b5cf6",
};

const DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

// Compute division averages from all clubs
function computeDivisionAvg(division: string) {
  const divSlugs = clubs.filter((c) => c.division === division).map((c) => c.slug);
  const ctxEntries = divSlugs.map((s) => marketContext[s]).filter(Boolean);

  const avg = (arr: (number | null)[]) => {
    const vals = arr.filter((v): v is number => v !== null && v !== undefined);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  return {
    population:   avg(ctxEntries.map((c) => c.population)),
    gva_per_head: avg(ctxEntries.map((c) => c.gva_per_head)),
    median_pay:   avg(ctxEntries.map((c) => c.median_pay)),
  };
}

function ComparisonPill({ value, benchmark }: { value: number; benchmark: number }) {
  const diff = Math.round(((value - benchmark) / benchmark) * 100);
  const isAbove = diff >= 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${
        isAbove
          ? "bg-[#d1fae5] text-[#065f46]"
          : "bg-[#fee2e2] text-[#991b1b]"
      }`}
    >
      {isAbove ? "+" : ""}{diff}%
    </span>
  );
}

function MetricBar({
  value,
  benchmark,
  color,
}: {
  value: number;
  benchmark: number;
  color: string;
}) {
  const max = Math.max(value, benchmark) * 1.15;
  const valPct = Math.min((value / max) * 100, 100);
  const benchPct = Math.min((benchmark / max) * 100, 100);
  const isAbove = value >= benchmark;

  return (
    <div className="mt-3">
      <div className="relative h-2 bg-[#f0f0f0] rounded-full" style={{ maxWidth: "320px" }}>
        {/* Benchmark line */}
        <div
          className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-[#cccccc] z-10 rounded-full"
          style={{ left: `${benchPct}%` }}
        />
        {/* Value bar */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${valPct}%`,
            backgroundColor: isAbove ? color : "#d1d5db",
          }}
        />
      </div>
    </div>
  );
}

// Format population for axis labels
function fmtPop(v: number): string {
  if (v >= 1_000_000) return `${v / 1_000_000}m`;
  return `${v / 1000}k`;
}

// Scatter plot: Revenue vs Population
function RevenueScatterPlot({
  currentSlug,
  division,
}: {
  currentSlug: string;
  division: string;
}) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    pop: number;
    rev: number;
    division: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 540, H = 360, PAD = { top: 16, right: 20, bottom: 40, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Log-scale constants
  const LOG_MIN = 50_000;
  const LOG_MAX = 12_000_000;

  // Gather data for all clubs
  const points = clubs
    .map((c) => {
      const ctx = marketContext[c.slug];
      const pop = ctx?.population ?? null;
      const rev = c.revenue;
      if (pop == null || rev == null) return null;
      return {
        slug: c.slug,
        name: c.name,
        division: c.division,
        population: pop,
        revenue: rev,
        isCurrent: c.slug === currentSlug,
      };
    })
    .filter(Boolean) as {
    slug: string;
    name: string;
    division: string;
    population: number;
    revenue: number;
    isCurrent: boolean;
  }[];

  if (points.length === 0) return null;

  const maxRev = Math.max(...points.map((p) => p.revenue));

  // Log scale for X axis
  const logMin = Math.log10(LOG_MIN);
  const logMax = Math.log10(LOG_MAX);
  const sx = (pop: number) =>
    ((Math.log10(Math.max(pop, LOG_MIN)) - logMin) / (logMax - logMin)) * innerW;

  // Linear scale for Y axis
  const sy = (rev: number) => innerH - (rev / maxRev) * innerH;

  const divColor = DIVISION_COLORS[division] ?? "#3b82f6";
  const current = points.find((p) => p.isCurrent);

  // Y axis ticks
  const yTicks = [0, 50, 100, 200, 400, 600, 750].filter((v) => v <= maxRev + 50);

  // X axis ticks — log-spaced, formatted as requested
  const xTickVals = [100_000, 250_000, 500_000, 1_000_000, 3_000_000, 9_000_000];

  const showTooltip = (
    p: { name: string; population: number; revenue: number; division: string },
    e: React.MouseEvent
  ) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    setTooltip({
      x: (PAD.left + sx(p.population)) * scaleX,
      y: (PAD.top + sy(p.revenue)) * scaleY,
      name: p.name,
      pop: p.population,
      rev: p.revenue,
      division: p.division,
    });
  };

  return (
    <div className="relative">
      <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-3">
        Revenue vs Market Size — all 92 English clubs
      </p>
      <div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ fontFamily: "inherit", display: "block" }}
        >
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* Y grid lines + labels */}
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={0} y1={sy(v)} x2={innerW} y2={sy(v)} stroke="#f0f0f0" strokeWidth={1} />
                <text x={-6} y={sy(v) + 4} textAnchor="end" fontSize={9} fill="#aaaaaa">
                  {v > 0 ? `£${v}m` : "£0"}
                </text>
              </g>
            ))}

            {/* X grid lines + labels (log scale) */}
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
              Local Population (mid-2024, log scale)
            </text>
            <text
              x={-innerH / 2} y={-42}
              textAnchor="middle"
              fontSize={9}
              fill="#888888"
              transform="rotate(-90)"
            >
              Revenue (£m)
            </text>

            {/* Other clubs — grey dots */}
            {points
              .filter((p) => !p.isCurrent)
              .map((p) => (
                <circle
                  key={p.slug}
                  cx={sx(p.population)}
                  cy={sy(p.revenue)}
                  r={3.5}
                  fill="#cccccc"
                  opacity={0.75}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => showTooltip(p, e)}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}

            {/* Current club — highlighted with outline ring */}
            {current && (
              <>
                <circle
                  cx={sx(current.population)}
                  cy={sy(current.revenue)}
                  r={11}
                  fill="none"
                  stroke={divColor}
                  strokeWidth={1.5}
                  opacity={0.35}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => showTooltip(current, e)}
                  onMouseLeave={() => setTooltip(null)}
                />
                <circle
                  cx={sx(current.population)}
                  cy={sy(current.revenue)}
                  r={7}
                  fill={divColor}
                  stroke="white"
                  strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => showTooltip(current, e)}
                  onMouseLeave={() => setTooltip(null)}
                />
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-[#e0e0e0] shadow-sm px-2.5 py-2 text-[11px] z-20"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y,
            transform: "translateY(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          <p className="font-semibold text-[#111111] mb-0.5">{tooltip.name}</p>
          <p className="text-[#888888]">{DIVISION_LABELS[tooltip.division] ?? tooltip.division}</p>
          <p className="text-[#555555]">
            Pop: {tooltip.pop >= 1_000_000
              ? `${(tooltip.pop / 1_000_000).toFixed(1)}m`
              : tooltip.pop.toLocaleString()}
          </p>
          <p className="text-[#555555]">Revenue: £{tooltip.rev.toFixed(1)}m</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: divColor }} />
          <span className="text-[10px] text-[#666666]">This club</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#cccccc]" />
          <span className="text-[10px] text-[#666666]">Other clubs</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketContextPanel({
  ctx,
  division,
  slug,
}: {
  ctx: MarketContext;
  division: string;
  slug: string;
}) {
  const [benchmark, setBenchmark] = useState<"england" | "division">("england");
  const color = DIVISION_COLORS[division] ?? "#3b82f6";
  const divLabel = DIVISION_LABELS[division] ?? division;

  const divAvg = computeDivisionAvg(division);

  const benchmarks =
    benchmark === "england"
      ? {
          gva_per_head: ENGLAND_BENCHMARKS.gva_per_head,
          median_pay:   ENGLAND_BENCHMARKS.median_pay,
          population:   null, // no England avg for population
          label:        "England avg",
        }
      : {
          gva_per_head: divAvg.gva_per_head,
          median_pay:   divAvg.median_pay,
          population:   divAvg.population,
          label:        `${divLabel} avg`,
        };

  return (
    <div className="space-y-5">
      {/* Header bar: location + benchmark toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[#444444]">
            <span className="text-[#888888]">📍</span> {ctx.local_authority}
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium border border-[#e0e0e0] text-[#666666]"
          >
            {ctx.region}
          </span>
          {ctx.uncertain && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] border border-[#fde68a] text-[#b45309] bg-[#fffbeb]">
              Approx match
            </span>
          )}
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-0 border border-[#e0e0e0] overflow-hidden">
          {(["england", "division"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBenchmark(b)}
              className={`px-3 py-1.5 text-[10px] font-medium tracking-[0.05em] uppercase transition-colors ${
                benchmark === b
                  ? "text-white"
                  : "text-[#888888] hover:text-[#444444] bg-white"
              }`}
              style={benchmark === b ? { backgroundColor: color } : {}}
            >
              {b === "england" ? "vs England" : `vs ${divLabel}`}
            </button>
          ))}
        </div>
      </div>

      {/* Three metric cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Population */}
        <div
          className="bg-white border border-[#e8e8e8] px-5 py-4"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-2">
            Local Population
          </p>
          {ctx.population != null ? (
            <>
              <p className="text-2xl font-semibold text-[#111111]">
                {ctx.population >= 1_000_000
                  ? `${(ctx.population / 1_000_000).toFixed(1)}m`
                  : ctx.population.toLocaleString()}
              </p>
              {benchmarks.population != null && (
                <>
                  <MetricBar
                    value={ctx.population}
                    benchmark={benchmarks.population}
                    color={color}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <ComparisonPill value={ctx.population} benchmark={benchmarks.population} />
                    <span className="text-[10px] text-[#999999]">{benchmarks.label}</span>
                  </div>
                </>
              )}
              <p className="text-[10px] text-[#bbbbbb] mt-2">{ctx.local_authority}, mid-2024</p>
            </>
          ) : (
            <p className="text-sm text-[#cccccc] italic">—</p>
          )}
        </div>

        {/* GVA per head */}
        <div
          className="bg-white border border-[#e8e8e8] px-5 py-4"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-2">
            GVA per Head
          </p>
          {ctx.gva_per_head != null ? (
            <>
              <p className="text-2xl font-semibold text-[#111111]">
                £{ctx.gva_per_head.toLocaleString()}
              </p>
              {benchmarks.gva_per_head != null && (
                <>
                  <MetricBar
                    value={ctx.gva_per_head}
                    benchmark={benchmarks.gva_per_head}
                    color={color}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <ComparisonPill value={ctx.gva_per_head} benchmark={benchmarks.gva_per_head} />
                    <span className="text-[10px] text-[#999999]">{benchmarks.label}</span>
                  </div>
                </>
              )}
              <p className="text-[10px] text-[#bbbbbb] mt-2">{ctx.gva_area}, 2023</p>
            </>
          ) : (
            <p className="text-sm text-[#cccccc] italic">—</p>
          )}
        </div>

        {/* Median pay */}
        <div
          className="bg-white border border-[#e8e8e8] px-5 py-4"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-2">
            Median Annual Pay
          </p>
          {ctx.median_pay != null ? (
            <>
              <p className="text-2xl font-semibold text-[#111111]">
                £{ctx.median_pay.toLocaleString()}
              </p>
              {benchmarks.median_pay != null && (
                <>
                  <MetricBar
                    value={ctx.median_pay}
                    benchmark={benchmarks.median_pay}
                    color={color}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <ComparisonPill value={ctx.median_pay} benchmark={benchmarks.median_pay} />
                    <span className="text-[10px] text-[#999999]">{benchmarks.label}</span>
                  </div>
                </>
              )}
              <p className="text-[10px] text-[#bbbbbb] mt-2">{ctx.region}, 2025</p>
            </>
          ) : (
            <p className="text-sm text-[#cccccc] italic">—</p>
          )}
        </div>
      </div>

      {/* Scatter plot */}
      <div
        className="bg-white border border-[#e8e8e8] px-5 py-5"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <RevenueScatterPlot currentSlug={slug} division={division} />
      </div>

      <p className="text-[10px] text-[#cccccc] leading-relaxed">
        Sources: ONS Mid-Year Population Estimates 2024 · ONS Regional GVA (Balanced) 2023 · ONS ASHE 2025
      </p>
    </div>
  );
}
