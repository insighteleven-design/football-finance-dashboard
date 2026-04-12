import { notFound } from "next/navigation";
import Link from "next/link";
import { clubs, getClub, fmt, METRICS } from "@/lib/clubs";

export function generateStaticParams() {
  return clubs.map((c) => ({ slug: c.slug }));
}

function MetricCard({
  label,
  description,
  value,
  metricKey,
}: {
  label: string;
  description: string;
  value: number | null;
  metricKey: string;
}) {
  const isRatio = metricKey === "wage_ratio";
  const formatted = fmt(value, isRatio);

  let valueClass = "text-gray-900";
  if (value !== null) {
    if (metricKey === "net_debt") {
      valueClass = value > 0 ? "text-red-600" : value < 0 ? "text-green-600" : "text-gray-900";
    } else if (["operating_profit", "pre_tax_profit"].includes(metricKey)) {
      valueClass = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-900";
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1.5 tabular-nums ${valueClass}`}>{formatted}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function HealthBadge({ club }: { club: ReturnType<typeof getClub> }) {
  if (!club) return null;
  const { pre_tax_profit, net_debt, wage_ratio } = club;
  const issues: string[] = [];
  const positives: string[] = [];

  if (pre_tax_profit !== null && pre_tax_profit < 0) issues.push("Loss-making");
  if (pre_tax_profit !== null && pre_tax_profit > 0) positives.push("Profitable");
  if (net_debt !== null && net_debt > 300) issues.push("High debt");
  if (net_debt !== null && net_debt < 0) positives.push("Net cash");
  if (wage_ratio !== null && wage_ratio > 80) issues.push("High wage ratio");
  if (wage_ratio !== null && wage_ratio < 60) positives.push("Lean wages");

  return (
    <div className="flex flex-wrap gap-2 mt-4">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-6 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        All clubs
      </Link>

      {/* Club header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{club.name}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            club.division === "premier-league"
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : "bg-sky-50 text-sky-700 border-sky-200"
          }`}>
            {club.division === "premier-league" ? "Premier League" : "Championship"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Financial year ending <span className="text-gray-700 font-medium">{fyDate}</span>
        </p>
        <HealthBadge club={club} />
      </div>

      {/* Primary metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {metrics.map((m) => (
          <MetricCard
            key={m.key as string}
            label={m.label}
            description={m.description}
            value={club[m.key] as number | null}
            metricKey={m.key as string}
          />
        ))}
      </div>

      {/* Wage ratio card — full width */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wage Ratio</p>
            <p className="text-3xl font-bold mt-1.5 tabular-nums text-gray-900">
              {fmt(club.wage_ratio, true)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Wage bill as a percentage of revenue</p>
          </div>
          {club.wage_ratio !== null && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Industry benchmark</p>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${club.wage_ratio > 80 ? "bg-red-400" : club.wage_ratio > 65 ? "bg-amber-400" : "bg-green-500"}`}
                    style={{ width: `${Math.min(club.wage_ratio, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{club.wage_ratio.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {club.wage_ratio > 80 ? "⚠ Above sustainable threshold (80%)" : club.wage_ratio > 65 ? "Moderate — above 65% target" : "✓ Below 65% target"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* League comparison callout */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">League Context</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["revenue", "wage_bill", "operating_profit", "net_debt"] as const).map((key) => {
            const all = clubs.map((c) => c[key] as number | null).filter((v): v is number => v !== null);
            const sorted = [...all].sort((a, b) => b - a);
            const rank = sorted.indexOf(club[key] as number) + 1;
            return (
              <div key={key} className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  {METRICS.find((m) => m.key === key)?.label}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {club[key] !== null ? `#${rank}` : "—"}
                </p>
                <p className="text-xs text-gray-400">of 20 clubs</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
