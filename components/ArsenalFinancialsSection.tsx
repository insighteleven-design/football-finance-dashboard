"use client";

import { useState } from "react";
import type { ClubFinancials } from "@/lib/clubs";
import YearOnYearSection from "./YearOnYearSection";

// ─── Signal colours + tints ───────────────────────────────────────────────────
const GREEN = "#2e7d52";
const RED   = "#9a3030";
const AMBER = "#c47900";

const SIGNAL_BG: Record<string, string> = {
  [GREEN]: "#f2fbf5",
  [RED]:   "#fdf3f3",
  [AMBER]: "#fdfaf0",
};

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
function fyLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
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

// ─── Subtext helpers ─────────────────────────────────────────────────────────
function wageSubtext(current: number | null, prior: number | null): string {
  if (current === null) return "";
  const dir = prior === null ? "" : current < prior ? "Improving" : current > prior ? "Worsening" : "Stable";
  const pos = current < 55 ? "well below 55% threshold" : current < 70 ? "above 55% threshold" : "exceeds 70%";
  return dir ? `${dir} · ${pos}` : pos;
}
function profitSubtext(current: number | null, prior: number | null): string {
  if (current === null) return "";
  if (current >= 0) return prior !== null && current > prior ? "Operating profit growing" : "Operating profit";
  if (prior !== null && prior < 0) return current < prior ? "Operating loss widening" : "Operating loss narrowing";
  return prior !== null && prior >= 0 ? "Moved to operating loss" : "Operating loss";
}
function debtSubtext(current: number | null, prior: number | null): string {
  if (current === null) return "";
  if (current <= 0) return "Net cash position";
  if (prior === null || prior <= 0) return `Net debt: ${fmtMoney(current)}`;
  const diff = current - prior;
  return `Growing · ${diff > 0 ? "up" : "down"} £${Math.abs(Math.round(diff))}m YoY`;
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
      fontSize: "13px",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#111111",
      margin: "0 0 16px 0",
      paddingBottom: "10px",
      borderBottom: "2px solid #111111",
    }}>
      {children}
    </p>
  );
}

