import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { clubs, getClub, fmt, type ClubFinancials } from "@/lib/clubs";

export function generateStaticParams() {
  return clubs.map((c) => ({ slug: c.slug }));
}

const DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

const ALL_METRICS: {
  key: keyof ClubFinancials;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter: boolean | null;
}[] = [
  { key: "revenue",          label: "Revenue",          higherBetter: true },
  { key: "wage_bill",        label: "Wage Bill",        higherBetter: null },
  { key: "wage_ratio",       label: "Wage Ratio",       isRatio: true, higherBetter: false },
  { key: "operating_profit", label: "Operating Profit", diverging: true, higherBetter: true },
  { key: "net_debt",         label: "Net Debt",         diverging: true, higherBetter: false },
];

function divisionStats(division: string, key: keyof ClubFinancials) {
  const vals = clubs
    .filter((c) => c.division === division && c[key] !== null)
    .map((c) => c[key] as number);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);
  const sorted = [...vals].sort((a, b) => b - a);
  return { avg, maxAbs, sorted, count: vals.length };
}

/** Green = better than division average, red = worse — for all metrics, all bar types */
function vsAvgColor(value: number, avg: number, higherBetter: boolean | null): string {
  if (higherBetter === null) return "#aaaaaa"; // wage bill — neutral
  return (higherBetter ? value > avg : value < avg) ? "#4a9a6a" : "#9a4a4a";
}

function HealthBadges({ club }: { club: ClubFinancials }) {
  const issues: string[] = [];
  const positives: string[] = [];

  if (club.pre_tax_profit !== null && club.pre_tax_profit < 0) issues.push("Loss-making");
  if (club.pre_tax_profit !== null && club.pre_tax_profit > 0) positives.push("Profitable");
  if (club.net_debt !== null && club.net_debt > 300) issues.push("High debt");
  if (club.net_debt !== null && club.net_debt < 0) positives.push("Net cash");
  if (club.wage_ratio !== null && club.wage_ratio > 100) issues.push("Wages exceed revenue");
  else if (club.wage_ratio !== null && club.wage_ratio > 80) issues.push("High wage ratio");
  if (club.wage_ratio !== null && club.wage_ratio < 60) positives.push("Lean wage bill");

  if (!issues.length && !positives.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {positives.map((p) => (
        <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#4a9a6a] text-[#4a9a6a]">
          {p}
        </span>
      ))}
      {issues.map((i) => (
        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[#9a4a4a] text-[#9a4a4a]">
          {i}
        </span>
      ))}
    </div>
  );
}

function StandardBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-7 bg-[#eeeeee] overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/** Diverging bar — negative extends left, positive extends right. Single `color` prop for the fill. */
function DivergingBar({ value, scale, color }: {
  value: number;
  scale: number;
  color: string;
}) {
  const pct = Math.min((Math.abs(value) / scale) * 100, 100);
  const isPositive = value >= 0;

  return (
    <div className="flex-1 flex h-7">
      <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
        {!isPositive && (
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        )}
      </div>
      <div className="w-px bg-[#e0e0e0] shrink-0" />
      <div className="flex-1 overflow-hidden bg-[#eeeeee]">
        {isPositive && (
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        )}
      </div>
    </div>
  );
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = getClub(slug);
  if (!club) notFound();

  const fyDate = new Date(club.fiscal_year_end).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999999] hover:text-[#111111] mb-6 group transition-colors">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        All clubs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl font-serif font-light text-[#111111] tracking-tight">{club.name}</h1>
              <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-[10px] font-medium tracking-[0.1em] uppercase text-[#666666]">
                {DIVISION_LABELS[club.division]}
              </span>
            </div>
            <p className="text-sm text-[#999999]">
              Financial year ending <span className="text-[#666666]">{fyDate}</span>
              {club.data_confidence !== "high" && (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-[10px] text-[#999999]">
                  {club.data_confidence === "medium" ? "Extracted · not independently verified" : "No financial data available"}
                </span>
              )}
            </p>
            <HealthBadges club={club} />
          </div>

          <Link
            href={`/compare?clubs=${club.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors shrink-0"
          >
            Compare with another club →
          </Link>
        </div>
      </div>

      {/* Split grid — CSS grid ensures left/right rows align precisely */}
      <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">

        {/* Column headers */}
        <div className="px-6 py-4 bg-white border-b border-r border-[#e0e0e0]">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">Financial Figures</p>
        </div>
        <div className="px-6 py-4 bg-white border-b border-[#e0e0e0]">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">vs Division Average</p>
        </div>

        {/* Metric rows */}
        {ALL_METRICS.map((m) => {
          const val = club[m.key] as number | null;
          const stats = divisionStats(club.division, m.key);
          const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;

          const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01) : 1;
          const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
          const avgPct = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;

          // Bar colour: green = better than division avg, red = worse, for ALL metrics
          const barColor = val !== null && stats
            ? vsAvgColor(val, stats.avg, m.higherBetter)
            : "#cccccc";

          return (
            <Fragment key={m.key as string}>
              {/* Left cell — plain figures, no colour coding */}
              <div className="px-6 py-5 border-b border-r border-[#e0e0e0] bg-white">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-1.5">{m.label}</p>
                {val !== null ? (
                  <p className="text-2xl font-light tabular-nums text-[#111111]">
                    {fmt(val, m.isRatio)}
                  </p>
                ) : (
                  <p className="text-2xl font-light text-[#cccccc]">—</p>
                )}
                {stats && rank !== null && (
                  <p className="text-[10px] text-[#aaaaaa] mt-1.5">
                    #{rank} <span className="text-[#cccccc]">of {stats.count}</span>
                  </p>
                )}
              </div>

              {/* Right cell — bar charts with green/red vs division average */}
              <div className="px-6 py-5 border-b border-[#e0e0e0] bg-white">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">{m.label}</p>

                {/* Club bar */}
                <div className="mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    {m.diverging ? (
                      <DivergingBar
                        value={val ?? 0}
                        scale={scale / 2}
                        color={val !== null ? barColor : "#cccccc"}
                      />
                    ) : (
                      <StandardBar pct={clubPct} color={val !== null ? barColor : "#eeeeee"} />
                    )}
                    <span className="text-xs font-medium tabular-nums text-[#111111] w-14 text-right shrink-0">
                      {fmt(val, m.isRatio)}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#aaaaaa] tracking-[0.05em]">This club</p>
                </div>

                {/* Division avg bar */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    {m.diverging && stats ? (
                      <DivergingBar value={stats.avg} scale={scale / 2} color="#cccccc" />
                    ) : (
                      <StandardBar pct={avgPct} color="#cccccc" />
                    )}
                    <span className="text-xs tabular-nums text-[#aaaaaa] w-14 text-right shrink-0">
                      {stats ? fmt(stats.avg, m.isRatio) : "—"}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#cccccc] tracking-[0.05em]">Division avg</p>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
