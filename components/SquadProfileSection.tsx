"use client";

import { useState } from "react";
import { type LeaguePositionData, type SquadProfile } from "@/lib/squadProfile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numAvg(arr: (number | null)[]): number | null {
  const vals = arr.filter((v): v is number => typeof v === "number");
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function ageLabel(age: number): { text: string; color: string } {
  if (age < 24)  return { text: "Young squad",  color: "#4a9a6a" };
  if (age <= 27) return { text: "Peak age",      color: "#888888" };
  return              { text: "Ageing squad",    color: "#c8884a" };
}

function deltaColor(delta: number, higherBetter: boolean): string {
  if (Math.abs(delta) < 0.05) return "#aaaaaa";
  return (higherBetter ? delta > 0 : delta < 0) ? "#4a9a6a" : "#9a4a4a";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  subColor,
  delta,
  deltaHigherBetter,
  avgLabel,
  border,
  children,
}: {
  label:              string;
  value:              string;
  sub?:               string;
  subColor?:          string;
  delta?:             number | null;
  deltaHigherBetter?: boolean;
  avgLabel?:          string;
  border:             string;
  children?:          React.ReactNode;
}) {
  const dColor = delta != null && deltaHigherBetter != null
    ? deltaColor(delta, deltaHigherBetter) : "#aaaaaa";
  const sign = delta != null && delta >= 0 ? "+" : "";

  return (
    <div className={`${border}`}>
      <div className="px-4 sm:px-6 py-5">
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-2">
          {label}
        </p>
        {value === "—" ? (
          <p className="text-3xl sm:text-5xl font-medium text-[#cccccc]">—</p>
        ) : (
          <p className="text-3xl sm:text-5xl font-medium tabular-nums text-[#111111]">{value}</p>
        )}
        {sub && (
          <p className="text-sm font-medium mt-1" style={{ color: subColor ?? "#888888" }}>{sub}</p>
        )}
        {delta != null && avgLabel && (
          <p className="text-sm mt-1.5">
            <span className="tabular-nums font-medium" style={{ color: dColor }}>
              {sign}{delta.toFixed(1)}
            </span>
            <span className="text-[#bbbbbb]"> vs {avgLabel} avg</span>
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Age Distribution Dropdown ────────────────────────────────────────────────

const AGE_BANDS = [
  { key: "under_21"  as const, label: "Under 21" },
  { key: "age_21_23" as const, label: "21–23" },
  { key: "age_24_26" as const, label: "24–26" },
  { key: "age_27_29" as const, label: "27–29" },
  { key: "over_30"   as const, label: "30+" },
];

function AgeDistributionDropdown({ profile }: { profile: SquadProfile }) {
  const [open, setOpen] = useState(false);
  const bands = profile.age_bands ?? null;

  const total = bands
    ? AGE_BANDS.reduce((sum, b) => sum + (bands[b.key] ?? 0), 0)
    : 0;

  const maxCount = bands
    ? Math.max(...AGE_BANDS.map(b => bands[b.key] ?? 0), 1)
    : 1;

  return (
    <div className="border-t border-[#e0e0e0] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left bg-white hover:bg-[#fafafa] transition-colors"
        aria-expanded={open}
      >
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#aaaaaa]">
          Age Distribution
        </p>
        <span
          className="text-sm text-[#cccccc] transition-transform duration-200 shrink-0"
          style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          →
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "400px" : "0px" }}
      >
        <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-[#f0f0f0] bg-white">
          {!bands || total === 0 ? (
            <p className="text-sm text-[#bbbbbb]">Age distribution data not yet available.</p>
          ) : (
            <div className="space-y-2.5">
              {AGE_BANDS.map(({ key, label }) => {
                const count = bands[key] ?? 0;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-[#888888] w-16 shrink-0">{label}</span>
                    <div className="flex-1 h-4 bg-[#f5f5f5] overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: "#cccccc" }}
                      />
                    </div>
                    <span className="text-sm tabular-nums text-[#555555] w-5 text-right shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-[#bbbbbb] mt-1">
                {total} players · Source: Transfermarkt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Contract Risk ────────────────────────────────────────────────────────────

function ContractRiskPanel({ profile }: { profile: SquadProfile }) {
  const exp = profile.contract_expiry;

  if (!exp) {
    return (
      <div>
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
          Contract Risk
        </p>
        <p className="text-sm text-[#aaaaaa]">Contract data unavailable.</p>
      </div>
    );
  }

  const r     = exp["0-12m"]  ?? 0;
  const a     = exp["12-24m"] ?? 0;
  const g     = exp["24m+"]   ?? 0;
  const total = r + a + g;

  if (total === 0) {
    return (
      <div>
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
          Contract Risk
        </p>
        <p className="text-sm text-[#aaaaaa]">No contract data available.</p>
      </div>
    );
  }

  const rPct = (r / total) * 100;
  const aPct = (a / total) * 100;
  const gPct = (g / total) * 100;

  const risk = r >= 8 ? "elevated renewal risk" : r >= 4 ? "moderate renewal risk" : "low renewal risk";
  const summary = `${r} player${r !== 1 ? "s" : ""} out of contract within 12 months — ${risk}`;

  return (
    <div>
      <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
        Contract Risk
      </p>
      <div className="border border-[#e0e0e0] overflow-hidden">
        {/* Stacked bar */}
        <div className="flex h-14">
          {rPct > 0 && (
            <div
              className="flex items-center justify-center text-white text-sm font-semibold tabular-nums shrink-0 min-w-0"
              style={{ width: `${rPct}%`, backgroundColor: "#9a4a4a" }}
            >
              {rPct > 8 && r}
            </div>
          )}
          {aPct > 0 && (
            <div
              className="flex items-center justify-center text-white text-sm font-semibold tabular-nums shrink-0 min-w-0"
              style={{ width: `${aPct}%`, backgroundColor: "#c8884a" }}
            >
              {aPct > 8 && a}
            </div>
          )}
          {gPct > 0 && (
            <div
              className="flex items-center justify-center text-white text-sm font-semibold tabular-nums shrink-0 min-w-0"
              style={{ width: `${gPct}%`, backgroundColor: "#4a9a6a" }}
            >
              {gPct > 8 && g}
            </div>
          )}
        </div>

        {/* Legend + summary */}
        <div className="px-4 sm:px-6 py-4 border-t border-[#e0e0e0]">
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
            {[
              { label: "0–12 months",  count: r, color: "#9a4a4a" },
              { label: "12–24 months", count: a, color: "#c8884a" },
              { label: "24+ months",   count: g, color: "#4a9a6a" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-[#555555]">
                  <span className="font-semibold tabular-nums">{count}</span>
                  <span className="text-[#999999]"> {label}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#555555]">{summary}</p>
          <p className="text-xs text-[#aaaaaa] mt-2">
            Source: Transfermarkt (crowdsourced — may not reflect current contracts)
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer Activity ────────────────────────────────────────────────────────

function TransferActivityPanel({ profile }: { profile: SquadProfile }) {
  const ta = profile.transfer_activity;

  if (!ta || ta.length === 0) {
    return (
      <div>
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
          Transfer Activity
        </p>
        <p className="text-sm text-[#aaaaaa]">No transfer data available.</p>
      </div>
    );
  }

  const rows = [...ta].sort((a, b) => b.season.localeCompare(a.season));

  const totalNet    = rows.reduce((s, r) => s + (r.net_eur_m          ?? 0), 0);
  const totalIncome = rows.reduce((s, r) => s + (r.gross_income_eur_m ?? 0), 0);
  const totalSpend  = rows.reduce((s, r) => s + (r.gross_spend_eur_m  ?? 0), 0);

  const netColor = (n: number) =>
    n >  0.5 ? "#4a9a6a" :
    n < -0.5 ? "#9a4a4a" : "#888888";

  const fmtNet = (n: number) =>
    `${n >= 0 ? "+" : "-"}€${Math.abs(n).toFixed(1)}m`;

  return (
    <div>
      <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
        Transfer Activity
      </p>
      <div className="border border-[#e0e0e0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
              <th className="px-4 py-2.5 text-left   font-semibold tracking-[0.04em] uppercase text-[#999999] text-xs">Season</th>
              <th className="px-4 py-2.5 text-right  font-semibold tracking-[0.04em] uppercase text-[#999999] text-xs">Income</th>
              <th className="px-4 py-2.5 text-right  font-semibold tracking-[0.04em] uppercase text-[#999999] text-xs">Spend</th>
              <th className="px-4 py-2.5 text-right  font-semibold tracking-[0.04em] uppercase text-[#999999] text-xs">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const net = r.net_eur_m ?? 0;
              return (
                <tr key={r.season} className={i < rows.length - 1 ? "border-b border-[#f0f0f0]" : ""}>
                  <td className="px-4 py-2.5 tabular-nums text-[#555555]">{r.season}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#555555]">
                    €{(r.gross_income_eur_m ?? 0).toFixed(1)}m
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#555555]">
                    €{(r.gross_spend_eur_m ?? 0).toFixed(1)}m
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold" style={{ color: netColor(net) }}>
                    {fmtNet(net)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-[#e0e0e0] bg-[#fafafa] flex items-center justify-between gap-4">
          <p className="text-xs text-[#bbbbbb]">
            Source: Transfermarkt · {rows.length} seasons: €{totalIncome.toFixed(0)}m in / €{totalSpend.toFixed(0)}m out
          </p>
          <p className="text-sm tabular-nums font-semibold shrink-0" style={{ color: netColor(totalNet) }}>
            Net: {fmtNet(totalNet)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── League Value Ranking ─────────────────────────────────────────────────────

function LeagueValueRankingPanel({
  currentSlug,
  leagueEntries,
  leagueLabel,
}: {
  currentSlug:   string;
  leagueEntries: { name: string; slug: string; profile: SquadProfile }[];
  leagueLabel:   string;
}) {
  const ranked = [...leagueEntries]
    .filter(e => e.profile.squad_value_eur_m != null)
    .sort((a, b) => (b.profile.squad_value_eur_m ?? 0) - (a.profile.squad_value_eur_m ?? 0));

  if (ranked.length === 0) {
    return (
      <p className="text-sm text-[#aaaaaa]">
        No squad value data available for {leagueLabel} clubs.
      </p>
    );
  }

  const maxValue = ranked[0].profile.squad_value_eur_m!;

  return (
    <div className="space-y-2.5">
      {ranked.map((entry, i) => {
        const isCurrent = entry.slug === currentSlug;
        const val = entry.profile.squad_value_eur_m!;
        const pct = maxValue > 0 ? (val / maxValue) * 100 : 0;
        return (
          <div key={entry.slug} className="flex items-center gap-3">
            <span className="w-5 text-right text-xs text-[#bbbbbb] tabular-nums shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm truncate ${isCurrent ? "font-semibold text-[#111111]" : "text-[#666666]"}`}
                >
                  {entry.name}
                </span>
                <span
                  className={`text-sm tabular-nums shrink-0 ml-3 ${isCurrent ? "font-semibold text-[#111111]" : "text-[#999999]"}`}
                >
                  €{val.toFixed(0)}m
                </span>
              </div>
              <div className="h-1.5 bg-[#f0f0f0] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isCurrent ? "#333333" : "#dddddd",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-[#bbbbbb] pt-1">
        Source: Transfermarkt · {leagueLabel} clubs in database only
      </p>
    </div>
  );
}

// ─── League Performance ───────────────────────────────────────────────────────

const TIER_COLORS: Record<number, string> = {
  1: "#333333",
  2: "#666666",
  3: "#999999",
};

function LeaguePerformancePanel({ positions }: { positions: LeaguePositionData[] }) {
  const rows = [...positions].sort((a, b) => a.season.localeCompare(b.season));

  return (
    <div>
      <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
        League Performance
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[#aaaaaa]">No league position data available.</p>
      ) : (
        <div className="border border-[#e0e0e0] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-4 py-2.5 text-left font-semibold tracking-[0.04em] uppercase text-[#999999] text-xs">Season</th>
                <th className="px-4 py-2.5 text-left font-semibold tracking-[0.04em] uppercase text-[#999999] text-xs">League</th>
                <th className="px-4 py-2.5 text-right font-semibold tracking-[0.04em] uppercase text-[#999999] text-xs">Position</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.season}-${r.league_name}`}
                  className={i < rows.length - 1 ? "border-b border-[#f0f0f0]" : ""}
                >
                  <td className="px-4 py-2.5 tabular-nums text-[#555555]">{r.season}</td>
                  <td className="px-4 py-2.5 text-[#555555]">
                    <span style={{ color: TIER_COLORS[r.tier] ?? "#999999" }}>{r.league_name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-[#111111]">
                    {r.position != null ? r.position : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-[#bbbbbb] border-t border-[#f0f0f0]">
            Source: Wikipedia
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SquadProfileSection({
  currentSlug,
  profile,
  clubName,
  leagueEntries,
  leagueLabel,
}: {
  currentSlug:   string;
  profile:       SquadProfile | undefined;
  clubName:      string;
  leagueEntries: { name: string; slug: string; profile: SquadProfile }[];
  leagueLabel:   string;
}) {
  const leagueProfiles = leagueEntries.map(e => e.profile);

  // ── League averages ──────────────────────────────────────────────────────────
  const avgAge   = numAvg(leagueProfiles.map(p => p.avg_age));
  const avgSize  = numAvg(leagueProfiles.map(p => p.squad_size));
  const avgValue = numAvg(leagueProfiles.map(p => p.squad_value_eur_m));

  // ── No profile ───────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="border border-[#e0e0e0] px-6 py-12 flex flex-col items-center justify-center text-center">
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#cccccc] mb-2">
          Squad Profile
        </p>
        <p className="text-sm text-[#aaaaaa]">Data unavailable</p>
      </div>
    );
  }

  const sv = profile.squad_value_eur_m ?? null;

  const ageDelta   = profile.avg_age   != null && avgAge   != null ? profile.avg_age   - avgAge   : null;
  const sizeDelta  = profile.squad_size != null && avgSize  != null ? profile.squad_size - avgSize  : null;
  const valueDelta = sv                 != null && avgValue != null ? sv                 - avgValue  : null;

  const ageMeta = profile.avg_age != null ? ageLabel(profile.avg_age) : null;

  const cardBorder1 = "border-b sm:border-b-0 sm:border-r border-[#e0e0e0]";
  const cardBorder2 = "border-b sm:border-b-0 sm:border-r border-[#e0e0e0]";
  const cardBorder3 = "";

  return (
    <div className="space-y-8">

      {/* ── Section 1: Top stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#e0e0e0] overflow-hidden">
        <StatCard
          label="Average Age"
          value={profile.avg_age != null ? profile.avg_age.toFixed(1) : "—"}
          sub={ageMeta?.text}
          subColor={ageMeta?.color}
          delta={ageDelta}
          deltaHigherBetter={false}
          avgLabel={leagueLabel}
          border={cardBorder1}
        >
          <AgeDistributionDropdown profile={profile} />
        </StatCard>
        <StatCard
          label="Squad Size"
          value={profile.squad_size != null ? String(profile.squad_size) : "—"}
          delta={sizeDelta}
          deltaHigherBetter={true}
          avgLabel={leagueLabel}
          border={cardBorder2}
        />
        <StatCard
          label="Est. Squad Market Value"
          value={sv != null ? `€${sv.toFixed(0)}m` : "—"}
          delta={valueDelta}
          deltaHigherBetter={true}
          avgLabel={leagueLabel}
          border={cardBorder3}
        />
      </div>

      {/* ── Section 2: Contract Risk ──────────────────────────────────────── */}
      <ContractRiskPanel profile={profile} />

      {/* ── Section 3: Transfer Activity ─────────────────────────────────── */}
      <TransferActivityPanel profile={profile} />

      {/* ── Section 5: League Value Ranking ──────────────────────────────── */}
      <div>
        <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-4">
          Est. Squad Value — {leagueLabel} Ranking
        </p>
        <LeagueValueRankingPanel
          currentSlug={currentSlug}
          leagueEntries={leagueEntries}
          leagueLabel={leagueLabel}
        />
      </div>

      {/* ── Section 6: League Performance ────────────────────────────────── */}
      <LeaguePerformancePanel positions={profile.league_positions} />

    </div>
  );
}
