"use client";

import { useState, useMemo } from "react";
import RadarChart from "@/components/RadarChart";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DivisionPeer = {
  slug:              string;
  name:              string;
  revenue:           number | null;
  wage_bill:         number | null;
  wage_ratio:        number | null;
  operating_profit:  number | null;
  pre_tax_profit:    number | null;
  net_debt:          number | null;
  squad_value_eur_m: number | null;
  avg_age:           number | null;
  expiry_0_12m_pct:  number | null;
  capacity:          number | null;
  attendance_pct:    number | null;
};

export type PriorYearSnap = {
  revenue:    number | null;
  wage_ratio: number | null;
  net_debt:   number | null;
};

export type H2HPeer = DivisionPeer & {
  country:       string;
  divisionLabel: string;
  currency:      "GBP" | "EUR" | "USD";
};

type CompareMode = "benchmark" | "h2h";
type H2HView    = "table" | "radar";

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGHLIGHT   = "#3b82f6";
const H2H_CLR     = "#e05252";
const C_WIN       = "#2e7d52";
const C_LOSE      = "#9a3030";
const BG_WIN      = "#f2fbf5";
const BG_LOSE     = "#fdf3f3";
const FX_GBP      = 1.17;
const FX_USD      = 0.92;

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Spain: "🇪🇸", Italy: "🇮🇹",
  France: "🇫🇷", Germany: "🇩🇪", Austria: "🇦🇹",
  Switzerland: "🇨🇭", Denmark: "🇩🇰", Norway: "🇳🇴",
  Sweden: "🇸🇪", Japan: "🇯🇵",
};

const COUNTRY_ORDER = [
  "England", "Spain", "Italy", "Germany", "France",
  "Austria", "Switzerland", "Denmark", "Norway", "Sweden", "Japan",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtGBP(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}£${abs.toFixed(1)}m`;
}

function fmtEUR(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}€${abs.toFixed(1)}m`;
}

function fmtPct(v: number | null, digits = 1): string {
  if (v === null) return "—";
  return `${v.toFixed(digits)}%`;
}

function toEUR(v: number | null, currency: "GBP" | "EUR" | "USD"): number | null {
  if (v === null) return null;
  if (currency === "GBP") return v * FX_GBP;
  if (currency === "USD") return v * FX_USD;
  return v;
}

function divRank(
  peers: DivisionPeer[],
  slug: string,
  getValue: (p: DivisionPeer) => number | null,
  higherBetter: boolean,
): number | null {
  const valid   = peers.filter(p => getValue(p) !== null);
  const sorted  = [...valid].sort((a, b) =>
    higherBetter ? getValue(b)! - getValue(a)! : getValue(a)! - getValue(b)!,
  );
  const idx = sorted.findIndex(p => p.slug === slug);
  return idx === -1 ? null : idx + 1;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Snapshot Card ────────────────────────────────────────────────────────────

function SnapshotCard({
  label, value, rankText, yoyStr, yoyColor,
}: {
  label:     string;
  value:     string;
  rankText:  string | null;
  yoyStr:    string | null;
  yoyColor:  string;
}) {
  return (
    <div className="px-4 sm:px-6 py-5">
      <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#888888] mb-2">
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-medium tabular-nums text-[#111111] leading-none">
        {value}
      </p>
      {yoyStr !== null && (
        <p className="text-sm mt-1.5">
          <span className="font-medium tabular-nums" style={{ color: yoyColor }}>
            {yoyStr}
          </span>
          <span className="text-[#bbbbbb]"> vs prior year</span>
        </p>
      )}
      {rankText && (
        <p className="text-xs mt-1.5 tracking-[0.04em]" style={{ color: HIGHLIGHT }}>
          {rankText}
        </p>
      )}
    </div>
  );
}

// ─── Ranking Bar ──────────────────────────────────────────────────────────────

function RankBar({
  name, value, maxAbs, isHighlight, formatFn, diverging,
}: {
  name:        string;
  value:       number | null;
  maxAbs:      number;
  isHighlight: boolean;
  formatFn:    (v: number) => string;
  diverging?:  boolean;
}) {
  const color     = isHighlight ? HIGHLIGHT : "#cccccc";
  const textColor = isHighlight ? "#111111" : "#555555";
  const weight    = isHighlight ? 600 : 400;

  if (!diverging) {
    const pct = value !== null && maxAbs > 0
      ? Math.min((Math.abs(value) / maxAbs) * 100, 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm w-36 sm:w-44 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: textColor, fontWeight: weight }}>
          {name}
        </span>
        <div className="flex-1 h-7 bg-[#eeeeee] overflow-hidden">
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-sm tabular-nums w-20 text-right shrink-0"
          style={{ color: textColor, fontWeight: weight }}>
          {value !== null ? formatFn(value) : "—"}
        </span>
      </div>
    );
  }

  const isPos = value !== null && value >= 0;
  const pct   = value !== null && maxAbs > 0
    ? Math.min((Math.abs(value) / maxAbs) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-36 sm:w-44 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ color: textColor, fontWeight: weight }}>
        {name}
      </span>
      <div className="flex-1 flex h-7">
        <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
          {value !== null && !isPos && (
            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          )}
        </div>
        <div className="w-px bg-[#dddddd] shrink-0" />
        <div className="flex-1 overflow-hidden bg-[#eeeeee]">
          {value !== null && isPos && (
            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          )}
        </div>
      </div>
      <span className="text-sm tabular-nums w-20 text-right shrink-0"
        style={{ color: textColor, fontWeight: weight }}>
        {value !== null ? formatFn(value) : "—"}
      </span>
    </div>
  );
}

