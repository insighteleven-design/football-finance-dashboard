"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClubFinancials, Division, fmt } from "@/lib/clubs";

const DIVISION_LABELS: Record<Division, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

const CLUB_COLORS = ["#2563eb", "#dc2626"];

const COMPARE_METRICS: {
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

function ClubSearch({
  allClubs,
  selectedSlugs,
  onAdd,
  disabled,
}: {
  allClubs: ClubFinancials[];
  selectedSlugs: string[];
  onAdd: (slug: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlighted, setHighlighted] = useState(0);

  const results =
    query.trim().length === 0
      ? []
      : allClubs
          .filter((c) => !selectedSlugs.includes(c.slug))
          .map((c) => ({ club: c, score: score(c, query.trim()) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((x) => x.club);

  useEffect(() => {
    setHighlighted(0);
    setOpen(results.length > 0);
  }, [results.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center border rounded-lg bg-white px-3 py-2 gap-2 transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : open
            ? "border-blue-300 ring-1 ring-blue-200"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Max 2 clubs selected" : "Search for a club…"}
          disabled={disabled}
          autoComplete="off"
          className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none min-w-0"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
          {results.map((club, i) => (
            <button
              key={club.slug}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(club);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 text-sm transition-colors ${
                i === highlighted ? "bg-blue-50" : "hover:bg-gray-50"
              } ${i > 0 ? "border-t border-gray-50" : ""}`}
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

function MetricBarChart({
  metric,
  clubs,
}: {
  metric: (typeof COMPARE_METRICS)[0];
  clubs: ClubFinancials[];
}) {
  const vals = clubs.map((c) => c[metric.key] as number | null);
  const absMax = Math.max(
    ...vals.filter((v): v is number => v !== null).map(Math.abs),
    0.01
  );

  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        {metric.label}
      </p>
      <div className="space-y-3">
        {clubs.map((club, i) => {
          const value = club[metric.key] as number | null;
          const pct =
            value !== null ? Math.min((Math.abs(value) / absMax) * 100, 100) : 0;
          return (
            <div key={club.slug}>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold w-32 shrink-0 truncate"
                  style={{ color: CLUB_COLORS[i] }}
                >
                  {club.name}
                </span>
                <div className="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: CLUB_COLORS[i],
                      opacity: 0.85,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums text-gray-800 w-16 text-right shrink-0">
                  {fmt(value, metric.isRatio)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ClubVsClub({ allClubs }: { allClubs: ClubFinancials[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSlugs = (searchParams.get("clubs") ?? "")
    .split(",")
    .filter((s) => s && allClubs.some((c) => c.slug === s))
    .slice(0, 2);

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);

  const updateUrl = useCallback(
    (slugs: string[]) => {
      router.replace(
        `/compare${slugs.length > 0 ? `?clubs=${slugs.join(",")}` : ""}`,
        { scroll: false }
      );
    },
    [router]
  );

  function addClub(slug: string) {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 2) return;
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
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {selectedClubs.map((club, i) => (
          <div
            key={club.slug}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium"
            style={{
              borderColor: CLUB_COLORS[i] + "60",
              backgroundColor: CLUB_COLORS[i] + "12",
              color: CLUB_COLORS[i],
            }}
          >
            <span>{club.name}</span>
            <button
              onClick={() => removeClub(club.slug)}
              className="opacity-60 hover:opacity-100 ml-0.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}

        <div className="w-72">
          <ClubSearch
            allClubs={allClubs}
            selectedSlugs={selectedSlugs}
            onAdd={addClub}
            disabled={selectedSlugs.length >= 2}
          />
        </div>

        {selectedClubs.length >= 2 && (
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {copied ? "Copied!" : "Copy link"}
          </button>
        )}
      </div>

      {/* Empty state */}
      {selectedClubs.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <svg
            className="w-10 h-10 mx-auto mb-3 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
          <p className="text-sm">Search for two clubs above to compare their financials</p>
        </div>
      )}

      {selectedClubs.length === 1 && (
        <p className="text-sm text-gray-400 mb-4">Add one more club to start comparing</p>
      )}

      {/* Bar charts — one per metric */}
      {selectedClubs.length >= 2 && (
        <div className="bg-white border border-gray-200 rounded-2xl px-6">
          {COMPARE_METRICS.map((metric) => (
            <MetricBarChart
              key={metric.key as string}
              metric={metric}
              clubs={selectedClubs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
