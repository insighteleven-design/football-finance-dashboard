"use client";

import { Fragment, useState } from "react";
import { clubs, fmt, type ClubFinancials, type Division } from "@/lib/clubs";
import type { RevenueBreakdown, DebtProfile } from "@/lib/deepDive";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  club: ClubFinancials;
  compareDivision: Division;
  compareLabel: string;
  breakdown: RevenueBreakdown | null;
  debt: DebtProfile | null;
}

// ─── Metrics config ───────────────────────────────────────────────────────────

const ALL_METRICS: {
  key: keyof ClubFinancials;
  label: string;
  isRatio?: boolean;
  diverging?: boolean;
  higherBetter: boolean | null;
  expandable?: "revenue" | "debt";
}[] = [
  { key: "revenue",          label: "Revenue",          higherBetter: true,  expandable: "revenue" },
  { key: "wage_bill",        label: "Wage Bill",        higherBetter: false },
  { key: "wage_ratio",       label: "Wage Ratio",       isRatio: true, higherBetter: false },
  { key: "operating_profit", label: "Operating Profit", diverging: true, higherBetter: true },
  { key: "pre_tax_profit",   label: "Pre-tax Profit",   diverging: true, higherBetter: true },
  { key: "net_debt",         label: "Net Debt",         diverging: true, higherBetter: false, expandable: "debt" },
];

// ─── Division stats ───────────────────────────────────────────────────────────

