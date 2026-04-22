"use client";

import { useState, Fragment } from "react";
import { EUClub } from "@/lib/euClubs";
import EUMarketContextPanel from "@/components/EUMarketContextPanel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(v: number | null, currency: "EUR" | "USD" | "SEK", isRatio = false): string {
  if (v === null) return "—";
  if (isRatio) return `${v.toFixed(1)}%`;
  const abs = Math.abs(v);
  if (currency === "SEK") return `${v < 0 ? "-" : ""}SEK ${abs.toFixed(1)}m`;
  const sym = currency === "USD" ? "$" : "€";
  return `${v < 0 ? "-" : ""}${sym}${abs.toFixed(1)}m`;
}

// ─── League stats ─────────────────────────────────────────────────────────────

type FinKey = keyof EUClub["financials"];

function leagueStats(clubs: EUClub[], key: FinKey) {
  const vals = clubs
    .map((c) => c.financials[key])
    .filter((v): v is number => typeof v === "number" && !isNaN(v));
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);
  const sorted = [...vals].sort((a, b) => b - a);
  return { avg, maxAbs, sorted, count: vals.length };
}

function vsAvgColor(value: number, avg: number, higherBetter: boolean | null): string {
  if (higherBetter === null) return "#aaaaaa";
  return (higherBetter ? value > avg : value < avg) ? "#4a9a6a" : "#9a4a4a";
}

// ─── Bar primitives ───────────────────────────────────────────────────────────

function StandardBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-7 bg-[#eeeeee] overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function DivergingBar({ value, scale, color }: { value: number; scale: number; color: string }) {
  const pct = Math.min((Math.abs(value) / scale) * 100, 100);
  const isPositive = value >= 0;
  return (
    <div className="flex-1 flex h-7">
      <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
        {!isPositive && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
      <div className="w-px bg-[#e0e0e0] shrink-0" />
      <div className="flex-1 overflow-hidden bg-[#eeeeee]">
        {isPositive && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
    </div>
  );
}

// ─── Metrics config ───────────────────────────────────────────────────────────

type MetricConfig = {
  key: FinKey;
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
  { key: "revenue",             label: "Revenue (USD)",                  higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (USD)",                higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                     isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "Operating Profit / (Loss)",      diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",        diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",              diverging: true, higherBetter: false },
];

const SW_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue (USD)",                  higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (USD)",                higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                     isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "Operating Profit / (Loss)",      diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",        diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",              diverging: true, higherBetter: false },
];

const IT_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue (€)",                    higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (€)",                  higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                     isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "EBIT / Operating Profit",        diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",        diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",              diverging: true, higherBetter: false },
];

const ES_METRICS: MetricConfig[] = [
  { key: "revenue",             label: "Revenue (€)",                    higherBetter: true },
  { key: "wage_bill",           label: "Wage Bill (€)",                  higherBetter: false },
  { key: "wage_to_revenue_pct", label: "Wage Ratio",                     isRatio: true, higherBetter: false },
  { key: "operating_profit",    label: "EBIT / Operating Profit",        diverging: true, higherBetter: true },
  { key: "pre_tax_profit",      label: "Pre-tax Profit / (Loss)",        diverging: true, higherBetter: true },
  { key: "net_debt",            label: "Net Debt / (Cash)",              diverging: true, higherBetter: false },
];

function getMetrics(country: string): MetricConfig[] {
  if (country === "Norway" || country === "Denmark") return DK_METRICS;
  if (country === "Sweden") return SW_METRICS;
  if (country === "France") return FR_METRICS;
  if (country === "Italy") return IT_METRICS;
  if (country === "Spain") return ES_METRICS;
  return EU_METRICS;
}

// ─── Country disclaimers ───────────────────────────────────────────────────────

