"use client";

import { marketData } from "@/lib/marketData";
import { nearbyClubs } from "@/lib/nearbyClubs";
import { getImmigrationRating } from "@/lib/immigrationRatings";
import { stadiumData } from "@/lib/stadiumData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MarketLeagueEntry = {
  slug:          string;
  name:          string;
  revenueMunits: number | null;  // Revenue in millions (same currency as currencySymbol)
};

// ─── Colour system ────────────────────────────────────────────────────────────

// Squad Profile deltas
const C_GREEN = "#4a9a6a";
const C_AMBER = "#c8884a";
const C_RED   = "#9a4a4a";

// KFI signal colours (Financial tab)
const SIG_GREEN = "#2e7d52";
const SIG_RED   = "#9a3030";
const SIG_AMBER = "#c47900";

const SIG_BG: Record<string, string> = {
  [SIG_GREEN]: "#f2fbf5",
  [SIG_RED]:   "#fdf3f3",
  [SIG_AMBER]: "#fdfaf0",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPop(m: number): string {
  if (m >= 1) return `${m.toFixed(1)}m`;
  return `${Math.round(m * 1000)}k`;
}

function competitivenessSignal(count: number): { label: string; signal: string } {
  if (count <= 1) return { label: "Low competition",    signal: SIG_GREEN };
  if (count <= 4) return { label: "Medium competition", signal: SIG_AMBER };
  return             { label: "High competition",   signal: SIG_RED   };
}

function workPermitSignal(rank: number): string {
  if (rank <= 3) return SIG_GREEN;
  if (rank <= 6) return SIG_AMBER;
  return SIG_RED;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
      {children}
    </p>
  );
}

function SubLabel({ text, color }: { text: string; color?: string }) {
  return (
    <p className="text-sm font-medium mt-1.5" style={{ color: color ?? "#888888" }}>
      {text}
    </p>
  );
}

function DeltaLine({ pct, label }: { pct: number; label: string }) {
  const color = pct >= 0 ? C_GREEN : C_RED;
  return (
    <p className="text-sm mt-1.5">
      <span className="tabular-nums font-medium" style={{ color }}>
        {pct >= 0 ? "+" : ""}{pct}%
      </span>
      <span className="text-[#bbbbbb]"> vs {label}</span>
    </p>
  );
}

function NullValue() {
  return <p className="text-3xl font-medium text-[#cccccc]">—</p>;
}