// ─── Ranking Section ──────────────────────────────────────────────────────────

type RankEntry = { slug: string; name: string; value: number | null };

function RankSection({
  title, note, data, highlightSlug, formatFn, higherBetter, diverging,
}: {
  title:        string;
  note?:        string;
  data:         RankEntry[];
  highlightSlug: string;
  formatFn:     (v: number) => string;
  higherBetter: boolean;
  diverging?:   boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const valid = data.filter(d => d.value !== null);
    return [...valid].sort((a, b) =>
      higherBetter ? b.value! - a.value! : a.value! - b.value!,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, higherBetter]);

  const maxAbs = useMemo(
    () => Math.max(...sorted.map(d => Math.abs(d.value ?? 0)), 0.01),
    [sorted],
  );

  const displayed = useMemo(() => {
    if (showAll) return sorted;
    const top5 = sorted.slice(0, 5);
    if (top5.some(d => d.slug === highlightSlug)) return top5;
    const hl = sorted.find(d => d.slug === highlightSlug);
    return hl ? [...top5, hl] : top5;
  }, [sorted, showAll, highlightSlug]);

  if (sorted.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="text-sm font-bold tracking-[0.1em] uppercase text-[#555555]">{title}</p>
          {note && <p className="text-xs text-[#aaaaaa] mt-0.5">{note}</p>}
        </div>
        {sorted.length > 5 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs text-[#aaaaaa] hover:text-[#555555] underline underline-offset-2 transition-colors shrink-0 ml-4"
          >
            {showAll ? "Show top 5" : `Show all ${sorted.length}`}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayed.map(d => (
          <RankBar
            key={d.slug}
            name={d.name}
            value={d.value}
            maxAbs={maxAbs}
            isHighlight={d.slug === highlightSlug}
            formatFn={formatFn}
            diverging={diverging}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
      {children}
    </p>
  );
}

// ─── Division Benchmark View ──────────────────────────────────────────────────

function DivisionBenchmarkView({
  slug, divisionLabel, divisionPeers, priorYear,
}: {
  slug:          string;
  divisionLabel: string;
  divisionPeers: DivisionPeer[];
  priorYear:     PriorYearSnap | null;
}) {
  const club = divisionPeers.find(p => p.slug === slug);
  if (!club) return null;

  // Revenue snapshot
  const revRank = divRank(divisionPeers, slug, p => p.revenue, true);
  const revYoy  = priorYear?.revenue != null && club.revenue != null
    ? ((club.revenue - priorYear.revenue) / Math.abs(priorYear.revenue)) * 100 : null;
  const revYoyStr   = revYoy !== null ? `${revYoy >= 0 ? "+" : ""}${revYoy.toFixed(1)}%` : null;
  const revYoyColor = revYoy === null ? "#cccccc" : revYoy >= 0 ? C_WIN : C_LOSE;

  // Wage Ratio snapshot
  const wrRank = divRank(divisionPeers, slug, p => p.wage_ratio, false);
  const wrYoy  = priorYear?.wage_ratio != null && club.wage_ratio != null
    ? club.wage_ratio - priorYear.wage_ratio : null;
  const wrYoyStr   = wrYoy !== null ? `${wrYoy >= 0 ? "+" : ""}${wrYoy.toFixed(1)}pp` : null;
  const wrYoyColor = wrYoy === null ? "#cccccc" : wrYoy <= 0 ? C_WIN : C_LOSE;

  // Net Debt snapshot
  const ndRank = divRank(divisionPeers, slug, p => p.net_debt, false);
  const ndYoy  = priorYear?.net_debt != null && club.net_debt != null
    ? club.net_debt - priorYear.net_debt : null;
  const ndYoyStr   = ndYoy !== null
    ? `${ndYoy >= 0 ? "+" : ""}£${Math.abs(ndYoy).toFixed(1)}m` : null;
  const ndYoyColor = ndYoy === null ? "#cccccc" : ndYoy <= 0 ? C_WIN : C_LOSE;

  // Squad Value snapshot
  const svRank = divRank(divisionPeers, slug, p => p.squad_value_eur_m, true);
  const svFmt  = club.squad_value_eur_m !== null
    ? `€${club.squad_value_eur_m.toLocaleString("en-GB", { maximumFractionDigits: 0 })}m` : "—";

  const hasAttendance = divisionPeers.filter(p => p.attendance_pct !== null).length >= 2;

  return (
    <div className="space-y-10">

      {/* ── Financial Snapshot Cards ───────────────────────────────────────── */}
      <div>
        <SectionHeading>Financial Snapshot</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#e0e0e0] overflow-hidden divide-x divide-y sm:divide-y-0 divide-[#e0e0e0]">
          <SnapshotCard
            label="Revenue"
            value={fmtGBP(club.revenue)}
            rankText={revRank ? `${ordinal(revRank)} in ${divisionLabel}` : null}
            yoyStr={revYoyStr}
            yoyColor={revYoyColor}
          />
          <SnapshotCard
            label="Wage Ratio"
            value={fmtPct(club.wage_ratio)}
            rankText={wrRank ? `${ordinal(wrRank)} in ${divisionLabel} · lower is better` : null}
            yoyStr={wrYoyStr}
            yoyColor={wrYoyColor}
          />
          <SnapshotCard
            label="Net Debt"
            value={fmtGBP(club.net_debt)}
            rankText={ndRank ? `${ordinal(ndRank)} in ${divisionLabel} · lower is better` : null}
            yoyStr={ndYoyStr}
            yoyColor={ndYoyColor}
          />
          <SnapshotCard
            label="Est. Squad Value"
            value={svFmt}
            rankText={svRank ? `${ordinal(svRank)} in ${divisionLabel}` : null}
            yoyStr={null}
            yoyColor="#cccccc"
          />
        </div>
      </div>

      {/* ── Financial Rankings ─────────────────────────────────────────────── */}
      <div>
        <SectionHeading>Financial Rankings</SectionHeading>
        <div className="space-y-7">
          <RankSection
            title="Revenue"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.revenue }))}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={true}
          />
          <RankSection
            title="Wage Bill"
            note="Lower is better"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.wage_bill }))}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={false}
          />
          <RankSection
            title="Wage Ratio"
            note="Lower is better"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.wage_ratio }))}
            highlightSlug={slug}
            formatFn={v => fmtPct(v)}
            higherBetter={false}
          />
          <RankSection
            title="Operating Profit / (Loss)"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.operating_profit }))}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={true}
            diverging={true}
          />
          <RankSection
            title="Pre-tax Profit / (Loss)"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.pre_tax_profit }))}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={true}
            diverging={true}
          />
          <RankSection
            title="Net Debt"
            note="Lower is better"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.net_debt }))}
            highlightSlug={slug}
            formatFn={v => fmtGBP(v)}
            higherBetter={false}
            diverging={true}
          />
        </div>
      </div>

      {/* ── Squad Rankings ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeading>Squad Rankings</SectionHeading>
        <div className="space-y-7">
          <RankSection
            title="Est. Squad Market Value"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.squad_value_eur_m }))}
            highlightSlug={slug}
            formatFn={v => `€${Math.round(v).toLocaleString("en-GB")}m`}
            higherBetter={true}
          />
          <RankSection
            title="Average Squad Age"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.avg_age }))}
            highlightSlug={slug}
            formatFn={v => v.toFixed(1)}
            higherBetter={false}
          />
          <RankSection
            title="Contract Expiry Risk"
            note="% of squad with contracts expiring ≤ 12 months · lower is better"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.expiry_0_12m_pct }))}
            highlightSlug={slug}
            formatFn={v => `${v.toFixed(0)}%`}
            higherBetter={false}
          />
        </div>
      </div>

      {/* ── Stadium Rankings ───────────────────────────────────────────────── */}
      <div>
        <SectionHeading>Stadium Rankings</SectionHeading>
        <div className="space-y-7">
          <RankSection
            title="Capacity"
            data={divisionPeers.map(p => ({ slug: p.slug, name: p.name, value: p.capacity }))}
            highlightSlug={slug}
            formatFn={v => Math.round(v).toLocaleString("en-GB")}
            higherBetter={true}
          />
          {hasAttendance && (
            <RankSection
              title="Stadium Utilisation"
              note="Average attendance / capacity"
              data={divisionPeers
                .filter(p => p.attendance_pct !== null)
                .map(p => ({ slug: p.slug, name: p.name, value: p.attendance_pct }))}
              highlightSlug={slug}
              formatFn={v => fmtPct(v)}
              higherBetter={true}
            />
          )}
        </div>
      </div>

    </div>
  );
}

