"use client";

import { type ClubAssets, fixedAssets } from "@/lib/fixedAssets";
import { clubs } from "@/lib/clubs";

const DIVISION_COLORS: Record<string, string> = {
  "premier-league": "#3b82f6",
  "championship":   "#f59e0b",
  "league-one":     "#10b981",
  "league-two":     "#8b5cf6",
};

const DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

function computeDivisionStats(division: string) {
  const slugs = clubs.filter((c) => c.division === division).map((c) => c.slug);
  const capacities = slugs
    .map((s) => fixedAssets[s]?.stadium?.capacity)
    .filter((v): v is number => v != null);
  const avgCapacity = capacities.length
    ? Math.round(capacities.reduce((a, b) => a + b, 0) / capacities.length)
    : null;
  const ownedCount = slugs.filter((s) => fixedAssets[s]?.stadium?.ownership === "owned").length;
  return { avgCapacity, ownedCount, total: slugs.length };
}

function OwnershipBadge({ ownership }: { ownership: "owned" | "leased" | null }) {
  if (!ownership) return null;
  const isOwned = ownership === "owned";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase border ${
        isOwned
          ? "border-[#10b981] text-[#10b981] bg-[#f0fdf4]"
          : "border-[#f59e0b] text-[#b45309] bg-[#fffbeb]"
      }`}
    >
      {isOwned ? "Freehold" : "Leasehold"}
    </span>
  );
}

function CapacityBar({
  capacity,
  divisionAvg,
  color,
}: {
  capacity: number;
  divisionAvg: number;
  color: string;
}) {
  const max = Math.max(capacity, divisionAvg) * 1.2;
  const clubPct = Math.min((capacity / max) * 100, 100);
  const avgPct = Math.min((divisionAvg / max) * 100, 100);
  const isAbove = capacity >= divisionAvg;
  const diff = Math.round(((capacity - divisionAvg) / divisionAvg) * 100);

  return (
    <div className="mt-3">
      <div className="relative h-2.5 bg-[#f0f0f0] rounded-full" style={{ maxWidth: "280px" }}>
        {/* Division average marker */}
        <div
          className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-[#bbbbbb] z-10 rounded-full"
          style={{ left: `${avgPct}%` }}
        />
        {/* Club bar */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all"
          style={{ width: `${clubPct}%`, backgroundColor: isAbove ? color : "#d1d5db", opacity: 0.85 }}
        />
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: isAbove ? "#059669" : "#999999" }}>
        {isAbove ? "+" : ""}{diff}% vs division avg ({divisionAvg.toLocaleString()})
      </p>
    </div>
  );
}

export default function FixedAssetsPanel({
  assets,
  division,
  landBuildings,
}: {
  assets: ClubAssets;
  division: string;
  landBuildings: number | null;
}) {
  const color = DIVISION_COLORS[division] ?? "#aaaaaa";
  const divLabel = DIVISION_LABELS[division] ?? division;
  const divStats = computeDivisionStats(division);

  const s = assets.stadium;
  const tg = assets.training_ground;

  return (
    <div className="space-y-4">
      {/* Stadium Card */}
      <div
        className="bg-white border border-[#e8e8e8] overflow-hidden"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
          <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa]">Stadium</p>
        </div>
        <div className="px-5 py-5">
          {/* Name + badge */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-medium text-[#111111] leading-tight">{s.stadium_name}</h3>
              {s.ownership === "leased" && s.ownership_detail && (
                <p className="text-[11px] text-[#888888] mt-0.5">
                  Owned by {s.ownership_detail}
                </p>
              )}
            </div>
            <OwnershipBadge ownership={s.ownership} />
          </div>

          {/* Metrics grid */}
          <div className="grid sm:grid-cols-2 gap-6 border-t border-[#f5f5f5] pt-5">
            {s.capacity != null && (
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-1">
                  Capacity
                </p>
                <p className="text-2xl font-semibold text-[#111111]">
                  {s.capacity.toLocaleString()}
                </p>
                {divStats.avgCapacity != null && (
                  <CapacityBar
                    capacity={s.capacity}
                    divisionAvg={divStats.avgCapacity}
                    color={color}
                  />
                )}
              </div>
            )}

            {landBuildings != null && (
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa] mb-1">
                  Book Value (Land &amp; Buildings)
                </p>
                <p className="text-2xl font-semibold text-[#111111]">
                  £{landBuildings.toFixed(1)}m
                </p>
                <p className="text-[10px] text-[#bbbbbb] mt-1.5">Net book value per latest accounts</p>
              </div>
            )}
          </div>

          {/* Leasehold note */}
          {s.ownership === "leased" && s.leasehold_notes && (
            <div className="mt-5 px-4 py-3 bg-[#fffbeb] border border-[#fde68a]">
              <p className="text-[9px] font-semibold tracking-[0.1em] uppercase text-[#b45309] mb-1">
                Leasehold Note
              </p>
              <p className="text-[11px] text-[#78350f] leading-relaxed">{s.leasehold_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Division benchmark */}
      <div className="flex items-center gap-3 px-1 py-1 text-[11px] text-[#999999]">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>
          {divStats.ownedCount} of {divStats.total} {divLabel} clubs own their stadium freehold
        </span>
      </div>

      {/* Training Ground Card */}
      {tg && (
        <div
          className="bg-white border border-[#e8e8e8] overflow-hidden"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <div className="px-5 py-3.5 border-b border-[#f0f0f0]">
            <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[#aaaaaa]">
              Training Ground
            </p>
          </div>
          <div className="px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                {tg.notes ? (
                  <p className="text-sm text-[#444444] leading-relaxed">{tg.notes}</p>
                ) : (
                  <p className="text-sm text-[#888888] italic">No additional details available</p>
                )}
              </div>
              <OwnershipBadge ownership={tg.ownership} />
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-[#cccccc] leading-relaxed">
        Book value is the net carrying amount of land &amp; buildings per the latest annual accounts. For long-established clubs this typically understates market value significantly — stadiums are rarely revalued upward.
      </p>
    </div>
  );
}