function CountryDisclaimer({ country }: { country: string }) {
  if (country === "Denmark") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-[10px] text-[#888888] leading-relaxed">
        Figures converted from Danish Krone (DKK) to US Dollars (USD) using published annual FX rates.
        Original DKK values are available in the data notes below.
      </div>
    );
  }
  if (country === "Norway") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-[10px] text-[#888888] leading-relaxed">
        Figures converted from Norwegian Krone (NOK) to US Dollars (USD) using published annual FX rates.
        Original NOK values are available in the data notes below.
        Norwegian clubs are non-profit idrettslag (sports associations) — no corporate tax applies.
      </div>
    );
  }
  if (country === "Sweden") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-[10px] text-[#888888] leading-relaxed">
        Figures converted from Swedish Kronor (SEK) to US Dollars (USD) using published annual average FX rates
        (2025: 10.47, 2024: 10.53, 2023: 10.50 SEK/USD). Original SEK values are available in the data notes below.
        Swedish clubs are non-profit ideella föreningar (membership associations) — no corporate tax applies.
      </div>
    );
  }
  if (country === "Italy") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-[10px] text-[#888888] leading-relaxed">
        Figures in EUR millions. FY typically ends 30 June (football year); clubs using a December fiscal year are noted.
        Revenue (Valore della Produzione) includes gains on player sales. EBIT shown as Differenza A−B.
        Source: bilancio d'esercizio / bilancio consolidato. Half-year accounts (Juventus, Lazio) cover 6 months only — not comparable to full-year figures.
      </div>
    );
  }
  if (country === "Spain") {
    return (
      <div className="mb-4 px-4 py-3 border border-[#e8e8e8] bg-[#fafafa] text-[10px] text-[#888888] leading-relaxed">
        Figures in EUR millions. FY runs 1 July → 30 June. Revenue = Importe neto de la cifra de negocios (includes player sale gains).
        EBIT = Resultado de explotación. Net debt excludes Deudas con entidades deportivas (transfer payables to other clubs).
        Entity types: SAD (Sociedad Anónima Deportiva, for-profit); Asociación (non-profit member club — Real Madrid, Barcelona, Athletic Club).
        Source: cuentas anuales filed at Registro Mercantil. Some clubs file foundation accounts not comparable with SAD commercial accounts.
      </div>
    );
  }
  return null;
}

// ─── Current year financial tab (with league comparison) ───────────────────────

