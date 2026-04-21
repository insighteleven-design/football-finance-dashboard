"use client";

import { useState, Fragment } from "react";
import type { JapanClub } from "@/lib/japanClubs";
import { fmtJpy, J_DIVISION_LABELS } from "@/lib/japanClubs";
import type { JapanClubDeepDive } from "@/lib/japanDeepDive";
import JapanRevenueBreakdownSection from "./JapanRevenueBreakdownSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type Snap = {
  revenue: number | null;
  wage_bill: number | null;
  wage_ratio: number | null;
  operating_profit: number | null;
  profit_from_player_sales: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function divStats(snaps: Snap[], key: keyof Snap) {
  const vals = snaps.map((s) => s[key]).filter((v): v is number => v !== null);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxAbs = Math.max(...vals.map(Math.abs), 0.01);
  const sorted = [...vals].sort((a, b) => b - a);
  return { avg, maxAbs, sorted, count: vals.length };
}

function vsColor(value: number, avg: number, higherBetter: boolean | null): string {
  if (higherBetter === null) return "#aaaaaa";
  return (higherBetter ? value > avg : value < avg) ? "#4a9a6a" : "#9a4a4a";
}

function calcPct(curr: number | null, prior: number | null): number | null {
  if (curr === null || prior === null || prior === 0) return null;
  return ((curr - prior) / Math.abs(prior)) * 100;
}

// ─── Bar primitives ───────────────────────────────────────────────────────────

function StdBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-7 bg-[#eeeeee] overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function DivBar({ value, scale, color }: { value: number; scale: number; color: string }) {
  const pct = Math.min((Math.abs(value) / scale) * 100, 100);
  const pos = value >= 0;
  return (
    <div className="flex-1 flex h-7">
      <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
        {!pos && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
      <div className="w-px bg-[#e0e0e0] shrink-0" />
      <div className="flex-1 overflow-hidden bg-[#eeeeee]">
        {pos && <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />}
      </div>
    </div>
  );
}

// ─── Breakdown badge ──────────────────────────────────────────────────────────

function BreakdownBadge({ open }: { open: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] uppercase border transition-colors shrink-0 ${open ? "border-[#4A90D9] bg-[#EBF3FC] text-[#4A90D9]" : "border-[#e0e0e0] text-[#aaaaaa]"}`}>
      Breakdown
      <span className="inline-block transition-transform duration-200" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>→</span>
    </span>
  );
}

// ─── Metrics config ───────────────────────────────────────────────────────────

const METRICS: {
  key: keyof Snap;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter: boolean | null;
  expandable?: "revenue" | "transfer";
}[] = [
  { key: "revenue",                  label: "Revenue",                    higherBetter: true,  expandable: "revenue" },
  { key: "wage_bill",                label: "Wage Bill",                  higherBetter: false },
  { key: "wage_ratio",               label: "Wage Ratio",                 isRatio: true, higherBetter: false },
  { key: "operating_profit",         label: "Operating Profit / (Loss)",  diverging: true, higherBetter: true },
  { key: "profit_from_player_sales", label: "Net Transfer Cash Flow",     diverging: true, higherBetter: null, expandable: "transfer" },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",    diverging: true, higherBetter: true },
  { key: "net_debt",                 label: "Net Debt (proxy)",           diverging: true, higherBetter: false },
];

// ─── Single-year metrics grid ─────────────────────────────────────────────────

function TransferPanel({ tb }: { tb: JapanClubDeepDive["transfer_breakdown"] }) {
  if (!tb) return null;
  const net = tb.income !== null && tb.expenditure !== null ? Math.round((tb.income - tb.expenditure) * 100) / 100 : null;
  const rows = [
    { label: "Transfer Income",      value: tb.income,      color: "#4a9a6a" },
    { label: "Transfer Expenditure", value: tb.expenditure, color: "#9a4a4a" },
    { label: "Net",                  value: net,            color: net !== null && net >= 0 ? "#4a9a6a" : "#9a4a4a" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-[#666666] w-40 shrink-0">{r.label}</span>
          <span className="text-[11px] tabular-nums font-medium" style={{ color: r.color }}>
            {r.value !== null ? `$${Math.abs(r.value).toFixed(1)}m${r.value < 0 ? " (net cost)" : ""}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricsGrid({
  data,
  divData,
  compareLabel,
  breakdown,
  totalRevenue,
  transferBreakdown,
}: {
  data: Snap;
  divData: Snap[];
  compareLabel: string;
  breakdown: JapanClubDeepDive["revenue_breakdown"];
  totalRevenue: number | null;
  transferBreakdown: JapanClubDeepDive["transfer_breakdown"];
}) {
  const [revOpen, setRevOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-r border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">Financial Figures</p>
      </div>
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">vs {compareLabel} Average</p>
      </div>

      {METRICS.map((m) => {
        const val = data[m.key];
        const stats = divStats(divData, m.key);
        const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;
        const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01) : 1;
        const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
        const avgPct = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;
        const barColor = val !== null && stats ? vsColor(val, stats.avg, m.higherBetter) : "#cccccc";
        const isRev = m.expandable === "revenue";
        const isTransfer = m.expandable === "transfer";
        const canExpand = (isRev && breakdown != null) || (isTransfer && transferBreakdown != null);
        const toggleExpand = canExpand
          ? () => { if (isRev) setRevOpen((o) => !o); else setTransferOpen((o) => !o); }
          : undefined;
        const expandOpen = isRev ? revOpen : isTransfer ? transferOpen : false;

        return (
          <Fragment key={m.key as string}>
            <div
              className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-r border-[#e0e0e0] bg-white${toggleExpand ? " cursor-pointer hover:bg-[#fafafa] transition-colors" : ""}`}
              onClick={toggleExpand}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999]">{m.label}</p>
                {toggleExpand && <BreakdownBadge open={expandOpen} />}
              </div>
              {val !== null ? (
                <p className="text-xl sm:text-2xl font-light tabular-nums text-[#111111]">{fmtJpy(val, m.isRatio)}</p>
              ) : (
                <p className="text-xl sm:text-2xl font-light text-[#cccccc]">—</p>
              )}
              {stats && rank !== null && (
                <p className="text-[10px] text-[#aaaaaa] mt-1.5">#{rank} <span className="text-[#cccccc]">of {stats.count}</span></p>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#e0e0e0] bg-white">
              <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">{m.label}</p>
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging ? (
                    <DivBar value={val ?? 0} scale={scale / 2} color={val !== null ? barColor : "#cccccc"} />
                  ) : (
                    <StdBar pct={clubPct} color={val !== null ? barColor : "#eeeeee"} />
                  )}
                  <span className="text-xs font-medium tabular-nums text-[#111111] w-14 text-right shrink-0">
                    {fmtJpy(val, m.isRatio)}
                  </span>
                </div>
                <p className="text-[9px] text-[#aaaaaa] tracking-[0.05em]">This club</p>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging && stats ? (
                    <DivBar value={stats.avg} scale={scale / 2} color="#cccccc" />
                  ) : (
                    <StdBar pct={avgPct} color="#cccccc" />
                  )}
                  <span className="text-xs tabular-nums text-[#aaaaaa] w-14 text-right shrink-0">
                    {stats ? fmtJpy(stats.avg, m.isRatio) : "—"}
                  </span>
                </div>
                <p className="text-[9px] text-[#cccccc] tracking-[0.05em]">Division avg</p>
              </div>
            </div>

            {isRev && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: revOpen ? "700px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">Revenue Breakdown</p>
                  <JapanRevenueBreakdownSection breakdown={breakdown ?? null} totalRevenue={totalRevenue} />
                </div>
              </div>
            )}
            {isTransfer && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: transferOpen ? "300px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">Transfer Breakdown</p>
                  <TransferPanel tb={transferBreakdown ?? null} />
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── YoY section ──────────────────────────────────────────────────────────────

function YoYSection({ club }: { club: JapanClub }) {
  const py = club.prior_year;
  if (!py) return <p className="text-sm text-[#aaaaaa] italic">No prior year data available.</p>;

  const rows: { label: string; key: keyof Snap; isRatio?: boolean }[] = [
    { label: "Revenue",                    key: "revenue" },
    { label: "Wage Bill",                  key: "wage_bill" },
    { label: "Wage Ratio",                 key: "wage_ratio",  isRatio: true },
    { label: "Operating Profit / (Loss)",  key: "operating_profit" },
    { label: "Net Transfer Cash Flow",      key: "profit_from_player_sales" },
    { label: "Pre-tax Profit / (Loss)",    key: "pre_tax_profit" },
    { label: "Net Debt (proxy)",           key: "net_debt" },
  ];

  const current: Snap = {
    revenue: club.revenue, wage_bill: club.wage_bill, wage_ratio: club.wage_ratio,
    operating_profit: club.operating_profit, profit_from_player_sales: club.profit_from_player_sales,
    pre_tax_profit: club.pre_tax_profit, net_debt: club.net_debt,
  };
  const prior: Snap = {
    revenue: py.revenue, wage_bill: py.wage_bill, wage_ratio: py.wage_ratio,
    operating_profit: py.operating_profit, profit_from_player_sales: py.profit_from_player_sales,
    pre_tax_profit: py.pre_tax_profit, net_debt: py.net_debt,
  };

  function fyLabel(s: string) {
    return new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }

  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      <div className="grid grid-cols-4 px-4 sm:px-6 py-3 bg-white border-b border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] col-span-1">Metric</p>
        <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] text-right">{fyLabel(py.fiscal_year_end)}</p>
        <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] text-right">{fyLabel(club.fiscal_year_end)}</p>
        <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] text-right">Change</p>
      </div>
      {rows.map((r, i) => {
        const curr = current[r.key];
        const prev = prior[r.key];
        const pct = calcPct(curr as number | null, prev as number | null);
        const isLast = i === rows.length - 1;
        return (
          <div
            key={r.key as string}
            className="grid grid-cols-4 px-4 sm:px-6 py-3 bg-white items-center"
            style={{ borderBottom: isLast ? undefined : "1px solid #f0f0f0" }}
          >
            <p className="text-[11px] text-[#666666] col-span-1 pr-2">{r.label}</p>
            <p className="text-[11px] tabular-nums text-[#aaaaaa] text-right">{fmtJpy(prev as number | null, r.isRatio)}</p>
            <p className="text-[11px] tabular-nums font-medium text-[#111111] text-right">{fmtJpy(curr as number | null, r.isRatio)}</p>
            <p className={`text-[11px] tabular-nums text-right font-medium ${pct === null ? "text-[#cccccc]" : pct > 0 ? "text-[#4a9a6a]" : "text-[#9a4a4a]"}`}>
              {pct === null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

type TabKey = "current" | "prior" | "yoy";

interface Props {
  club: JapanClub;
  leagueClubs: JapanClub[];
  deepDive: JapanClubDeepDive | null;
}

export default function JapanClubProfile({ club, leagueClubs, deepDive }: Props) {
  const hasPrior = club.prior_year !== null;
  const [tab, setTab] = useState<TabKey>(hasPrior ? "yoy" : "current");

  const fyLabel = (s: string) =>
    new Date(s).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  const TABS: { key: TabKey; label: string }[] = [
    { key: "current", label: fyLabel(club.fiscal_year_end) },
    ...(hasPrior ? [{ key: "prior" as TabKey, label: fyLabel(club.prior_year!.fiscal_year_end) }] : []),
    ...(hasPrior ? [{ key: "yoy" as TabKey, label: "Year-on-Year" }] : []),
  ];

  const currentSnap: Snap = {
    revenue: club.revenue, wage_bill: club.wage_bill, wage_ratio: club.wage_ratio,
    operating_profit: club.operating_profit, profit_from_player_sales: club.profit_from_player_sales,
    pre_tax_profit: club.pre_tax_profit, net_debt: club.net_debt,
  };

  const priorSnap: Snap | null = club.prior_year
    ? {
        revenue: club.prior_year.revenue, wage_bill: club.prior_year.wage_bill,
        wage_ratio: club.prior_year.wage_ratio, operating_profit: club.prior_year.operating_profit,
        profit_from_player_sales: club.prior_year.profit_from_player_sales,
        pre_tax_profit: club.prior_year.pre_tax_profit, net_debt: club.prior_year.net_debt,
      }
    : null;

  const currentDivSnaps: Snap[] = leagueClubs.map((c) => ({
    revenue: c.revenue, wage_bill: c.wage_bill, wage_ratio: c.wage_ratio,
    operating_profit: c.operating_profit, profit_from_player_sales: c.profit_from_player_sales,
    pre_tax_profit: c.pre_tax_profit, net_debt: c.net_debt,
  }));

  const priorDivSnaps: Snap[] = leagueClubs
    .filter((c) => c.prior_year !== null)
    .map((c) => ({
      revenue: c.prior_year!.revenue, wage_bill: c.prior_year!.wage_bill,
      wage_ratio: c.prior_year!.wage_ratio, operating_profit: c.prior_year!.operating_profit,
      profit_from_player_sales: c.prior_year!.profit_from_player_sales,
      pre_tax_profit: c.prior_year!.pre_tax_profit, net_debt: c.prior_year!.net_debt,
    }));

  const compareLabel = J_DIVISION_LABELS[club.division];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 sm:px-5 py-2.5 text-xs font-medium tracking-[0.08em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
              tab === key ? "border-[#111111] text-[#111111]" : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "current" && (
        <MetricsGrid
          data={currentSnap}
          divData={currentDivSnaps}
          compareLabel={compareLabel}
          breakdown={deepDive?.revenue_breakdown ?? null}
          totalRevenue={club.revenue}
          transferBreakdown={deepDive?.transfer_breakdown ?? null}
        />
      )}

      {tab === "prior" && priorSnap && (
        <MetricsGrid
          data={priorSnap}
          divData={priorDivSnaps}
          compareLabel={compareLabel}
          breakdown={deepDive?.revenue_breakdown_prior ?? null}
          totalRevenue={priorSnap.revenue}
          transferBreakdown={null}
        />
      )}

      {tab === "yoy" && <YoYSection club={club} />}

      {/* Disclaimer */}
      <p className="text-[10px] text-[#bbbbbb] mt-6 leading-relaxed">
        Figures converted from JPY millions at ¥150/$1. Net Debt shown as a proxy (Total Liabilities minus Current Assets) since individual debt instruments are not disclosed separately in J-League financial disclosures.
      </p>
    </div>
  );
}
