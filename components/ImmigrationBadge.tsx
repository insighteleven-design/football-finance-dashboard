"use client";

import { useState, useRef, useEffect } from "react";
import { getImmigrationRating, ALL_IMMIGRATION_RATINGS } from "@/lib/immigrationRatings";

// ─── Legend ────────────────────────────────────────────────────────────────────

const LEGEND = [
  { label: "Very Easy / Easy",         hex: "#4CAF50", ranks: "1–4" },
  { label: "Moderate / Restricted",    hex: "#FF9800", ranks: "5–8" },
  { label: "Hard / Very Hard",         hex: "#F44336", ranks: "9–10" },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ country }: { country: string }) {
  const rating = getImmigrationRating(country);

  return (
    <div
      className="absolute left-0 top-full mt-2 z-50 bg-white border border-[#e0e0e0] shadow-xl"
      style={{ width: "300px" }}
      // prevent mouse-leave on badge from closing when pointer moves into tooltip
      onMouseEnter={() => {/* handled by parent wrapper */}}
    >
      {/* Header strip */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#999999]">
          Immigration Ease
        </span>
        <span className="text-[10px] text-[#bbbbbb]">Non-EU African players</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {rating ? (
          <>
            {/* Country + rating */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: rating.hex }}
                />
                <span className="text-sm font-semibold text-[#111111]">{rating.country}</span>
              </div>
              <span className="text-xs text-[#888888]">{rating.rank} / 10</span>
            </div>

            {/* Label */}
            <p
              className="text-xs font-medium mb-2"
              style={{ color: rating.hex }}
            >
              {rating.label}
            </p>

            {/* Explanation */}
            <p className="text-xs text-[#555555] leading-relaxed mb-2">
              {rating.explanation}
            </p>

            {/* Country-specific note */}
            {rating.note && (
              <div
                className="text-xs text-[#666666] leading-relaxed px-3 py-2 mt-1"
                style={{ backgroundColor: "#f8f8f8", borderLeft: `3px solid ${rating.hex}` }}
              >
                {rating.note}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <span className="w-3 h-3 rounded-full bg-[#cccccc] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#111111]">{country}</p>
              <p className="text-xs text-[#888888] mt-0.5">No immigration rating available for this country.</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}
      >
        <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-[#aaaaaa] mb-2">
          Rating guide
        </p>
        <div className="flex flex-col gap-1">
          {LEGEND.map((l) => (
            <div key={l.ranks} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: l.hex }}
              />
              <span className="text-[11px] text-[#666666]">
                <span className="text-[#999999] mr-1">{l.ranks}</span>
                {l.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#bbbbbb] mt-2 leading-relaxed">
          Based on national football association rules and applicable EU/ACP treaty exemptions as of 2024/25.
        </p>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export default function ImmigrationBadge({ country }: { country: string }) {
  const rating = getImmigrationRating(country);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click-outside (for mobile / keyboard users)
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const dotColor = rating ? rating.hex : "#cccccc";
  const shortLabel = rating ? rating.label.split(" — ")[0] : "Not rated";

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#e0e0e0] text-xs font-medium tracking-[0.08em] uppercase text-[#666666] hover:border-[#aaaaaa] transition-colors cursor-default"
        style={{ letterSpacing: "0.08em" }}
        aria-label={`Immigration ease: ${shortLabel}`}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span>{shortLabel}</span>
      </button>

      {open && <Tooltip country={country} />}
    </div>
  );
}
