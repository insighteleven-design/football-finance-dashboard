"use client";

import { useState } from "react";
import { plymouthCashFlow } from "@/lib/plymouthCashFlow";
import type { PlymouthCashFlowData } from "@/lib/plymouthCashFlow";

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

function fmtDelta(delta: number): string {
  return fmtK(delta);
}

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

// ─── Breakdown badge (matches MetricsGrid) ────────────────────────────────────

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

// ─── Block 1: Waterfall chart ─────────────────────────────────────────────────

const WATERFALL_SCALE = 10.324; // £m — opening cash

interface WaterfallBar {
  label: string;
  displayValue: string;
  // bottom and height as percentage of chart height
  bottomPct: number;
  heightPct: number;
  color: string;
  isTotal: boolean;
}

function buildWaterfallBars(): WaterfallBar[] {
  const S = WATERFALL_SCALE;
  // Running total in £m (exact figures / 1m)
  const open   = 10.324;
  const afterOp  = 2.721;  // 10.324 - 7.603
  const afterInv = 0.019;  // 2.721 - 2.702
  const closing  = 2.676;  // 0.019 + 2.657

  return [
    {
      label: "Opening cash",
      displayValue: fmtM(10_323_934),
      bottomPct: 0,
      heightPct: (open / S) * 100,
      color: "#999999",
      isTotal: true,
    },
    {
      label: "Operating",
      displayValue: fmtM(-7_602_684),
      bottomPct: (afterOp / S) * 100,
      heightPct: (7.603 / S) * 100,
      color: "#9a4a4a",
      isTotal: false,
    },
    {
      label: "Investing",
      displayValue: fmtM(-2_702_407),
      bottomPct: (afterInv / S) * 100,
      heightPct: (2.702 / S) * 100,
      color: "#9a4a4a",
      isTotal: false,
    },
    {
      label: "Financing",
      displayValue: fmtM(2_657_393),
      bottomPct: (afterInv / S) * 100,
      heightPct: (2.657 / S) * 100,
      color: "#4a9a6a",
      isTotal: false,
    },
    {
      label: "Closing cash",
      displayValue: fmtM(2_676_236),
      bottomPct: 0,
      heightPct: (closing / S) * 100,
      color: "#999999",
      isTotal: true,
    },
  ];
}