function FinancialTab({
  club,
  leagueClubs,
  leagueLabel,
  metrics,
}: {
  club: EUClub;
  leagueClubs: EUClub[];
  leagueLabel: string;
  metrics: MetricConfig[];
}) {
  const fin = club.financials;
  const curr = (club.currency === "USD" ? "USD" : club.currency === "SEK" ? "SEK" : "EUR") as "EUR" | "USD" | "SEK";
  const hasAny = metrics.some((m) => fin[m.key] !== null && fin[m.key] !== undefined);
  if (!hasAny) {
    return (
      <p className="text-sm text-[#aaaaaa] italic">No financial data available for this club.</p>
    );
  }

  return (
    <div>
      <CountryDisclaimer country={club.country} />
      <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-white border-b border-r border-[#e0e0e0]">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">Financial Figures</p>
        </div>
        <div className="px-4 sm:px-6 py-4 bg-white border-b border-[#e0e0e0]">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">vs {leagueLabel} Average</p>
        </div>

        {metrics.map((m) => {
          const val = fin[m.key] as number | null;
          const stats = leagueStats(leagueClubs, m.key);
          const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;
          const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01) : Math.abs(val ?? 0) || 1;
          const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
          const avgPct  = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;
          const barColor = val !== null && stats ? vsAvgColor(val, stats.avg, m.higherBetter) : "#cccccc";

          return (
            <Fragment key={m.key}>
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-r border-[#e0e0e0] bg-white">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-1.5">{m.label}</p>
                {val !== null ? (
                  <p className="text-xl sm:text-2xl font-light tabular-nums text-[#111111]">
                    {fmtCurrency(val, curr, m.isRatio)}
                  </p>
                ) : (
                  <p className="text-xl sm:text-2xl font-light text-[#cccccc]">—</p>
                )}
                {stats && rank !== null && rank > 0 && (
                  <p className="text-[10px] text-[#aaaaaa] mt-1.5">#{rank} <span className="text-[#cccccc]">of {stats.count}</span></p>
                )}
              </div>
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e0e0e0] bg-white">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">{m.label}</p>
                <div className="mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    {m.diverging ? (
                      <DivergingBar value={val ?? 0} scale={scale / 2} color={val !== null ? barColor : "#cccccc"} />
                    ) : (
                      <StandardBar pct={clubPct} color={val !== null ? barColor : "#eeeeee"} />
                    )}
                    <span className="text-xs font-medium tabular-nums text-[#111111] w-14 text-right shrink-0">
                      {fmtCurrency(val, curr, m.isRatio)}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#aaaaaa] tracking-[0.05em]">This club</p>
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    {m.diverging && stats ? (
                      <DivergingBar value={stats.avg} scale={scale / 2} color="#cccccc" />
                    ) : (
                      <StandardBar pct={avgPct} color="#cccccc" />
                    )}
                    <span className="text-xs tabular-nums text-[#aaaaaa] w-14 text-right shrink-0">
                      {stats ? fmtCurrency(stats.avg, curr, m.isRatio) : "—"}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#cccccc] tracking-[0.05em]">League avg</p>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
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
  const snaps: EUYearSnap[] = club.historical.map((h) => {
    const py = club.prior_year?.season === h.season ? club.prior_year : null;
    const isCurrent = h.season === currentSeason;
    const fin = isCurrent ? club.financials : null;
    return {
      season: h.season,
      revenue: h.revenue,
      wage_bill: h.wage_bill,
      wage_to_revenue_pct:
        h.revenue && h.wage_bill ? Math.round((h.wage_bill / h.revenue) * 1000) / 10 : null,
      net_profit: h.net_profit,
      equity: h.equity ?? (fin?.equity ?? null),
      total_liabilities: h.total_liabilities ?? (fin?.total_liabilities ?? null),
      operating_profit: fin?.operating_profit ?? py?.operating_profit ?? null,
      profit_from_player_sales: fin?.profit_from_player_sales ?? py?.profit_from_player_sales ?? null,
      pre_tax_profit: fin?.pre_tax_profit ?? py?.pre_tax_profit ?? null,
      net_debt: fin?.net_debt ?? py?.net_debt ?? null,
    };
  });
  // Inject prior_year when not already present in historical
  const py = club.prior_year;
  if (py && !snaps.find((s) => s.season === py.season) && py.season !== currentSeason) {
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
  // Ensure current year is present (use financials as authoritative source)
  if (currentSeason && !snaps.find((s) => s.season === currentSeason)) {
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

// ─── Historical year tab (simple list — no league comparison available) ───────

function HistoricalYearTab({
  snap,
  currency,
  metrics,
}: {
  snap: EUYearSnap;
  currency: "EUR" | "USD" | "SEK";
  metrics: MetricConfig[];
}) {
  type SnapKey = keyof EUYearSnap;
  const hasAny = metrics.some((m) => {
    const v = snap[m.key as SnapKey];
    return v !== null && v !== undefined;
  });
  if (!hasAny) {
    return <p className="text-sm text-[#aaaaaa] italic">No financial data available for this year.</p>;
  }
  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">Financial Figures</p>
      </div>
      {metrics.map((m) => {
        const val = (snap[m.key as SnapKey] ?? null) as number | null;
        return (
          <div key={m.key} className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e0e0e0] bg-white flex items-center justify-between">
            <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999]">{m.label}</p>
            {val !== null ? (
              <p className="text-lg sm:text-xl font-light tabular-nums text-[#111111]">
                {fmtCurrency(val, currency, m.isRatio)}
              </p>
            ) : (
              <p className="text-lg sm:text-xl font-light text-[#cccccc]">—</p>
            )}
          </div>
        );
      })}
    </div>
  );
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

function EUTrendChart({
  years,
  metricKey,
  isRatio,
  currency,
}: {
  years: EUYearSnap[];
  metricKey: keyof EUYearSnap;
  isRatio?: boolean;
  currency: "EUR" | "USD" | "SEK";
}) {
  const n = years.length;
  const allVals: number[] = years
    .map((y) => y[metricKey] as number | null)
    .filter((v): v is number => v !== null && isFinite(v));

  if (allVals.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${VH}px` }}>
        <p style={{ fontSize: "12px", color: "#cccccc", fontStyle: "italic" }}>No data available</p>
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

  // Build polyline segments (skip nulls)
  const segments: string[][] = [];
  let seg: string[] = [];
  years.forEach((yr, i) => {
    const v = yr[metricKey] as number | null;
    if (v !== null && v !== undefined && isFinite(v)) {
      seg.push(`${xPos(i).toFixed(2)},${yPos(v).toFixed(2)}`);
    } else {
      if (seg.length) { segments.push(seg); seg = []; }
    }
  });
  if (seg.length) segments.push(seg);

  const fillBase = zeroY ?? yPos(yMin);
  const areaPaths = segments
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
            <text x={ML - 7} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8.5} fill="#cccccc" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtChartTick(tick, isRatio, currency)}
            </text>
          </g>
        );
      })}
      {zeroY !== null && (
        <line x1={ML} y1={zeroY} x2={ML + PW} y2={zeroY} stroke="#d8d8d8" strokeWidth={0.75} strokeDasharray="3 3" />
      )}
      {areaPaths.map((d, i) => <path key={i} d={d} fill="rgba(17,17,17,0.04)" />)}
      {segments.map((s, i) => (
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
            <text x={lx} y={ly} textAnchor={anchor} fontSize={9} fontWeight={400} fill="#555555" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmtChartLabel(v, isRatio)}
            </text>
          </g>
        );
      })}
      {years.map((yr, i) => (
        <text key={i} x={xPos(i)} y={MT + PH + 16} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={9} fill="#bbbbbb">
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
    return <span style={{ color: "#cccccc", fontSize: "11px" }}>—</span>;
  const improved =
    higherBetter === null || current === prior
      ? null
      : higherBetter ? current > prior : current < prior;
  let label: string;
  if (isRatio) {
    const diff = current - prior;
    label = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp`;
  } else {
    if (prior === 0) return <span style={{ color: "#cccccc", fontSize: "11px" }}>—</span>;
    const pct = ((current - prior) / Math.abs(prior)) * 100;
    label = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  }
  const color = improved === true ? "#2e7d52" : improved === false ? "#9a3030" : "#888888";
  const bg    = improved === true ? "#edf7f1" : improved === false ? "#fdf1f1" : "#f5f5f5";
  return (
    <span style={{ color, background: bg, fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", display: "inline-block" }}>
      {label}
    </span>
  );
}

// ─── Year-on-year section (table + chart) ─────────────────────────────────────

function EUYoYSection({
  club,
  metrics,
  currency,
}: {
  club: EUClub;
  metrics: MetricConfig[];
  currency: "EUR" | "USD" | "SEK";
}) {
  const allYears = buildEUYearSnaps(club);
  if (allYears.length < 2) return null;

  // Only show metrics that have at least one data point in history
  type SnapKey = keyof EUYearSnap;
  const chartMetrics = metrics.filter((m) =>
    allYears.some((y) => {
      const v = y[m.key as SnapKey];
      return v !== null && v !== undefined && isFinite(v as number);
    })
  );

  const [activeMetric, setActiveMetric] = useState(0);

  const cols = allYears.map((y, i) => ({ label: y.season, snap: y, isCurrent: i === allYears.length - 1 }));

  return (
    <div>
      {/* ── Table ── */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${320 + cols.length * 110}px` }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
              <th style={{ textAlign: "left", padding: "12px 20px 10px", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999999", whiteSpace: "nowrap", width: "200px" }}>
                Metric
              </th>
              {cols.map((col, ci) => (
                <th key={ci} style={{ textAlign: "right", padding: "12px 16px 10px", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: col.isCurrent ? "#111111" : "#aaaaaa", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "90px" }}>
                  {col.label}
                </th>
              ))}
              <th style={{ textAlign: "right", padding: "12px 16px 10px", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaaaaa", whiteSpace: "nowrap", borderLeft: "1px solid #eeeeee", minWidth: "80px" }}>
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
                  <td style={{ padding: "13px 20px", fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: activeMetric === mi ? "#111111" : "#666666", whiteSpace: "nowrap", borderLeft: activeMetric === mi ? "2px solid #111111" : "2px solid transparent" }}>
                    {m.label}
                  </td>
                  {values.map((v, ci) => (
                    <td key={ci} style={{ textAlign: "right", padding: "13px 16px", fontSize: cols[ci].isCurrent ? "14px" : "13px", fontWeight: cols[ci].isCurrent ? 400 : 300, color: cols[ci].isCurrent ? "#111111" : "#888888", borderLeft: "1px solid #eeeeee", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {fmtCurrency(v, currency, m.isRatio)}
                    </td>
                  ))}
                  <td style={{ textAlign: "right", padding: "13px 16px", borderLeft: "1px solid #eeeeee", whiteSpace: "nowrap" }}>
                    <ChgBadge current={latest} prior={penultimate} higherBetter={m.higherBetter} isRatio={m.isRatio} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Chart ── */}
      <div style={{ marginTop: "28px", borderTop: "1px solid #eeeeee", paddingTop: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
          {chartMetrics.map((m, i) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(i)}
              style={{
                padding: "5px 12px", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em",
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999999", margin: 0 }}>
            {chartMetrics[activeMetric]?.label}
          </p>
        </div>
        <EUTrendChart
          years={allYears}
          metricKey={chartMetrics[activeMetric]?.key as keyof EUYearSnap ?? "revenue"}
          isRatio={chartMetrics[activeMetric]?.isRatio}
          currency={currency}
        />
      </div>
    </div>
  );
}


// ─── Club info tab ────────────────────────────────────────────────────────────

function ClubInfoTab({ club }: { club: EUClub }) {
  const hasStadium = !!club.stadium?.name;
  const hasOwnership = !!(club.ownership?.summary || club.ownership?.category);

  if (!hasStadium && !hasOwnership) {
    return <p className="text-sm text-[#aaaaaa] italic">No club information available.</p>;
  }

  return (
    <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">
      {hasStadium && club.stadium && (
        <div
          className={`px-4 sm:px-6 py-4 sm:py-5 bg-white ${
            hasOwnership ? "border-b lg:border-b-0 border-r border-[#e0e0e0]" : "lg:col-span-2"
          }`}
        >
          <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">Stadium</p>
          <p className="text-sm font-medium text-[#111111] mb-1">{club.stadium.name}</p>
          {club.stadium.capacity && (
            <p className="text-xs text-[#666666] mb-1.5">{club.stadium.capacity.toLocaleString()} capacity</p>
          )}
          {club.stadium.ownership && (
            <p className="text-[10px] text-[#aaaaaa] leading-relaxed">{club.stadium.ownership}</p>
          )}
        </div>
      )}
      {hasOwnership && club.ownership && (
        <div className={`px-4 sm:px-6 py-4 sm:py-5 bg-white ${!hasStadium ? "lg:col-span-2" : ""}`}>
          <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">Ownership</p>
          {club.ownership.category && (
            <p className="text-xs text-[#666666] mb-1">{club.ownership.category}</p>
          )}
          {club.ownership.fifty_plus_one && (
            <p className="text-[10px] text-[#aaaaaa] mb-1.5">50+1: {club.ownership.fifty_plus_one}</p>
          )}
          {club.ownership.summary && (
            <p className="text-[10px] text-[#aaaaaa] leading-relaxed">{club.ownership.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Financials section (outer tab content) ────────────────────────────────────

function FinancialsSection({
  club,
  leagueClubs,
  leagueLabel,
}: {
  club: EUClub;
  leagueClubs: EUClub[];
  leagueLabel: string;
}) {
  const metrics  = getMetrics(club.country);
  const curr     = (club.currency === "USD" ? "USD" : club.currency === "SEK" ? "SEK" : "EUR") as "EUR" | "USD" | "SEK";
  const allYears = buildEUYearSnaps(club);

  // Historical year tabs: up to 3 most recent non-current seasons
  const currentSeason  = club.financials.most_recent_year;
  const historicalTabs = allYears
    .filter((y) => y.season !== currentSeason)
    .slice(-3); // at most 3 historical year tabs

  const hasHistory = historicalTabs.length > 0;
  const hasYoY     = allYears.length >= 2;

  const defaultTab = hasYoY ? "yoy" : "current";
  const [innerTab, setInnerTab] = useState<string>(defaultTab);

  const innerTabs: { key: string; label: string }[] = [
    ...historicalTabs.map((y) => ({ key: y.season, label: y.season })),
    { key: "current", label: currentSeason ?? "Current" },
    ...(hasYoY ? [{ key: "yoy", label: "Year on Year" }] : []),
  ];

  const activeHistSnap = historicalTabs.find((y) => y.season === innerTab) ?? null;

  return (
    <div>
      {/* Inner tab bar */}
      {(hasHistory || hasYoY) && (
        <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
          {innerTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setInnerTab(key)}
              className={`px-4 sm:px-5 py-2.5 text-xs font-medium tracking-[0.08em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                innerTab === key
                  ? "border-[#111111] text-[#111111]"
                  : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Historical year tab */}
      {activeHistSnap !== null && innerTab !== "current" && innerTab !== "yoy" && (
        <>
          <CountryDisclaimer country={club.country} />
          <HistoricalYearTab snap={activeHistSnap} currency={curr} metrics={metrics} />
        </>
      )}

      {/* Current year tab */}
      {innerTab === "current" && (
        <FinancialTab club={club} leagueClubs={leagueClubs} leagueLabel={leagueLabel} metrics={metrics} />
      )}

      {/* Year on Year tab */}
      {innerTab === "yoy" && hasYoY && (
        <EUYoYSection club={club} metrics={metrics} currency={curr} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const OUTER_TABS = [
  { key: "financials", label: "Financials" },
  { key: "market",     label: "Market Context" },
  { key: "info",       label: "Club Info" },
] as const;
type OuterTabKey = (typeof OUTER_TABS)[number]["key"];

export default function EuropeanClubProfile({
  club,
  leagueClubs,
  leagueLabel,
}: {
  club: EUClub;
  leagueClubs: EUClub[];
  leagueLabel: string;
}) {
  const [tab, setTab] = useState<OuterTabKey>("financials");
  const fin = club.financials;

  return (
    <div>
      {/* Metadata line */}
      {(fin.most_recent_year || fin.data_notes) && (
        <p className="text-sm text-[#999999] mb-6">
          {fin.most_recent_year && (
            <>Financial year: <span className="text-[#666666]">{fin.most_recent_year}</span></>
          )}
          {fin.data_notes && (
            <span className="ml-3 inline-flex items-center px-2 py-0.5 border border-[#e0e0e0] text-[10px] text-[#999999]">
              {fin.data_notes}
            </span>
          )}
        </p>
      )}

      {/* Outer tab bar */}
      <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
        {OUTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 sm:px-5 py-2.5 text-xs font-medium tracking-[0.08em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
              tab === key
                ? "border-[#111111] text-[#111111]"
                : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "financials" && (
        <FinancialsSection club={club} leagueClubs={leagueClubs} leagueLabel={leagueLabel} />
      )}
      {tab === "market" && (
        <EUMarketContextPanel club={club} leagueClubs={leagueClubs} leagueLabel={leagueLabel} />
      )}
      {tab === "info" && <ClubInfoTab club={club} />}
    </div>
  );
}
