"use client";

import { useState } from "react";
import { EUClub } from "@/lib/euClubs";

// ─── Signal colours + tints ───────────────────────────────────────────────────
const GREEN = "#2e7d52";
const RED   = "#9a3030";
const AMBER = "#c47900";

const SIGNAL_BG: Record<string, string> = {
  [GREEN]: "#f2fbf5",
  [RED]:   "#fdf3f3",
  [AMBER]: "#fdfaf0",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(v: number | null, currency: "EUR" | "USD" | "SEK", isRatio = false): string {
  if (v === null) return "—";
  if (isRatio) return `${v.toFixed(1)}%`;
  const abs = Math.abs(v);
  if (currency === "SEK") return `${v < 0 ? "-" : ""}SEK ${abs.toFixed(1)}m`;
  const sym = currency === "USD" ? "$" : "€";
  return `${v < 0 ? "-" : ""}${sym}${abs.toFixed(1)}m`;
}

function currSym(currency: "EUR" | "USD" | "SEK"): string {
  return currency === "USD" ? "$" : currency === "SEK" ? "SEK " : "€";
}

function normalizeSeason(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\s*\(.*$/, "").replace(/^FY/, "").trim();
}

// ─── Signal helpers ───────────────────────────────────────────────────────────

function wageSignal(ratio: number | null): string {
  if (ratio === null) return "#cccccc";
  return ratio < 55 ? GREEN : ratio < 70 ? AMBER : RED;
}
function profitSignal(v: number | null): string {
  if (v === null) return "#cccccc";
  return v >= 0 ? GREEN : RED;
}
function debtDotSignal(v: number | null): string {
  if (v === null) return "#cccccc";
  return v <= 0 ? GREEN : RED;
}
function debtCardSignal(current: number | null, prior: number | null): string {
  if (current === null) return "#cccccc";
  if (current <= 0) return GREEN;
  if (prior !== null && prior > 0) {
    const growth = (current - prior) / Math.abs(prior);
    if (growth <= 0) return GREEN;
    if (growth <= 0.15) return AMBER;
  }
  return RED;
}
function liabCardSignal(current: number | null, prior: number | null): string {
  if (current === null || current <= 0) return "#cccccc";
  if (prior !== null && prior > 0) {
    const growth = (current - prior) / Math.abs(prior);
    if (growth <= 0) return GREEN;
    if (growth <= 0.15) return AMBER;
    return RED;
  }
  return "#cccccc";
}

// ─── Subtext helpers ─────────────────────────────────────────────────────────

function wageSubtext(current: number | null, prior: number | null): string {
  if (current === null) return "";
  const dir = prior === null ? "" : current < prior ? "Improving" : current > prior ? "Worsening" : "Stable";
  const pos = current < 55 ? "well below 55% threshold" : current < 70 ? "above 55% threshold" : "exceeds 70%";
  return dir ? `${dir} · ${pos}` : pos;
}
function profitSubtext(current: number | null, prior: number | null, isOpProfit: boolean): string {
  if (current === null) return "";
  const label = isOpProfit ? "Operating" : "Net";
  if (current >= 0) return prior !== null && current > prior ? `${label} profit growing` : `${label} profit`;
  if (prior !== null && prior < 0) return current < prior ? `${label} loss widening` : `${label} loss narrowing`;
  return prior !== null && prior >= 0 ? `Moved to ${label.toLowerCase()} loss` : `${label} loss`;
}
function debtSubtext(current: number | null, prior: number | null, sym: string): string {
  if (current === null) return "";
  if (current <= 0) return "Net cash position";
  if (prior === null || prior <= 0) return `Net debt: ${sym}${Math.abs(current).toFixed(1)}m`;
  const diff = current - prior;
  return `Growing · ${diff > 0 ? "up" : "down"} ${sym}${Math.abs(diff).toFixed(1)}m YoY`;
}
function liabSubtext(current: number | null, prior: number | null, sym: string): string {
  if (current === null) return "";
  if (prior === null) return `${sym}${Math.abs(current).toFixed(1)}m total liabilities`;
  const diff = current - prior;
  return `${diff > 0 ? "Rising" : diff < 0 ? "Falling" : "Stable"} · ${diff > 0 ? "up" : "down"} ${sym}${Math.abs(diff).toFixed(1)}m YoY`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values, higherBetter }: { values: (number | null)[]; higherBetter: boolean | null }) {
  const nonNull = values
    .map((v, i): { v: number; i: number } | null => v !== null ? { v, i } : null)
    .filter((x): x is { v: number; i: number } => x !== null);

  if (nonNull.length < 2) return <div style={{ height: "26px" }} />;

  const first = nonNull[0].v;
  const last  = nonNull[nonNull.length - 1].v;
  const trendUp   = last > first;
  const trendDown = last < first;

  let stroke = "#cccccc";
  if (trendUp || trendDown) {
    if (higherBetter === true)  stroke = trendUp  ? GREEN : RED;
    if (higherBetter === false) stroke = trendDown ? GREEN : RED;
    if (higherBetter === null)  stroke = trendUp  ? GREEN : "#cccccc";
  }

  const vals = nonNull.map(x => x.v);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV;

  const W = 100, H = 24, PAD = 3;
  const n = nonNull.length;
  const xOf = (pos: number) => (pos / (n - 1)) * W;
  const yOf = (v: number) => range === 0 ? H / 2 : PAD + ((maxV - v) / range) * (H - PAD * 2);

  const points = nonNull.map((x, pos) => `${xOf(pos).toFixed(1)},${yOf(x.v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "26px", display: "block" }}>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "#111111", margin: "0 0 16px 0", paddingBottom: "10px", borderBottom: "2px solid #111111",
    }}>
      {children}
    </p>
  );
}

// ─── Tier 1: KFI card ─────────────────────────────────────────────────────────
function HealthCard({ label, value, subtext, signal, dots }: {
  label: string; value: string; subtext: string; signal: string; dots: string[];
}) {
  const bg = SIGNAL_BG[signal] ?? "white";
  return (
    <div style={{
      borderTop: "1px solid #eeeeee", borderRight: "1px solid #eeeeee",
      borderBottom: "1px solid #eeeeee", borderLeft: `4px solid ${signal}`,
      padding: "28px 24px 22px", background: bg,
    }}>
      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: signal, margin: "0 0 12px 0", opacity: 0.85 }}>
        {label}
      </p>
      <p style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 700, color: signal, fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: "0 0 10px 0" }}>
        {value}
      </p>
      <p style={{ fontSize: "14px", color: signal, margin: "0 0 18px 0", lineHeight: 1.45, opacity: 0.8 }}>
        {subtext}
      </p>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {dots.map((dotColor, i) => (
          <span key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Tier 2: Metric tile ──────────────────────────────────────────────────────
function MetricTile({ label, value, current, prior, higherBetter, sparkValues }: {
  label: string; value: string;
  current: number | null; prior: number | null;
  higherBetter: boolean | null;
  sparkValues: (number | null)[];
}) {
  const pct = current !== null && prior !== null && prior !== 0
    ? ((current - prior) / Math.abs(prior)) * 100
    : null;

  let deltaColor = "#888888";
  if (pct !== null) {
    if (higherBetter !== null) {
      deltaColor = (higherBetter ? current! > prior! : current! < prior!) ? GREEN : RED;
    } else {
      deltaColor = pct >= 0 ? GREEN : RED;
    }
  }

  return (
    <div style={{ border: "1px solid #eeeeee", padding: "18px 18px 14px", background: "white", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888888", margin: "0 0 8px 0" }}>
        {label}
      </p>
      <p style={{ fontSize: "22px", fontWeight: 700, color: "#111111", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, margin: "0 0 4px 0" }}>
        {value}
      </p>
      {pct !== null ? (
        <p style={{ fontSize: "12px", fontWeight: 600, color: deltaColor, margin: "0 0 10px 0" }}>
          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}% YoY
        </p>
      ) : (
        <div style={{ marginBottom: "10px" }} />
      )}
      <Sparkline values={sparkValues} higherBetter={higherBetter} />
    </div>
  );
}

// ─── Metrics config (for YoY section) ────────────────────────────────────────

type MetricConfig = {
  key: keyof EUYearSnap;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter: boolean | null;
};

const EU_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue",             higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill",           higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",          isRatio: true, higherBetter: false },
  { key: "net_profit",          label: "Net Profit / (Loss)", diverging: true, higherBetter: true },
  { key: "equity",              label: "Equity",              diverging: true, higherBetter: true },
  { key: "total_liabilities",   label: "Total Liabilities",   higherBetter: false },
];

const FR_METRICS: MetricConfig[] = [
  { key: "revenue",                  label: "Revenue",                   higherBetter: true },
  { key: "wage_bill",                label: "Wage Bill",                 higherBetter: false },
  { key: "wage_to_revenue_pct",      label: "Wage Ratio",                isRatio: true, higherBetter: false },
  { key: "operating_profit",         label: "Operating Profit / (Loss)", diverging: true, higherBetter: true },
  { key: "profit_from_player_sales", label: "Player Sales Revenue",      diverging: true, higherBetter: true },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",   diverging: true, higherBetter: true },
  { key: "net_debt",                 label: "Net Debt / (Cash)",         diverging: true, higherBetter: false },
];

const DK_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue (€)",               higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (€)",             higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "Operating Profit / (Loss)", diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",   diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",         diverging: true, higherBetter: false },
];

const SW_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue (USD)",             higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (USD)",           higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "Operating Profit / (Loss)", diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",   diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",         diverging: true, higherBetter: false },
];

const IT_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue (€)",               higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (€)",             higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "EBIT / Operating Profit",   diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",   diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",         diverging: true, higherBetter: false },
];

const ES_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue (€)",               higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (€)",             higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "EBIT / Operating Profit",   diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",   diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",         diverging: true, higherBetter: false },
];

function getMetrics(country: string): MetricConfig[] {
  if (country === "Norway" || country === "Denmark") return DK_METRICS;
  if (country === "Sweden") return SW_METRICS;
  if (country === "France") return FR_METRICS;
  if (country === "Italy") return IT_METRICS;
  if (country === "Spain") return ES_METRICS;
  return EU_METRICS;
}

// ─── Country disclaimer ───────────────────────────────────────────────────────

function CountryDisclaimer({ country }: { country: string }) {
  if (country === "Denmark") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-xs text-[#888888] leading-relaxed">
        Figures converted from Danish Krone (DKK) to Euros (EUR) using published annual EUR/DKK rates.
        Original DKK values are available in the data notes below.
      </div>
    );
  }
  if (country === "Norway") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-xs text-[#888888] leading-relaxed">
        Figures converted from Norwegian Krone (NOK) to US Dollars (USD) using published annual FX rates.
        Original NOK values are available in the data notes below.
        Norwegian clubs are non-profit idrettslag (sports associations) — no corporate tax applies.
      </div>
    );
  }
  if (country === "Sweden") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-xs text-[#888888] leading-relaxed">
        Figures converted from Swedish Kronor (SEK) to US Dollars (USD) using published annual average FX rates
        (2025: 10.47, 2024: 10.53, 2023: 10.50 SEK/USD). Original SEK values are available in the data notes below.
        Swedish clubs are non-profit ideella föreningar (membership associations) — no corporate tax applies.
      </div>
    );
  }
  if (country === "Italy") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-xs text-[#888888] leading-relaxed">
        Figures in EUR millions. FY typically ends 30 June (football year); clubs using a December fiscal year are noted.
        Revenue (Valore della Produzione) includes gains on player sales. EBIT shown as Differenza A−B.
        Source: bilancio d&apos;esercizio / bilancio consolidato. Half-year accounts (Juventus, Lazio) cover 6 months only — not comparable to full-year figures.
      </div>
    );
  }
  if (country === "Spain") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-xs text-[#888888] leading-relaxed">
        Figures in EUR millions. FY runs 1 July → 30 June. Revenue = Importe neto de la cifra de negocios (includes player sale gains).
        EBIT = Resultado de explotación. Net debt excludes Deudas con entidades deportivas (transfer payables to other clubs).
        Entity types: SAD (Sociedad Anónima Deportiva, for-profit); Asociación (non-profit member club — Real Madrid, Barcelona, Athletic Club).
        Source: cuentas anuales filed at Registro Mercantil. Some clubs file foundation accounts not comparable with SAD commercial accounts.
      </div>
    );
  }
  return null;
}

// ─── Historical year snapshot type ───────────────────────────────────────────

type EUYearSnap = {
  season: string;
  revenue: number | null;
  wage_bill: number | null;
  wage_to_revenue_pct: number | null;
  net_profit: number | null;
  equity: number | null;
  total_liabilities: number | null;
  operating_profit?: number | null;
  profit_from_player_sales?: number | null;
  pre_tax_profit?: number | null;
  net_debt?: number | null;
};

function buildEUYearSnaps(club: EUClub): EUYearSnap[] {
  const currentSeason = club.financials.most_recent_year;
  const currentNorm = normalizeSeason(currentSeason);
  const snaps: EUYearSnap[] = club.historical
    .filter((h) => normalizeSeason(h.season) !== currentNorm)
    .map((h) => {
      const py = club.prior_year?.season === h.season ? club.prior_year : null;
      return {
        season: h.season,
        revenue: h.revenue,
        wage_bill: h.wage_bill,
        wage_to_revenue_pct:
          h.revenue && h.wage_bill ? Math.round((h.wage_bill / h.revenue) * 1000) / 10 : null,
        net_profit: h.net_profit,
        equity: h.equity ?? null,
        total_liabilities: h.total_liabilities ?? null,
        operating_profit: h.operating_profit ?? py?.operating_profit ?? null,
        profit_from_player_sales: h.profit_from_player_sales ?? py?.profit_from_player_sales ?? null,
        pre_tax_profit: h.pre_tax_profit ?? h.net_profit ?? py?.pre_tax_profit ?? null,
        net_debt: h.net_debt ?? py?.net_debt ?? null,
      };
    });
  const py = club.prior_year;
  if (
    py &&
    !snaps.find((s) => normalizeSeason(s.season) === normalizeSeason(py.season)) &&
    normalizeSeason(py.season) !== currentNorm
  ) {
    snaps.push({
      season: py.season,
      revenue: py.revenue,
      wage_bill: py.wage_bill,
      wage_to_revenue_pct: py.wage_to_revenue_pct,
      net_profit: py.net_profit ?? null,
      equity: py.equity ?? null,
      total_liabilities: py.total_liabilities ?? null,
      operating_profit: py.operating_profit ?? null,
      profit_from_player_sales: py.profit_from_player_sales ?? null,
      pre_tax_profit: py.pre_tax_profit ?? null,
      net_debt: py.net_debt ?? null,
    });
  }
  if (currentSeason && !snaps.find((s) => normalizeSeason(s.season) === currentNorm)) {
    snaps.push({
      season: currentSeason,
      revenue: club.financials.revenue,
      wage_bill: club.financials.wage_bill,
      wage_to_revenue_pct: club.financials.wage_to_revenue_pct,
      net_profit: club.financials.net_profit,
      equity: club.financials.equity,
      total_liabilities: club.financials.total_liabilities,
      operating_profit: club.financials.operating_profit ?? null,
      profit_from_player_sales: club.financials.profit_from_player_sales ?? null,
      pre_tax_profit: club.financials.pre_tax_profit ?? null,
      net_debt: club.financials.net_debt ?? null,
    });
  }
  return snaps;
}

// ─── SVG trend chart ──────────────────────────────────────────────────────────

const ML = 56, MR = 16, MT = 28, MB = 36, VW = 560, VH = 200;
const PW = VW - ML - MR, PH = VH - MT - MB;

function niceStep(range: number): number {
  if (range === 0) return 1;
  const raw = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
}

function buildTicks(min: number, max: number): number[] {
  const step = niceStep(max - min);
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.01; v = Math.round((v + step) * 1e9) / 1e9) ticks.push(v);
  if (ticks.length > 6) {
    const every = Math.ceil(ticks.length / 5);
    return ticks.filter((_, i) => i % every === 0);
  }
  return ticks;
}

function fmtChartTick(v: number, isRatio: boolean | undefined, currency: "EUR" | "USD" | "SEK"): string {
  if (isRatio) return `${v}%`;
  const sym = currency === "USD" ? "$" : currency === "SEK" ? "SEK" : "€";
  if (Math.abs(v) >= 1000) return `${sym}${(v / 1000).toFixed(1)}bn`;
  return `${sym}${v}m`;
}
function fmtChartLabel(v: number, isRatio: boolean | undefined): string {
  if (isRatio) return `${v.toFixed(1)}%`;
  return `${v.toFixed(0)}m`;
}

function buildLeagueAvgSnaps(allYears: EUYearSnap[], leagueClubs: EUClub[]): EUYearSnap[] {
  return allYears.map((yr) => {
    const matchingSnaps = leagueClubs.flatMap((c) =>
      buildEUYearSnaps(c).filter((s) => normalizeSeason(s.season) === normalizeSeason(yr.season))
    );
    const avg = (key: keyof EUYearSnap): number | null => {
      const vals = matchingSnaps
        .map((s) => s[key] as number | null)
        .filter((v): v is number => v !== null && isFinite(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      season: yr.season,
      revenue: avg("revenue"),
      wage_bill: avg("wage_bill"),
      wage_to_revenue_pct: avg("wage_to_revenue_pct"),
      net_profit: avg("net_profit"),
      equity: avg("equity"),
      total_liabilities: avg("total_liabilities"),
      operating_profit: avg("operating_profit"),
      profit_from_player_sales: avg("profit_from_player_sales"),
      pre_tax_profit: avg("pre_tax_profit"),
      net_debt: avg("net_debt"),
    };
  });
}

function euPolySegments(
  years: EUYearSnap[],
  key: keyof EUYearSnap,
  xPos: (i: number) => number,
  yPos: (v: number) => number,
): string[][] {
  const segs: string[][] = [];
  let seg: string[] = [];
  years.forEach((yr, i) => {
    const v = yr[key] as number | null;
    if (v !== null && v !== undefined && isFinite(v)) {
      seg.push(`${xPos(i).toFixed(2)},${yPos(v).toFixed(2)}`);
    } else {
      if (seg.length) { segs.push(seg); seg = []; }
    }
  });
  if (seg.length) segs.push(seg);
  return segs;
}

function EUTrendChart({
  years, leagueYears, metricKey, isRatio, currency,
}: {
  years: EUYearSnap[];
  leagueYears: EUYearSnap[];
  metricKey: keyof EUYearSnap;
  isRatio?: boolean;
  currency: "EUR" | "USD" | "SEK";
}) {
  const n = years.length;
  const allVals: number[] = [...years, ...leagueYears]
    .map((y) => y[metricKey] as number | null)
    .filter((v): v is number => v !== null && isFinite(v));

  if (allVals.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${VH}px` }}>
        <p style={{ fontSize: "17px", color: "#cccccc", fontStyle: "italic" }}>No data available</p>
      </div>
    );
  }

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span = rawMax - rawMin || Math.abs(rawMax) || 10;
  const dataMin = rawMin - span * 0.28;
  const dataMax = rawMax + span * 0.28;
  const ticks = buildTicks(dataMin, dataMax);
  const yMin = Math.min(dataMin, ticks[0]);
  const yMax = Math.max(dataMax, ticks[ticks.length - 1]);

  const xPos = (i: number) => ML + (n <= 1 ? PW / 2 : (i / (n - 1)) * PW);
  const yPos = (v: number) => MT + PH - ((v - yMin) / (yMax - yMin)) * PH;

  const showZero = yMin < 0 && yMax > 0;
  const zeroY = showZero ? yPos(0) : null;

  const clubSegs = euPolySegments(years, metricKey, xPos, yPos);
  const avgSegs  = euPolySegments(leagueYears, metricKey, xPos, yPos);

  const fillBase = zeroY ?? yPos(yMin);
  const areaPaths = clubSegs
    .filter((s) => s.length >= 2)
    .map((s) => {
      const pts = s.map((pt) => pt.split(","));
      return (
        `M ${pts[0][0]},${pts[0][1]}` +
        pts.slice(1).map(([x, y]) => ` L ${x},${y}`).join("") +
        ` L ${pts[pts.length - 1][0]},${fillBase.toFixed(2)}` +
        ` L ${pts[0][0]},${fillBase.toFixed(2)} Z`
      );
    });

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }} aria-label="Trend chart">
      {ticks.map((tick) => {
        const y = yPos(tick);
        if (y < MT - 1 || y > MT + PH + 1) return null;
        return (
          <g key={tick}>
            <line x1={ML} y1={y} x2={ML + PW} y2={y} stroke="#f0f0f0" strokeWidth={0.5} />
            <text x={ML - 7} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#cccccc" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtChartTick(tick, isRatio, currency)}
            </text>
          </g>
        );
      })}
      {zeroY !== null && (
        <line x1={ML} y1={zeroY} x2={ML + PW} y2={zeroY} stroke="#d8d8d8" strokeWidth={0.75} strokeDasharray="3 3" />
      )}
      {areaPaths.map((d, i) => <path key={i} d={d} fill="rgba(17,17,17,0.04)" />)}
      {avgSegs.map((s, i) => (
        <polyline key={i} points={s.join(" ")} fill="none" stroke="#cccccc" strokeWidth={0.75} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {clubSegs.map((s, i) => (
        <polyline key={i} points={s.join(" ")} fill="none" stroke="#111111" strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {years.map((yr, i) => {
        const v = yr[metricKey] as number | null;
        if (v === null || v === undefined || !isFinite(v)) return null;
        const cx = xPos(i);
        const cy = yPos(v);
        const isFirst = i === 0, isLast = i === n - 1;
        const anchor = isFirst ? "start" : isLast ? "end" : "middle";
        const lx = isFirst ? cx + 1 : isLast ? cx - 1 : cx;
        const above = cy > MT + 18;
        const ly = above ? cy - 9 : cy + 17;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={2.5} fill="white" stroke="#111111" strokeWidth={1} />
            <text x={lx} y={ly} textAnchor={anchor} fontSize={11} fontWeight={400} fill="#555555" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtChartLabel(v, isRatio)}
            </text>
          </g>
        );
      })}
      {years.map((yr, i) => (
        <text key={i} x={xPos(i)} y={MT + PH + 16} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill="#bbbbbb">
          {yr.season}
        </text>
      ))}
      <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke="#ebebeb" strokeWidth={0.5} />
      <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke="#ebebeb" strokeWidth={0.5} />
    </svg>
  );
}

// ─── Change badge ─────────────────────────────────────────────────────────────

function ChgBadge({
  current, prior, higherBetter, isRatio,
}: {
  current: number | null; prior: number | null;
  higherBetter: boolean | null; isRatio?: boolean;
}) {
  if (current === null || prior === null)
    return <span style={{ color: "#cccccc", fontSize: "13px" }}>—</span>;
  const improved =
    higherBetter === null || current === prior
      ? null
      : higherBetter ? current > prior : current < prior;
  let label: string;
  if (isRatio) {
    const diff = current - prior;
    label = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp`;
  } else {
    if (prior === 0) return <span style={{ color: "#cccccc", fontSize: "13px" }}>—</span>;
    const pct = ((current - prior) / Math.abs(prior)) * 100;
    label = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  }
  const color = improved === true ? "#2e7d52" : improved === false ? "#9a3030" : "#888888";
  const bg    = improved === true ? "#edf7f1" : improved === false ? "#fdf1f1" : "#f5f5f5";
  return (
    <span style={{ color, background: bg, fontSize: "13px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", display: "inline-block" }}>
      {label}
    </span>
  );
}

// ─── Year-on-year section ─────────────────────────────────────────────────────

function EUYoYSection({
  club, leagueClubs, metrics, currency, view = "all",
}: {
  club: EUClub;
  leagueClubs: EUClub[];
  metrics: MetricConfig[];
  currency: "EUR" | "USD" | "SEK";
  view?: "all" | "table" | "chart";
}) {
  const allYears = buildEUYearSnaps(club).sort((a, b) => a.season.localeCompare(b.season));
  if (allYears.length < 2) return null;

  const leagueAvgYears = buildLeagueAvgSnaps(allYears, leagueClubs);

  type SnapKey = keyof EUYearSnap;
  const chartMetrics = metrics.filter((m) =>
    allYears.some((y) => {
      const v = y[m.key as SnapKey];
      return v !== null && v !== undefined && isFinite(v as number);
    })
  );

  const [activeMetric, setActiveMetric] = useState(0);
  const [showAllYears, setShowAllYears] = useState(false);

  const cols = allYears.map((y, i) => ({ label: y.season, snap: y, isCurrent: i === allYears.length - 1 }));

  const showTable = view !== "chart";
  const showChart = view !== "table";

  const fullTable = (
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${320 + cols.length * 110}px` }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
          <th style={{ textAlign: "left", padding: "10px 16px 8px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888", whiteSpace: "nowrap", width: "160px" }}>
            Metric
          </th>
          {cols.map((col, ci) => (
            <th key={ci} style={{ textAlign: "right", padding: "10px 12px 8px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: col.isCurrent ? "#111111" : "#aaaaaa", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "80px" }}>
              {col.label}
            </th>
          ))}
          <th style={{ textAlign: "right", padding: "10px 12px 8px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaaaaa", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "70px" }}>
            Change
          </th>
        </tr>
      </thead>
      <tbody>
        {chartMetrics.map((m, mi) => {
          const values = cols.map((col) => {
            const v = col.snap[m.key as SnapKey];
            return (v !== undefined ? v : null) as number | null;
          });
          const latest      = values[values.length - 1];
          const penultimate = values[values.length - 2] ?? null;
          return (
            <tr
              key={m.key}
              style={{ borderBottom: mi < chartMetrics.length - 1 ? "1px solid #f2f2f2" : "none", background: "white", cursor: "pointer" }}
              onClick={() => setActiveMetric(mi)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "white"; }}
            >
              <td style={{ padding: "11px 16px", fontSize: "14px", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: activeMetric === mi ? "#111111" : "#666666", whiteSpace: "nowrap", borderLeft: activeMetric === mi ? "2px solid #111111" : "2px solid transparent" }}>
                {m.label}
              </td>
              {values.map((v, ci) => (
                <td key={ci} style={{ textAlign: "right", padding: "11px 12px", fontSize: cols[ci].isCurrent ? "16px" : "14px", fontWeight: cols[ci].isCurrent ? 600 : 400, color: cols[ci].isCurrent ? "#111111" : "#888888", borderLeft: "1px solid #eeeeee", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {fmtCurrency(v, currency, m.isRatio)}
                </td>
              ))}
              <td style={{ textAlign: "right", padding: "11px 12px", borderLeft: "1px solid #eeeeee", whiteSpace: "nowrap" }}>
                <ChgBadge current={latest} prior={penultimate} higherBetter={m.higherBetter} isRatio={m.isRatio} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div>
      {/* ── Mobile table ── */}
      {showTable && <div className="sm:hidden">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaaaaa" }}>
            Latest: {cols[cols.length - 1].label}
          </span>
          <button
            onClick={() => setShowAllYears(v => !v)}
            style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888888", background: "none", border: "1px solid #e0e0e0", padding: "4px 10px", cursor: "pointer" }}
          >
            {showAllYears ? "← Back" : "All years →"}
          </button>
        </div>
        {showAllYears ? (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>{fullTable}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                <th style={{ textAlign: "left", padding: "10px 0 8px 8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888888" }}>
                  Metric
                </th>
                <th style={{ textAlign: "right", padding: "10px 12px 8px", fontSize: "13px", fontWeight: 700, color: "#111111" }}>
                  {cols[cols.length - 1].label}
                </th>
                <th style={{ textAlign: "right", padding: "10px 0 8px 8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888888", whiteSpace: "nowrap" }}>
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {chartMetrics.map((m, mi) => {
                const latest = ((): number | null => { const v = cols[cols.length - 1].snap[m.key as SnapKey]; return v !== undefined ? v as number | null : null; })();
                const prior  = ((): number | null => { const v = cols[cols.length - 2]?.snap[m.key as SnapKey]; return v !== undefined ? v as number | null : null; })();
                const shortLabel = m.label.replace(" / (Loss)", "").replace(" / (Cash)", "").replace(" (€)", "").replace(" (USD)", "");
                return (
                  <tr
                    key={m.key}
                    style={{ borderBottom: mi < chartMetrics.length - 1 ? "1px solid #f0f0f0" : "none", cursor: "pointer" }}
                    onClick={() => setActiveMetric(mi)}
                  >
                    <td style={{ padding: "11px 0 11px 8px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: activeMetric === mi ? "#111111" : "#555555", borderLeft: activeMetric === mi ? "2px solid #111111" : "2px solid transparent" }}>
                      {shortLabel}
                    </td>
                    <td style={{ textAlign: "right", padding: "11px 12px", fontSize: "17px", fontWeight: 700, color: "#111111", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {fmtCurrency(latest, currency, m.isRatio)}
                    </td>
                    <td style={{ textAlign: "right", padding: "11px 0 11px 8px", whiteSpace: "nowrap" }}>
                      <ChgBadge current={latest} prior={prior} higherBetter={m.higherBetter} isRatio={m.isRatio} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>}

      {/* ── Desktop table ── */}
      {showTable && <div className="hidden sm:block" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {fullTable}
      </div>}

      {/* ── Chart ── */}
      {showChart && <div style={{ marginTop: showTable ? "28px" : 0, borderTop: showTable ? "1px solid #eeeeee" : "none", paddingTop: showTable ? "20px" : 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "16px" }}>
          {chartMetrics.map((m, i) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(i)}
              style={{
                padding: "5px 11px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: "pointer", transition: "all 0.12s",
                border: activeMetric === i ? "1px solid #111111" : "1px solid #e0e0e0",
                background: activeMetric === i ? "#111111" : "white",
                color: activeMetric === i ? "white" : "#888888",
              }}
            >
              {m.label.replace(" / (Loss)", "").replace(" / (Cash)", "").replace(" (€)", "").replace(" (USD)", "")}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888", margin: 0 }}>
            {chartMetrics[activeMetric]?.label}
          </p>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="20" height="10" style={{ display: "block" }}>
                <line x1="0" y1="5" x2="20" y2="5" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="5" r="2.5" fill="white" stroke="#111111" strokeWidth="1.5" />
              </svg>
              <span style={{ fontSize: "12px", color: "#333333", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Club</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="20" height="10" style={{ display: "block" }}>
                <line x1="0" y1="5" x2="20" y2="5" stroke="#aaaaaa" strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "12px", color: "#888888", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>League Avg</span>
            </span>
          </div>
        </div>
        <EUTrendChart
          years={allYears}
          leagueYears={leagueAvgYears}
          metricKey={chartMetrics[activeMetric]?.key as keyof EUYearSnap ?? "revenue"}
          isRatio={chartMetrics[activeMetric]?.isRatio}
          currency={currency}
        />
      </div>}
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export default function EUFinancialsSection({
  club,
  leagueClubs,
  leagueLabel,
}: {
  club: EUClub;
  leagueClubs: EUClub[];
  leagueLabel: string;
}) {
  const fin    = club.financials;
  const curr   = (club.currency === "USD" ? "USD" : club.currency === "SEK" ? "SEK" : "EUR") as "EUR" | "USD" | "SEK";
  const sym    = currSym(curr);
  const metrics = getMetrics(club.country);
  const py     = club.prior_year ?? null;

  const [fullView, setFullView] = useState<"table" | "chart">("table");

  // ── All chronological years for sparklines + trend dots ──────────────────
  const allYears = buildEUYearSnaps(club).sort((a, b) => a.season.localeCompare(b.season));
  const dotYears = allYears.slice(-4);

  // ── KFI values ───────────────────────────────────────────────────────────
  const profitVal   = fin.operating_profit ?? fin.net_profit;
  const priorProfit = py?.operating_profit ?? py?.net_profit ?? null;
  const isOpProfit  = fin.operating_profit != null;

  const debtVal   = fin.net_debt ?? null;
  const priorDebt = py?.net_debt ?? null;
  const hasNetDebt = debtVal !== null || priorDebt !== null;
  // Fall back to total_liabilities for clubs without net_debt
  const liabVal   = fin.total_liabilities ?? null;
  const priorLiab = py?.total_liabilities ?? null;

  // ── Signal dots ──────────────────────────────────────────────────────────
  const wageDots   = dotYears.map(y => wageSignal(y.wage_to_revenue_pct ?? null));
  const profitDots = dotYears.map(y => profitSignal((y.operating_profit ?? y.net_profit) ?? null));
  const debtDots   = dotYears.map(y => debtDotSignal((y.net_debt ?? null)));

  // ── Sparkline series ─────────────────────────────────────────────────────
  const revenueVals = allYears.map(y => y.revenue);
  const wageVals    = allYears.map(y => y.wage_bill);
  const profitVals  = allYears.map(y => (y.operating_profit ?? y.net_profit) ?? null);
  const debtVals    = allYears.map(y => hasNetDebt ? (y.net_debt ?? null) : (y.total_liabilities ?? null));

  // ── Tile 3: profit metric ─────────────────────────────────────────────────
  const profit3Val   = profitVal;
  const priorProfit3 = priorProfit;

  // ── Tile 4: debt or liabilities ───────────────────────────────────────────
  const debt4Val     = hasNetDebt ? debtVal   : liabVal;
  const priorDebt4   = hasNetDebt ? priorDebt : priorLiab;
  const debt4Label   = hasNetDebt ? "Net Debt" : "Total Liabilities";
  const debt4HB: boolean | null = false; // lower is better for both

  // ── Year range for accordion subtitle ────────────────────────────────────
  const firstSeason = allYears[0]?.season ?? "";
  const lastSeason  = allYears[allYears.length - 1]?.season ?? fin.most_recent_year ?? "";
  const hasYoY = allYears.length >= 2;

  return (
    <div>
      {/* ── TIER 1: Key Financial Indicators ─────────────────────────────────── */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeading>Key Financial Indicators</SectionHeading>
        {fin.data_notes && (
          <p className="text-sm text-[#999999] mb-4">
            <span className="inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-xs text-[#999999]">
              {fin.data_notes}
            </span>
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HealthCard
            label="Wage Efficiency"
            value={fin.wage_to_revenue_pct !== null ? `${fin.wage_to_revenue_pct.toFixed(1)}%` : "—"}
            subtext={wageSubtext(fin.wage_to_revenue_pct, py?.wage_to_revenue_pct ?? null)}
            signal={wageSignal(fin.wage_to_revenue_pct)}
            dots={wageDots}
          />
          <HealthCard
            label="Profitability"
            value={fmtCurrency(profit3Val, curr)}
            subtext={profitSubtext(profit3Val, priorProfit3, isOpProfit)}
            signal={profitSignal(profit3Val)}
            dots={profitDots}
          />
          <HealthCard
            label="Debt Position"
            value={fmtCurrency(debt4Val, curr)}
            subtext={hasNetDebt
              ? debtSubtext(debtVal, priorDebt, sym)
              : liabSubtext(liabVal, priorLiab, sym)}
            signal={hasNetDebt
              ? debtCardSignal(debtVal, priorDebt)
              : liabCardSignal(liabVal, priorLiab)}
            dots={debtDots}
          />
        </div>
      </div>

      {/* ── TIER 2: Latest Accounts ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeading>Latest Accounts · {lastSeason || fin.most_recent_year}</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            label="Revenue"
            value={fmtCurrency(fin.revenue, curr)}
            current={fin.revenue}
            prior={py?.revenue ?? null}
            higherBetter={true}
            sparkValues={revenueVals}
          />
          <MetricTile
            label="Wage Bill"
            value={fmtCurrency(fin.wage_bill, curr)}
            current={fin.wage_bill}
            prior={py?.wage_bill ?? null}
            higherBetter={false}
            sparkValues={wageVals}
          />
          <MetricTile
            label={isOpProfit ? "Operating Profit" : "Net Profit"}
            value={fmtCurrency(profit3Val, curr)}
            current={profit3Val}
            prior={priorProfit3}
            higherBetter={true}
            sparkValues={profitVals}
          />
          <MetricTile
            label={debt4Label}
            value={fmtCurrency(debt4Val, curr)}
            current={debt4Val}
            prior={priorDebt4}
            higherBetter={debt4HB}
            sparkValues={debtVals}
          />
        </div>
      </div>

      {/* ── TIER 3: Full Accounts ─────────────────────────────────────────────── */}
      {hasYoY && (
        <div>
          <SectionHeading>Full Accounts · {firstSeason} – {lastSeason}</SectionHeading>
          <CountryDisclaimer country={club.country} />
          <div className="flex overflow-x-auto" style={{ borderBottom: "1px solid #eeeeee", marginBottom: "20px" }}>
            {(["table", "chart"] as const).map(v => (
              <button
                key={v}
                onClick={() => setFullView(v)}
                style={{
                  padding: "12px 24px", fontSize: "13px", fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase", border: "none",
                  borderBottom: fullView === v ? "2px solid #111111" : "2px solid transparent",
                  marginBottom: "-1px", background: "none",
                  color: fullView === v ? "#111111" : "#aaaaaa",
                  cursor: "pointer", whiteSpace: "nowrap", minHeight: "44px", flexShrink: 0,
                }}
              >
                {v === "table" ? "Table" : "Chart"}
              </button>
            ))}
          </div>
          <EUYoYSection
            club={club}
            leagueClubs={leagueClubs}
            metrics={metrics}
            currency={curr}
            view={fullView}
          />
        </div>
      )}

      {/* ── League label (for context) ───────────────────────────────────────── */}
      {leagueLabel && <p style={{ display: "none" }}>{leagueLabel}</p>}
    </div>
  );
}
