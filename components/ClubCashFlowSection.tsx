"use client";

import { useState } from "react";
import type { ClubCashFlowData } from "@/lib/cashFlowData";

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtM(v: number, dp = 1): string {
  const abs = Math.abs(v) / 1_000_000;
  const s = abs.toFixed(dp);
  return v < 0 ? `(£${s}m)` : `£${s}m`;
}

function fmtK(v: number): string {
  if (v === 0) return "—";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return fmtM(v);
  if (abs >= 1_000) {
    const s = (abs / 1_000).toFixed(0);
    return v < 0 ? `(£${s}k)` : `£${s}k`;
  }
  return v < 0 ? `(£${abs})` : `£${abs}`;
}

function fmtDelta(v: number): string { return fmtK(v); }

function fmtPct(v: number): string {
  if (!isFinite(v) || Math.abs(v) > 9999) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(0)}%`;
}

function numColor(v: number): string {
  if (v > 0) return "#4a9a6a";
  if (v < 0) return "#9a4a4a";
  return "#aaaaaa";
}

// ─── Breakdown badge ──────────────────────────────────────────────────────────

function BreakdownBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium tracking-[0.08em] uppercase border transition-colors shrink-0 ${
        open
          ? "border-[#4A90D9] bg-[#EBF3FC] text-[#4A90D9]"
          : "border-[#e0e0e0] text-[#aaaaaa]"
      }`}
    >
      Breakdown
      <span
        className="inline-block transition-transform duration-200"
        style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
      >
        →
      </span>
    </span>
  );
}

// ─── Waterfall chart ──────────────────────────────────────────────────────────

interface WaterfallBar {
  label: string;
  displayValue: string;
  bottomPct: number;
  heightPct: number;
  color: string;
  isTotal: boolean;
}

function buildWaterfall(data: ClubCashFlowData): { bars: WaterfallBar[]; scaleM: number; yLabels: string[] } {
  const toM = (v: number) => v / 1_000_000;
  const open    = toM(data.openingCash.current);
  const op      = toM(data.netOperating.current);
  const inv     = toM(data.netInvesting.current);
  const fin     = toM(data.netFinancing.current);
  const closing = toM(data.closingCash.current);

  // Levels between bars
  const afterOp  = open + op;
  const afterInv = afterOp + inv;
  // afterFin = closing (within rounding)

  // Scale: find max positive reach to set chart height
  const levels = [open, afterOp, afterInv, closing];
  const maxVal = Math.max(...levels.map(Math.abs), Math.abs(op), Math.abs(inv), Math.abs(fin));
  // Round up scale to nearest nice number
  const scaleM = maxVal <= 5 ? 5 : maxVal <= 10 ? 10 : maxVal <= 20 ? 20 : maxVal <= 50 ? 50 : maxVal <= 100 ? 100 : maxVal <= 200 ? 200 : Math.ceil(maxVal / 100) * 100;

  const pct = (v: number) => (v / scaleM) * 100;

  // For movement bars:
  // If value < 0: bar drawn from (current_level + value) up to current_level, colored red
  // If value > 0: bar drawn from current_level up to current_level + value, colored green
  const movBar = (label: string, level: number, value: number): WaterfallBar => {
    const isNeg = value < 0;
    const bottom = isNeg ? level + value : level;
    const height = Math.abs(value);
    return {
      label,
      displayValue: fmtM(value * 1_000_000),
      bottomPct: Math.max(pct(bottom), 0),
      heightPct: pct(height),
      color: isNeg ? "#9a4a4a" : "#4a9a6a",
      isTotal: false,
    };
  };

  const bars: WaterfallBar[] = [
    {
      label: "Opening cash",
      displayValue: fmtM(data.openingCash.current),
      bottomPct: 0,
      heightPct: pct(Math.abs(open)),
      color: "#999999",
      isTotal: true,
    },
    movBar("Operating", open, op),
    movBar("Investing", afterOp, inv),
    movBar("Financing", afterInv, fin),
    {
      label: "Closing cash",
      displayValue: fmtM(data.closingCash.current),
      bottomPct: 0,
      heightPct: pct(Math.abs(closing)),
      color: "#999999",
      isTotal: true,
    },
  ];

  // Y-axis labels
  const steps = 4;
  const yLabels = Array.from({ length: steps + 1 }, (_, i) => {
    const v = scaleM * (1 - i / steps);
    return v >= 1 ? `£${v.toFixed(0)}m` : `£${(v * 1000).toFixed(0)}k`;
  });

  return { bars, scaleM, yLabels };
}