function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[#bbbbbb] mt-3">{children}</p>;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function MarketContextSection({
  slug,
  country,
  leagueClubs,
  leagueLabel,
  currencySymbol: _currencySymbol,
  color: _color,
}: {
  slug:           string;
  country:        string;
  leagueClubs:    MarketLeagueEntry[];
  leagueLabel:    string;
  currencySymbol: string;
  color:          string;
}) {
  const md = marketData[slug];
  const nc = nearbyClubs[slug];
  const sd = stadiumData[slug];
  const wp = getImmigrationRating(country);

  // ── Stadium league averages ───────────────────────────────────────────────
  const leagueCaps = leagueClubs
    .filter((c) => c.slug !== slug)
    .map((c) => stadiumData[c.slug]?.capacity)
    .filter((v): v is number => v != null && v > 0);
  const leagueAvgCap =
    leagueCaps.length > 0
      ? Math.round(leagueCaps.reduce((a, b) => a + b, 0) / leagueCaps.length)
      : null;
  const capDeltaPct =
    sd?.capacity != null && leagueAvgCap != null
      ? Math.round(((sd.capacity - leagueAvgCap) / leagueAvgCap) * 100)
      : null;

  const leagueAtts = leagueClubs
    .filter((c) => c.slug !== slug)
    .map((c) => stadiumData[c.slug]?.avg_attendance)
    .filter((v): v is number => v != null && v > 0);
  const leagueAvgAtt =
    leagueAtts.length > 0
      ? Math.round(leagueAtts.reduce((a, b) => a + b, 0) / leagueAtts.length)
      : null;
  const attDeltaPct =
    sd?.avg_attendance != null && leagueAvgAtt != null
      ? Math.round(((sd.avg_attendance - leagueAvgAtt) / leagueAvgAtt) * 100)
      : null;

  const leagueFills = leagueClubs
    .filter((c) => c.slug !== slug)
    .map((c) => stadiumData[c.slug]?.attendance_pct)
    .filter((v): v is number => v != null && v > 0);
  const leagueAvgFill =
    leagueFills.length > 0
      ? leagueFills.reduce((a, b) => a + b, 0) / leagueFills.length
      : null;
  // Attendance rate delta in percentage points (pp), not relative %, because
  // comparing two percentages as a ratio (e.g. 90% vs 75% = "+20%") is misleading.
  const fillDeltaPp =
    sd?.attendance_pct != null && leagueAvgFill != null
      ? Math.round((sd.attendance_pct - leagueAvgFill) * 10) / 10
      : null;

  // Stadium utilisation label
  const utilisation =
    sd?.attendance_pct != null
      ? sd.attendance_pct < 70
        ? { label: "High headroom",    color: C_GREEN, bg: "#f0faf4" }
        : sd.attendance_pct < 85
        ? { label: "Moderate headroom", color: C_AMBER, bg: "#fdf8f0" }
        : { label: "Near capacity",     color: C_GREEN, bg: "#f0faf4" }
      : null;

  const hasStadium = sd != null && (sd.stadium_name != null || sd.capacity != null);

  // ── Work permit ───────────────────────────────────────────────────────────
  const [wpLabel, wpNote] = wp ? wp.label.split(" — ", 2) : ["Not rated", undefined];
  const wpSignal = wp ? workPermitSignal(wp.rank) : "#cccccc";
  const wpBg     = SIG_BG[wpSignal] ?? "white";

  // ── Competitiveness ───────────────────────────────────────────────────────
  const compConf   = competitivenessSignal(nc?.clubs?.length ?? 0);
  const compBg     = SIG_BG[compConf.signal] ?? "white";

  // ── Shared card border helpers (Stadium section) ───────────────────────────
  const b2left = "border-b sm:border-b-0 sm:border-r border-[#e0e0e0]";

  return (
    <div className="space-y-8">

      {/* ── Stadium ───────────────────────────────────────────────────────── */}
      {hasStadium && (
        <div>
          <SectionHeading>Stadium</SectionHeading>

          {/* 2×2 metric grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#e0e0e0] overflow-hidden">

            {/* Row 1 — Name */}
            <div className={`px-4 sm:px-6 py-5 ${b2left}`}>
              <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-2">
                Name
              </p>
              {sd?.stadium_name != null ? (
                <p className="text-xl sm:text-2xl font-medium text-[#111111] leading-snug">
                  {sd.stadium_name}
                </p>
              ) : (
                <NullValue />
              )}
              <SourceNote>Transfermarkt</SourceNote>
            </div>

            {/* Row 1 — Capacity */}
            <div className="px-4 sm:px-6 py-5">
              <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-2">
                Capacity
              </p>
              {sd?.capacity != null ? (
                <>
                  <p className="text-3xl sm:text-5xl font-medium tabular-nums text-[#111111]">
                    {sd.capacity.toLocaleString()}
                  </p>
                  {capDeltaPct !== null && (
                    <DeltaLine pct={capDeltaPct} label={`${leagueLabel} avg`} />
                  )}
                </>
              ) : (
                <NullValue />
              )}
              <SourceNote>Transfermarkt</SourceNote>
            </div>

            {/* Row 2 — Avg Attendance (always shown; "Data unavailable" when null) */}
            <div className={`px-4 sm:px-6 py-5 border-t border-[#e0e0e0] ${b2left}`}>
              <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-2">
                Avg Attendance
              </p>
              {sd?.avg_attendance != null ? (
                <>
                  <p className="text-3xl sm:text-5xl font-medium tabular-nums text-[#111111]">
                    {sd.avg_attendance.toLocaleString()}
                  </p>
                  {attDeltaPct !== null && (
                    <DeltaLine pct={attDeltaPct} label={`${leagueLabel} avg`} />
                  )}
                </>
              ) : (
                <p className="text-sm text-[#cccccc] italic mt-1">Data unavailable</p>
              )}
              <SourceNote>
                Transfermarkt{sd?.data_season ? ` · ${sd.data_season} season` : ""}
              </SourceNote>
            </div>

            {/* Row 2 — Attendance Rate (hidden if no capacity; "Data unavailable" if no avg) */}
            {sd?.capacity != null && (
              <div className="px-4 sm:px-6 py-5 border-t border-[#e0e0e0]">
                <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-2">
                  Attendance Rate
                </p>
                {sd?.attendance_pct != null ? (
                  <>
                    <p className="text-3xl sm:text-5xl font-medium tabular-nums text-[#111111]">
                      {sd.attendance_pct.toFixed(1)}%
                    </p>
                    {fillDeltaPp !== null && (
                      <p className="text-sm mt-1.5">
                        <span
                          className="tabular-nums font-medium"
                          style={{ color: fillDeltaPp >= 0 ? C_GREEN : C_RED }}
                        >
                          {fillDeltaPp >= 0 ? "+" : ""}{fillDeltaPp.toFixed(1)}pp
                        </span>
                        <span className="text-[#bbbbbb]"> vs {leagueLabel} avg</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[#cccccc] italic mt-1">Data unavailable</p>
                )}
                <SourceNote>
                  Avg attendance / capacity{sd?.data_season ? ` · ${sd.data_season} season` : ""}
                </SourceNote>
              </div>
            )}

          </div>

          {/* Stadium Utilisation insight row */}
          {utilisation && (
            <div className="mt-3 border border-[#e0e0e0] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[#aaaaaa]">
                  Stadium Utilisation
                </p>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: utilisation.color, background: utilisation.bg }}
                >
                  {utilisation.label}
                </span>
              </div>
              <p className="text-sm font-medium tabular-nums text-[#111111]">
                {sd!.attendance_pct!.toFixed(1)}%
              </p>
            </div>
          )}

        </div>
      )}

      {/* ── Local Context ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeading>Local Context</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Population — neutral plain card */}
          <div className="border border-[#e0e0e0] px-4 sm:px-6 py-5">
            <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-2">
              Local Population
            </p>
            {md?.pop_m != null ? (
              <>
                <p className="text-3xl sm:text-5xl font-medium tabular-nums text-[#111111]">
                  {fmtPop(md.pop_m)}
                </p>
                <SubLabel text={md.city} />
              </>
            ) : (
              <NullValue />
            )}
            <SourceNote>GeoNames cities dataset</SourceNote>
          </div>

          {/* Local Market — KFI signal card */}
          <div style={{
            borderTop:    "1px solid #eeeeee",
            borderRight:  "1px solid #eeeeee",
            borderBottom: "1px solid #eeeeee",
            borderLeft:   `4px solid ${compConf.signal}`,
            padding:      "20px 24px 18px",
            background:   compBg,
          }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: compConf.signal, margin: "0 0 12px 0", opacity: 0.85 }}>
              Local Market
            </p>
            {nc != null ? (
              <>
                <p style={{ fontSize: "clamp(32px, 6vw, 42px)", fontWeight: 700, color: compConf.signal, fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: "0 0 8px 0" }}>
                  {nc.clubs.length}
                </p>
                <p style={{ fontSize: "14px", color: compConf.signal, lineHeight: 1.45, opacity: 0.8, margin: "0 0 14px 0" }}>
                  {compConf.label}
                </p>
              </>
            ) : (
              <p style={{ fontSize: "clamp(32px, 6vw, 42px)", fontWeight: 700, color: "#cccccc", lineHeight: 1, margin: "0 0 22px 0" }}>—</p>
            )}
            <p style={{ fontSize: "11px", color: compConf.signal, opacity: 0.6 }}>
              Clubs within 25 miles · Insight Eleven database
            </p>
          </div>

          {/* Work Permit — KFI signal card */}
          <div style={{
            borderTop:    "1px solid #eeeeee",
            borderRight:  "1px solid #eeeeee",
            borderBottom: "1px solid #eeeeee",
            borderLeft:   `4px solid ${wpSignal}`,
            padding:      "20px 24px 18px",
            background:   wpBg,
          }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: wpSignal, margin: "0 0 12px 0", opacity: 0.85 }}>
              Work Permit
            </p>
            {wp != null ? (
              <>
                <p style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: wpSignal, lineHeight: 1.1, margin: "0 0 8px 0" }}>
                  {wpLabel}
                </p>
                <p style={{ fontSize: "14px", color: wpSignal, lineHeight: 1.45, opacity: 0.8, margin: "0 0 6px 0" }}>
                  Difficulty: {wp.rank}/10
                </p>
                {wpNote && (
                  <p style={{ fontSize: "13px", color: wpSignal, lineHeight: 1.45, opacity: 0.65, margin: "0 0 14px 0" }}>
                    {wpNote}
                  </p>
                )}
                {!wpNote && <div style={{ marginBottom: "14px" }} />}
              </>
            ) : (
              <>
                <p style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "#cccccc", lineHeight: 1.1, margin: "0 0 22px 0" }}>
                  Not rated
                </p>
              </>
            )}
            <p style={{ fontSize: "11px", color: wpSignal, opacity: 0.6 }}>
              Non-EU African players · 2024/25
            </p>
          </div>

        </div>
      </div>

      <p className="text-xs text-[#cccccc] leading-relaxed">
        Population: GeoNames cities dataset (CC-BY 4.0) · Nearby clubs: OpenStreetMap / Nominatim
      </p>
    </div>
  );
}
