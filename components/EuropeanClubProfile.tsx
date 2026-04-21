"use client";

import { useState, Fragment } from "react";
import { EUClub, EUPriorYear } from "@/lib/euClubs";
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

function calcPct(curr: number | null, prior: number | null): number | null {
  if (curr === null || prior === null || prior === 0) return null;
  return ((curr - prior) / Math.abs(prior)) * 100;
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

// ─── Prior year tab (no league bars — comparative data not available for all clubs) ──

function PriorYearTab({
  priorYear,
  currency,
  metrics,
}: {
  priorYear: EUPriorYear;
  currency: "EUR" | "USD" | "SEK";
  metrics: MetricConfig[];
}) {
  type PriorKey = keyof EUPriorYear;
  const hasAny = metrics.some((m) => {
    const v = priorYear[m.key as PriorKey];
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
        const val = (priorYear[m.key as PriorKey] ?? null) as number | null;
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

// ─── Year-on-year comparison tab ───────────────────────────────────────────────

function YoYTab({
  club,
  metrics,
}: {
  club: EUClub;
  metrics: MetricConfig[];
}) {
  const prior = club.prior_year!;
  const curr = (club.currency === "USD" ? "USD" : club.currency === "SEK" ? "SEK" : "EUR") as "EUR" | "USD" | "SEK";
  type PriorKey = keyof EUPriorYear;

  const rows = metrics.filter((m) => {
    const pVal = prior[m.key as PriorKey];
    const cVal = club.financials[m.key];
    return (pVal !== null && pVal !== undefined) || (cVal !== null && cVal !== undefined);
  });

  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 px-4 sm:px-6 py-3 bg-white border-b border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] col-span-1">Metric</p>
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] text-right">{prior.season}</p>
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] text-right">{club.financials.most_recent_year ?? "Current"}</p>
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] text-right">Change</p>
      </div>

      {rows.map((m) => {
        const priorVal = (prior[m.key as PriorKey] ?? null) as number | null;
        const currVal = (club.financials[m.key] ?? null) as number | null;
        const pct = calcPct(currVal, priorVal);
        const isPositiveGood = m.higherBetter === true;
        const isNegativeGood = m.higherBetter === false;
        const pctColor =
          pct === null
            ? "text-[#cccccc]"
            : pct > 0
            ? isPositiveGood ? "text-[#4a9a6a]" : isNegativeGood ? "text-[#9a4a4a]" : "text-[#aaaaaa]"
            : isNegativeGood ? "text-[#4a9a6a]" : isPositiveGood ? "text-[#9a4a4a]" : "text-[#aaaaaa]";

        return (
          <div key={m.key} className="grid grid-cols-4 px-4 sm:px-6 py-4 border-b border-[#f0f0f0] bg-white items-center">
            <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#777777] col-span-1 pr-2">{m.label}</p>
            <p className="text-sm tabular-nums text-[#aaaaaa] text-right">
              {fmtCurrency(priorVal, curr, m.isRatio)}
            </p>
            <p className="text-sm tabular-nums font-medium text-[#111111] text-right">
              {fmtCurrency(currVal, curr, m.isRatio)}
            </p>
            <p className={`text-sm tabular-nums font-medium text-right ${pctColor}`}>
              {pct === null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Historical section (revenue sparkline) ───────────────────────────────────

function HistoricalSection({ club }: { club: EUClub }) {
  const hist = [...club.historical]
    .reverse()
    .filter((h) => h.revenue !== null || h.net_profit !== null);

  if (!hist.length) return null;

  const curr = (club.currency === "USD" ? "USD" : club.currency === "SEK" ? "SEK" : "EUR") as "EUR" | "USD" | "SEK";
  const maxRev = Math.max(...hist.map((h) => h.revenue ?? 0), 0.01);
  const showProfit = hist.some((h) => h.net_profit !== null);

  return (
    <div className="mt-6">
      <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-3">Revenue History</p>
      <div className="border border-[#e0e0e0] overflow-hidden">
        <div className="bg-white divide-y divide-[#f0f0f0]">
          {hist.map((h) => {
            const revPct = h.revenue !== null ? (h.revenue / maxRev) * 100 : 0;
            return (
              <div key={h.season} className="px-4 sm:px-6 py-3.5 flex items-center gap-4">
                <span className="text-[10px] text-[#aaaaaa] w-16 shrink-0 tabular-nums">{h.season}</span>
                <div className="flex-1 h-6 bg-[#eeeeee] overflow-hidden">
                  <div className="h-full bg-[#8888cc]" style={{ width: `${revPct}%` }} />
                </div>
                <span className="text-xs tabular-nums text-[#111111] w-16 text-right shrink-0">
                  {h.revenue !== null ? fmtCurrency(h.revenue, curr) : "—"}
                </span>
                {showProfit && (
                  <span
                    className={`text-xs tabular-nums w-16 text-right shrink-0 ${
                      h.net_profit === null ? "text-[#cccccc]" : h.net_profit >= 0 ? "text-[#4a9a6a]" : "text-[#9a4a4a]"
                    }`}
                  >
                    {h.net_profit !== null ? fmtCurrency(h.net_profit, curr) : "—"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {showProfit && (
          <div className="px-4 sm:px-6 py-3 bg-white border-t border-[#f0f0f0] flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[9px] text-[#aaaaaa]">
              <span className="w-2 h-2 rounded-full bg-[#8888cc] inline-block" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-[#4a9a6a]">
              <span className="w-2 h-2 rounded-full bg-[#4a9a6a] inline-block" /> Profit
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-[#9a4a4a]">
              <span className="w-2 h-2 rounded-full bg-[#9a4a4a] inline-block" /> Loss
            </span>
          </div>
        )}
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

type InnerTab = "prior" | "current" | "yoy";

function FinancialsSection({
  club,
  leagueClubs,
  leagueLabel,
}: {
  club: EUClub;
  leagueClubs: EUClub[];
  leagueLabel: string;
}) {
  const hasPrior = !!club.prior_year;
  const metrics = getMetrics(club.country);
  const [innerTab, setInnerTab] = useState<InnerTab>(hasPrior ? "yoy" : "current");

  const innerTabs: { key: InnerTab; label: string }[] = [
    ...(hasPrior ? [{ key: "prior" as InnerTab, label: club.prior_year!.season }] : []),
    { key: "current", label: club.financials.most_recent_year ?? "Current" },
    ...(hasPrior ? [{ key: "yoy" as InnerTab, label: "Year on Year" }] : []),
  ];

  const curr = (club.currency === "USD" ? "USD" : club.currency === "SEK" ? "SEK" : "EUR") as "EUR" | "USD" | "SEK";

  return (
    <div>
      {/* Inner tab bar */}
      {hasPrior && (
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

      {innerTab === "current" && (
        <FinancialTab club={club} leagueClubs={leagueClubs} leagueLabel={leagueLabel} metrics={metrics} />
      )}

      {innerTab === "prior" && hasPrior && (
        <>
          <CountryDisclaimer country={club.country} />
          <PriorYearTab priorYear={club.prior_year!} currency={curr} metrics={metrics} />
        </>
      )}

      {innerTab === "yoy" && hasPrior && (
        <YoYTab club={club} metrics={metrics} />
      )}

      <HistoricalSection club={club} />
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
