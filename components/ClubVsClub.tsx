"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ClubFinancials, Division, fmt } from "@/lib/clubs";

const DIVISION_LABELS: Record<Division, string> = {
  "premier-league": "Premier League",
  "championship": "Championship",
  "league-one": "League One",
  "league-two": "League Two",
};

const CLUB_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706"];

// Metrics to show in the side-by-side table
const TABLE_METRICS: { key: keyof ClubFinancials; label: string; higherBetter: boolean }[] = [
  { key: "revenue",          label: "Revenue",           higherBetter: true },
  { key: "wage_bill",        label: "Wage Bill",         higherBetter: false },
  { key: "wage_ratio",       label: "Wage Ratio",        higherBetter: false },
  { key: "operating_profit", label: "Operating Profit",  higherBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax Profit",    higherBetter: true },
  { key: "net_debt",         label: "Net Debt",          higherBetter: false },
  { key: "cash",             label: "Cash",              higherBetter: true },
];

// Radar metrics — 6 axes normalized across all clubs
const RADAR_METRICS: { key: keyof ClubFinancials; label: string; higherBetter: boolean }[] = [
  { key: "revenue",          label: "Revenue",       higherBetter: true },
  { key: "wage_ratio",       label: "Wage Efficiency", higherBetter: false },
  { key: "operating_profit", label: "Op. Profit",    higherBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax",       higherBetter: true },
  { key: "net_debt",         label: "Low Debt",      higherBetter: false },
  { key: "cash",             label: "Cash",          higherBetter: true },
];

function normalize(clubs: ClubFinancials[], key: keyof ClubFinancials, higherBetter: boolean): Map<string, number> {
  const vals = clubs.map((c) => c[key] as number | null).filter((v): v is number => v !== null);
  if (vals.length < 2) return new Map(clubs.map((c) => [c.slug, 50]));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min;
  return new Map(
    clubs.map((c) => {
      const v = c[key] as number | null;
      if (v === null) return [c.slug, 0];
      const scaled = range === 0 ? 50 : ((v - min) / range) * 100;
      return [c.slug, higherBetter ? scaled : 100 - scaled];
    })
  );
}

function score(club: ClubFinancials, query: string): number {
  const q = query.toLowerCase();
  const name = club.name.toLowerCase();
  const slug = club.slug.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (slug.startsWith(q)) return 80;
  if (name.includes(q)) return 70;
  if (slug.includes(q)) return 60;
  if (name.split(" ").some((w) => w.startsWith(q))) return 50;
  return 0;
}

interface ClubSearchProps {
  allClubs: ClubFinancials[];
  selectedSlugs: string[];
  onAdd: (slug: string) => void;
  disabled: boolean;
}

function ClubSearch({ allClubs, selectedSlugs, onAdd, disabled }: ClubSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlighted, setHighlighted] = useState(0);

  const results = query.trim().length === 0
    ? []
    : allClubs
        .filter((c) => !selectedSlugs.includes(c.slug))
        .map((c) => ({ club: c, score: score(c, query.trim()) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((x) => x.club);

  useEffect(() => { setHighlighted(0); setOpen(results.length > 0); }, [results.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(club: ClubFinancials) {
    onAdd(club.slug);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); handleSelect(results[highlighted]); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center border rounded-lg bg-white px-3 py-2 gap-2 transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : open ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200 hover:border-gray-300"}`}>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Max 4 clubs selected" : "Add a club…"}
          disabled={disabled}
          autoComplete="off"
          className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none min-w-0"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50 min-w-[280px]">
          {results.map((club, i) => (
            <button
              key={club.slug}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(club); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 text-sm transition-colors ${i === highlighted ? "bg-blue-50" : "hover:bg-gray-50"} ${i > 0 ? "border-t border-gray-50" : ""}`}
            >
              <span className="font-medium text-gray-900">{club.name}</span>
              <span className="text-xs text-gray-400">{DIVISION_LABELS[club.division]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClubVsClub({ allClubs }: { allClubs: ClubFinancials[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSlugs = (searchParams.get("clubs") ?? "")
    .split(",")
    .filter((s) => s && allClubs.some((c) => c.slug === s))
    .slice(0, 4);

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);

  const updateUrl = useCallback((slugs: string[]) => {
    const params = new URLSearchParams();
    if (slugs.length > 0) params.set("clubs", slugs.join(","));
    router.replace(`/compare/clubs${slugs.length > 0 ? `?clubs=${slugs.join(",")}` : ""}`, { scroll: false });
  }, [router]);

  function addClub(slug: string) {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 4) return;
    const next = [...selectedSlugs, slug];
    setSelectedSlugs(next);
    updateUrl(next);
  }

  function removeClub(slug: string) {
    const next = selectedSlugs.filter((s) => s !== slug);
    setSelectedSlugs(next);
    updateUrl(next);
  }

  const selectedClubs = selectedSlugs
    .map((s) => allClubs.find((c) => c.slug === s))
    .filter((c): c is ClubFinancials => !!c);

  // Pre-compute radar normalizations across ALL clubs (so radar reflects absolute position)
  const radarNorms = Object.fromEntries(
    RADAR_METRICS.map(({ key, higherBetter }) => [key, normalize(allClubs, key, higherBetter)])
  );

  const radarData = RADAR_METRICS.map(({ key, label }) => {
    const entry: Record<string, string | number> = { metric: label };
    selectedClubs.forEach((club) => {
      entry[club.name] = Math.round(radarNorms[key as string].get(club.slug) ?? 0);
    });
    return entry;
  });

  // Determine "winner" per metric row (best value = highlighted)
  function winner(key: keyof ClubFinancials, higherBetter: boolean): string | null {
    const vals = selectedClubs
      .map((c) => ({ slug: c.slug, val: c[key] as number | null }))
      .filter((x) => x.val !== null);
    if (vals.length < 2) return null;
    return higherBetter
      ? vals.reduce((a, b) => (a.val! > b.val! ? a : b)).slug
      : vals.reduce((a, b) => (a.val! < b.val! ? a : b)).slug;
  }

  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {/* Club selector */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        {selectedClubs.map((club, i) => (
          <div
            key={club.slug}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium"
            style={{ borderColor: CLUB_COLORS[i] + "60", backgroundColor: CLUB_COLORS[i] + "10", color: CLUB_COLORS[i] }}
          >
            <span>{club.name}</span>
            <button onClick={() => removeClub(club.slug)} className="opacity-60 hover:opacity-100 ml-0.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <div className="w-64">
          <ClubSearch
            allClubs={allClubs}
            selectedSlugs={selectedSlugs}
            onAdd={addClub}
            disabled={selectedSlugs.length >= 4}
          />
        </div>
        {selectedClubs.length >= 2 && (
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {copied ? "Copied!" : "Copy link"}
          </button>
        )}
      </div>

      {selectedClubs.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <p className="text-sm">Search for clubs above to start comparing</p>
        </div>
      )}

      {selectedClubs.length === 1 && (
        <p className="text-sm text-gray-400 mb-4">Add at least one more club to compare</p>
      )}

      {selectedClubs.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Side-by-side metrics table */}
          <div className="lg:col-span-3">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    {selectedClubs.map((club, i) => (
                      <th key={club.slug} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: CLUB_COLORS[i] }}>
                        {club.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TABLE_METRICS.map(({ key, label, higherBetter }) => {
                    const winnerSlug = winner(key, higherBetter);
                    return (
                      <tr key={key as string} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">
                          {label}
                        </td>
                        {selectedClubs.map((club) => {
                          const val = club[key] as number | null;
                          const isWinner = winnerSlug === club.slug && val !== null;
                          const isRatio = key === "wage_ratio";
                          return (
                            <td key={club.slug} className="px-4 py-3 text-right tabular-nums text-sm whitespace-nowrap">
                              {val === null ? (
                                <span className="text-gray-300">—</span>
                              ) : (
                                <span className={`font-medium px-2 py-0.5 rounded ${isWinner ? "bg-green-50 text-green-700" : "text-gray-700"}`}>
                                  {fmt(val, isRatio)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Division row */}
                  <tr className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-xs font-medium text-gray-600">Division</td>
                    {selectedClubs.map((club) => (
                      <td key={club.slug} className="px-4 py-3 text-right">
                        <span className="text-xs text-gray-500">{DIVISION_LABELS[club.division]}</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-xs font-medium text-gray-600">FY End</td>
                    {selectedClubs.map((club) => (
                      <td key={club.slug} className="px-4 py-3 text-right">
                        <span className="text-xs text-gray-500">
                          {new Date(club.fiscal_year_end).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Green = best value for each metric across selected clubs</p>
          </div>

          {/* Radar chart */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Financial Profile</p>
              <p className="text-xs text-gray-400 mb-4">Scores relative to all {allClubs.filter(c => c.revenue !== null).length} clubs with data</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  {selectedClubs.map((club, i) => (
                    <Radar
                      key={club.slug}
                      name={club.name}
                      dataKey={club.name}
                      stroke={CLUB_COLORS[i]}
                      fill={CLUB_COLORS[i]}
                      fillOpacity={0.08}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 11, color: "#374151" }}>{value}</span>}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}/100`]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
