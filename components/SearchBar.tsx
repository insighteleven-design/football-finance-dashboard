"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClubFinancials, Division } from "@/lib/clubs";

const DIVISION_LABELS: Record<Division, string> = {
  "premier-league": "Premier League",
  "championship": "Championship",
  "league-one": "League One",
  "league-two": "League Two",
};

const DIVISION_COLORS: Record<Division, string> = {
  "premier-league": "text-purple-600 bg-purple-50",
  "championship": "text-sky-600 bg-sky-50",
  "league-one": "text-amber-600 bg-amber-50",
  "league-two": "text-emerald-600 bg-emerald-50",
};

function score(club: ClubFinancials, query: string): number {
  const q = query.toLowerCase();
  const name = club.name.toLowerCase();
  const slug = club.slug.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (slug.startsWith(q)) return 80;
  if (name.includes(q)) return 70;
  if (slug.includes(q)) return 60;
  // word match
  if (name.split(" ").some((w) => w.startsWith(q))) return 50;
  return 0;
}

export default function SearchBar({ clubs }: { clubs: ClubFinancials[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length === 0
    ? []
    : clubs
        .map((c) => ({ club: c, score: score(c, query.trim()) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((x) => x.club);

  const navigate = useCallback((club: ClubFinancials) => {
    setQuery("");
    setOpen(false);
    router.push(`/clubs/${club.slug}`);
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
      <div className={`flex items-center border rounded-2xl bg-white shadow-sm transition-shadow px-4 py-3 gap-3 ${open ? "shadow-md border-blue-300 ring-1 ring-blue-200" : "border-gray-200 hover:border-gray-300 hover:shadow"}`}>
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          className="flex-1 text-base text-gray-900 placeholder-gray-400 bg-transparent outline-none"
        />
        {query.length > 0 && (
          <button
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
          {results.map((club, i) => (
            <button
              key={club.slug}
              onMouseDown={(e) => { e.preventDefault(); navigate(club); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${i === highlighted ? "bg-blue-50" : "hover:bg-gray-50"} ${i > 0 ? "border-t border-gray-50" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">{club.name}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${DIVISION_COLORS[club.division]}`}>
                {DIVISION_LABELS[club.division]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
