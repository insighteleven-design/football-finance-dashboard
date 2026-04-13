"use client";

import { useState } from "react";
import type { DebtProfile } from "@/lib/deepDive";

interface Props {
  debt: DebtProfile | null;
  fiscalYearEnd: string;
  netDebt: number | null;
}

function fmt(v: number): string {
  return `£${Math.abs(v).toFixed(1)}m`;
}

/** Parse a repayment date string into a Date. Returns null for non-date strings. */
function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Format a Date as "Mon YYYY" */
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
  /** true = highlight red (due within 12 months) */
  urgent: boolean;
}

function buildRows(debt: DebtProfile, fyEnd: Date): DebtRow[] {
  const rows: DebtRow[] = [];

  if (debt.owner_loans?.amount != null) {
    const repDate = parseDate(debt.owner_loans.repayment_date);
    const urgent = repDate !== null && (repDate.getTime() - fyEnd.getTime()) < 365 * 24 * 60 * 60 * 1000;
    rows.push({
      type: "Owner / shareholder loans",
      amount: debt.owner_loans.amount,
      rate: debt.owner_loans.interest_rate,
      repayment: debt.owner_loans.repayment_date,
      security: debt.owner_loans.secured === false
        ? "Unsecured"
        : debt.owner_loans.secured === true
        ? "Secured"
        : null,
      color: urgent ? "#9a4a4a" : "#4a9a6a",
      urgent,
    });
  }

  if (debt.bank_debt?.amount != null) {
    const repDate = parseDate(debt.bank_debt.repayment_date);
    const urgent = repDate !== null && (repDate.getTime() - fyEnd.getTime()) < 365 * 24 * 60 * 60 * 1000;
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
    rows.push({
      type: "Transfer payables",
      amount: debt.transfer_payables,
      rate: null,
      repayment: null,
      security: null,
      color: "#4A90D9",
      urgent: false,
    });
  }

  if (debt.bond_debt?.amount != null) {
    const matDate = parseDate(debt.bond_debt.maturity);
    const urgent = matDate !== null && (matDate.getTime() - fyEnd.getTime()) < 365 * 24 * 60 * 60 * 1000;
    rows.push({
      type: "Bonds / debentures",
      amount: debt.bond_debt.amount,
      rate: null,
      repayment: debt.bond_debt.maturity,
      security: null,
      color: urgent ? "#9a4a4a" : "#9a4a4a",
      urgent,
    });
  }

  if (debt.other_debt) {
    rows.push({
      type: "Other",
      amount: null,
      rate: null,
      repayment: null,
      security: debt.other_debt,
      color: "#999999",
      urgent: false,
    });
  }

  return rows;
}

const SEGMENT_COLORS: Record<string, string> = {
  owner: "#4a9a6a",
  bank: "#E8A838",
  transfer: "#4A90D9",
  bond: "#9a4a4a",
  other: "#999999",
};

function generateObservations(debt: DebtProfile, fyEnd: Date, netDebt: number | null): string[] {
  const obs: string[] = [];

  const ownerAmt   = debt.owner_loans?.amount ?? 0;
  const bankAmt    = debt.bank_debt?.amount ?? 0;
  const transferAmt = debt.transfer_payables ?? 0;
  const bondAmt    = debt.bond_debt?.amount ?? 0;
  const total = ownerAmt + bankAmt + transferAmt + bondAmt;

  // Owner loan dominance
  if (ownerAmt > 0 && total > 0) {
    const pct = Math.round((ownerAmt / total) * 100);
    if (pct >= 50) {
      obs.push(
        `Owner / shareholder loans represent ${pct}% of total debt — the club is primarily equity-backed.`
      );
    }
  }

  // Interest-free owner loans
  const rate = debt.owner_loans?.interest_rate;
  if (rate && (rate === "0%" || rate.toLowerCase().includes("interest free") || rate.toLowerCase().includes("0%"))) {
    obs.push(`Shareholder loans carry no interest, reducing annual financing costs.`);
  }

  // Bank debt maturity risk
  if (bankAmt > 0 && debt.bank_debt?.repayment_date) {
    const repDate = parseDate(debt.bank_debt.repayment_date);
    if (repDate) {
      const msUntil = repDate.getTime() - fyEnd.getTime();
      const monthsUntil = msUntil / (1000 * 60 * 60 * 24 * 30);
      if (monthsUntil <= 12 && monthsUntil > 0) {
        obs.push(
          `${fmt(bankAmt)} ${debt.bank_debt.facility_type ?? "bank facility"} matures within 12 months of year end — near-term refinancing risk.`
        );
      } else if (monthsUntil > 12) {
        obs.push(
          `${fmt(bankAmt)} ${debt.bank_debt.facility_type ?? "bank facility"} due ${fmtMonth(repDate)}.${
            debt.bank_debt.security ? ` Secured on ${debt.bank_debt.security.toLowerCase()}.` : ""
          }`
        );
      }
    }
  }

  // Significant transfer payables
  if (transferAmt >= 10) {
    obs.push(`${fmt(transferAmt)} owed to other clubs for player purchases (transfer payables).`);
  }

  // Net cash position
  if (netDebt !== null && netDebt < 0) {
    obs.push(`The club holds a net cash position of ${fmt(Math.abs(netDebt))}.`);
  }

  // Debt notes from filing
  if (debt.total_debt_notes) {
    obs.push(debt.total_debt_notes);
  }

  return obs;
}

