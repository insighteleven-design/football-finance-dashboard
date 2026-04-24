"use client";

// Pure-SVG radar / spider chart. No external dependencies.
// Uses percentile-rank normalisation against the full dataset population per axis,
// so the visual position reflects genuine rank — robust to extreme outliers.

export interface RadarAxis {
  label: string;       // display label — use \n for line break
  invert?: boolean;    // lower raw value = better = larger polygon
  population: number[]; // all non-null values for this axis across the full dataset
}

export interface RadarSeries {
  name: string;
  color: string;
  values: (number | null)[]; // one per axis
}

interface Props {
  axes: RadarAxis[];
  series: RadarSeries[];
}

const CX       = 350;
const CY       = 350;
const RADIUS   = 240;
const LABEL_R  = 306;
const GRID_STEPS = 5;

// ─── Percentile rank ──────────────────────────────────────────────────────────

function percentileRank(v: number, sorted: number[]): number {
  if (sorted.length === 0) return 0.5;
  let below = 0, equal = 0;
  for (const x of sorted) {
    if (x < v) below++;
    else if (x === v) equal++;
  }
  return (below + 0.5 * equal) / sorted.length;
}

function normalizeValue(v: number | null, sorted: number[], invert: boolean): number {
  if (v === null || sorted.length === 0) return 0.05;
  const rank = percentileRank(v, sorted);
  const result = invert ? 1 - rank : rank;
  return Math.max(0.05, Math.min(0.98, result));
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function axisAngle(i: number, total: number): number {
  return (i / total) * 2 * Math.PI - Math.PI / 2;
}

function polarToXY(angle: number, r: number): { x: number; y: number } {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function polygonPoints(normalized: number[]): string {
  return normalized
    .map((n, i) => {
      const { x, y } = polarToXY(axisAngle(i, normalized.length), RADIUS * n);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function gridPolygonPoints(fraction: number, total: number): string {
  return Array.from({ length: total })
    .map((_, i) => {
      const { x, y } = polarToXY(axisAngle(i, total), RADIUS * fraction);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

// ─── Axis label ───────────────────────────────────────────────────────────────

function AxisLabel({ axis, index, total }: { axis: RadarAxis; index: number; total: number }) {
  const angle   = axisAngle(index, total);
  const { x, y } = polarToXY(angle, LABEL_R);
  const cos     = Math.cos(angle);
  const sin     = Math.sin(angle);
  const anchor  = cos < -0.25 ? "end" : cos > 0.25 ? "start" : "middle";
  const lines   = axis.label.split("\n");
  const lineH   = 22;
  const startDy = -(lines.length - 1) * lineH * 0.5;
  const nudgeY  = sin < -0.25 ? -6 : sin > 0.25 ? 6 : 0;

  return (
    <text
      x={x}
      y={y + startDy + nudgeY}
      textAnchor={anchor}
      fontSize={17}
      fontWeight={600}
      letterSpacing="0.07em"
      fill="#666666"
      style={{ textTransform: "uppercase", fontFamily: "inherit" }}
    >
      {lines.map((line, li) => (
        <tspan key={li} x={x} dy={li === 0 ? 0 : lineH}>{line}</tspan>
      ))}
    </text>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RadarChart({ axes, series }: Props) {
  const n     = axes.length;
  const viewW = 700;
  const viewH = 700;

  const sortedPops = axes.map((axis) => [...axis.population].sort((a, b) => a - b));

  const seriesNorm: number[][] = series.map((s) =>
    axes.map((axis, ai) =>
      normalizeValue(s.values[ai] ?? null, sortedPops[ai], axis.invert ?? false)
    )
  );

  return (
    <div style={{ width: "100%", maxWidth: "720px", margin: "0 auto" }}>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        aria-label="Radar chart"
      >
        {/* ── Background fill ──────────────────────────────────────────────── */}
        <polygon
          points={gridPolygonPoints(1, n)}
          fill="#f8f8f8"
          stroke="none"
        />

        {/* ── Grid rings ───────────────────────────────────────────────────── */}
        {Array.from({ length: GRID_STEPS }).map((_, gi) => {
          const frac = (gi + 1) / GRID_STEPS;
          return (
            <polygon
              key={gi}
              points={gridPolygonPoints(frac, n)}
              fill="none"
              stroke={gi === GRID_STEPS - 1 ? "#d8d8d8" : "#e8e8e8"}
              strokeWidth={gi === GRID_STEPS - 1 ? 1.5 : 1}
            />
          );
        })}

        {/* ── Percentile labels on second axis ─────────────────────────────── */}
        {Array.from({ length: GRID_STEPS }).map((_, gi) => {
          const frac  = (gi + 1) / GRID_STEPS;
          const angle = axisAngle(1, n);
          const { x, y } = polarToXY(angle, RADIUS * frac);
          return (
            <text key={gi} x={x + 8} y={y} fontSize={12} fill="#bbbbbb" dominantBaseline="middle" fontWeight={500}>
              {Math.round(frac * 100)}
            </text>
          );
        })}

        {/* ── Axis lines ───────────────────────────────────────────────────── */}
        {axes.map((_, i) => {
          const { x, y } = polarToXY(axisAngle(i, n), RADIUS);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#dedede" strokeWidth={1.5} />;
        })}

        {/* ── Series polygons ──────────────────────────────────────────────── */}
        {series.map((s, si) => (
          <g key={s.name}>
            <polygon
              points={polygonPoints(seriesNorm[si])}
              fill={s.color}
              fillOpacity={series.length <= 2 ? 0.15 : 0.1}
              stroke={s.color}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            {seriesNorm[si].map((norm, ai) => {
              const { x, y } = polarToXY(axisAngle(ai, n), RADIUS * norm);
              return (
                <circle key={ai} cx={x} cy={y} r={7} fill={s.color} stroke="#ffffff" strokeWidth={2} />
              );
            })}
          </g>
        ))}

        {/* ── Axis labels ──────────────────────────────────────────────────── */}
        {axes.map((axis, i) => (
          <AxisLabel key={i} axis={axis} index={i} total={n} />
        ))}
      </svg>

      {/* ── Legend (HTML) ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem 2.5rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #eeeeee", justifyContent: "center" }}>
        {series.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: "16px", height: "16px", backgroundColor: s.color, borderRadius: "3px", flexShrink: 0 }} />
            <span style={{ fontSize: "16px", fontWeight: 500, color: s.color }}>{s.name}</span>
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: "12px", color: "#bbbbbb", marginTop: "0.75rem", letterSpacing: "0.04em" }}>
        Position = percentile rank across full dataset
      </p>
    </div>
  );
}