function WaterfallChart({ data }: { data: ClubCashFlowData }) {
  const { bars, yLabels } = buildWaterfall(data);
  const CHART_H = 160;
  const TOP_PAD = 18;
  const TOTAL_H = CHART_H + TOP_PAD;
  const toPx = (pct: number) => (pct / 100) * CHART_H;

  return (
    <div>
      <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-4">
        Cash Movement {data.currentFY}
      </p>
      <div className="flex gap-4">
        {/* Y-axis */}
        <div
          className="flex flex-col justify-between text-right shrink-0"
          style={{ height: CHART_H, marginTop: TOP_PAD }}
        >
          {yLabels.map((l) => (
            <span key={l} className="text-xs text-[#cccccc] leading-none">{l}</span>
          ))}
        </div>

        {/* Chart */}
        <div className="flex-1 relative" style={{ height: TOTAL_H }}>
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0"
              style={{ bottom: toPx(pct), height: 1, backgroundColor: pct === 0 ? "#d0d0d0" : "#f0f0f0" }}
            />
          ))}
          <div className="absolute inset-0 flex gap-2">
            {bars.map((bar) => {
              const barBottomPx = toPx(bar.bottomPct);
              const barHeightPx = Math.max(toPx(bar.heightPct), bar.heightPct > 0 ? 2 : 0);
              const labelBottomPx = barBottomPx + barHeightPx + 3;
              return (
                <div key={bar.label} className="flex-1 relative">
                  <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: labelBottomPx }}>
                    <span
                      className="text-[8px] font-medium tabular-nums whitespace-nowrap leading-none"
                      style={{ color: bar.isTotal ? "#666666" : bar.color }}
                    >
                      {bar.displayValue}
                    </span>
                  </div>
                  <div
                    className="absolute left-0 right-0"
                    style={{
                      bottom: barBottomPx,
                      height: barHeightPx,
                      backgroundColor: bar.color,
                      opacity: bar.isTotal ? 0.55 : 0.8,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis */}
      <div className="flex gap-4 mt-1" style={{ paddingLeft: "2.5rem" }}>
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 text-center">
            <span className="text-[8px] text-[#aaaaaa] leading-tight block">{bar.label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4">
        {[
          { color: "#999999", label: "Opening / Closing (total)" },
          { color: "#9a4a4a", label: "Outflow" },
          { color: "#4a9a6a", label: "Inflow" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-[#999999]">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TableRow({
  label,
  current,
  prior,
  isSubtotal,
  indent,
}: {
  label: string;
  current: number;
  prior: number;
  isSubtotal?: boolean;
  indent?: boolean;
}) {
  const delta = current - prior;
  const pct   = prior !== 0 ? (delta / Math.abs(prior)) * 100 : Infinity;
  return (
    <tr className={`border-b border-[#f4f4f4] last:border-b-0 ${isSubtotal ? "bg-[#f7f7f7]" : ""}`}>
      <td className={`py-2 pr-3 text-xs ${isSubtotal ? "font-medium text-[#333333]" : "text-[#555555]"} ${indent ? "pl-4" : "pl-0"}`}>
        {label}
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-xs" style={{ color: current === 0 && !isSubtotal ? "#cccccc" : numColor(current) }}>
        {current === 0 && !isSubtotal ? "—" : fmtK(current)}
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-xs" style={{ color: prior === 0 && !isSubtotal ? "#cccccc" : numColor(prior) }}>
        {prior === 0 && !isSubtotal ? "—" : fmtK(prior)}
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-xs" style={{ color: numColor(delta) }}>
        {current === 0 && prior === 0 ? "—" : fmtDelta(delta)}
      </td>
      <td className="py-2 pl-3 text-right tabular-nums text-xs" style={{ color: "#aaaaaa" }}>
        {current === 0 && prior === 0 ? "—" : fmtPct(pct)}
      </td>
    </tr>
  );
}

function CategoryHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={5} className="pt-4 pb-1.5 text-xs font-medium tracking-[0.15em] uppercase text-[#aaaaaa]">
        {label}
      </td>
    </tr>
  );
}

// ─── Two-year cash flow table ─────────────────────────────────────────────────

function CashFlowTable({ data }: { data: ClubCashFlowData }) {
  const [showRecon, setShowRecon] = useState(false);

  return (
    <div>
      <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
        Two-Year Comparison
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-[#e0e0e0]">
              <th className="pb-2 pr-3 text-left text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">Line</th>
              <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa] whitespace-nowrap">{data.currentFY}</th>
              <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa] whitespace-nowrap">{data.priorFY}</th>
              <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">Δ £</th>
              <th className="pb-2 pl-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">Δ %</th>
            </tr>
          </thead>
          <tbody>
            <CategoryHeader label="Operating activities" />
            {data.operating.map((item) => (
              <TableRow key={item.label} label={item.label} current={item.current} prior={item.prior} indent />
            ))}
            <TableRow label="Net cash from/(used in) operating activities" current={data.netOperating.current} prior={data.netOperating.prior} isSubtotal />

            <CategoryHeader label="Investing activities" />
            {data.investing.map((item) => (
              <TableRow key={item.label} label={item.label} current={item.current} prior={item.prior} indent />
            ))}
            <TableRow label="Net cash used in investing activities" current={data.netInvesting.current} prior={data.netInvesting.prior} isSubtotal />

            <CategoryHeader label="Financing activities" />
            {data.financing.map((item) => (
              <TableRow key={item.label} label={item.label} current={item.current} prior={item.prior} indent />
            ))}
            <TableRow label="Net cash from/(used in) financing activities" current={data.netFinancing.current} prior={data.netFinancing.prior} isSubtotal />

            <tr><td colSpan={5} className="pt-4 pb-1" /></tr>
            <TableRow label="Opening cash" current={data.openingCash.current} prior={data.openingCash.prior} isSubtotal />
            <TableRow label="Closing cash"  current={data.closingCash.current}  prior={data.closingCash.prior}  isSubtotal />
          </tbody>
        </table>
      </div>

      {/* Reconciliation toggle */}
      {data.reconciliation && data.reconciliation.length > 0 && (
        <div className="mt-4 border-t border-[#f0f0f0] pt-4">
          <button
            onClick={() => setShowRecon((o) => !o)}
            className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors hover:text-[#333333]"
            style={{ color: showRecon ? "#4A90D9" : "#aaaaaa" }}
          >
            <span className="inline-block transition-transform duration-200" style={{ transform: showRecon ? "rotate(90deg)" : "rotate(0deg)" }}>
              →
            </span>
            {data.reconciliationTitle ?? "Show reconciliation to cash from operations"}
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: showRecon ? "700px" : "0px" }}
          >
            <div className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-[#e0e0e0]">
                      <th className="pb-2 pr-3 text-left text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">Item</th>
                      <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">{data.currentFY}</th>
                      <th className="pb-2 pl-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">{data.priorFY}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reconciliation.map((item, i) => (
                      <tr key={i} className="border-b border-[#f4f4f4] last:border-b-0">
                        <td className="py-2 pr-3 text-xs text-[#555555]">{item.label}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-xs" style={{ color: numColor(item.current) }}>
                          {fmtK(item.current)}
                        </td>
                        <td className="py-2 pl-3 text-right tabular-nums text-xs" style={{ color: numColor(item.prior) }}>
                          {fmtK(item.prior)}
                        </td>
                      </tr>
                    ))}
                    {/* Total row matches netOperating */}
                    <tr className="border-t border-[#e0e0e0] bg-[#f7f7f7]">
                      <td className="py-2 pr-3 text-xs font-medium text-[#333333]">Cash (absorbed by)/generated from operations</td>
                      <td className="py-2 px-3 text-right tabular-nums text-xs font-medium" style={{ color: numColor(data.netOperating.current) }}>
                        {fmtK(data.netOperating.current)}
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums text-xs font-medium" style={{ color: numColor(data.netOperating.prior) }}>
                        {fmtK(data.netOperating.prior)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {data.reconciliationNote && (
                <p className="text-xs text-[#aaaaaa] mt-2 leading-relaxed">
                  {data.reconciliationNote}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple bar (for prior-year card) ────────────────────────────────────────

function SimpleBar({ value, scale, label }: { value: number; scale: number; label: string }) {
  const isNeg = value < 0;
  const widthPct = Math.min((Math.abs(value / 1_000_000) / scale) * 100, 100);
  const color = isNeg ? "#9a4a4a" : "#4a9a6a";
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 flex h-7">
          {isNeg ? (
            <>
              <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
                <div className="h-full" style={{ width: `${widthPct}%`, backgroundColor: color }} />
              </div>
              <div className="w-px bg-[#e0e0e0] shrink-0" />
              <div className="flex-1 overflow-hidden bg-[#eeeeee]" />
            </>
          ) : (
            <>
              <div className="flex-1 overflow-hidden bg-[#eeeeee]" />
              <div className="w-px bg-[#e0e0e0] shrink-0" />
              <div className="flex-1 flex overflow-hidden bg-[#eeeeee]">
                <div className="h-full" style={{ width: `${widthPct}%`, backgroundColor: color }} />
              </div>
            </>
          )}
        </div>
        <span className="text-xs font-medium tabular-nums w-14 text-right shrink-0" style={{ color }}>
          {fmtM(value)}
        </span>
      </div>
      <p className="text-xs text-[#aaaaaa] tracking-[0.05em]">{label}</p>
    </div>
  );
}

// ─── Simple prior-year export ─────────────────────────────────────────────────

export function ClubCashFlowSectionSimple({
  value,
  fyLabel,
  scale,
}: {
  value: number;   // £ exact (net operating cash flow for prior year)
  fyLabel: string; // e.g. "FY2024"
  scale: number;   // £m scale for the bar
}) {
  const color = value < 0 ? "#9a4a4a" : "#4a9a6a";
  return (
    <div
      className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden"
      style={{ marginTop: -1 }}
    >
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-r border-[#e0e0e0] bg-white">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-1.5">
          Operating Cash Flow
        </p>
        <p className="text-xl sm:text-2xl font-light tabular-nums" style={{ color }}>
          {fmtM(value)}
        </p>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
          Operating Cash Flow
        </p>
        <SimpleBar value={value} scale={scale} label={fyLabel} />
      </div>
    </div>
  );
}

// ─── Main component (full current-year view) ──────────────────────────────────

export default function ClubCashFlowSection({ data }: { data: ClubCashFlowData }) {
  const [open, setOpen] = useState(false);
  const netOp = data.netOperating.current;
  const color = netOp < 0 ? "#9a4a4a" : "#4a9a6a";

  // Scale for dual bar (use larger of current / prior, in £m)
  const scaleM = Math.max(
    Math.abs(data.netOperating.current / 1_000_000),
    Math.abs(data.netOperating.prior / 1_000_000),
    1 // minimum 1m to avoid divide by zero
  );

  return (
    <div
      className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden"
      style={{ marginTop: -1 }}
    >
      {/* Left: label + value + toggle */}
      <div
        className="px-4 sm:px-6 py-4 sm:py-5 border-r border-[#e0e0e0] bg-white cursor-pointer hover:bg-[#fafafa] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999]">
            Operating Cash Flow
          </p>
          <BreakdownBadge open={open} />
        </div>
        <p className="text-xl sm:text-2xl font-light tabular-nums" style={{ color }}>
          {fmtM(netOp)}
        </p>
      </div>

      {/* Right: dual-year bar */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
          Operating Cash Flow
        </p>
        {/* Current year */}
        <div className="mb-2">
          <SimpleBar value={netOp} scale={scaleM} label={data.currentFY} />
        </div>
        {/* Prior year (muted) */}
        <div className="opacity-40">
          <SimpleBar value={data.netOperating.prior} scale={scaleM} label={data.priorFY} />
        </div>
      </div>

      {/* Expansion panel */}
      <div
        className="col-span-full overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "2600px" : "0px" }}
      >
        <div className="border-t border-[#e0e0e0] bg-[#fafafa]">
          {/* Waterfall */}
          <div className="px-6 py-5 border-b border-[#e0e0e0]">
            <WaterfallChart data={data} />
          </div>
          {/* Two-year table + reconciliation */}
          <div className="px-6 py-5 border-b border-[#e0e0e0]">
            <CashFlowTable data={data} />
          </div>
          {/* Post-BS note */}
          {data.postBalanceSheetNote && (
            <div className="px-6 py-3">
              <p className="text-xs text-[#aaaaaa] leading-relaxed">
                {data.postBalanceSheetNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