export default function DebtProfileSection({ debt, fiscalYearEnd, netDebt }: Props) {
  const [open, setOpen] = useState(false);

  const fyEnd = new Date(fiscalYearEnd);

  const hasData = debt !== null && (
    debt.owner_loans != null ||
    debt.bank_debt != null ||
    (debt.transfer_payables != null && debt.transfer_payables > 0) ||
    debt.bond_debt != null ||
    debt.other_debt != null ||
    debt.total_debt_notes != null
  );

  const rows = hasData && debt ? buildRows(debt, fyEnd) : [];
  const observations = hasData && debt ? generateObservations(debt, fyEnd, netDebt) : [];

  // Composition bar segments
  const ownerAmt   = debt?.owner_loans?.amount ?? 0;
  const bankAmt    = debt?.bank_debt?.amount ?? 0;
  const transferAmt = debt?.transfer_payables ?? 0;
  const bondAmt    = debt?.bond_debt?.amount ?? 0;
  const totalDebt  = ownerAmt + bankAmt + transferAmt + bondAmt;

  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-[#fafafa] transition-colors"
        aria-expanded={open}
      >
        <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999]">
          Debt Profile
        </p>
        <span
          className="text-[11px] text-[#cccccc] transition-transform duration-200 shrink-0"
          style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          →
        </span>
      </button>

      {/* Expandable content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "1200px" : "0px" }}
      >
        <div className="border-t border-[#e0e0e0] bg-white">
          {!hasData ? (
            <div className="px-6 py-5">
              <p className="text-sm text-[#aaaaaa] italic">
                Detailed debt breakdown not available from this filing.
              </p>
            </div>
          ) : (
            <>
              {/* Composition bar */}
              {totalDebt > 0 && (
                <div className="px-6 pt-5 pb-4">
                  <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
                    Debt Composition
                  </p>
                  <div className="h-6 flex overflow-hidden mb-3" style={{ borderRadius: "2px" }}>
                    {[
                      { amt: ownerAmt,    color: SEGMENT_COLORS.owner },
                      { amt: bankAmt,     color: SEGMENT_COLORS.bank },
                      { amt: transferAmt, color: SEGMENT_COLORS.transfer },
                      { amt: bondAmt,     color: SEGMENT_COLORS.bond },
                    ].map(({ amt, color }, idx) =>
                      amt > 0 ? (
                        <div
                          key={idx}
                          className="h-full"
                          style={{ width: `${(amt / totalDebt) * 100}%`, backgroundColor: color, minWidth: 2 }}
                        />
                      ) : null
                    )}
                  </div>
                  {/* Composition legend */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {[
                      { label: "Owner loans",       amt: ownerAmt,    color: SEGMENT_COLORS.owner },
                      { label: "Bank debt",          amt: bankAmt,     color: SEGMENT_COLORS.bank },
                      { label: "Transfer payables",  amt: transferAmt, color: SEGMENT_COLORS.transfer },
                      { label: "Bonds",              amt: bondAmt,     color: SEGMENT_COLORS.bond },
                    ].filter(({ amt }) => amt > 0).map(({ label, amt, color }) => (
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
                <div className="border-t border-[#e0e0e0] overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="border-b border-[#e0e0e0]">
                        {["Type", "Amount", "Interest Rate", "Repayment", "Security / Notes"].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-[9px] font-medium tracking-[0.15em] uppercase text-[#aaaaaa]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-[#f0f0f0] last:border-b-0 ${
                            row.urgent ? "bg-[#fdf7f7]" : ""
                          }`}
                        >
                          {/* Coloured left indicator + type */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-1 h-4 shrink-0 rounded-sm"
                                style={{ backgroundColor: row.color }}
                              />
                              <span className="text-[11px] text-[#333333]">{row.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-[11px] font-light tabular-nums text-[#111111]">
                            {row.amount != null ? fmt(row.amount) : "—"}
                          </td>
                          <td className="px-6 py-3.5 text-[11px] text-[#666666]">
                            {row.rate ?? "—"}
                          </td>
                          <td className="px-6 py-3.5">
                            {row.repayment ? (
                              <span
                                className={`text-[11px] ${
                                  row.urgent
                                    ? "text-[#9a4a4a] font-medium"
                                    : "text-[#666666]"
                                }`}
                              >
                                {(() => {
                                  const d = parseDate(row.repayment);
                                  return d ? fmtMonth(d) : row.repayment;
                                })()}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#cccccc]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-[11px] text-[#666666] max-w-[220px]">
                            {row.security ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Key observations */}
              {observations.length > 0 && (
                <div className="px-6 py-5 border-t border-[#e0e0e0]">
                  <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-3">
                    Key Observations
                  </p>
                  <ul className="space-y-1.5">
                    {observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#cccccc] text-[11px] mt-0.5 shrink-0">•</span>
                        <span className="text-[11px] text-[#555555] leading-relaxed">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