// ─── H2H Table ────────────────────────────────────────────────────────────────

function H2HTable({ main, other }: { main: H2HPeer; other: H2HPeer }) {
  const mainFX  = main.currency !== "EUR";
  const otherFX = other.currency !== "EUR";

  type RowDef = {
    label:        string;
    mainVal:      number | null;
    otherVal:     number | null;
    higherBetter: boolean;
    isRatio?:     boolean;
    isEURDirect?: boolean; // already in EUR (squad value) — no FX needed
    isPlain?:     boolean; // dimensionless (age, %) — no FX needed, format raw
    plainFmt?:    (v: number) => string;
    // if true, winner is whichever club's abs(val - 26) is smaller
    isAgePeak?:   boolean;
  };

  function rowWinner(
    def: RowDef,
    mainEur: number | null,
    otherEur: number | null,
  ): boolean | null {
    if (mainEur === null || otherEur === null) return null;
    if (def.isAgePeak) {
      return Math.abs(mainEur - 26) < Math.abs(otherEur - 26);
    }
    return def.higherBetter ? mainEur > otherEur : mainEur < otherEur;
  }

  function TableRow({ def }: { def: RowDef }) {
    const mainEur  = def.isEURDirect || def.isPlain || def.isRatio
      ? def.mainVal  : toEUR(def.mainVal, main.currency);
    const otherEur = def.isEURDirect || def.isPlain || def.isRatio
      ? def.otherVal : toEUR(def.otherVal, other.currency);

    const mainWins  = rowWinner(def, mainEur, otherEur);
    const mainBg    = mainWins === true  ? BG_WIN  : mainWins === false ? BG_LOSE : undefined;
    const otherBg   = mainWins === false ? BG_WIN  : mainWins === true  ? BG_LOSE : undefined;
    const mainClr   = mainWins === true  ? C_WIN   : mainWins === false ? C_LOSE  : "#111111";
    const otherClr  = mainWins === false ? C_WIN   : mainWins === true  ? C_LOSE  : "#111111";

    function display(v: number | null, isOther: boolean): string {
      if (v === null) return "—";
      if (def.isRatio) return fmtPct(v);
      if (def.isPlain && def.plainFmt) return def.plainFmt(v);
      // currency — convert to EUR
      const eur = toEUR(v, isOther ? other.currency : main.currency);
      return fmtEUR(eur);
    }

    const showMainFX  = !def.isRatio && !def.isPlain && !def.isEURDirect && mainFX  && def.mainVal !== null;
    const showOtherFX = !def.isRatio && !def.isPlain && !def.isEURDirect && otherFX && def.otherVal !== null;

    return (
      <div className="flex border-b border-[#f0f0f0] last:border-0">
        <div className="w-32 sm:w-40 px-4 py-3 shrink-0 flex items-center">
          <span className="text-xs font-bold tracking-[0.1em] uppercase text-[#888888]">
            {def.label}
          </span>
        </div>
        <div className="flex-1 px-4 py-3 border-l border-[#f0f0f0]" style={{ background: mainBg }}>
          <span className="text-base font-medium tabular-nums" style={{ color: mainClr }}>
            {display(def.mainVal, false)}
          </span>
          {showMainFX && (
            <span className="text-xs text-[#bbbbbb] ml-1.5">fx applied</span>
          )}
        </div>
        <div className="flex-1 px-4 py-3 border-l border-[#f0f0f0]" style={{ background: otherBg }}>
          <span className="text-base font-medium tabular-nums" style={{ color: otherClr }}>
            {display(def.otherVal, true)}
          </span>
          {showOtherFX && (
            <span className="text-xs text-[#bbbbbb] ml-1.5">fx applied</span>
          )}
        </div>
      </div>
    );
  }

  function SectionHeader({ label }: { label: string }) {
    return (
      <div className="flex bg-[#f9f9f9] border-b border-[#e8e8e8]">
        <div className="w-32 sm:w-40 shrink-0" />
        <div className="flex-1 px-4 py-2 border-l border-[#e8e8e8]">
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#999999]">{label}</span>
        </div>
      </div>
    );
  }

  const financialRows: RowDef[] = [
    { label: "Revenue",     mainVal: main.revenue,          otherVal: other.revenue,          higherBetter: true  },
    { label: "Wage Bill",   mainVal: main.wage_bill,        otherVal: other.wage_bill,        higherBetter: false },
    { label: "Wage Ratio",  mainVal: main.wage_ratio,       otherVal: other.wage_ratio,       higherBetter: false, isRatio: true },
    { label: "Op. Profit",  mainVal: main.operating_profit, otherVal: other.operating_profit, higherBetter: true  },
    { label: "Pre-tax",     mainVal: main.pre_tax_profit,   otherVal: other.pre_tax_profit,   higherBetter: true  },
    { label: "Net Debt",    mainVal: main.net_debt,         otherVal: other.net_debt,         higherBetter: false },
  ];
  const squadRows: RowDef[] = [
    {
      label: "Squad Value", mainVal: main.squad_value_eur_m, otherVal: other.squad_value_eur_m,
      higherBetter: true, isEURDirect: true,
      isPlain: false,
    },
    {
      label: "Avg Age",     mainVal: main.avg_age, otherVal: other.avg_age,
      higherBetter: false, isPlain: true, isAgePeak: true,
      plainFmt: v => v.toFixed(1),
    },
    {
      label: "Expiry Risk", mainVal: main.expiry_0_12m_pct, otherVal: other.expiry_0_12m_pct,
      higherBetter: false, isRatio: true,
    },
  ];
  const stadiumRows: RowDef[] = [
    {
      label: "Capacity",    mainVal: main.capacity, otherVal: other.capacity,
      higherBetter: true, isPlain: true, plainFmt: v => Math.round(v).toLocaleString("en-GB"),
    },
    {
      label: "Utilisation", mainVal: main.attendance_pct, otherVal: other.attendance_pct,
      higherBetter: true, isRatio: true,
    },
  ];

  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      {/* Column headers */}
      <div className="flex border-b-2 border-[#e0e0e0]">
        <div className="w-32 sm:w-40 shrink-0 px-4 py-3">
          <span className="text-xs font-bold tracking-[0.1em] uppercase text-[#aaaaaa]">EUR base</span>
        </div>
        <div className="flex-1 px-4 py-3 border-l border-[#e0e0e0]">
          <p className="text-sm font-bold" style={{ color: HIGHLIGHT }}>{main.name}</p>
          <p className="text-xs text-[#aaaaaa] mt-0.5">{main.divisionLabel}</p>
        </div>
        <div className="flex-1 px-4 py-3 border-l border-[#e0e0e0]">
          <p className="text-sm font-bold" style={{ color: H2H_CLR }}>{other.name}</p>
          <p className="text-xs text-[#aaaaaa] mt-0.5">
            {COUNTRY_FLAGS[other.country] ?? ""} {other.divisionLabel}
          </p>
        </div>
      </div>

      <SectionHeader label="Financial" />
      {financialRows.map(def => <TableRow key={def.label} def={def} />)}

      <SectionHeader label="Squad" />
      {squadRows.map(def => <TableRow key={def.label} def={def} />)}

      <SectionHeader label="Stadium" />
      {stadiumRows.map(def => <TableRow key={def.label} def={def} />)}

      <div className="px-4 py-2 bg-[#fafafa] border-t border-[#e8e8e8]">
        <p className="text-xs text-[#cccccc]">
          EUR base · GBP ×{FX_GBP} · USD ×{FX_USD} · Squad value always in EUR · Green = better for that metric
        </p>
      </div>
    </div>
  );
}

