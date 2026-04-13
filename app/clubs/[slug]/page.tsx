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

// Metrics shown on the profile page
const ALL_METRICS: {
  key: keyof ClubFinancials;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;   // profit/debt: negative extends left, positive extends right
  higherBetter: boolean | null; // null = neutral (wage bill)
}[] = [
  { key: "revenue",          label: "Revenue",          higherBetter: true },
  { key: "wage_bill",        label: "Wage Bill",        higherBetter: null },
  { key: "wage_ratio",       label: "Wage Ratio",       isRatio: true, higherBetter: false },
  { key: "operating_profit", label: "Operating Profit", diverging: true, higherBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax Profit",   diverging: true, higherBetter: true },
  { key: "net_debt",         label: "Net Debt",         diverging: true, higherBetter: false },
  { key: "cash",             label: "Cash",             higherBetter: true },
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

/** Resolve bar color for the club's bar based on vs-average comparison */
function clubBarColor(
  key: keyof ClubFinancials,
  value: number,
  avg: number,
  higherBetter: boolean | null
): string {
  if (higherBetter === null) return "#444444"; // neutral — wage bill
  const better = higherBetter ? value > avg : value < avg;
  return better ? "#4a9a6a" : "#9a4a4a";
}

/** Resolve text color for the value on the left panel */
function valueTextColor(
  key: keyof ClubFinancials,
  value: number,
  avg: number,
  higherBetter: boolean | null
): string {
  if (higherBetter === null) return "text-white";
  const better = higherBetter ? value > avg : value < avg;
  return better ? "text-[#4a9a6a]" : "text-[#9a4a4a]";
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

/** A standard left-to-right bar (revenue, wages, cash, wage ratio) */
function StandardBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-7 bg-[#1a1a1a] overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/** A diverging bar — negative side extends left, positive extends right */
function DivergingBar({ value, scale, positiveColor, negativeColor }: {
  value: number;
  scale: number;
  positiveColor: string;
  negativeColor: string;
}) {
  const pct = Math.min((Math.abs(value) / scale) * 100, 100);
  const isPositive = value >= 0;
  const color = isPositive ? positiveColor : negativeColor;

  return (
    <div className="flex-1 flex h-7">
      {/* Negative (left) side */}
      <div className="flex-1 flex justify-end overflow-hidden bg-[#1a1a1a]">
        {!isPositive && (
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        )}
      </div>
      {/* Centre divider */}
      <div className="w-px bg-[#2a2a2a] shrink-0" />
      {/* Positive (right) side */}
      <div className="flex-1 overflow-hidden bg-[#1a1a1a]">
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
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-white mb-6 group transition-colors">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        All clubs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl font-serif font-light text-white tracking-tight">{club.name}</h1>
              <span className="inline-flex items-center px-2 py-0.5 border border-[#2a2a2a] text-[10px] font-medium tracking-[0.1em] uppercase text-[#888888]">
                {DIVISION_LABELS[club.division]}
              </span>
            </div>
            <p className="text-sm text-[#555555]">
              Financial year ending <span className="text-[#888888]">{fyDate}</span>
              {club.data_confidence !== "high" && (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 border border-[#2a2a2a] text-[10px] text-[#555555]">
                  {club.data_confidence === "medium" ? "Extracted · not independently verified" : "No financial data available"}
                </span>
              )}
            </p>
            <HealthBadges club={club} />
          </div>

          <Link
            href={`/compare?clubs=${club.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] text-sm text-[#888888] hover:border-white hover:text-white transition-colors shrink-0"
          >
            Compare with another club →
          </Link>
        </div>
      </div>

      {/* Split grid — CSS grid ensures left/right rows align precisely */}
      <div className="grid lg:grid-cols-2 border border-[#2a2a2a] overflow-hidden">

        {/* Column headers */}
        <div className="px-6 py-4 bg-[#111111] border-b border-r border-[#2a2a2a]">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#555555]">Financial Figures</p>
        </div>
        <div className="px-6 py-4 bg-[#111111] border-b border-[#2a2a2a]">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#555555]">vs Division Average</p>
        </div>

        {/* Metric rows */}
        {ALL_METRICS.map((m) => {
          const val = club[m.key] as number | null;
          const stats = divisionStats(club.division, m.key);
          const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;

          // Scale: max absolute in division (used to size both bars comparably)
          const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats?.avg ?? 0), 0.01) : 1;

          // Club bar sizing
          const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
          // Avg bar sizing
          const avgPct = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;

          // Colors
          const barColor = val !== null && stats
            ? clubBarColor(m.key, val, stats.avg, m.higherBetter)
            : "#444444";
          const txtColor = val !== null && stats
            ? valueTextColor(m.key, val, stats.avg, m.higherBetter)
            : "text-white";

          return (
            <Fragment key={m.key as string}>
              {/* Left cell — figure */}
              <div className="px-6 py-5 border-b border-r border-[#2a2a2a]">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#555555] mb-1.5">{m.label}</p>
                {val !== null ? (
                  <p className={`text-2xl font-light tabular-nums ${txtColor}`}>
                    {fmt(val, m.isRatio)}
                  </p>
                ) : (
                  <p className="text-2xl font-light text-[#2a2a2a]">—</p>
                )}
                {stats && rank !== null && (
                  <p className="text-[10px] text-[#444444] mt-1.5">
                    #{rank} <span className="text-[#333333]">of {stats.count}</span>
                  </p>
                )}
              </div>

              {/* Right cell — bars */}
              <div className="px-6 py-5 border-b border-[#2a2a2a]">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#555555] mb-3">{m.label}</p>

                {/* Club bar */}
                <div className="mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    {m.diverging ? (
                      <DivergingBar
                        value={val ?? 0}
                        scale={scale / 2}
                        positiveColor="#4a9a6a"
                        negativeColor="#9a4a4a"
                      />
                    ) : (
                      <StandardBar pct={clubPct} color={val !== null ? barColor : "#1a1a1a"} />
                    )}
                    <span className="text-xs font-medium tabular-nums text-white w-14 text-right shrink-0">
                      {fmt(val, m.isRatio)}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#444444] tracking-[0.05em]">This club</p>
                </div>

                {/* Division avg bar */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    {m.diverging && stats ? (
                      <DivergingBar
                        value={stats.avg}
                        scale={scale / 2}
                        positiveColor="#333333"
                        negativeColor="#2a2a2a"
                      />
                    ) : (
                      <StandardBar pct={avgPct} color="#333333" />
                    )}
                    <span className="text-xs tabular-nums text-[#555555] w-14 text-right shrink-0">
                      {stats ? fmt(stats.avg, m.isRatio) : "—"}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#333333] tracking-[0.05em]">Division avg</p>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
