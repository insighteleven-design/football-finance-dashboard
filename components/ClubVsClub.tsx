"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ComparableClub, fmtVal } from "@/lib/comparable";
import RadarChart from "@/components/RadarChart";
import { getImmigrationRating } from "@/lib/immigrationRatings";

export type { ComparableClub };

const MAX_CLUBS = 4;
const SLOT_LABELS = ["A", "B", "C", "D"];
const CLUB_COLORS = ["#4A90D9", "#E05252", "#E8A838", "#9B59B6"];
const SLOT_STYLES = [
  { border: "#4A90D9", bg: "#EBF3FC", text: "#4A90D9" },
  { border: "#E05252", bg: "#FCEAEA", text: "#E05252" },
  { border: "#E8A838", bg: "#FDF5E6", text: "#E8A838" },
  { border: "#9B59B6", bg: "#F5EEF8", text: "#9B59B6" },
];

const COUNTRY_ORDER = ["England", "Spain", "Italy", "Germany", "France", "Netherlands", "Belgium", "Austria", "Switzerland", "Denmark", "Norway", "Sweden", "Japan"];
const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Spain: "🇪🇸", Italy: "🇮🇹",
  France: "🇫🇷", Netherlands: "🇳🇱", Belgium: "🇧🇪",
  Denmark: "🇩🇰", Norway: "🇳🇴", Sweden: "🇸🇪", Japan: "🇯🇵",
  Germany: "🇩🇪", Austria: "🇦🇹", Switzerland: "🇨🇭",
};

