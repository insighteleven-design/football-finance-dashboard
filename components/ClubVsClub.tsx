"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ComparableClub, fmtVal } from "@/lib/comparable";

export type { ComparableClub };

const MAX_CLUBS = 4;
const CLUB_COLORS = ["#4A90D9", "#E05252", "#E8A838", "#9B59B6"];
const CLUB_TAG_STYLES = [
  { borderColor: "#4A90D9", backgroundColor: "#EBF3FC", color: "#4A90D9" },
  { borderColor: "#E05252", backgroundColor: "#FCEAEA", color: "#E05252" },
  { borderColor: "#E8A838", backgroundColor: "#FDF5E6", color: "#E8A838" },
  { borderColor: "#9B59B6", backgroundColor: "#F5EEF8", color: "#9B59B6" },
];

const COMPARE_METRICS: {
  key: keyof ComparableClub;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter?: boolean;
}[] = [
  { key: "revenue",          label: "Revenue",                      higherBetter: true },
  { key: "wage_bill",        label: "Wage Bill",                    higherBetter: false },
  { key: "wage_ratio",       label: "Wage Ratio",        isRatio: true, higherBetter: false },
  { key: "operating_profit", label: "Operating Profit / (Loss)",    diverging: true, higherBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax Profit / (Loss)",      diverging: true, higherBetter: true },
  { key: "net_debt",         label: "Net Debt",            diverging: true, higherBetter: false },
];

// ─── Featured Comparisons ─────────────────────────────────────────────────────

const CARD_ACCENTS = ["#60a5fa", "#34d399", "#fbbf24", "#c084fc", "#f87171", "#22d3ee"];

const FEATURED: {
  id: string;
  title: string;
  subtitle: string;
  slugs: [string, string];
  hook: string;
  primaryMetric: keyof ComparableClub;
  primaryIsRatio?: boolean;
}[] = [
  {
    id: "dortmund-vs-tottenham",
    title: "Same Revenue. Opposite Fortunes.",
    subtitle: "Germany · England",
    slugs: ["borussia_dortmund", "tottenham"],
    hook: "Dortmund and Spurs generate almost identical revenues — yet Dortmund turned a profit while Spurs posted a nine-figure loss.",
    primaryMetric: "pre_tax_profit",
  },
  {
    id: "stuttgart-vs-villa",
    title: "The €276m Parallel",
    subtitle: "Germany · England",
    slugs: ["vfb_stuttgart", "aston_villa"],
    hook: "VfB Stuttgart and Aston Villa reported almost exactly the same revenue last season. One operates at a profit; the other doesn't.",
    primaryMetric: "revenue",
  },
  {
    id: "lille-vs-lyon",
    title: "Ligue 1's Great Divide",
    subtitle: "France · France",
    slugs: ["losc_lille", "olympique_lyonnais"],
    hook: "Lille generated a €101m pre-tax profit with net cash. Lyon posted a €208m loss with €750m of net debt — same league, same season.",
    primaryMetric: "pre_tax_profit",
  },
  {
    id: "psg-vs-parisfc",
    title: "One City. 68× Apart.",
    subtitle: "France · France",
    slugs: ["paris_saint_germain", "paris_fc"],
    hook: "PSG and Paris FC both call Paris home. PSG generate €837m in revenue; Paris FC €12m. The gulf captures the full spectrum of French football.",
    primaryMetric: "revenue",
  },
  {
    id: "chelsea-vs-lyon",
    title: "The Debt Trap",
    subtitle: "England · France",
    slugs: ["chelsea", "olympique_lyonnais"],
    hook: "Chelsea carry £1.3bn in net debt; Lyon €750m. Together they represent the heaviest leverage across European club football.",
    primaryMetric: "net_debt",
  },
  {
    id: "strasbourg-vs-brest",
    title: "Wage Discipline: Extremes",
    subtitle: "France · France",
    slugs: ["rc_strasbourg", "stade_brestois"],
    hook: "Strasbourg spent 173% of revenue on wages — €1.73 for every €1 earned. Brest spent just 46%. Same league. Very different disciplines.",
    primaryMetric: "wage_ratio",
    primaryIsRatio: true,
  },
];

function FeaturedCard({
  config,
  allClubs,
  index,
  onLoad,
}: {
  config: (typeof FEATURED)[0];
  allClubs: ComparableClub[];
  index: number;
  onLoad: (slugs: string[]) => void;
}) {
  const [a, b] = config.slugs.map((s) => allClubs.find((c) => c.slug === s));
  if (!a || !b) return null;
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const valA = a[config.primaryMetric] as number | null;
  const valB = b[config.primaryMetric] as number | null;

  return (
    <button
      onClick={() => onLoad(config.slugs)}
      style={{
        display: "block",
        textAlign: "left",
        width: "100%",
        backgroundColor: "#2a2a2a",
        border: "1px solid #363636",
        borderTop: `3px solid ${accent}`,
        padding: "1.25rem",
        cursor: "pointer",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = "#323232";
        el.style.borderColor = "#444444";
        el.style.borderTopColor = accent;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = "#2a2a2a";
        el.style.borderColor = "#363636";
        el.style.borderTopColor = accent;
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#777777" }}>
          {String(index + 1).padStart(2, "0")} · {config.subtitle}
        </p>
        <svg style={{ width: "14px", height: "14px", flexShrink: 0, color: "#444444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      </div>

      <p style={{ fontSize: "14px", fontWeight: 500, lineHeight: 1.3, color: "#ffffff", marginBottom: "1rem" }}>
        {config.title}
      </p>

      <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
          <span style={{ fontSize: "11px", color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: accent, flexShrink: 0 }}>
            {fmtVal(valA, config.primaryIsRatio, a.currency)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
          <span style={{ fontSize: "11px", color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: accent, flexShrink: 0 }}>
            {fmtVal(valB, config.primaryIsRatio, b.currency)}
          </span>
        </div>
      </div>

      <p style={{ fontSize: "11px", lineHeight: 1.55, color: "#888888" }}>{config.hook}</p>
    </button>
  );
}

// ─── Stats view ───────────────────────────────────────────────────────────────

function StatsView({ clubs }: { clubs: ComparableClub[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
        <thead>
          <tr>
            <th style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaaaaa", textAlign: "left", padding: "0.75rem 0.5rem", borderBottom: "1px solid #e0e0e0", width: "180px" }}>
              Metric
            </th>
            {clubs.map((club, i) => (
              <th
                key={club.slug}
                style={{ fontSize: "11px", fontWeight: 600, color: CLUB_COLORS[i], textAlign: "right", padding: "0.75rem 0.5rem", borderBottom: "1px solid #e0e0e0" }}
              >
                {club.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_METRICS.map((metric) => {
            const values = clubs.map((c) => c[metric.key] as number | null);
            const valid  = values.filter((v): v is number => v !== null);
            const best   = valid.length
              ? (metric.higherBetter ? Math.max(...valid) : Math.min(...valid))
              : null;

            return (
              <tr key={metric.key as string} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td style={{ fontSize: "11px", color: "#666666", padding: "0.75rem 0.5rem", whiteSpace: "nowrap" }}>
                  {metric.label}
                </td>
                {clubs.map((club, i) => {
                  const val    = club[metric.key] as number | null;
                  const isBest = val !== null && valid.length > 1 && val === best;
                  return (
                    <td
                      key={club.slug}
                      style={{
                        fontSize: "13px",
                        fontWeight: isBest ? 600 : 400,
                        fontVariantNumeric: "tabular-nums",
                        textAlign: "right",
                        padding: "0.75rem 0.5rem",
                        color: isBest ? "#22c55e" : val !== null ? CLUB_COLORS[i] : "#cccccc",
                        backgroundColor: isBest ? "#f0fdf4" : "transparent",
                      }}
                    >
                      {fmtVal(val, metric.isRatio, club.currency)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {clubs.length > 1 && (
        <p style={{ fontSize: "10px", color: "#cccccc", marginTop: "0.75rem" }}>
          Green = best in comparison for that metric
        </p>
      )}
    </div>
  );
}

// ─── Charts view ──────────────────────────────────────────────────────────────

function StandardBarRow({
  club, value, pct, clubColor, isRatio,
}: {
  club: ComparableClub; value: number | null; pct: number; clubColor: string; isRatio?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ fontSize: "12px", width: "8rem", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: clubColor }}>{club.name}</span>
      <div style={{ flex: 1, height: "1.75rem", backgroundColor: "#eeeeee", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: clubColor }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 300, fontVariantNumeric: "tabular-nums", width: "4.5rem", textAlign: "right", flexShrink: 0, color: clubColor }}>
        {fmtVal(value, isRatio, club.currency)}
      </span>
    </div>
  );
}

function DivergingBarRow({
  club, value, scale, clubColor, isRatio,
}: {
  club: ComparableClub; value: number | null; scale: number; clubColor: string; isRatio?: boolean;
}) {
  const isPos = value !== null && value >= 0;
  const pct   = value !== null ? Math.min((Math.abs(value) / scale) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ fontSize: "12px", width: "8rem", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: clubColor }}>{club.name}</span>
      <div style={{ flex: 1, display: "flex", height: "1.75rem" }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", overflow: "hidden", backgroundColor: "#eeeeee" }}>
          {value !== null && !isPos && <div style={{ height: "100%", width: `${pct}%`, backgroundColor: clubColor }} />}
        </div>
        <div style={{ width: "1px", backgroundColor: "#e0e0e0", flexShrink: 0 }} />
        <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#eeeeee" }}>
          {value !== null && isPos && <div style={{ height: "100%", width: `${pct}%`, backgroundColor: clubColor }} />}
        </div>
      </div>
      <span style={{ fontSize: "13px", fontWeight: 300, fontVariantNumeric: "tabular-nums", width: "4.5rem", textAlign: "right", flexShrink: 0, color: value !== null ? clubColor : "#aaaaaa" }}>
        {fmtVal(value, isRatio, club.currency)}
      </span>
    </div>
  );
}

function ChartsView({ clubs }: { clubs: ComparableClub[] }) {
  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "#ffffff", padding: "0 1.25rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", padding: "1.25rem 0", borderBottom: "1px solid #e0e0e0", marginBottom: "0.5rem" }}>
        {clubs.map((club, i) => (
          <div key={club.slug} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: CLUB_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: CLUB_COLORS[i] }}>{club.name}</span>
          </div>
        ))}
        <span style={{ fontSize: "10px", color: "#cccccc", marginLeft: "auto", alignSelf: "center", letterSpacing: "0.05em" }}>
          Diverging: left = loss/debt · right = profit/cash
        </span>
      </div>
      {COMPARE_METRICS.map((metric) => {
        const vals   = clubs.map((c) => c[metric.key] as number | null);
        const absMax = Math.max(...vals.filter((v): v is number => v !== null).map(Math.abs), 0.01);
        return (
          <div key={metric.key as string} style={{ padding: "1.5rem 0", borderBottom: "1px solid #e0e0e0" }}>
            <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999999", marginBottom: "1rem" }}>
              {metric.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {clubs.map((club, i) => {
                const value = club[metric.key] as number | null;
                const color = CLUB_COLORS[i];
                if (metric.diverging) {
                  return <DivergingBarRow key={club.slug} club={club} value={value} scale={absMax} clubColor={color} isRatio={metric.isRatio} />;
                }
                const pct = value !== null ? Math.min((Math.abs(value) / absMax) * 100, 100) : 0;
                return <StandardBarRow key={club.slug} club={club} value={value} pct={pct} clubColor={color} isRatio={metric.isRatio} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Analysis view ────────────────────────────────────────────────────────────

function generateInsights(clubs: ComparableClub[]): string[] {
  const out: string[] = [];

  // Revenue scale
  const withRev = [...clubs].filter((c) => c.revenue !== null).sort((a, b) => b.revenue! - a.revenue!);
  if (withRev.length >= 2) {
    const top = withRev[0], bot = withRev[withRev.length - 1];
    const ratio = top.revenue! / bot.revenue!;
    if (ratio > 2) {
      out.push(
        `${top.name} generate ${ratio.toFixed(1)}× more revenue than ${bot.name} (${fmtVal(top.revenue, false, top.currency)} vs ${fmtVal(bot.revenue, false, bot.currency)}), pointing to a fundamental difference in commercial scale and league context.`
      );
    } else {
      const pct = Math.round(((top.revenue! - bot.revenue!) / bot.revenue!) * 100);
      out.push(
        `${top.name} and ${bot.name} are closely matched on revenue — within ${pct}% of each other — making wage efficiency and cost discipline the more decisive financial battleground.`
      );
    }
  }

  // Profitability split
  const profitable = clubs.filter((c) => c.pre_tax_profit !== null && c.pre_tax_profit > 0)
    .sort((a, b) => b.pre_tax_profit! - a.pre_tax_profit!);
  const lossMaking = clubs.filter((c) => c.pre_tax_profit !== null && c.pre_tax_profit < 0)
    .sort((a, b) => a.pre_tax_profit! - b.pre_tax_profit!);

  if (profitable.length > 0 && lossMaking.length > 0) {
    const profStr = profitable.map((c) => `${c.name} (${fmtVal(c.pre_tax_profit, false, c.currency)})`).join(", ");
    const lossStr = lossMaking.map((c) => `${c.name} (${fmtVal(c.pre_tax_profit, false, c.currency)})`).join(", ");
    out.push(
      `The profitability divide is clear: ${profStr} ${profitable.length === 1 ? "is" : "are"} profitable at the pre-tax level, while ${lossStr} ${lossMaking.length === 1 ? "is" : "are"} loss-making.`
    );
  } else if (profitable.length === clubs.filter((c) => c.pre_tax_profit !== null).length && profitable.length > 0) {
    out.push(`All clubs in this comparison are profitable at the pre-tax level — a relatively rare outcome at the top of European football.`);
  } else if (lossMaking.length === clubs.filter((c) => c.pre_tax_profit !== null).length && lossMaking.length > 0) {
    out.push(`Every club in this comparison is loss-making, illustrating the structural cost pressures that have become endemic across European football.`);
  }

  // Wage efficiency
  const withWage = [...clubs].filter((c) => c.wage_ratio !== null).sort((a, b) => a.wage_ratio! - b.wage_ratio!);
  if (withWage.length >= 2) {
    const best = withWage[0], worst = withWage[withWage.length - 1];
    if (best.slug !== worst.slug) {
      out.push(
        `${best.name} are the most wage-efficient at ${best.wage_ratio!.toFixed(1)}% of revenue — ${worst.wage_ratio!.toFixed(1)}% for ${worst.name}. A ${(worst.wage_ratio! - best.wage_ratio!).toFixed(0)}-point gap in wage ratio typically flows directly to the profit line.`
      );
    }
  }

  // Debt
  const withDebt = [...clubs].filter((c) => c.net_debt !== null).sort((a, b) => b.net_debt! - a.net_debt!);
  if (withDebt.length >= 1) {
    const mostIndebted = withDebt[0];
    if (mostIndebted.net_debt! > 50) {
      out.push(
        `${mostIndebted.name} carry ${fmtVal(mostIndebted.net_debt, false, mostIndebted.currency)} in net debt — a balance sheet constraint that limits transfer investment and increases financial risk.`
      );
    }
    const cashClubs = withDebt.filter((c) => c.net_debt! < 0);
    if (cashClubs.length > 0) {
      const cashStr = cashClubs.map((c) => `${c.name} (${fmtVal(c.net_debt, false, c.currency)} net cash)`).join(", ");
      out.push(
        `${cashStr} ${cashClubs.length === 1 ? "holds" : "hold"} a net cash position, providing structural flexibility that ${clubs.filter((c) => !cashClubs.includes(c)).map((c) => c.name).join(", ")} ${clubs.length - cashClubs.length === 1 ? "lacks" : "lack"}.`
      );
    }
  }

  // Verdict
  const scored = clubs.map((c) => {
    let s = 0;
    if (c.pre_tax_profit !== null) s += c.pre_tax_profit > 0 ? 3 : c.pre_tax_profit > -20 ? 1 : 0;
    if (c.wage_ratio !== null)     s += c.wage_ratio < 65 ? 3 : c.wage_ratio < 80 ? 1 : 0;
    if (c.net_debt !== null)       s += c.net_debt < 0 ? 3 : c.net_debt < 50 ? 1 : 0;
    return { club: c, score: s };
  }).sort((a, b) => b.score - a.score);

  if (scored.length >= 2 && scored[0].score > scored[1].score) {
    out.push(
      `On balance, ${scored[0].club.name} present the strongest financial profile in this comparison — the best combination of profitability, wage discipline, and balance sheet strength.`
    );
  } else if (scored.length >= 2) {
    out.push(
      `On balance, ${scored[0].club.name} and ${scored[1].club.name} are closely matched financially — their relative fortunes may ultimately depend on factors beyond the accounts.`
    );
  }

  return out;
}

const INSIGHT_ACCENTS = ["#60a5fa", "#34d399", "#fbbf24", "#c084fc", "#f87171", "#22d3ee"];

function AnalysisView({ clubs }: { clubs: ComparableClub[] }) {
  const insights = generateInsights(clubs);
  return (
    <div>
      {insights.map((text, i) => (
        <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "3px", backgroundColor: INSIGHT_ACCENTS[i % INSIGHT_ACCENTS.length], flexShrink: 0, borderRadius: "2px" }} />
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: "#333333" }}>{text}</p>
        </div>
      ))}
      {insights.length === 0 && (
        <p style={{ fontSize: "14px", color: "#aaaaaa" }}>Not enough data to generate analysis for the selected clubs.</p>
      )}
    </div>
  );
}

// ─── Club search ──────────────────────────────────────────────────────────────

function score(club: ComparableClub, query: string): number {
  const q    = query.toLowerCase();
  const name = club.name.toLowerCase();
  const slug = club.slug.toLowerCase();
  if (name === q)                               return 100;
  if (name.startsWith(q))                       return 90;
  if (slug.startsWith(q))                       return 80;
  if (name.includes(q))                         return 70;
  if (slug.includes(q))                         return 60;
  if (name.split(" ").some((w) => w.startsWith(q))) return 50;
  return 0;
}

function ClubSearch({
  allClubs, selectedSlugs, onAdd, disabled,
}: {
  allClubs: ComparableClub[];
  selectedSlugs: string[];
  onAdd: (slug: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery]           = useState("");
  const [open, setOpen]             = useState(false);
  const [highlighted, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

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

  useEffect(() => { setHighlight(0); setOpen(results.length > 0); }, [results.length]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleSelect(club: ComparableClub) {
    onAdd(club.slug);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); handleSelect(results[highlighted]); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${open ? "#333333" : "#cccccc"}`, padding: "0.625rem 0.875rem", gap: "0.625rem", backgroundColor: disabled ? "#f5f5f5" : "#ffffff", opacity: disabled ? 0.4 : 1 }}>
        <svg style={{ width: "16px", height: "16px", color: "#aaaaaa", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? `${MAX_CLUBS} clubs selected` : "Search clubs — England, Germany, Austria, France…"}
          disabled={disabled}
          autoComplete="off"
          style={{ flex: 1, fontSize: "14px", color: "#111111", background: "transparent", outline: "none", minWidth: 0, border: "none" }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "1px", backgroundColor: "#ffffff", border: "1px solid #e0e0e0", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 50, overflow: "hidden" }}>
          {results.map((club, i) => (
            <button
              key={club.slug}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(club); }}
              onMouseEnter={() => setHighlight(i)}
              style={{ width: "100%", textAlign: "left", padding: "0.625rem 0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "14px", backgroundColor: i === highlighted ? "#f5f5f5" : "#ffffff", borderTop: i > 0 ? "1px solid #f0f0f0" : "none", border: "none", cursor: "pointer" }}
            >
              <span style={{ color: "#111111" }}>{club.name}</span>
              <span style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>{club.divisionLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type CompareView = "stats" | "charts" | "analysis";

export default function ClubVsClub({ allClubs }: { allClubs: ComparableClub[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSlugs = (searchParams.get("clubs") ?? "")
    .split(",")
    .filter((s) => s && allClubs.some((c) => c.slug === s))
    .slice(0, MAX_CLUBS);

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);
  const [view, setView]                   = useState<CompareView>("stats");
  const buildRef = useRef<HTMLDivElement>(null);

  const updateUrl = useCallback(
    (slugs: string[]) => {
      router.replace(`/compare${slugs.length > 0 ? `?clubs=${slugs.join(",")}` : ""}`, { scroll: false });
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

  function loadFeatured(slugs: string[]) {
    setSelectedSlugs(slugs);
    updateUrl(slugs);
    setView("stats");
    setTimeout(() => buildRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  const selectedClubs = selectedSlugs
    .map((s) => allClubs.find((c) => c.slug === s))
    .filter((c): c is ComparableClub => !!c);

  const [copied, setCopied] = useState(false);
  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const views: { id: CompareView; label: string }[] = [
    { id: "stats",    label: "Side by Side" },
    { id: "charts",   label: "Charts" },
    { id: "analysis", label: "Analysis" },
  ];

  return (
    <div>
      {/* ── 1. Build Your Comparison ───────────────────────────── */}
      <section ref={buildRef} style={{ marginBottom: "4rem" }}>
        <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "1rem" }}>
          Build Your Comparison
        </p>
        <p style={{ fontSize: "22px", fontWeight: 300, color: "#111111", marginBottom: "1.5rem", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          Compare up to four clubs<br />
          <span style={{ color: "#aaaaaa", fontSize: "14px" }}>across England, Germany, Austria, and France</span>
        </p>

        {/* Search */}
        {selectedSlugs.length < MAX_CLUBS && (
          <div style={{ maxWidth: "520px", marginBottom: "1rem" }}>
            <ClubSearch allClubs={allClubs} selectedSlugs={selectedSlugs} onAdd={addClub} disabled={false} />
          </div>
        )}

        {/* Selected clubs + copy */}
        {selectedClubs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {selectedClubs.map((club, i) => (
              <div
                key={club.slug}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.75rem", border: `1px solid ${CLUB_TAG_STYLES[i].borderColor}`, backgroundColor: CLUB_TAG_STYLES[i].backgroundColor, color: CLUB_TAG_STYLES[i].color, fontSize: "13px" }}
              >
                <span>{club.name}</span>
                <button
                  onClick={() => removeClub(club.slug)}
                  style={{ opacity: 0.4, background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1, display: "flex" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.4"; }}
                >
                  <svg style={{ width: "14px", height: "14px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {selectedClubs.length >= 2 && (
              <button
                onClick={copyLink}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", border: "1px solid #e0e0e0", fontSize: "12px", color: "#999999", cursor: "pointer", background: "#ffffff", transition: "border-color 0.15s, color 0.15s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#999999"; el.style.color = "#111111"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e0e0e0"; el.style.color = "#999999"; }}
              >
                <svg style={{ width: "14px", height: "14px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {copied ? "Copied" : "Share link"}
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {selectedClubs.length === 0 && (
          <div style={{ padding: "2rem 0", color: "#bbbbbb", fontSize: "13px" }}>
            Search above, or click a featured comparison below to load it instantly.
          </div>
        )}

        {selectedClubs.length === 1 && (
          <p style={{ fontSize: "13px", color: "#aaaaaa", marginTop: "0.5rem" }}>
            Add at least one more club to compare.
          </p>
        )}

        {/* Comparison panel */}
        {selectedClubs.length >= 2 && (
          <div>
            {/* Toggle tabs */}
            <div style={{ display: "flex", gap: "0", marginBottom: "1.5rem", borderBottom: "1px solid #e0e0e0" }}>
              {views.map(({ id, label }) => {
                const isActive = view === id;
                return (
                  <button
                    key={id}
                    onClick={() => setView(id)}
                    style={{
                      padding: "0.625rem 1.25rem",
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: isActive ? "#111111" : "#999999",
                      borderBottom: `2px solid ${isActive ? "#111111" : "transparent"}`,
                      marginBottom: "-1px",
                      background: "none",
                      border: "none",
                      borderBottomStyle: "solid",
                      borderBottomWidth: "2px",
                      borderBottomColor: isActive ? "#111111" : "transparent",
                      cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {view === "stats"    && <StatsView    clubs={selectedClubs} />}
            {view === "charts"   && <ChartsView   clubs={selectedClubs} />}
            {view === "analysis" && <AnalysisView clubs={selectedClubs} />}
          </div>
        )}
      </section>

      {/* ── 2. Featured Comparisons ────────────────────────────── */}
      <section style={{ borderTop: "1px solid #e8e8e8", paddingTop: "3rem" }}>
        <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#aaaaaa", marginBottom: "1.25rem" }}>
          Featured Comparisons
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {FEATURED.map((config, i) => (
            <FeaturedCard
              key={config.id}
              config={config}
              allClubs={allClubs}
              index={i}
              onLoad={loadFeatured}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
