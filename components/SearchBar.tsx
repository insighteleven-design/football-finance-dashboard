"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClubFinancials, Division } from "@/lib/clubs";
import { EUClub } from "@/lib/euClubs";

const DIVISION_LABELS: Record<Division, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

const DIVISION_COLORS: Record<Division, string> = {
  "premier-league": "text-[#8888cc]",
  "championship":   "text-[#6699bb]",
  "league-one":     "text-[#aaaa66]",
  "league-two":     "text-[#66aa88]",
};

type SearchResult =
  | { kind: "english"; club: ClubFinancials }
  | { kind: "eu"; club: EUClub };

function scoreStr(name: string, slug: string, query: string): number {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  const s = slug.toLowerCase();
  if (n === q) return 100;
  if (n.startsWith(q)) return 90;
  if (s.startsWith(q)) return 80;
  if (n.includes(q)) return 70;
  if (s.includes(q)) return 60;
  if (n.split(" ").some((w) => w.startsWith(q))) return 50;
  return 0;
}

// Build a short label for EU clubs: "Eliteserien · Norway"
const EU_LEAGUE_DISPLAY: Record<string, string> = {
  "Bundesliga": "Austrian Bundesliga",
  "2. Liga": "Austrian 2. Liga",
  "norwegian-eliteserien": "Eliteserien",
};

function euLabel(club: EUClub): string {
  const leagueDisplay = EU_LEAGUE_DISPLAY[club.league] ?? club.league;
  return `${leagueDisplay} · ${club.country}`;
}

const EU_COUNTRY_COLORS: Record<string, string> = {
  "Germany":     "text-[#cc9966]",
  "Netherlands": "text-[#cc6666]",
  "Belgium":     "text-[#9966cc]",
  "Austria":     "text-[#66aacc]",
  "France":      "text-[#cc6688]",
  "Denmark":     "text-[#cc6644]",
  "Norway":      "text-[#6699aa]",
};

function euColor(club: EUClub): string {
  return EU_COUNTRY_COLORS[club.country] ?? "text-[#aaaaaa]";
}

export default function SearchBar({
  clubs,
  euClubs,
}: {
  clubs: ClubFinancials[];
  euClubs: EUClub[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = query.trim().length === 0
    ? []
    : [
        ...clubs
          .map((c) => ({ kind: "english" as const, club: c, s: scoreStr(c.name, c.slug, query.trim()) }))
          .filter((x) => x.s > 0),
        ...euClubs
          .map((c) => ({ kind: "eu" as const, club: c, s: scoreStr(c.name, c.slug, query.trim()) }))
          .filter((x) => x.s > 0),
      ]
        .sort((a, b) => b.s - a.s)
        .slice(0, 8)
        .map(({ kind, club }) =>
          kind === "english"
            ? { kind: "english" as const, club: club as ClubFinancials }
            : { kind: "eu" as const, club: club as EUClub }
        );

  const navigate = useCallback((result: SearchResult) => {
    setQuery("");
    setOpen(false);
    router.push(`/clubs/${result.club.slug}`);
  }, [router]);

  useEffect(() => {
    setHighlighted(0);
    setOpen(results.length > 0);
  }, [results.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
      navigate(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div
        className={`flex items-center border px-4 py-3 gap-3 transition-all ${
          open
            ? "border-white bg-[#111111]"
            : "border-[#2a2a2a] bg-[#111111] hover:border-[#555555]"
        }`}
      >
        <svg className="w-4 h-4 text-[#555555] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search for a club…"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 text-sm text-white placeholder-[#555555] bg-transparent outline-none"
        />
        {query.length > 0 && (
          <button
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            className="text-[#555555] hover:text-white shrink-0 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-px bg-[#111111] border border-[#2a2a2a] shadow-2xl overflow-hidden z-50">
          {results.map((result, i) => (
            <button
              key={result.club.slug}
              onMouseDown={(e) => { e.preventDefault(); navigate(result); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-t border-[#1a1a1a] first:border-t-0 ${
                i === highlighted ? "bg-[#1a1a1a]" : "hover:bg-[#161616]"
              }`}
            >
              <span className="text-sm text-white">{result.club.name}</span>
              {result.kind === "english" ? (
                <span className={`text-xs tracking-[0.1em] uppercase shrink-0 ${DIVISION_COLORS[result.club.division]}`}>
                  {DIVISION_LABELS[result.club.division]}
                </span>
              ) : (
                <span className={`text-xs tracking-[0.1em] uppercase shrink-0 ${euColor(result.club)}`}>
                  {euLabel(result.club)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