const COMPARE_METRICS: {
  key: keyof ComparableClub;
  label: string;
  shortLabel: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter?: boolean;
}[] = [
  { key: "revenue",          label: "Revenue",                   shortLabel: "Revenue",      higherBetter: true },
  { key: "wage_bill",        label: "Wage Bill",                 shortLabel: "Wages",        higherBetter: false },
  { key: "wage_ratio",       label: "Wage Ratio",                shortLabel: "Wage %", isRatio: true, higherBetter: false },
  { key: "operating_profit", label: "Operating Profit / (Loss)", shortLabel: "Op. Profit",   diverging: true, higherBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax Profit / (Loss)",   shortLabel: "Pre-tax",      diverging: true, higherBetter: true },
  { key: "net_debt",         label: "Net Debt",                  shortLabel: "Net Debt",     diverging: true, higherBetter: false },
];

// ─── Club slot ────────────────────────────────────────────────────────────────

type SlotPhase = "countries" | "clubs";

function ClubSlot({
  slotIndex, allClubs, selectedSlug, otherSlugs, onSelect, onRemove,
}: {
  slotIndex: number; allClubs: ComparableClub[]; selectedSlug: string | null;
  otherSlugs: string[]; onSelect: (slug: string) => void; onRemove: () => void;
}) {
  const [phase, setPhase]           = useState<SlotPhase>("countries");
  const [activeCountry, setCountry] = useState<string | null>(null);
  const [filter, setFilter]         = useState("");

  const style = SLOT_STYLES[slotIndex];
  const color = CLUB_COLORS[slotIndex];
  const label = SLOT_LABELS[slotIndex];

  const available = useMemo(() => allClubs.filter((c) => !otherSlugs.includes(c.slug)), [allClubs, otherSlugs]);
  const countries = useMemo(() => {
    const present = new Set(available.map((c) => c.country));
    return COUNTRY_ORDER.filter((cn) => present.has(cn));
  }, [available]);

  const countryClubs = useMemo(() => {
    if (!activeCountry) return [];
    const q = filter.toLowerCase();
    return available.filter((c) => c.country === activeCountry && (!q || c.name.toLowerCase().includes(q) || c.divisionLabel.toLowerCase().includes(q)));
  }, [available, activeCountry, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ComparableClub[]>();
    for (const c of countryClubs) {
      if (!map.has(c.divisionLabel)) map.set(c.divisionLabel, []);
      map.get(c.divisionLabel)!.push(c);
    }
    return [...map.entries()];
  }, [countryClubs]);

  function selectCountry(country: string) { setCountry(country); setPhase("clubs"); setFilter(""); }
  function goBack() { setPhase("countries"); setCountry(null); setFilter(""); }
  function handleSelect(slug: string) { onSelect(slug); setPhase("countries"); setCountry(null); setFilter(""); }
  function handleRemove() { onRemove(); setPhase("countries"); setCountry(null); setFilter(""); }

  const selectedClub = selectedSlug ? allClubs.find((c) => c.slug === selectedSlug) : null;

  // ── Filled ───────────────────────────────────────────────────────────────────
  if (selectedClub) {
    return (
      <div style={{ border: `2px solid ${style.border}`, backgroundColor: style.bg, padding: "1.25rem 1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: style.text }}>
            Club {label}
          </span>
          <button
            onClick={handleRemove}
            style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: style.text, background: "none", border: "none", cursor: "pointer", opacity: 0.65, padding: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.65"; }}
          >
            Remove ×
          </button>
        </div>
        <p style={{ fontSize: "26px", fontWeight: 500, color: "#111111", lineHeight: 1.2, marginBottom: "0.375rem" }}>
          {selectedClub.name}
        </p>
        <p style={{ fontSize: "14px", letterSpacing: "0.06em", textTransform: "uppercase", color: style.text, fontWeight: 500 }}>
          {COUNTRY_FLAGS[selectedClub.country] ?? ""} {selectedClub.divisionLabel}
        </p>
      </div>
    );
  }

  // ── Club list ─────────────────────────────────────────────────────────────────
  if (phase === "clubs" && activeCountry) {
    return (
      <div style={{ border: "1px solid #e0e0e0", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.75rem", borderBottom: "1px solid #f0f0f0" }}>
          <button
            onClick={goBack}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "none", cursor: "pointer", color: "#888888", padding: 0, fontSize: "16px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888888"; }}
          >
            ← Back
          </button>
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: style.text }}>
            Club {label}
          </span>
          <span style={{ fontSize: "18px", marginLeft: "auto", color: "#888" }}>{COUNTRY_FLAGS[activeCountry] ?? ""} {activeCountry}</span>
        </div>
        <div style={{ padding: "1rem 1.75rem", borderBottom: "1px solid #f5f5f5" }}>
          <input
            type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter clubs…" autoFocus
            style={{ width: "100%", fontSize: "18px", color: "#111111", border: "1px solid #e8e8e8", padding: "0.75rem 1rem", outline: "none", backgroundColor: "#fafafa", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {grouped.length === 0 && <p style={{ fontSize: "18px", color: "#aaaaaa", padding: "1.5rem 1.75rem" }}>No clubs match.</p>}
          {grouped.map(([division, divClubs]) => (
            <div key={division}>
              <div style={{ padding: "0.75rem 1.75rem 0.5rem", fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbbbbb", backgroundColor: "#fafafa", borderBottom: "1px solid #f5f5f5" }}>
                {division}
              </div>
              {divClubs.map((club) => (
                <button
                  key={club.slug} onMouseDown={() => handleSelect(club.slug)}
                  style={{ width: "100%", textAlign: "left", padding: "1rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", borderBottom: "1px solid #f8f8f8", cursor: "pointer", gap: "0.5rem" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                >
                  <span style={{ fontSize: "22px", color: "#111111" }}>{club.name}</span>
                  <span style={{ fontSize: "17px", color: color, fontWeight: 600 }}>Select →</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Country grid ──────────────────────────────────────────────────────────────
  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "#ffffff", padding: "2.5rem", minHeight: "200px", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: style.text, marginBottom: "1.25rem" }}>
        Club {label}
      </p>
      <p style={{ fontSize: "20px", color: "#999999", marginBottom: "1.75rem" }}>
        Select a country to browse clubs
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        {countries.map((country) => (
          <button
            key={country} onClick={() => selectCountry(country)}
            style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem 1.75rem", border: "1px solid #e0e0e0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "22px", color: "#444444", transition: "all 0.12s" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.backgroundColor = style.bg; el.style.color = color; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e0e0e0"; el.style.backgroundColor = "#ffffff"; el.style.color = "#444444"; }}
          >
            <span>{COUNTRY_FLAGS[country] ?? ""}</span>
            <span>{country}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Stats view ───────────────────────────────────────────────────────────────

function StatsView({ clubs }: { clubs: ComparableClub[] }) {
  return (
    <div>
      {/* Club header */}
      <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0" }}>
        <div style={{ width: "190px", flexShrink: 0, padding: "1rem 1.5rem 1rem 0" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaaaaa" }}>Metric</span>
        </div>
        {clubs.map((club, i) => (
          <div key={club.slug} style={{ flex: 1, padding: "1rem 1rem 1rem 1.5rem", minWidth: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: 600, color: CLUB_COLORS[i], marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.name}</div>
            <div style={{ fontSize: "13px", letterSpacing: "0.07em", textTransform: "uppercase", color: "#aaaaaa", fontWeight: 500 }}>
              {COUNTRY_FLAGS[club.country] ?? ""} {club.divisionLabel}
            </div>
          </div>
        ))}
      </div>

      {/* Metric rows */}
      {COMPARE_METRICS.map((metric, mi) => {
        const values = clubs.map((c) => c[metric.key] as number | null);
        const valid  = values.filter((v): v is number => v !== null);
        const best   = valid.length ? (metric.higherBetter ? Math.max(...valid) : Math.min(...valid)) : null;
        return (
          <div key={metric.key as string} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eeeeee", backgroundColor: mi % 2 === 0 ? "#fafafa" : "#ffffff" }}>
            <div style={{ width: "190px", flexShrink: 0, padding: "1.75rem 1.5rem 1.75rem 0", fontSize: "16px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#777777", fontWeight: 700, whiteSpace: "nowrap" }}>
              {metric.shortLabel}
            </div>
            {clubs.map((club, i) => {
              const val    = club[metric.key] as number | null;
              const isBest = val !== null && valid.length > 1 && val === best;
              return (
                <div key={club.slug} style={{ flex: 1, padding: "1.75rem 1rem 1.75rem 1.5rem", fontSize: "22px", fontWeight: isBest ? 700 : 600, fontVariantNumeric: "tabular-nums", color: isBest ? "#059669" : val !== null ? CLUB_COLORS[i] : "#cccccc", backgroundColor: isBest ? "#ecfdf5" : "transparent", minWidth: 0 }}>
                  {fmtVal(val, metric.isRatio, club.currency)}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Immigration ease row */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eeeeee", backgroundColor: COMPARE_METRICS.length % 2 === 0 ? "#fafafa" : "#ffffff" }}>
        <div style={{ width: "190px", flexShrink: 0, padding: "1.75rem 1.5rem 1.75rem 0", fontSize: "16px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#777777", fontWeight: 700, whiteSpace: "nowrap" }}>
          Permit
        </div>
        {clubs.map((club, i) => {
          const rating = getImmigrationRating(club.country);
          const hex    = rating ? rating.hex : "#cccccc";
          const label  = rating ? rating.label.split(" — ")[0] : "Not rated";
          const rank   = rating ? `${rating.rank}/10` : "—";
          return (
            <div key={club.slug} style={{ flex: 1, padding: "1.75rem 1rem 1.75rem 1.5rem", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span style={{ width: "11px", height: "11px", borderRadius: "50%", backgroundColor: hex, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: "20px", fontWeight: 600, color: hex }}>{label}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#aaaaaa", marginTop: "4px", letterSpacing: "0.06em" }}>
                {rank} · {club.country}
              </div>
            </div>
          );
        })}
      </div>

      {clubs.length > 1 && (
        <p style={{ fontSize: "12px", color: "#cccccc", marginTop: "0.875rem", letterSpacing: "0.04em" }}>
          Green = best in comparison for that metric
        </p>
      )}
    </div>
  );
}

// ─── Charts view ──────────────────────────────────────────────────────────────

function StandardBarRow({ club, value, pct, clubColor, isRatio }: { club: ComparableClub; value: number | null; pct: number; clubColor: string; isRatio?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
      <span style={{ fontSize: "17px", fontWeight: 500, width: "11rem", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: clubColor }}>{club.name}</span>
      <div style={{ flex: 1, height: "3rem", backgroundColor: "#eeeeee", overflow: "hidden", borderRadius: "2px" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: clubColor, opacity: 0.85 }} />
      </div>
      <span style={{ fontSize: "18px", fontWeight: 500, fontVariantNumeric: "tabular-nums", width: "6rem", textAlign: "right", flexShrink: 0, color: clubColor }}>
        {fmtVal(value, isRatio, club.currency)}
      </span>
    </div>
  );
}

function DivergingBarRow({ club, value, scale, clubColor, isRatio }: { club: ComparableClub; value: number | null; scale: number; clubColor: string; isRatio?: boolean }) {
  const isPos = value !== null && value >= 0;
  const pct   = value !== null ? Math.min((Math.abs(value) / scale) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
      <span style={{ fontSize: "17px", fontWeight: 500, width: "11rem", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: clubColor }}>{club.name}</span>
      <div style={{ flex: 1, display: "flex", height: "3rem", borderRadius: "2px" }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", overflow: "hidden", backgroundColor: "#eeeeee" }}>
          {value !== null && !isPos && <div style={{ height: "100%", width: `${pct}%`, backgroundColor: clubColor, opacity: 0.85 }} />}
        </div>
        <div style={{ width: "2px", backgroundColor: "#dddddd", flexShrink: 0 }} />
        <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#eeeeee" }}>
          {value !== null && isPos && <div style={{ height: "100%", width: `${pct}%`, backgroundColor: clubColor, opacity: 0.85 }} />}
        </div>
      </div>
      <span style={{ fontSize: "18px", fontWeight: 500, fontVariantNumeric: "tabular-nums", width: "6rem", textAlign: "right", flexShrink: 0, color: value !== null ? clubColor : "#aaaaaa" }}>
        {fmtVal(value, isRatio, club.currency)}
      </span>
    </div>
  );
}

function ChartsView({ clubs }: { clubs: ComparableClub[] }) {
  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.75rem", paddingBottom: "1.75rem", borderBottom: "1px solid #eeeeee", marginBottom: "0.5rem" }}>
        {clubs.map((club, i) => (
          <div key={club.slug} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: "14px", height: "14px", backgroundColor: CLUB_COLORS[i], flexShrink: 0, borderRadius: "2px" }} />
            <span style={{ fontSize: "17px", fontWeight: 500, color: CLUB_COLORS[i] }}>{club.name}</span>
          </div>
        ))}
        <span style={{ fontSize: "13px", color: "#cccccc", marginLeft: "auto", alignSelf: "center", letterSpacing: "0.04em" }}>
          Diverging: left = loss/debt · right = profit/cash
        </span>
      </div>
      {COMPARE_METRICS.map((metric) => {
        const vals   = clubs.map((c) => c[metric.key] as number | null);
        const absMax = Math.max(...vals.filter((v): v is number => v !== null).map(Math.abs), 0.01);
        return (
          <div key={metric.key as string} style={{ padding: "2.25rem 0", borderBottom: "1px solid #f0f0f0" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "1.25rem" }}>
              {metric.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {clubs.map((club, i) => {
                const value = club[metric.key] as number | null;
                const color = CLUB_COLORS[i];
                if (metric.diverging) return <DivergingBarRow key={club.slug} club={club} value={value} scale={absMax} clubColor={color} isRatio={metric.isRatio} />;
                const pct = value !== null ? Math.min((Math.abs(value) / absMax) * 100, 100) : 0;
                return <StandardBarRow key={club.slug} club={club} value={value} pct={pct} clubColor={color} isRatio={metric.isRatio} />;
              })}
            </div>
          </div>
        );
      })}

      {/* Immigration ease strip */}
      <div style={{ padding: "2.25rem 0" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "1.25rem" }}>
          Non-EU Permit Ease
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {clubs.map((club, i) => {
            const rating = getImmigrationRating(club.country);
            const hex    = rating ? rating.hex : "#cccccc";
            const label  = rating ? rating.label : "Not rated";
            const rank   = rating ? rating.rank : null;
            const trackPct = rank !== null ? Math.round(((10 - rank) / 9) * 100) : 0;
            return (
              <div key={club.slug} style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <span style={{ fontSize: "17px", fontWeight: 500, width: "11rem", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: CLUB_COLORS[i] }}>{club.name}</span>
                <div style={{ flex: 1, height: "3rem", backgroundColor: "#eeeeee", overflow: "hidden", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${trackPct}%`, backgroundColor: hex, opacity: 0.85 }} />
                </div>
                <div style={{ width: "6rem", textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: hex, display: "block" }}>{label.split(" — ")[0]}</span>
                  {rank !== null && <span style={{ fontSize: "12px", color: "#aaaaaa" }}>{rank}/10</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Analysis view ────────────────────────────────────────────────────────────

function generateInsights(clubs: ComparableClub[]): string[] {
  const out: string[] = [];

  const withRev = [...clubs].filter((c) => c.revenue !== null).sort((a, b) => b.revenue! - a.revenue!);
  if (withRev.length >= 2) {
    const top = withRev[0], bot = withRev[withRev.length - 1];
    const ratio = top.revenue! / bot.revenue!;
    if (ratio > 2) {
      out.push(`${top.name} generate ${ratio.toFixed(1)}× more revenue than ${bot.name} (${fmtVal(top.revenue, false, top.currency)} vs ${fmtVal(bot.revenue, false, bot.currency)}), pointing to a fundamental difference in commercial scale and league context.`);
    } else {
      const pct = Math.round(((top.revenue! - bot.revenue!) / bot.revenue!) * 100);
      out.push(`${top.name} and ${bot.name} are closely matched on revenue — within ${pct}% of each other — making wage efficiency and cost discipline the more decisive financial battleground.`);
    }
  }

  const profitable = clubs.filter((c) => c.pre_tax_profit !== null && c.pre_tax_profit > 0).sort((a, b) => b.pre_tax_profit! - a.pre_tax_profit!);
  const lossMaking = clubs.filter((c) => c.pre_tax_profit !== null && c.pre_tax_profit < 0).sort((a, b) => a.pre_tax_profit! - b.pre_tax_profit!);
  if (profitable.length > 0 && lossMaking.length > 0) {
    const profStr = profitable.map((c) => `${c.name} (${fmtVal(c.pre_tax_profit, false, c.currency)})`).join(", ");
    const lossStr = lossMaking.map((c) => `${c.name} (${fmtVal(c.pre_tax_profit, false, c.currency)})`).join(", ");
    out.push(`The profitability divide is clear: ${profStr} ${profitable.length === 1 ? "is" : "are"} profitable at the pre-tax level, while ${lossStr} ${lossMaking.length === 1 ? "is" : "are"} loss-making.`);
  } else if (profitable.length === clubs.filter((c) => c.pre_tax_profit !== null).length && profitable.length > 0) {
    out.push(`All clubs in this comparison are profitable at the pre-tax level — a relatively rare outcome at the top of European football.`);
  } else if (lossMaking.length === clubs.filter((c) => c.pre_tax_profit !== null).length && lossMaking.length > 0) {
    out.push(`Every club in this comparison is loss-making, illustrating the structural cost pressures that have become endemic across European football.`);
  }

  const withWage = [...clubs].filter((c) => c.wage_ratio !== null).sort((a, b) => a.wage_ratio! - b.wage_ratio!);
  if (withWage.length >= 2) {
    const best = withWage[0], worst = withWage[withWage.length - 1];
    if (best.slug !== worst.slug) {
      out.push(`${best.name} are the most wage-efficient at ${best.wage_ratio!.toFixed(1)}% of revenue — ${worst.wage_ratio!.toFixed(1)}% for ${worst.name}. A ${(worst.wage_ratio! - best.wage_ratio!).toFixed(0)}-point gap in wage ratio typically flows directly to the profit line.`);
    }
  }

  const withDebt = [...clubs].filter((c) => c.net_debt !== null).sort((a, b) => b.net_debt! - a.net_debt!);
  if (withDebt.length >= 1) {
    const mostIndebted = withDebt[0];
    if (mostIndebted.net_debt! > 50) {
      out.push(`${mostIndebted.name} carry ${fmtVal(mostIndebted.net_debt, false, mostIndebted.currency)} in net debt — a balance sheet constraint that limits transfer investment and increases financial risk.`);
    }
    const cashClubs = withDebt.filter((c) => c.net_debt! < 0);
    if (cashClubs.length > 0) {
      const cashStr = cashClubs.map((c) => `${c.name} (${fmtVal(c.net_debt, false, c.currency)} net cash)`).join(", ");
      out.push(`${cashStr} ${cashClubs.length === 1 ? "holds" : "hold"} a net cash position, providing structural flexibility that ${clubs.filter((c) => !cashClubs.includes(c)).map((c) => c.name).join(", ")} ${clubs.length - cashClubs.length === 1 ? "lacks" : "lack"}.`);
    }
  }

  const scored = clubs.map((c) => {
    let s = 0;
    if (c.pre_tax_profit !== null) s += c.pre_tax_profit > 0 ? 3 : c.pre_tax_profit > -20 ? 1 : 0;
    if (c.wage_ratio !== null)     s += c.wage_ratio < 65 ? 3 : c.wage_ratio < 80 ? 1 : 0;
    if (c.net_debt !== null)       s += c.net_debt < 0 ? 3 : c.net_debt < 50 ? 1 : 0;
    return { club: c, score: s };
  }).sort((a, b) => b.score - a.score);

  if (scored.length >= 2 && scored[0].score > scored[1].score) {
    out.push(`On balance, ${scored[0].club.name} present the strongest financial profile in this comparison — the best combination of profitability, wage discipline, and balance sheet strength.`);
  } else if (scored.length >= 2) {
    out.push(`On balance, ${scored[0].club.name} and ${scored[1].club.name} are closely matched financially — their relative fortunes may ultimately depend on factors beyond the accounts.`);
  }

  return out;
}

const INSIGHT_ACCENTS = ["#60a5fa", "#34d399", "#fbbf24", "#c084fc", "#f87171", "#22d3ee"];

function AnalysisView({ clubs }: { clubs: ComparableClub[] }) {
  const insights = generateInsights(clubs);
  return (
    <div>
      {insights.map((text, i) => (
        <div key={i} style={{ display: "flex", gap: "1.5rem", marginBottom: "1.75rem", alignItems: "flex-start" }}>
          <div style={{ width: "5px", minHeight: "100%", backgroundColor: INSIGHT_ACCENTS[i % INSIGHT_ACCENTS.length], flexShrink: 0, borderRadius: "2px", alignSelf: "stretch" }} />
          <p style={{ fontSize: "19px", lineHeight: 1.8, color: "#333333" }}>{text}</p>
        </div>
      ))}
      {insights.length === 0 && (
        <p style={{ fontSize: "16px", color: "#aaaaaa", fontStyle: "italic" }}>Not enough data to generate analysis for the selected clubs.</p>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type CompareView = "stats" | "charts" | "radar" | "analysis";

export default function ClubVsClub({ allClubs }: { allClubs: ComparableClub[] }) {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const initialSlugs = (searchParams.get("clubs") ?? "")
    .split(",")
    .filter((s) => s && allClubs.some((c) => c.slug === s))
    .slice(0, MAX_CLUBS);

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);
  const [view, setView]                   = useState<CompareView>("stats");
  const [copied, setCopied]               = useState(false);

  const updateUrl = useCallback(
    (slugs: string[]) => {
      router.replace(`/compare?mode=clubs${slugs.length > 0 ? `&clubs=${slugs.join(",")}` : ""}`, { scroll: false });
    },
    [router]
  );

  function setSlug(index: number, slug: string) {
    const next = [...selectedSlugs];
    next[index] = slug;
    setSelectedSlugs(next);
    updateUrl(next);
  }

  function removeSlug(index: number) {
    const next = selectedSlugs.filter((_, i) => i !== index);
    setSelectedSlugs(next);
    updateUrl(next);
  }

  const selectedClubs = selectedSlugs
    .map((s) => allClubs.find((c) => c.slug === s))
    .filter((c): c is ComparableClub => !!c);

  const slotsToShow = Math.min(MAX_CLUBS, Math.max(2, selectedSlugs.length + (selectedSlugs.length < MAX_CLUBS ? 1 : 0)));

  const views: { id: CompareView; label: string }[] = [
    { id: "stats",    label: "Side by Side" },
    { id: "radar",    label: "Radar" },
    { id: "charts",   label: "Charts" },
    { id: "analysis", label: "Analysis" },
  ];

  const radarPopulations = useMemo(() => {
    function pop(key: keyof ComparableClub) {
      return allClubs.map((c) => c[key] as number | null).filter((v): v is number => v !== null);
    }
    return {
      revenue:          pop("revenue"),
      wage_ratio:       pop("wage_ratio"),
      operating_profit: pop("operating_profit"),
      pre_tax_profit:   pop("pre_tax_profit"),
      net_debt:         pop("net_debt"),
    };
  }, [allClubs]);

  const RADAR_AXES = [
    { label: "Revenue",           invert: false, population: radarPopulations.revenue },
    { label: "Wage\nEfficiency",  invert: true,  population: radarPopulations.wage_ratio },
    { label: "Operating\nProfit", invert: false, population: radarPopulations.operating_profit },
    { label: "Pre-tax\nProfit",   invert: false, population: radarPopulations.pre_tax_profit },
    { label: "Net\nPosition",     invert: true,  population: radarPopulations.net_debt },
  ];

  const radarSeries = selectedClubs.map((club, i) => ({
    name:   club.name,
    color:  CLUB_COLORS[i],
    values: [club.revenue, club.wage_ratio, club.operating_profit, club.pre_tax_profit, club.net_debt],
  }));

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Slot grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${slotsToShow}, 1fr)`, gap: "0.75rem", marginBottom: selectedClubs.length >= 2 ? "1.5rem" : 0, flex: selectedClubs.length < 2 ? 1 : undefined, alignItems: "stretch" }}>
        {Array.from({ length: slotsToShow }).map((_, i) => (
          <ClubSlot
            key={i} slotIndex={i} allClubs={allClubs}
            selectedSlug={selectedSlugs[i] ?? null}
            otherSlugs={selectedSlugs.filter((_, j) => j !== i)}
            onSelect={(slug) => setSlug(i, slug)}
            onRemove={() => removeSlug(i)}
          />
        ))}
      </div>

      {selectedClubs.length === 1 && (
        <p style={{ fontSize: "14px", color: "#aaaaaa", marginBottom: "1.5rem" }}>
          Select a second club to start the comparison.
        </p>
      )}

      {/* Result panel */}
      {selectedClubs.length >= 2 && (
        <div>
          {/* View tab bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", marginBottom: "2rem" }}>
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {views.map(({ id, label }) => {
                const isActive = view === id;
                return (
                  <button
                    key={id} onClick={() => setView(id)}
                    style={{ padding: "1rem 2rem", fontSize: "15px", fontWeight: isActive ? 700 : 500, letterSpacing: "0.08em", textTransform: "uppercase", color: isActive ? "#111111" : "#999999", background: "none", border: "none", borderBottom: `2px solid ${isActive ? "#111111" : "transparent"}`, marginBottom: "-1px", cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={copyLink}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.125rem", border: "1px solid #e0e0e0", fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#999999", cursor: "pointer", background: "#ffffff", marginBottom: "1px", whiteSpace: "nowrap", flexShrink: 0 }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#999999"; el.style.color = "#111111"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e0e0e0"; el.style.color = "#999999"; }}
            >
              <svg style={{ width: "12px", height: "12px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {copied ? "Copied" : "Share"}
            </button>
          </div>

          {view === "stats"    && <StatsView    clubs={selectedClubs} />}
          {view === "radar"    && <RadarChart   axes={RADAR_AXES} series={radarSeries} />}
          {view === "charts"   && <ChartsView   clubs={selectedClubs} />}
          {view === "analysis" && <AnalysisView clubs={selectedClubs} />}
        </div>
      )}
    </div>
  );
}
