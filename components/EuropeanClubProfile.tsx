"use client";

import { EUClub } from "@/lib/euClubs";

// ─── Formatting helpers ──────────────────────────────────────────────────────

function fmtEur(v: number | null, isRatio = false): string {
  if (v === null || v === undefined) return "—";
  if (isRatio) return `${v.toFixed(1)}%`;
  const abs = Math.abs(v);
  return `${v < 0 ? "-" : ""}€${abs.toFixed(1)}m`;
}

function profitColor(v: number | null): string {
  if (v === null) return "text-[#999999]";
  return v >= 0 ? "text-[#4a9a6a]" : "text-[#9a4a4a]";
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="border border-[#e0e0e0] bg-white p-5">
      <p className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#999999] mb-2">{label}</p>
      <p className={`text-2xl font-light tabular-nums ${color ?? "text-[#111111]"}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#aaaaaa] mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Historical chart ────────────────────────────────────────────────────────

function HistoricalChart({ club }: { club: EUClub }) {
  const hist = club.historical.filter((h) => h.revenue !== null);
  if (!hist.length) return null;

  const maxRev = Math.max(...hist.map((h) => h.revenue ?? 0), 0.01);

  return (
    <div className="border border-[#e0e0e0] bg-white p-6">
      <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-6">
        Revenue History (€m)
      </p>
      <div className="space-y-2.5">
        {[...hist].reverse().map((h) => {
          const pct = h.revenue !== null ? (h.revenue / maxRev) * 100 : 0;
          return (
            <div key={h.season} className="flex items-center gap-3">
              <span className="text-[10px] text-[#aaaaaa] w-16 shrink-0 tabular-nums">{h.season}</span>
              <div className="flex-1 h-5 bg-[#eeeeee] overflow-hidden">
                <div className="h-full bg-[#8888cc]" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] tabular-nums text-[#111111] w-16 text-right shrink-0">
                {fmtEur(h.revenue)}
              </span>
              {h.net_profit !== null && (
                <span className={`text-[10px] tabular-nums w-16 text-right shrink-0 ${profitColor(h.net_profit)}`}>
                  {fmtEur(h.net_profit)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {hist.some((h) => h.net_profit !== null) && (
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#f0f0f0]">
          <span className="flex items-center gap-1.5 text-[9px] text-[#aaaaaa]">
            <span className="w-2 h-2 rounded-full bg-[#8888cc] inline-block" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-[9px] text-[#aaaaaa]">
            <span className="w-2 h-2 rounded-full bg-[#4a9a6a] inline-block" /> Net profit (positive)
          </span>
          <span className="flex items-center gap-1.5 text-[9px] text-[#aaaaaa]">
            <span className="w-2 h-2 rounded-full bg-[#9a4a4a] inline-block" /> Net loss
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Ownership & stadium panel ───────────────────────────────────────────────

function MetadataPanel({ club }: { club: EUClub }) {
  const hasOwnership = club.ownership?.summary || club.ownership?.category;
  const hasStadium = club.stadium?.name;
  if (!hasOwnership && !hasStadium) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {hasStadium && club.stadium && (
        <div className="border border-[#e0e0e0] bg-white p-5">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-3">Stadium</p>
          <p className="text-sm text-[#111111] font-medium mb-1">{club.stadium.name}</p>
          {club.stadium.capacity && (
            <p className="text-xs text-[#666666]">
              {club.stadium.capacity.toLocaleString()} capacity
            </p>
          )}
          {club.stadium.ownership && (
            <p className="text-[10px] text-[#aaaaaa] mt-1.5 leading-relaxed">{club.stadium.ownership}</p>
          )}
        </div>
      )}
      {hasOwnership && club.ownership && (
        <div className="border border-[#e0e0e0] bg-white p-5">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-[#999999] mb-3">Ownership</p>
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function EuropeanClubProfile({ club }: { club: EUClub }) {
  const fin = club.financials;
  const hasFinancials = fin.revenue !== null || fin.net_profit !== null;

  const LEAGUE_DISPLAY: Record<string, string> = {
    "Bundesliga": "Austrian Bundesliga",
    "2. Liga": "Austrian 2. Liga",
  };
  const leagueDisplay =
    club.country === "Austria"
      ? (LEAGUE_DISPLAY[club.league] ?? club.league)
      : club.league;

  return (
    <div className="space-y-6">
      {/* Financial year label */}
      {fin.most_recent_year && (
        <p className="text-sm text-[#999999]">
          Financial year: <span className="text-[#666666]">{fin.most_recent_year}</span>
          <span className="ml-2 text-[10px] text-[#aaaaaa] uppercase tracking-widest">{leagueDisplay}</span>
        </p>
      )}

      {/* Data notes */}
      {fin.data_notes && (
        <div className="border border-[#e8e8e8] bg-[#fafafa] px-4 py-3">
          <p className="text-[11px] text-[#999999]">{fin.data_notes}</p>
        </div>
      )}

      {/* PARTIAL data note for Belgium */}
      {club.data_status === "PARTIAL" && club.country === "Belgium" && (
        <div className="border border-[#e8d8b0] bg-[#fffdf5] px-4 py-3">
          <p className="text-[11px] text-[#aa8833]">Some data fields pending enrichment</p>
        </div>
      )}

      {/* No financials */}
      {!hasFinancials && !club.historical.length && (
        <p className="text-sm text-[#aaaaaa] italic py-4">No financial data available for this club.</p>
      )}

      {/* Key metrics grid */}
      {hasFinancials && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="Revenue" value={fmtEur(fin.revenue)} sub="€m" />
          <StatCard label="Wage Bill" value={fmtEur(fin.wage_bill)} sub="€m" />
          {fin.wage_to_revenue_pct !== null && (
            <StatCard label="Wage Ratio" value={`${fin.wage_to_revenue_pct?.toFixed(1)}%`} />
          )}
          <StatCard
            label="Net Profit / (Loss)"
            value={fmtEur(fin.net_profit)}
            color={profitColor(fin.net_profit)}
          />
          {fin.equity !== null && (
            <StatCard label="Equity" value={fmtEur(fin.equity)} />
          )}
          {fin.total_liabilities !== null && (
            <StatCard label="Total Liabilities" value={fmtEur(fin.total_liabilities)} sub="not net debt" />
          )}
          {club.tm_squad_value_eur_m !== null && (
            <StatCard label="Squad Value (TM)" value={fmtEur(club.tm_squad_value_eur_m)} />
          )}
        </div>
      )}

      {/* Historical chart */}
      <HistoricalChart club={club} />

      {/* Ownership & stadium */}
      <MetadataPanel club={club} />
    </div>
  );
}