function WaterfallChart() {
  const bars = buildWaterfallBars();
  const CHART_H = 160; // px height for the bar drawing area
  const TOP_PAD = 18;  // px headroom above bars for value labels
  const TOTAL_H = CHART_H + TOP_PAD;

  // Convert percentage (0-100, relative to CHART_H) to bottom px within TOTAL_H container
  const toPx = (pct: number) => (pct / 100) * CHART_H;

  return (
    <div>
      <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-4">
        Cash Movement FY2025
      </p>

      <div className="flex gap-4">
        {/* Y-axis labels — span only the CHART_H portion (bottom of container) */}
        <div
          className="flex flex-col justify-between text-right shrink-0"
          style={{ height: CHART_H, marginTop: TOP_PAD }}
        >
          {["£10m", "£7.5m", "£5m", "£2.5m", "£0"].map((l) => (
            <span key={l} className="text-xs text-[#cccccc] leading-none">{l}</span>
          ))}
        </div>

        {/* Chart area: TOTAL_H tall, bars drawn in bottom CHART_H px */}
        <div className="flex-1 relative" style={{ height: TOTAL_H }}>
          {/* Grid lines at 0 / 25 / 50 / 75 / 100% of CHART_H */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0"
              style={{
                bottom: toPx(pct),
                height: 1,
                backgroundColor: pct === 0 ? "#d0d0d0" : "#f0f0f0",
              }}
            />
          ))}

          {/* Bars */}
          <div className="absolute inset-0 flex gap-2">
            {bars.map((bar) => {
              const barBottomPx = toPx(bar.bottomPct);
              const barHeightPx = Math.max(toPx(bar.heightPct), bar.heightPct > 0 ? 2 : 0);
              const labelBottomPx = barBottomPx + barHeightPx + 3;
              return (
                <div key={bar.label} className="flex-1 relative">
                  {/* Value label */}
                  <div
                    className="absolute left-0 right-0 flex justify-center"
                    style={{ bottom: labelBottomPx }}
                  >
                    <span
                      className="text-[8px] font-medium tabular-nums whitespace-nowrap leading-none"
                      style={{ color: bar.isTotal ? "#666666" : bar.color }}
                    >
                      {bar.displayValue}
                    </span>
                  </div>
                  {/* Bar fill */}
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

      {/* X-axis labels */}
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

// ─── Block 2: Two-year comparison table ──────────────────────────────────────

interface TableRowProps {
  label: string;
  fy25: number;
  fy24: number;
  isSubtotal?: boolean;
  indent?: boolean;
}

function TableRow({ label, fy25, fy24, isSubtotal, indent }: TableRowProps) {
  const delta = fy25 - fy24;
  const pct = fy24 !== 0 ? (delta / Math.abs(fy24)) * 100 : Infinity;

  return (
    <tr
      className={`border-b border-[#f4f4f4] last:border-b-0 ${isSubtotal ? "bg-[#f7f7f7]" : ""}`}
    >
      <td className={`py-2 pr-3 text-xs ${isSubtotal ? "font-medium text-[#333333]" : "text-[#555555]"} ${indent ? "pl-4" : "pl-0"}`}>
        {label}
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-xs" style={{ color: fy25 === 0 && !isSubtotal ? "#cccccc" : numColor(fy25) }}>
        {fy25 === 0 && !isSubtotal ? "—" : fmtK(fy25)}
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-xs" style={{ color: fy24 === 0 && !isSubtotal ? "#cccccc" : numColor(fy24) }}>
        {fy24 === 0 && !isSubtotal ? "—" : fmtK(fy24)}
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-xs" style={{ color: numColor(delta) }}>
        {fy25 === 0 && fy24 === 0 ? "—" : fmtDelta(delta)}
      </td>
      <td className="py-2 pl-3 text-right tabular-nums text-xs" style={{ color: "#aaaaaa" }}>
        {fy25 === 0 && fy24 === 0 ? "—" : fmtPct(pct)}
      </td>
    </tr>
  );
}

function CategoryHeader({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="pt-4 pb-1.5 text-xs font-medium tracking-[0.15em] uppercase text-[#aaaaaa]"
      >
        {label}
      </td>
    </tr>
  );
}

function CashFlowTable({ data }: { data: PlymouthCashFlowData }) {
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
              <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa] whitespace-nowrap">FY2025</th>
              <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa] whitespace-nowrap">FY2024</th>
              <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">Δ £</th>
              <th className="pb-2 pl-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">Δ %</th>
            </tr>
          </thead>
          <tbody>
            <CategoryHeader label="Operating activities" />
            {data.operating.map((item) => (
              <TableRow key={item.label} label={item.label} fy25={item.fy25} fy24={item.fy24} indent />
            ))}
            <TableRow
              label="Net cash from operating activities"
              fy25={data.netOperating.fy25}
              fy24={data.netOperating.fy24}
              isSubtotal
            />

            <CategoryHeader label="Investing activities" />
            {data.investing.map((item) => (
              <TableRow key={item.label} label={item.label} fy25={item.fy25} fy24={item.fy24} indent />
            ))}
            <TableRow
              label="Net cash used in investing activities"
              fy25={data.netInvesting.fy25}
              fy24={data.netInvesting.fy24}
              isSubtotal
            />

            <CategoryHeader label="Financing activities" />
            {data.financing.map((item) => (
              <TableRow key={item.label} label={item.label} fy25={item.fy25} fy24={item.fy24} indent />
            ))}
            <TableRow
              label="Net cash generated from financing activities"
              fy25={data.netFinancing.fy25}
              fy24={data.netFinancing.fy24}
              isSubtotal
            />

            {/* Opening / closing */}
            <tr><td colSpan={5} className="pt-4 pb-1" /></tr>
            <TableRow label="Opening cash" fy25={data.openingCash.fy25} fy24={data.openingCash.fy24} isSubtotal />
            <TableRow label="Closing cash" fy25={data.closingCash.fy25} fy24={data.closingCash.fy24} isSubtotal />
          </tbody>
        </table>
      </div>

      {/* Commentary */}
      <p className="text-xs text-[#666666] leading-relaxed mt-4">
        Cash absorbed by operations worsened by £6.8m year-on-year, driving the collapse in cash reserves from £10.3m to £2.7m.
      </p>

      {/* Reconciliation toggle */}
      <div className="mt-4 border-t border-[#f0f0f0] pt-4">
        <button
          onClick={() => setShowRecon((o) => !o)}
          className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors hover:text-[#333333]"
          style={{ color: showRecon ? "#4A90D9" : "#aaaaaa" }}
        >
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: showRecon ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            →
          </span>
          Show reconciliation (Note 30)
        </button>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: showRecon ? "600px" : "0px" }}
        >
          <div className="pt-4">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
              Note 30 — Cash (absorbed by)/generated from operations
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-[#e0e0e0]">
                    <th className="pb-2 pr-3 text-left text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">Item</th>
                    <th className="pb-2 px-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">FY2025</th>
                    <th className="pb-2 pl-3 text-right text-xs font-medium tracking-[0.12em] uppercase text-[#aaaaaa]">FY2024*</th>
                  </tr>
                </thead>
                <tbody>
                  {plymouthCashFlow.reconciliation.map((item, i) => (
                    <tr key={i} className="border-b border-[#f4f4f4] last:border-b-0">
                      <td className="py-2 pr-3 text-xs text-[#555555]">{item.label}</td>
                      <td
                        className="py-2 px-3 text-right tabular-nums text-xs"
                        style={{ color: numColor(item.fy25) }}
                      >
                        {fmtK(item.fy25)}
                      </td>
                      <td
                        className="py-2 pl-3 text-right tabular-nums text-xs"
                        style={{ color: numColor(item.fy24) }}
                      >
                        {fmtK(item.fy24)}
                      </td>
                    </tr>
                  ))}
                  {/* Total */}
                  <tr className="border-t border-[#e0e0e0] bg-[#f7f7f7]">
                    <td className="py-2 pr-3 text-xs font-medium text-[#333333]">Cash (absorbed by)/generated from operations</td>
                    <td className="py-2 px-3 text-right tabular-nums text-xs font-medium" style={{ color: numColor(-7_602_684) }}>
                      {fmtK(-7_602_684)}
                    </td>
                    <td className="py-2 pl-3 text-right tabular-nums text-xs font-medium" style={{ color: numColor(4_900_020) }}>
                      {fmtK(4_900_020)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#aaaaaa] mt-2 leading-relaxed">
              * FY2024 comparatives as restated in the FY2025 accounts (reclassification of player trading between operating and investing). The FY2024 cash flow statement reported (£791k) absorbed by operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Block 3: How the shortfall was funded ────────────────────────────────────

interface FundingSegment {
  label: string;
  value: number; // £m
  color: string;
  postBsOnly?: boolean;
}

const FUNDING_AS_REPORTED: FundingSegment[] = [
  { label: "Net player trading",    value: 2.2,  color: "#4A90D9" },
  { label: "New external funding",  value: 2.7,  color: "#E8A838" },
  { label: "Cash reserves drawn",   value: 2.7,  color: "#9a4a4a" },
];

const FUNDING_POST_BS: FundingSegment[] = [
  { label: "Net player trading",         value: 2.2,  color: "#4A90D9" },
  { label: "New external funding",       value: 2.7,  color: "#E8A838" },
  { label: "Cash reserves drawn",        value: 2.7,  color: "#9a4a4a" },
  { label: "Post-BS director loan",      value: 9.8,  color: "#cccccc", postBsOnly: true },
];

function FundingBar({ segments }: { segments: FundingSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return (
    <div>
      {/* Stacked bar */}
      <div className="h-7 flex overflow-hidden mb-3" style={{ borderRadius: 2 }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="h-full"
            style={{
              width: `${(seg.value / total) * 100}%`,
              backgroundColor: seg.color,
              minWidth: 2,
              opacity: seg.postBsOnly ? 0.6 : 1,
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color, opacity: seg.postBsOnly ? 0.6 : 1 }} />
            <span className="text-xs text-[#666666]">
              {seg.label}
              {seg.postBsOnly && (
                <span className="ml-1 text-xs" style={{ color: "#aaaaaa" }}>(post balance sheet)</span>
              )}
            </span>
            <span className="text-xs font-medium tabular-nums" style={{ color: seg.postBsOnly ? "#aaaaaa" : "#333333" }}>
              £{seg.value.toFixed(1)}m
            </span>
          </div>
        ))}
      </div>

      {/* Reinvestment line */}
      <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex items-center gap-3">
        <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#bbbbbb" }} />
        <span className="text-xs text-[#666666] flex-1">
          Reinvestment (tangible capex £5.0m less disposals £10k less interest received £104k)
        </span>
        <span className="text-xs font-medium tabular-nums text-[#333333]">£4.9m</span>
      </div>
    </div>
  );
}

function FundingSection() {
  const [view, setView] = useState<"reported" | "postbs">("reported");

  const segments = view === "reported" ? FUNDING_AS_REPORTED : FUNDING_POST_BS;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999]">
          How the £7.6m operating shortfall was funded
        </p>
        {/* Toggle */}
        <div className="flex items-center border border-[#e0e0e0] overflow-hidden" style={{ borderRadius: 2 }}>
          {(["reported", "postbs"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 text-xs font-medium tracking-[0.08em] uppercase transition-colors"
              style={{
                backgroundColor: view === v ? "#111111" : "#ffffff",
                color: view === v ? "#ffffff" : "#aaaaaa",
              }}
            >
              {v === "reported" ? "As reported" : "Incl. post-BS"}
            </button>
          ))}
        </div>
      </div>

      <FundingBar segments={segments} />

      {view === "postbs" && (
        <p className="text-xs text-[#aaaaaa] mt-3 leading-relaxed italic">
          Post-balance sheet view includes the £9.8m director loan drawn from Mr S Hallett after 30 June 2025 (Note 28). Figures are indicative — the post-BS loan is not reflected in the statutory cash flow statement above.
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── Simple (FY2024) variant ──────────────────────────────────────────────────

export function CashFlowSectionSimple() {
  // FY2024: net cash outflow from operating activities = (£784,905) ≈ (£0.8m)
  return (
    <div
      className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden"
      style={{ marginTop: -1 }}
    >
      {/* Left cell */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-r border-[#e0e0e0] bg-white">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-1.5">
          Operating Cash Flow
        </p>
        <p className="text-xl sm:text-2xl font-light tabular-nums" style={{ color: "#9a4a4a" }}>
          (£0.8m)
        </p>
      </div>

      {/* Right cell */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
          Operating Cash Flow
        </p>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 flex h-7">
            <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
              <div className="h-full" style={{ width: `${Math.min((0.8 / 10) * 100, 100)}%`, backgroundColor: "#9a4a4a" }} />
            </div>
            <div className="w-px bg-[#e0e0e0] shrink-0" />
            <div className="flex-1 overflow-hidden bg-[#eeeeee]" />
          </div>
          <span className="text-xs font-medium tabular-nums text-[#9a4a4a] w-14 text-right shrink-0">
            (£0.8m)
          </span>
        </div>
        <p className="text-xs text-[#aaaaaa] tracking-[0.05em]">FY2024</p>
      </div>
    </div>
  );
}

// ─── Full (FY2025) variant ────────────────────────────────────────────────────

export default function CashFlowSection() {
  const [open, setOpen] = useState(false);
  const data = plymouthCashFlow;

  return (
    <div
      className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden"
      style={{ marginTop: -1 }} // merge with MetricsGrid bottom border
    >
      {/* ── Left cell: label + value + breakdown toggle ─────────────────────── */}
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
        <p
          className="text-xl sm:text-2xl font-light tabular-nums"
          style={{ color: "#9a4a4a" }}
        >
          (£7.6m)
        </p>
      </div>

      {/* ── Right cell: FY2025 vs FY2024 bars ───────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
          Operating Cash Flow
        </p>

        <div className="mb-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 flex h-7">
              <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
                <div className="h-full" style={{ width: `${Math.min((7.6 / 10) * 100, 100)}%`, backgroundColor: "#9a4a4a" }} />
              </div>
              <div className="w-px bg-[#e0e0e0] shrink-0" />
              <div className="flex-1 overflow-hidden bg-[#eeeeee]" />
            </div>
            <span className="text-xs font-medium tabular-nums text-[#9a4a4a] w-14 text-right shrink-0">
              (£7.6m)
            </span>
          </div>
          <p className="text-xs text-[#aaaaaa] tracking-[0.05em]">FY2025</p>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 flex h-7">
              <div className="flex-1 flex justify-end overflow-hidden bg-[#eeeeee]">
                <div className="h-full" style={{ width: `${Math.min((0.8 / 10) * 100, 100)}%`, backgroundColor: "#cccccc" }} />
              </div>
              <div className="w-px bg-[#e0e0e0] shrink-0" />
              <div className="flex-1 overflow-hidden bg-[#eeeeee]" />
            </div>
            <span className="text-xs tabular-nums text-[#aaaaaa] w-14 text-right shrink-0">
              (£0.8m)
            </span>
          </div>
          <p className="text-xs text-[#cccccc] tracking-[0.05em]">FY2024</p>
        </div>
      </div>

      {/* ── Inline expansion ─────────────────────────────────────────────────── */}
      <div
        className="col-span-full overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "2400px" : "0px" }}
      >
        <div className="border-t border-[#e0e0e0] bg-[#fafafa]">

          {/* Block 1 — Waterfall */}
          <div className="px-6 py-5 border-b border-[#e0e0e0]">
            <WaterfallChart />
          </div>

          {/* Block 2 — Two-year table + reconciliation toggle */}
          <div className="px-6 py-5 border-b border-[#e0e0e0]">
            <CashFlowTable data={data} />
          </div>

          {/* Block 3 — How the shortfall was funded */}
          <div className="px-6 py-5 border-b border-[#e0e0e0]">
            <FundingSection />
          </div>

          {/* Post-balance-sheet footer note */}
          <div className="px-6 py-3">
            <p className="text-xs text-[#aaaaaa] leading-relaxed">
              Post balance sheet, a further £9.8m drawn from Mr Hallett (not reflected in statutory figures above). See Note 28.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