function divisionStats(division: string, key: keyof ClubFinancials) {
  const vals = clubs
    .filter((c) => c.division === division && c[key] !== null)
    .map((c) => c[key] as number);
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

// ─── Revenue breakdown panel ─────────────────────────────────────────────────

const REV_SEGMENTS = [
  { key: "matchday",     label: "Matchday",     color: "#4A90D9" },
  { key: "broadcasting", label: "Broadcasting", color: "#9B59B6" },
  { key: "commercial",   label: "Commercial",   color: "#E8A838" },
] as const;

function fmtGbp(v: number) {
  return `£${v.toFixed(1)}m`;
}

function RevenuePanel({ breakdown, totalRevenue }: { breakdown: RevenueBreakdown | null; totalRevenue: number | null }) {
  const hasData =
    breakdown !== null &&
    (breakdown.matchday !== null || breakdown.broadcasting !== null || breakdown.commercial !== null);

  const knownSum =
    (breakdown?.matchday ?? 0) + (breakdown?.broadcasting ?? 0) + (breakdown?.commercial ?? 0);
  const denominator = totalRevenue && totalRevenue > knownSum ? totalRevenue : knownSum;
  const otherAmount = denominator - knownSum;

  if (!hasData) {
    return (
      <p className="text-sm text-[#aaaaaa] italic">Revenue breakdown not disclosed in this filing.</p>
    );
  }

  return (
    <>
      {/* Stacked bar */}
      <div className="h-7 flex overflow-hidden mb-5" style={{ borderRadius: "2px" }}>
        {REV_SEGMENTS.map(({ key, color }) => {
          const val = breakdown![key];
          if (val === null || denominator === 0) return null;
          const pct = (val / denominator) * 100;
          return (
            <div
              key={key}
              className="h-full"
              style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? 2 : 0 }}
            />
          );
        })}
        {otherAmount > 0.5 && denominator > 0 && (
          <div
            className="h-full"
            style={{ width: `${(otherAmount / denominator) * 100}%`, backgroundColor: "#dddddd", minWidth: 2 }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {REV_SEGMENTS.map(({ key, label, color }) => {
          const val = breakdown![key];
          const pct = val !== null && denominator > 0 ? (val / denominator) * 100 : null;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-[#666666] w-28">{label}</span>
              <span className="text-[11px] font-light tabular-nums text-[#111111] w-14">
                {val !== null ? fmtGbp(val) : "—"}
              </span>
              <span className="text-[11px] text-[#aaaaaa] tabular-nums">
                {pct !== null ? `${pct.toFixed(0)}%` : "—"}
              </span>
            </div>
          );
        })}
        {otherAmount > 0.5 && (
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#dddddd" }} />
            <span className="text-[11px] text-[#999999] w-28">Other / unallocated</span>
            <span className="text-[11px] font-light tabular-nums text-[#aaaaaa] w-14">{fmtGbp(otherAmount)}</span>
            <span className="text-[11px] text-[#cccccc] tabular-nums">
              {denominator > 0 ? `${((otherAmount / denominator) * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Debt profile panel ───────────────────────────────────────────────────────

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

interface DebtRow {
  type: string;
  amount: number | null;
  rate: string | null;
  repayment: string | null;
  security: string | null;
  color: string;
  urgent: boolean;
}

function buildDebtRows(debt: DebtProfile, fyEnd: Date): DebtRow[] {
  const rows: DebtRow[] = [];
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  if (debt.owner_loans?.amount != null) {
    const repDate = parseDate(debt.owner_loans.repayment_date);
    const urgent = repDate !== null && repDate.getTime() - fyEnd.getTime() < oneYear;
    rows.push({
      type: "Owner / shareholder loans",
      amount: debt.owner_loans.amount,
      rate: debt.owner_loans.interest_rate,
      repayment: debt.owner_loans.repayment_date,
      security: debt.owner_loans.secured === false ? "Unsecured" : debt.owner_loans.secured === true ? "Secured" : null,
      color: urgent ? "#9a4a4a" : "#4a9a6a",
      urgent,
    });
  }

  if (debt.bank_debt?.amount != null) {
    const repDate = parseDate(debt.bank_debt.repayment_date);
    const urgent = repDate !== null && repDate.getTime() - fyEnd.getTime() < oneYear;
    rows.push({
      type: debt.bank_debt.facility_type ?? "Bank debt",
      amount: debt.bank_debt.amount,
      rate: null,
      repayment: debt.bank_debt.repayment_date,
      security: debt.bank_debt.security,
      color: urgent ? "#9a4a4a" : "#E8A838",
      urgent,
    });
  }

  if (debt.transfer_payables != null && debt.transfer_payables > 0) {
    rows.push({ type: "Transfer payables", amount: debt.transfer_payables, rate: null, repayment: null, security: null, color: "#4A90D9", urgent: false });
  }

  if (debt.bond_debt?.amount != null) {
    const matDate = parseDate(debt.bond_debt.maturity);
    const urgent = matDate !== null && matDate.getTime() - fyEnd.getTime() < oneYear;
    rows.push({ type: "Bonds / debentures", amount: debt.bond_debt.amount, rate: null, repayment: debt.bond_debt.maturity, security: null, color: "#9a4a4a", urgent });
  }

  if (debt.other_debt) {
    rows.push({ type: "Other", amount: null, rate: null, repayment: null, security: debt.other_debt, color: "#999999", urgent: false });
  }

  return rows;
}

function buildObservations(debt: DebtProfile, fyEnd: Date, netDebt: number | null): string[] {
  const obs: string[] = [];
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  const ownerAmt    = debt.owner_loans?.amount ?? 0;
  const bankAmt     = debt.bank_debt?.amount ?? 0;
  const transferAmt = debt.transfer_payables ?? 0;
  const bondAmt     = debt.bond_debt?.amount ?? 0;
  const total = ownerAmt + bankAmt + transferAmt + bondAmt;

  if (ownerAmt > 0 && total > 0) {
    const pct = Math.round((ownerAmt / total) * 100);
    if (pct >= 50) obs.push(`Owner / shareholder loans represent ${pct}% of total debt — the club is primarily equity-backed.`);
  }

  const rate = debt.owner_loans?.interest_rate;
  if (rate && (rate === "0%" || rate.toLowerCase().includes("interest free") || rate.toLowerCase().includes("0%"))) {
    obs.push(`Shareholder loans carry no interest, reducing annual financing costs.`);
  }

  if (bankAmt > 0 && debt.bank_debt?.repayment_date) {
    const repDate = parseDate(debt.bank_debt.repayment_date);
    if (repDate) {
      const msUntil = repDate.getTime() - fyEnd.getTime();
      const monthsUntil = msUntil / (1000 * 60 * 60 * 24 * 30);
      if (monthsUntil <= 12 && monthsUntil > 0) {
        obs.push(`£${bankAmt.toFixed(1)}m ${debt.bank_debt.facility_type ?? "bank facility"} matures within 12 months of year end — near-term refinancing risk.`);
      } else if (monthsUntil > 12) {
        obs.push(`£${bankAmt.toFixed(1)}m ${debt.bank_debt.facility_type ?? "bank facility"} due ${fmtMonth(repDate)}.${debt.bank_debt.security ? ` Secured on ${debt.bank_debt.security.toLowerCase()}.` : ""}`);
      }
    }
  }

  if (transferAmt >= 10) obs.push(`£${transferAmt.toFixed(1)}m owed to other clubs for player purchases (transfer payables).`);
  if (netDebt !== null && netDebt < 0) obs.push(`The club holds a net cash position of £${Math.abs(netDebt).toFixed(1)}m.`);
  if (debt.total_debt_notes) obs.push(debt.total_debt_notes);

  return obs;
}

const DEBT_SEGMENT_COLORS = { owner: "#4a9a6a", bank: "#E8A838", transfer: "#4A90D9", bond: "#9a4a4a" };

function DebtPanel({ debt, fiscalYearEnd, netDebt }: { debt: DebtProfile | null; fiscalYearEnd: string; netDebt: number | null }) {
  const fyEnd = new Date(fiscalYearEnd);
  const hasData =
    debt !== null &&
    (debt.owner_loans != null ||
      debt.bank_debt != null ||
      (debt.transfer_payables != null && debt.transfer_payables > 0) ||
      debt.bond_debt != null ||
      debt.other_debt != null ||
      debt.total_debt_notes != null);

  if (!hasData) {
    return <p className="text-sm text-[#aaaaaa] italic">Detailed debt breakdown not available from this filing.</p>;
  }

  const rows = buildDebtRows(debt!, fyEnd);
  const observations = buildObservations(debt!, fyEnd, netDebt);

  const ownerAmt    = debt!.owner_loans?.amount ?? 0;
  const bankAmt     = debt!.bank_debt?.amount ?? 0;
  const transferAmt = debt!.transfer_payables ?? 0;
  const bondAmt     = debt!.bond_debt?.amount ?? 0;
  const totalDebt   = ownerAmt + bankAmt + transferAmt + bondAmt;

  return (
    <div className="-mx-6 -mb-5">
      {/* Composition bar */}
      {totalDebt > 0 && (
        <div className="px-6 pt-5 pb-4 border-b border-[#e0e0e0]">
          <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">Debt Composition</p>
          <div className="h-6 flex overflow-hidden mb-3" style={{ borderRadius: "2px" }}>
            {[
              { amt: ownerAmt,    color: DEBT_SEGMENT_COLORS.owner },
              { amt: bankAmt,     color: DEBT_SEGMENT_COLORS.bank },
              { amt: transferAmt, color: DEBT_SEGMENT_COLORS.transfer },
              { amt: bondAmt,     color: DEBT_SEGMENT_COLORS.bond },
            ].map(({ amt, color }, i) =>
              amt > 0 ? (
                <div key={i} className="h-full" style={{ width: `${(amt / totalDebt) * 100}%`, backgroundColor: color, minWidth: 2 }} />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {[
              { label: "Owner loans",      amt: ownerAmt,    color: DEBT_SEGMENT_COLORS.owner },
              { label: "Bank debt",         amt: bankAmt,     color: DEBT_SEGMENT_COLORS.bank },
              { label: "Transfer payables", amt: transferAmt, color: DEBT_SEGMENT_COLORS.transfer },
              { label: "Bonds",             amt: bondAmt,     color: DEBT_SEGMENT_COLORS.bond },
            ]
              .filter(({ amt }) => amt > 0)
              .map(({ label, amt, color }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-[#666666]">{label}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Debt table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border-b border-[#e0e0e0]">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                {["Type", "Amount", "Interest Rate", "Repayment", "Security / Notes"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[9px] font-medium tracking-[0.15em] uppercase text-[#aaaaaa]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={`border-b border-[#f0f0f0] last:border-b-0 ${row.urgent ? "bg-[#fdf7f7]" : ""}`}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-4 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
                      <span className="text-[11px] text-[#333333]">{row.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[11px] font-light tabular-nums text-[#111111]">
                    {row.amount != null ? `£${Math.abs(row.amount).toFixed(1)}m` : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-[11px] text-[#666666]">{row.rate ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    {row.repayment ? (
                      <span className={`text-[11px] ${row.urgent ? "text-[#9a4a4a] font-medium" : "text-[#666666]"}`}>
                        {(() => { const d = parseDate(row.repayment); return d ? fmtMonth(d) : row.repayment; })()}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#cccccc]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-[11px] text-[#666666] max-w-[220px]">{row.security ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Observations */}
      {observations.length > 0 && (
        <div className="px-6 py-5">
          <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">Key Observations</p>
          <ul className="space-y-1.5">
            {observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#cccccc] text-[11px] mt-0.5 shrink-0">•</span>
                <span className="text-[11px] text-[#555555] leading-relaxed">{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Expand chevron ───────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      className="inline-block text-[11px] text-[#cccccc] transition-transform duration-200 shrink-0"
      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
    >
      →
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MetricsGrid({ club, compareDivision, compareLabel, breakdown, debt }: Props) {
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">
      {/* Column headers */}
      <div className="px-6 py-4 bg-white border-b border-r border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">Financial Figures</p>
      </div>
      <div className="px-6 py-4 bg-white border-b border-[#e0e0e0]">
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">
          vs {compareLabel} Average
        </p>
      </div>

      {/* Metric rows */}
      {ALL_METRICS.map((m) => {
        const val = club[m.key] as number | null;
        const stats = divisionStats(compareDivision, m.key);
        const rank = val !== null && stats ? stats.sorted.indexOf(val) + 1 : null;

        const scale = stats ? Math.max(stats.maxAbs, Math.abs(stats.avg), 0.01) : 1;
        const clubPct = val !== null ? Math.min((Math.abs(val) / scale) * 100, 100) : 0;
        const avgPct = stats ? Math.min((Math.abs(stats.avg) / scale) * 100, 100) : 0;

        const barColor = val !== null && stats ? vsAvgColor(val, stats.avg, m.higherBetter) : "#cccccc";

        const isRevenue = m.expandable === "revenue";
        const isDebt = m.expandable === "debt";
        const expandOpen = isRevenue ? revenueOpen : isDebt ? debtOpen : false;
        const toggleExpand = isRevenue
          ? () => setRevenueOpen((o) => !o)
          : isDebt
          ? () => setDebtOpen((o) => !o)
          : undefined;

        return (
          <Fragment key={m.key as string}>
            {/* Left cell */}
            <div
              className={`px-6 py-5 border-b border-r border-[#e0e0e0] bg-white${toggleExpand ? " cursor-pointer hover:bg-[#fafafa] transition-colors" : ""}`}
              onClick={toggleExpand}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999]">{m.label}</p>
                {toggleExpand && <Chevron open={expandOpen} />}
              </div>
              {val !== null ? (
                <p className="text-2xl font-light tabular-nums text-[#111111]">{fmt(val, m.isRatio)}</p>
              ) : (
                <p className="text-2xl font-light text-[#cccccc]">—</p>
              )}
              {stats && rank !== null && (
                <p className="text-[10px] text-[#aaaaaa] mt-1.5">
                  #{rank} <span className="text-[#cccccc]">of {stats.count}</span>
                </p>
              )}
            </div>

            {/* Right cell */}
            <div className="px-6 py-5 border-b border-[#e0e0e0] bg-white">
              <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">{m.label}</p>

              {/* Club bar */}
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging ? (
                    <DivergingBar value={val ?? 0} scale={scale / 2} color={val !== null ? barColor : "#cccccc"} />
                  ) : (
                    <StandardBar pct={clubPct} color={val !== null ? barColor : "#eeeeee"} />
                  )}
                  <span className="text-xs font-medium tabular-nums text-[#111111] w-14 text-right shrink-0">
                    {fmt(val, m.isRatio)}
                  </span>
                </div>
                <p className="text-[9px] text-[#aaaaaa] tracking-[0.05em]">This club</p>
              </div>

              {/* Division avg bar */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  {m.diverging && stats ? (
                    <DivergingBar value={stats.avg} scale={scale / 2} color="#cccccc" />
                  ) : (
                    <StandardBar pct={avgPct} color="#cccccc" />
                  )}
                  <span className="text-xs tabular-nums text-[#aaaaaa] w-14 text-right shrink-0">
                    {stats ? fmt(stats.avg, m.isRatio) : "—"}
                  </span>
                </div>
                <p className="text-[9px] text-[#cccccc] tracking-[0.05em]">Division avg</p>
              </div>
            </div>

            {/* Inline expansion panels */}
            {isRevenue && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: revenueOpen ? "600px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">Revenue Breakdown</p>
                  <RevenuePanel breakdown={breakdown} totalRevenue={club.revenue} />
                </div>
              </div>
            )}

            {isDebt && (
              <div
                className="col-span-full border-b border-[#e0e0e0] overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: debtOpen ? "1400px" : "0px" }}
              >
                <div className="px-6 py-5 bg-[#fafafa] border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-4">Debt Profile</p>
                  <DebtPanel debt={debt} fiscalYearEnd={club.fiscal_year_end} netDebt={club.net_debt} />
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
