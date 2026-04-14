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

const MAX_CLUBS = 4;

// Fixed per-club colours — consistent across all charts and tags
const CLUB_COLORS = ["#4A90D9", "#E05252", "#E8A838", "#9B59B6"];

// Light-tint tag backgrounds for each club colour
const CLUB_TAG_STYLES = [
  { borderColor: "#4A90D9", backgroundColor: "#EBF3FC", color: "#4A90D9" },
  { borderColor: "#E05252", backgroundColor: "#FCEAEA", color: "#E05252" },
  { borderColor: "#E8A838", backgroundColor: "#FDF5E6", color: "#E8A838" },
  { borderColor: "#9B59B6", backgroundColor: "#F5EEF8", color: "#9B59B6" },
];

const COMPARE_METRICS: {
  key: keyof ClubFinancials;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
}[] = [
  { key: "revenue",          label: "Revenue" },
  { key: "wage_bill",        label: "Wage Bill" },
  { key: "wage_ratio",       label: "Wage Ratio",       isRatio: true },
  { key: "operating_profit", label: "Operating Profit / (Loss)", diverging: true },
  { key: "pre_tax_profit",   label: "Pre-tax Profit / (Loss)",   diverging: true },
  { key: "net_debt",         label: "Net Cash / (Debt)",         diverging: true },
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
        className={`flex items-center border px-3 py-2 gap-2 transition-colors ${
          disabled
            ? "opacity-40 cursor-not-allowed border-[#e0e0e0] bg-[#f5f5f5]"
            : open
            ? "border-[#333333] bg-white"
            : "border-[#e0e0e0] bg-white hover:border-[#999999]"
        }`}
      >
        <svg className="w-4 h-4 text-[#aaaaaa] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? `${MAX_CLUBS} clubs selected` : "Search for a club…"}
          disabled={disabled}
          autoComplete="off"
          className="flex-1 text-sm text-[#111111] placeholder-[#aaaaaa] bg-transparent outline-none min-w-0"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-px bg-white border border-[#e0e0e0] shadow-lg overflow-hidden z-50">
          {results.map((club, i) => (
            <button
              key={club.slug}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(club); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 text-sm transition-colors border-t border-[#f0f0f0] first:border-t-0 ${
                i === highlighted ? "bg-[#f5f5f5]" : "hover:bg-[#fafafa]"
              }`}
            >
              <span className="text-[#111111]">{club.name}</span>
              <span className="text-[10px] text-[#aaaaaa] tracking-[0.08em] uppercase shrink-0">
                {DIVISION_LABELS[club.division]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Standard left-to-right bar */
function StandardBarRow({
  club,
  value,
  pct,
  clubColor,
  isRatio,
}: {
  club: ClubFinancials;
  value: number | null;
  pct: number;
  clubColor: string;
  isRatio?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-xs w-20 sm:w-32 shrink-0 truncate" style={{ color: clubColor }}>{club.name}</span>
      <div className="flex-1 h-6 sm:h-8 bg-[#eeeeee] overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: clubColor }} />
      </div>
      <span className="text-xs sm:text-sm font-light tabular-nums w-14 sm:w-16 text-right shrink-0" style={{ color: clubColor }}>
        {fmt(value, isRatio)}
      </span>
    </div>
  );
}

/** Diverging bar — negative extends left, positive extends right */
function DivergingBarRow({
  club,
  value,
  scale,
  clubColor,
  isRatio,
}: {
  club: ClubFinancials;
  value: number | null;
  scale: number;
  clubColor: string;
  isRatio?: boolean;
}) {
  const isPositive = value !== null && value >= 0;
  const pct = value !== null ? Math.min((Math.abs(value) / scale) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-xs w-20 sm:w-32 shrink-0 truncate" style={{ color: clubColor }}>{club.name}</span>
      <div className="flex-1 flex h-6 sm:h-8">
        {/* Negative (left) side */}
        <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
          {value !== null && !isPositive && (
            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: clubColor }} />
          )}
        </div>
        <div className="w-px bg-[#e0e0e0] shrink-0" />
        {/* Positive (right) side */}
        <div className="flex-1 overflow-hidden bg-[#eeeeee]">
          {value !== null && isPositive && (
            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: clubColor }} />
          )}
        </div>
      </div>
      <span
        className="text-xs sm:text-sm font-light tabular-nums w-14 sm:w-16 text-right shrink-0"
        style={{ color: value !== null ? clubColor : "#aaaaaa" }}
      >
        {fmt(value, isRatio)}
      </span>
    </div>
  );
}

function MetricSection({
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
    <div className="py-6 border-b border-[#e0e0e0] last:border-0">
      <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">
        {metric.label}
      </p>
      <div className="space-y-3">
        {clubs.map((club, i) => {
          const value = club[metric.key] as number | null;
          const clubColor = CLUB_COLORS[i];
          if (metric.diverging) {
            return (
              <DivergingBarRow
                key={club.slug}
                club={club}
                value={value}
                scale={absMax}
                clubColor={clubColor}
                isRatio={metric.isRatio}
              />
            );
          }
          const pct = value !== null ? Math.min((Math.abs(value) / absMax) * 100, 100) : 0;
          return (
            <StandardBarRow
              key={club.slug}
              club={club}
              value={value}
              pct={pct}
              clubColor={clubColor}
              isRatio={metric.isRatio}
            />
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
    .slice(0, MAX_CLUBS);

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
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= MAX_CLUBS) return;
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
            className="flex items-center gap-2 px-3 py-1.5 border text-sm"
            style={CLUB_TAG_STYLES[i]}
          >
            <span>{club.name}</span>
            <button
              onClick={() => removeClub(club.slug)}
              className="opacity-40 hover:opacity-100 ml-0.5 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {selectedSlugs.length < MAX_CLUBS && (
          <div className="w-full sm:w-72">
            <ClubSearch
              allClubs={allClubs}
              selectedSlugs={selectedSlugs}
              onAdd={addClub}
              disabled={false}
            />
          </div>
        )}

        {selectedClubs.length >= 2 && (
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e0e0e0] text-xs text-[#999999] hover:border-[#999999] hover:text-[#111111] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {copied ? "Copied" : "Share"}
          </button>
        )}
      </div>

      {/* States */}
      {selectedClubs.length === 0 && (
        <div className="text-center py-24">
          <p className="text-[#bbbbbb] text-sm tracking-[0.05em]">Search for clubs above to compare their financials — up to {MAX_CLUBS} at once</p>
        </div>
      )}

      {selectedClubs.length === 1 && (
        <p className="text-sm text-[#aaaaaa] mb-4">Add at least one more club to start comparing</p>
      )}

      {/* Bar charts */}
      {selectedClubs.length >= 2 && (
        <div className="border border-[#e0e0e0] bg-white px-3 sm:px-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-5 pb-4 border-b border-[#e0e0e0] mb-2">
            {selectedClubs.map((club, i) => (
              <div key={club.slug} className="flex items-center gap-2">
                <div className="w-3 h-3 shrink-0" style={{ backgroundColor: CLUB_COLORS[i] }} />
                <span className="text-xs" style={{ color: CLUB_COLORS[i] }}>{club.name}</span>
              </div>
            ))}
            <span className="hidden sm:block text-[10px] text-[#cccccc] ml-auto self-center tracking-[0.05em]">
              Diverging bars: left = loss / net debt · right = profit / net cash
            </span>
          </div>

          {COMPARE_METRICS.map((metric) => (
            <MetricSection
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