// ─── Head to Head View ────────────────────────────────────────────────────────

function HeadToHeadView({
  mainSlug, mainPeer, allH2HPeers,
}: {
  mainSlug:    string;
  mainPeer:    H2HPeer;
  allH2HPeers: H2HPeer[];
}) {
  const [query, setQuery]       = useState("");
  const [selectedSlug, setSlug] = useState<string | null>(null);
  const [view, setView]         = useState<H2HView>("table");

  const otherPeer = selectedSlug
    ? allH2HPeers.find(p => p.slug === selectedSlug) ?? null
    : null;

  // Search filter: exclude the main club
  const searchPool = useMemo(
    () => allH2HPeers.filter(p => p.slug !== mainSlug),
    [allH2HPeers, mainSlug],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return searchPool;
    const q = query.toLowerCase();
    return searchPool.filter(
      p => p.name.toLowerCase().includes(q) || p.divisionLabel.toLowerCase().includes(q),
    );
  }, [searchPool, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, H2HPeer[]>();
    for (const p of filtered) {
      if (!map.has(p.country)) map.set(p.country, []);
      map.get(p.country)!.push(p);
    }
    return COUNTRY_ORDER
      .filter(c => map.has(c))
      .map(c => [c, map.get(c)!] as [string, H2HPeer[]]);
  }, [filtered]);

  // Radar populations (from full peer set for fair normalisation)
  const radarPops = useMemo(() => {
    function pop(fn: (p: H2HPeer) => number | null): number[] {
      return allH2HPeers.map(fn).filter((v): v is number => v !== null);
    }
    return {
      revenueEur: pop(p => toEUR(p.revenue, p.currency)),
      wageRatio:  pop(p => p.wage_ratio),
      squadValue: pop(p => p.squad_value_eur_m),
      ageDev:     pop(p => p.avg_age !== null ? Math.abs(p.avg_age - 26) : null),
      capacity:   pop(p => p.capacity),
      attendance: pop(p => p.attendance_pct),
    };
  }, [allH2HPeers]);

  function radarValues(peer: H2HPeer) {
    return [
      toEUR(peer.revenue, peer.currency),
      peer.wage_ratio,
      peer.squad_value_eur_m,
      peer.avg_age !== null ? Math.abs(peer.avg_age - 26) : null,
      peer.capacity,
      peer.attendance_pct,
    ];
  }

  const radarAxes = [
    { label: "Revenue",          invert: false, population: radarPops.revenueEur },
    { label: "Wage\nEfficiency", invert: true,  population: radarPops.wageRatio  },
    { label: "Squad\nValue",     invert: false, population: radarPops.squadValue  },
    { label: "Peak\nAge",        invert: true,  population: radarPops.ageDev      },
    { label: "Stadium\nCapacity",invert: false, population: radarPops.capacity    },
    { label: "Attendance\nRate", invert: false, population: radarPops.attendance  },
  ];

  return (
    <div>
      {/* Club search */}
      {!otherPeer && (
        <div className="mb-6">
          <p className="text-sm text-[#888888] mb-3">Search for any club in the database to compare</p>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clubs…"
            autoComplete="off"
            className="w-full max-w-sm border border-[#e0e0e0] px-3 py-2 text-sm text-[#111111] bg-white focus:outline-none focus:border-[#999999]"
          />
          {query.trim().length > 0 && (
            <div className="max-w-sm border border-[#e0e0e0] border-t-0 max-h-72 overflow-y-auto bg-white">
              {grouped.length === 0 && (
                <p className="px-4 py-3 text-sm text-[#aaaaaa]">No clubs match.</p>
              )}
              {grouped.map(([country, peers]) => (
                <div key={country}>
                  <div className="px-4 py-1.5 bg-[#f9f9f9] border-b border-[#f0f0f0]">
                    <span className="text-xs font-bold tracking-[0.12em] uppercase text-[#bbbbbb]">
                      {COUNTRY_FLAGS[country] ?? ""} {country}
                    </span>
                  </div>
                  {peers.map(p => (
                    <button
                      key={p.slug}
                      onMouseDown={() => { setSlug(p.slug); setQuery(""); }}
                      className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-[#f5f5f5] border-b border-[#f8f8f8] last:border-0"
                    >
                      <span className="text-sm text-[#111111]">{p.name}</span>
                      <span className="text-xs text-[#aaaaaa] ml-2 shrink-0">{p.divisionLabel}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected club header */}
      {otherPeer && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: HIGHLIGHT }}>
                {mainPeer.name}
              </span>
            </div>
            <span className="text-[#cccccc]">vs</span>
            <div>
              <span className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: H2H_CLR }}>
                {otherPeer.name}
              </span>
              <span className="text-xs text-[#aaaaaa] ml-2">
                {COUNTRY_FLAGS[otherPeer.country] ?? ""} {otherPeer.divisionLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex border border-[#e0e0e0] overflow-hidden text-xs">
              {(["table", "radar"] as H2HView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 font-bold tracking-[0.08em] uppercase transition-colors"
                  style={{
                    background:  view === v ? "#111111" : "#ffffff",
                    color:       view === v ? "#ffffff" : "#999999",
                    borderRight: v === "table" ? "1px solid #e0e0e0" : undefined,
                  }}
                >
                  {v === "table" ? "Table" : "Radar"}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSlug(null); setQuery(""); }}
              className="text-xs text-[#aaaaaa] hover:text-[#555555] underline underline-offset-2 transition-colors"
            >
              Change club
            </button>
          </div>
        </div>
      )}

      {/* Comparison content */}
      {otherPeer && view === "table" && (
        <H2HTable main={mainPeer} other={otherPeer} />
      )}
      {otherPeer && view === "radar" && (
        <RadarChart
          axes={radarAxes}
          series={[
            { name: mainPeer.name,  color: HIGHLIGHT, values: radarValues(mainPeer)  },
            { name: otherPeer.name, color: H2H_CLR,   values: radarValues(otherPeer) },
          ]}
        />
      )}

      {/* No club selected yet — show a hint */}
      {!otherPeer && !query.trim() && (
        <div className="border border-dashed border-[#e0e0e0] px-6 py-10 text-center">
          <p className="text-sm text-[#aaaaaa]">
            Search above to select a club and start the head-to-head comparison.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Mode tab button ──────────────────────────────────────────────────────────

function ModeTab({
  label, active, onClick,
}: {
  label:   string;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 transition-colors"
      style={{
        padding:       "0.875rem 1.75rem",
        fontSize:      "13px",
        fontWeight:    active ? 700 : 400,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color:         active ? "#111111" : "#aaaaaa",
        background:    "none",
        border:        "none",
        borderBottom:  `2px solid ${active ? "#111111" : "transparent"}`,
        marginBottom:  "-1px",
        cursor:        "pointer",
        whiteSpace:    "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function ClubCompareTab({
  slug,
  divisionLabel,
  priorYear,
  divisionPeers,
  allH2HPeers,
}: {
  slug:          string;
  divisionLabel: string;
  priorYear:     PriorYearSnap | null;
  divisionPeers: DivisionPeer[];
  allH2HPeers:   H2HPeer[];
}) {
  const [mode, setMode] = useState<CompareMode>("benchmark");

  const mainPeer = allH2HPeers.find(p => p.slug === slug) ?? null;

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex border-b border-[#e0e0e0] mb-8 overflow-x-auto">
        <ModeTab
          label="Division Benchmark"
          active={mode === "benchmark"}
          onClick={() => setMode("benchmark")}
        />
        <ModeTab
          label="Head to Head"
          active={mode === "h2h"}
          onClick={() => setMode("h2h")}
        />
      </div>

      {mode === "benchmark" && (
        <DivisionBenchmarkView
          slug={slug}
          divisionLabel={divisionLabel}
          divisionPeers={divisionPeers}
          priorYear={priorYear}
        />
      )}

      {mode === "h2h" && mainPeer && (
        <HeadToHeadView
          mainSlug={slug}
          mainPeer={mainPeer}
          allH2HPeers={allH2HPeers}
        />
      )}
    </div>
  );
}
