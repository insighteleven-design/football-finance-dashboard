"use client";

import type { ClubFinancials, PriorYearFinancials } from "@/lib/clubs";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetricConfig {
  key: keyof PriorYearFinancials;
  label: string;
  isRatio?: boolean;
  higherBetter: boolean | null; // null = neutral (player sales)
}

const METRICS: MetricConfig[] = [
  { key: "revenue",                  label: "Revenue",                    higherBetter: true },
  { key: "wage_bill",                label: "Wage Bill",                  higherBetter: false },
  { key: "wage_ratio",               label: "Wage Ratio",                 isRatio: true, higherBetter: false },
  { key: "operating_profit",         label: "Operating Profit / (Loss)",  higherBetter: true },
  { key: "profit_from_player_sales", label: "Player Sales Profit",        higherBetter: null },
  { key: "pre_tax_profit",           label: "Pre-tax Profit / (Loss)",    higherBetter: true },
  { key: "net_debt",                 label: "Net Debt",          higherBetter: false },
];

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtMoney(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}£${abs.toFixed(1)}m`;
}

function fmtRatio(v: number | null): string {
  if (v === null) return "—";
  return `${v.toFixed(1)}%`;
}

function fmt(v: number | null, isRatio?: boolean): string {
  return isRatio ? fmtRatio(v) : fmtMoney(v);
}

// ─── % change calculation ─────────────────────────────────────────────────────

function calcPct(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

// Is the direction of change an improvement?
function isImprovement(
  current: number | null,
  prior: number | null,
  higherBetter: boolean | null
): boolean | null {
  if (current === null || prior === null || higherBetter === null) return null;
  if (current === prior) return null;
  return higherBetter ? current > prior : current < prior;
}

function PctBadge({
  current,
  prior,
  higherBetter,
  isRatio,
}: {
  current: number | null;
  prior: number | null;
  higherBetter: boolean | null;
  isRatio?: boolean;
}) {
  if (current === null || prior === null) {
    return <span className="text-[#cccccc] text-[11px]">—</span>;
  }

  const pct = calcPct(current, prior);
  const improved = isImprovement(current, prior, higherBetter);

  // For ratio metrics, show pp change instead of %
  let label: string;
  if (isRatio) {
    const diff = current - prior;
    label = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pp`;
  } else if (pct !== null) {
    label = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  } else {
    return <span className="text-[#cccccc] text-[11px]">—</span>;
  }

  const color =
    improved === true
      ? "#4a9a6a"
      : improved === false
      ? "#9a4a4a"
      : "#999999";

  return (
    <span
      className="text-[11px] font-medium tabular-nums"
      style={{ color }}
    >
      {label}
    </span>
  );
}

// ─── Year label ───────────────────────────────────────────────────────────────

function fyLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function YearOnYearSection({ club }: { club: ClubFinancials }) {
  const py = club.prior_year;
  if (!py) return null;

  // Compute prior year wage_ratio if not supplied
  const pyWageRatio: number | null =
    py.wage_ratio !== null
      ? py.wage_ratio
      : py.wage_bill !== null && py.revenue !== null && py.revenue > 0
      ? Math.round((py.wage_bill / py.revenue) * 1000) / 10
      : null;

  const pyWithRatio: PriorYearFinancials = { ...py, wage_ratio: pyWageRatio };

  const currentLabel = fyLabel(club.fiscal_year_end);
  const priorLabel   = fyLabel(py.fiscal_year_end);

  // Current year values (keyed same as PriorYearFinancials)
  const current: Partial<Record<keyof PriorYearFinancials, number | null>> = {
    revenue:                  club.revenue,
    wage_bill:                club.wage_bill,
    wage_ratio:               club.wage_ratio,
    operating_profit:         club.operating_profit,
    profit_from_player_sales: club.profit_from_player_sales ?? null,
    pre_tax_profit:           club.pre_tax_profit,
    net_debt:                 club.net_debt,
  };

  return (
    <div className="border border-[#e0e0e0] overflow-hidden mt-6">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] border-b border-[#e0e0e0] bg-white">
        <div className="px-4 sm:px-6 py-4">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">Year-on-Year Comparison</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-right border-l border-[#e0e0e0] min-w-[80px] sm:min-w-[110px]">
          <p className="text-[9px] font-medium tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[#999999]">{currentLabel}</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-right border-l border-[#e0e0e0] min-w-[80px] sm:min-w-[110px]">
          <p className="text-[9px] font-medium tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[#aaaaaa]">{priorLabel}</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-right border-l border-[#e0e0e0] min-w-[60px] sm:min-w-[90px]">
          <p className="text-[9px] font-medium tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[#aaaaaa]">Chg</p>
        </div>
      </div>

      {/* Metric rows */}
      {METRICS.map((m) => {
        const curr = current[m.key] ?? null;
        const prev = pyWithRatio[m.key] ?? null;

        return (
          <div
            key={m.key as string}
            className="grid grid-cols-[1fr_auto_auto_auto] border-b border-[#f0f0f0] last:border-b-0 bg-white hover:bg-[#fafafa] transition-colors"
          >
            {/* Metric name */}
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999]">{m.label}</p>
            </div>

            {/* Current year */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 text-right border-l border-[#f0f0f0] min-w-[80px] sm:min-w-[110px]">
              <span className="text-xs sm:text-sm font-light tabular-nums text-[#111111]">
                {curr !== null ? fmt(curr, m.isRatio) : "—"}
              </span>
            </div>

            {/* Prior year */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 text-right border-l border-[#f0f0f0] min-w-[80px] sm:min-w-[110px]">
              <span className="text-xs sm:text-sm font-light tabular-nums text-[#aaaaaa]">
                {prev !== null ? fmt(prev as number, m.isRatio) : "—"}
              </span>
            </div>

            {/* % change */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 text-right border-l border-[#f0f0f0] min-w-[60px] sm:min-w-[90px]">
              <PctBadge
                current={curr as number | null}
                prior={prev as number | null}
                higherBetter={m.higherBetter}
                isRatio={m.isRatio}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
