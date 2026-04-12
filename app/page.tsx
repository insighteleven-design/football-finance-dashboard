import Link from "next/link";
import { clubs, Division, fmt } from "@/lib/clubs";
import SearchBar from "@/components/SearchBar";

const DIVISIONS: { key: Division; label: string; color: string; border: string; bg: string }[] = [
  { key: "premier-league", label: "Premier League", color: "text-purple-700", border: "border-purple-100", bg: "bg-purple-50/60" },
  { key: "championship",   label: "Championship",   color: "text-sky-700",    border: "border-sky-100",    bg: "bg-sky-50/60" },
  { key: "league-one",     label: "League One",     color: "text-amber-700",  border: "border-amber-100",  bg: "bg-amber-50/60" },
  { key: "league-two",     label: "League Two",     color: "text-emerald-700",border: "border-emerald-100",bg: "bg-emerald-50/60" },
];

function divAvg(division: Division, key: "revenue" | "wage_bill" | "pre_tax_profit") {
  const vals = clubs
    .filter((c) => c.division === division && c[key] !== null)
    .map((c) => c[key] as number);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function Home() {
  const stats = {
    total: clubs.length,
    withData: clubs.filter((c) => c.revenue !== null).length,
  };

  return (
    <div className="flex flex-col items-center min-h-[70vh] px-4">
      {/* Hero */}
      <div className="w-full max-w-2xl mx-auto mt-20 mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
          Football Finance
        </h1>
        <p className="text-base text-gray-500 mb-8">
          Financial data for {stats.total} clubs across all four English football leagues
        </p>
        <SearchBar clubs={clubs} />
        <p className="text-xs text-gray-400 mt-3">
          {stats.withData} clubs with full accounts · data from Companies House filings
        </p>
      </div>

      {/* Division cards */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {DIVISIONS.map((div) => {
          const divClubs = clubs.filter((c) => c.division === div.key);
          const avgRev = divAvg(div.key, "revenue");
          const withRev = divClubs.filter((c) => c.revenue !== null).length;
          return (
            <Link
              key={div.key}
              href={`/compare?division=${div.key}`}
              className={`rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-0.5 ${div.border} ${div.bg}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${div.color}`}>
                {div.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{divClubs.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">clubs</p>
              {avgRev !== null && (
                <p className="text-xs text-gray-400 mt-2">
                  avg revenue {fmt(avgRev)}
                </p>
              )}
              {withRev < divClubs.length && (
                <p className="text-xs text-gray-400">
                  {withRev}/{divClubs.length} with P&L data
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-6 text-sm text-gray-400 mb-16">
        <Link href="/compare" className="hover:text-blue-600 transition-colors">
          Division comparison →
        </Link>
        <Link href="/compare/clubs" className="hover:text-blue-600 transition-colors">
          Club vs club →
        </Link>
      </div>
    </div>
  );
}
