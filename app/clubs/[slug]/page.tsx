import { notFound } from "next/navigation";
import Link from "next/link";
import { clubs, getClub, fmt, METRICS, type DataConfidence, type ClubFinancials } from "@/lib/clubs";

export function generateStaticParams() {
  return clubs.map((c) => ({ slug: c.slug }));
}

const DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship": "Championship",
  "league-one": "League One",
  "league-two": "League Two",
};

const DIVISION_BADGE: Record<string, string> = {
  "premier-league": "bg-purple-50 text-purple-700 border-purple-200",
  "championship":   "bg-sky-50 text-sky-700 border-sky-200",
  "league-one":     "bg-amber-50 text-amber-700 border-amber-200",
  "league-two":     "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function divStats(division: string, key: keyof ClubFinancials) {
  const vals = clubs
    .filter((c) => c.division === division && c[key] !== null)
    .map((c) => c[key] as number);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const sorted = [...vals].sort((a, b) => b - a);
  return { avg, min, max, sorted };
}

function BenchmarkRow({
  label,
  value,
  metricKey,
  division,
  slug,
}: {
  label: string;
  value: number | null;
  metricKey: keyof ClubFinancials;
  division: string;
  slug: string;
}) {
  const isRatio = metricKey === "wage_ratio";
  const stats = divStats(division, metricKey);
  const divClubs = clubs.filter((c) => c.division === division && c[metricKey] !== null);
  const allVals = divClubs.map((c) => c[metricKey] as number).sort((a, b) => b - a);
  const rank = value !== null ? allVals.indexOf(value) + 1 : null;

  // Colour for value
  let valueColor = "text-gray-900";
  if (value !== null) {
    if (metricKey === "net_debt") valueColor = value > 0 ? "text-red-600" : value < 0 ? "text-green-600" : "text-gray-900";
    else if (["operating_profit", "pre_tax_profit"].includes(metricKey as string))
      valueColor = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-900";
  }

  // Position on bar [0..1] — use min/max of division
  let barPos: number | null = null;
  if (value !== null && stats && stats.max !== stats.min) {
    barPos = (value - stats.min) / (stats.max - stats.min);
  }

  // pct diff vs avg
  let vsAvg: string | null = null;
  if (value !== null && stats) {
    const diff = ((value - stats.avg) / Math.abs(stats.avg)) * 100;
    if (Math.abs(diff) >= 1) {
      vsAvg = diff > 0 ? `+${diff.toFixed(0)}% vs div avg` : `${diff.toFixed(0)}% vs div avg`;
    }
  }

  return (
    <div className="py-4 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          {value !== null ? (
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${valueColor}`}>{fmt(value, isRatio)}</p>
          ) : (
            <p className="text-2xl font-bold text-gray-200 mt-0.5">—</p>
          )}
        </div>
        {stats && value !== null && (
          <div className="text-right shrink-0">
            {rank !== null && (
              <p className="text-sm font-semibold text-gray-900">
                #{rank} <span className="text-xs font-normal text-gray-400">of {allVals.length}</span>
              </p>
            )}
            {vsAvg && (
              <p className={`text-xs mt-0.5 ${vsAvg.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
                {vsAvg}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">div avg {fmt(stats.avg, isRatio)}</p>
          </div>
        )}
      </div>

      {/* Range bar */}
      {barPos !== null && stats && (
        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-visible mt-1">
          <div className="absolute inset-0 rounded-full bg-gray-100" />
          {/* Avg marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-300 rounded-full"
            style={{ left: `${((stats.avg - stats.min) / (stats.max - stats.min)) * 100}%` }}
          />
          {/* Club dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{
              left: `${barPos * 100}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor:
                metricKey === "net_debt"
                  ? (value! > 0 ? "#ef4444" : "#22c55e")
                  : ["operating_profit", "pre_tax_profit"].includes(metricKey as string)
                  ? (value! >= 0 ? "#22c55e" : "#ef4444")
                  : "#3b82f6",
            }}
          />
        </div>
      )}
      {stats && value !== null && (
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-300">{fmt(stats.min, isRatio)}</span>
          <span className="text-[10px] text-gray-300">{fmt(stats.max, isRatio)}</span>
        </div>
      )}
    </div>
  );
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
        <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          {p}
        </span>
      ))}
      {issues.map((i) => (
        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          {i}
        </span>
      ))}
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

  const metrics = METRICS.filter((m) => m.key !== "wage_ratio");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/compare" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 mb-6 group transition-colors">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        All clubs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{club.name}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${DIVISION_BADGE[club.division]}`}>
            {DIVISION_LABELS[club.division]}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Financial year ending <span className="text-gray-700 font-medium">{fyDate}</span>
          {club.data_confidence !== "high" && (
            <span className={`ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              club.data_confidence === "medium"
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}>
              {club.data_confidence === "medium" ? "Extracted · not independently verified" : "No financial data available"}
            </span>
          )}
        </p>
        <HealthBadges club={club} />

        {/* Compare link */}
        <Link
          href={`/compare/clubs?clubs=${club.slug}`}
          className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          Compare with another club →
        </Link>
      </div>

      {/* Metrics with benchmarks */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 divide-y divide-gray-50 mb-6">
        {metrics.map((m) => (
          <BenchmarkRow
            key={m.key as string}
            label={m.label}
            value={club[m.key] as number | null}
            metricKey={m.key}
            division={club.division}
            slug={club.slug}
          />
        ))}
        {/* Wage ratio */}
        <BenchmarkRow
          label="Wage Ratio"
          value={club.wage_ratio}
          metricKey="wage_ratio"
          division={club.division}
          slug={club.slug}
        />
      </div>
    </div>
  );
}