// ─── Tier 1: KFI card ─────────────────────────────────────────────────────────
function HealthCard({
  label, value, subtext, signal, dots,
}: {
  label: string; value: string; subtext: string; signal: string; dots: string[];
}) {
  const bg = SIGNAL_BG[signal] ?? "white";
  return (
    <div style={{
      borderTop: "1px solid #eeeeee",
      borderRight: "1px solid #eeeeee",
      borderBottom: "1px solid #eeeeee",
      borderLeft: `4px solid ${signal}`,
      padding: "28px 24px 22px",
      background: bg,
    }}>
      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: signal, margin: "0 0 12px 0", opacity: 0.85 }}>
        {label}
      </p>
      <p style={{ fontSize: "clamp(32px, 6vw, 42px)", fontWeight: 700, color: signal, fontVariantNumeric: "tabular-nums", lineHeight: 1, margin: "0 0 10px 0" }}>
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
function MetricTile({
  label, value, current, prior, higherBetter, sparkValues,
}: {
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function ArsenalFinancialsSection({ club }: { club: ClubFinancials }) {
  const py = club.prior_year ?? null;
  const [fullView, setFullView] = useState<"table" | "chart">("table");

  // ── Chronological snapshots for trend dots ────────────────────────────────
  const snapList = [
    ...(club.data2022 ? [{ wage_ratio: club.data2022.wage_ratio, operating_profit: club.data2022.operating_profit, net_debt: club.data2022.net_debt }] : []),
    ...(club.data2023 ? [{ wage_ratio: club.data2023.wage_ratio, operating_profit: club.data2023.operating_profit, net_debt: club.data2023.net_debt }] : []),
    ...(py            ? [{ wage_ratio: py.wage_ratio,            operating_profit: py.operating_profit,            net_debt: py.net_debt            }] : []),
    { wage_ratio: club.wage_ratio, operating_profit: club.operating_profit, net_debt: club.net_debt },
  ];

  const wageDots   = snapList.map(s => wageSignal(s.wage_ratio ?? null));
  const profitDots = snapList.map(s => profitSignal(s.operating_profit ?? null));
  const debtDots   = snapList.map(s => debtDotSignal(s.net_debt ?? null));

  // ── Sparkline series ────────────────────────────────────────────────────────
  const revenueVals: (number | null)[] = [club.data2022?.revenue ?? null, club.data2023?.revenue ?? null, py?.revenue ?? null, club.revenue];
  const wageVals:    (number | null)[] = [club.data2022?.wage_bill ?? null, club.data2023?.wage_bill ?? null, py?.wage_bill ?? null, club.wage_bill];
  const playerVals:  (number | null)[] = [club.data2022?.profit_from_player_sales ?? null, club.data2023?.profit_from_player_sales ?? null, py?.profit_from_player_sales ?? null, club.profit_from_player_sales ?? null];
  const pretaxVals:  (number | null)[] = [club.data2022?.pre_tax_profit ?? null, club.data2023?.pre_tax_profit ?? null, py?.pre_tax_profit ?? null, club.pre_tax_profit];

  // ── Labels ─────────────────────────────────────────────────────────────────
  const firstYear  = club.data2022 ?? club.data2023 ?? py;
  const firstLabel = firstYear ? fyLabel(firstYear.fiscal_year_end) : fyLabel(club.fiscal_year_end);
  const lastLabel  = fyLabel(club.fiscal_year_end);

  return (
    <div>
      {/* ── TIER 1: Key Financial Indicators ─────────────────────────────────── */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeading>Key Financial Indicators</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HealthCard
            label="Wage Efficiency"
            value={fmtRatio(club.wage_ratio)}
            subtext={wageSubtext(club.wage_ratio, py?.wage_ratio ?? null)}
            signal={wageSignal(club.wage_ratio)}
            dots={wageDots}
          />
          <HealthCard
            label="Profitability"
            value={fmtMoney(club.operating_profit)}
            subtext={profitSubtext(club.operating_profit, py?.operating_profit ?? null)}
            signal={profitSignal(club.operating_profit)}
            dots={profitDots}
          />
          <HealthCard
            label="Debt Position"
            value={fmtMoney(club.net_debt)}
            subtext={debtSubtext(club.net_debt, py?.net_debt ?? null)}
            signal={debtCardSignal(club.net_debt, py?.net_debt ?? null)}
            dots={debtDots}
          />
        </div>
      </div>

      {/* ── TIER 2: Latest Accounts ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "36px" }}>
        <SectionHeading>Latest Accounts · {lastLabel}</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            label="Revenue"
            value={fmtMoney(club.revenue)}
            current={club.revenue}
            prior={py?.revenue ?? null}
            higherBetter={true}
            sparkValues={revenueVals}
          />
          <MetricTile
            label="Wage Bill"
            value={fmtMoney(club.wage_bill)}
            current={club.wage_bill}
            prior={py?.wage_bill ?? null}
            higherBetter={false}
            sparkValues={wageVals}
          />
          <MetricTile
            label="Player Sales"
            value={fmtMoney(club.profit_from_player_sales ?? null)}
            current={club.profit_from_player_sales ?? null}
            prior={py?.profit_from_player_sales ?? null}
            higherBetter={null}
            sparkValues={playerVals}
          />
          <MetricTile
            label="Pre-tax Profit"
            value={fmtMoney(club.pre_tax_profit)}
            current={club.pre_tax_profit}
            prior={py?.pre_tax_profit ?? null}
            higherBetter={true}
            sparkValues={pretaxVals}
          />
        </div>
      </div>

      {/* ── TIER 3: Full Accounts ─────────────────────────────────────────────── */}
      <div>
        <SectionHeading>Full Accounts · {firstLabel} – {lastLabel}</SectionHeading>

        {/* Table / Chart toggle */}
        <div className="flex overflow-x-auto" style={{ borderBottom: "1px solid #eeeeee", marginBottom: "20px" }}>
          {(["table", "chart"] as const).map(v => (
            <button
              key={v}
              onClick={() => setFullView(v)}
              style={{
                padding: "12px 24px",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: "none",
                borderBottom: fullView === v ? "2px solid #111111" : "2px solid transparent",
                marginBottom: "-1px",
                background: "none",
                color: fullView === v ? "#111111" : "#aaaaaa",
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: "44px",
                flexShrink: 0,
              }}
            >
              {v === "table" ? "Table" : "Chart"}
            </button>
          ))}
        </div>

        <YearOnYearSection club={club} view={fullView} />
      </div>
    </div>
  );
}
