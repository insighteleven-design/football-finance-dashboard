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

const DIVISION_BADGE: Record<string, string> = {
  "premier-league": "bg-purple-50 text-purple-700 border-purple-200",
  "championship":   "bg-sky-50 text-sky-700 border-sky-200",
  "league-one":     "bg-amber-50 text-amber-700 border-amber-200",
  "league-two":     "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ALL_METRICS: {
  key: keyof ClubFinancials;
  label: string;
  isRatio?: boolean;
}[] = [
  { key: "revenue",          label: "Revenue"          },
  { key: "wage_bill",        label: "Wage Bill"        },
  { key: "wage_ratio",       label: "Wage Ratio", isRatio: true },
  { key: "operating_profit", label: "Operating Profit" },
  { key: "pre_tax_profit",   label: "Pre-tax Profit"   },
  { key: "net_debt",         label: "Net Debt"         },
  { key: "cash",             label: "Cash"             },
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

function barColor(key: keyof ClubFinancials, value: number): string {
  if (key === "net_debt") return value > 0 ? "#ef4444" : "#22c55e";
  if (key === "operating_profit" || key === "pre_tax_profit") {
    return value >= 0 ? "#22c55e" : "#f97316";
  }
  return "#3b82f6";
}

function valueColor(key: keyof ClubFinancials, value: number): string {
  if (key === "net_debt") return value > 0 ? "text-red-600" : "text-green-600";
  if (key === "operating_profit" || key === "pre_tax_profit") {
    return value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-900";
  }
  return "text-gray-900";
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 mb-6 group transition-colors">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        All clubs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{club.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${DIVISION_BADGE[club.division]}`}>
                {DIVISION_LABELS[club.division]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Financial year ending <span className="font-medium text-gray-700">{fyDate}</span>
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
          </div>

          <Link
            href={`/compare?clubs=${club.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            Compare with another club →
          </Link>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border border-gray-200 rounded-2xl overflow-hidden">
        {/* Left: figures */}
        <div className="lg:border-r border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial Figures</p>
          </div>
          <div className="divide-y divide-gray-50">
            {ALL_METRICS.map((m) => {
              const val = club[m.key] as number | null;
              const stats = divisionStats(club.division, m.key);
              const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;
              return (
                <div key={m.key as string} className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{m.label}</p>
                  {val !== null ? (
                    <p className={`text-2xl font-bold tabular-nums ${valueColor(m.key, val)}`}>
                      {fmt(val, m.isRatio)}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-200">—</p>
                  )}
                  {stats && rank !== null && (
                    <p className="text-xs text-gray-400 mt-1">
                      #{rank} of {stats.count} in {DIVISION_LABELS[club.division]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: bar charts */}
        <div>
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">vs Division Average</p>
          </div>
          <div className="divide-y divide-gray-50">
            {ALL_METRICS.map((m) => {
              const val = club[m.key] as number | null;
              const stats = divisionStats(club.division, m.key);
              const scale = stats
                ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01)
                : 1;
              const clubPct = val !== null
                ? Math.min((Math.abs(val) / scale) * 100, 100)
                : 0;
              const avgPct = stats
                ? Math.min((Math.abs(stats.avg) / scale) * 100, 100)
                : 0;
              const color = val !== null ? barColor(m.key, val) : "#9ca3af";
              return (
                <div key={m.key as string} className="px-6 py-5">
                  <div className="space-y-3">
                    {/* Club bar */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md"
                            style={{ width: `${clubPct}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-gray-900 w-16 text-right shrink-0">
                          {fmt(val, m.isRatio)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">This club</p>
                    </div>
                    {/* Div avg bar */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md bg-gray-300"
                            style={{ width: `${avgPct}%` }}
                          />
                        </div>
                        <span className="text-sm tabular-nums text-gray-400 w-16 text-right shrink-0">
                          {stats ? fmt(stats.avg, m.isRatio) : "—"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Division avg</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
