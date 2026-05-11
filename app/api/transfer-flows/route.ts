import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SEASON = "2024-25";

function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials are not configured.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const league      = searchParams.get("league")      ?? undefined;
  const nationality = searchParams.get("nationality") ?? undefined;

  let sb;
  try {
    sb = createServerClient();
  } catch {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // ── Flow data ──────────────────────────────────────────────────────────────
  const { data: flows, error: flowErr } = await sb.rpc("get_transfer_flows", {
    p_season:         SEASON,
    p_competition_id: league      ?? null,
    p_nationality:    nationality ?? null,
    p_limit:          league || nationality ? 100 : 20,
  });

  if (flowErr) {
    console.error("transfer-flows rpc error:", flowErr.message);
    return NextResponse.json({ error: "Failed to load flow data." }, { status: 500 });
  }

  // ── Totals ─────────────────────────────────────────────────────────────────
  const { data: totals, error: totErr } = await sb.rpc("get_transfer_flows_totals", {
    p_season:         SEASON,
    p_competition_id: league      ?? null,
    p_nationality:    nationality ?? null,
  });

  if (totErr) {
    console.error("transfer-flows totals rpc error:", totErr.message);
  }

  const totalPlayers       = totals?.[0]?.total_players       ?? 0;
  const totalNationalities = totals?.[0]?.total_nationalities ?? 0;

  // ── Shape response ─────────────────────────────────────────────────────────
  const shaped = (flows ?? []).map((row: {
    nationality: string;
    competition_id: string;
    competition: string;
    player_count: number;
    avg_market_value_eur: number | null;
    top_clubs: string[] | null;
  }) => ({
    nationality:          row.nationality,
    competition:          row.competition,
    competition_id:       row.competition_id,
    player_count:         Number(row.player_count),
    avg_market_value_eur: row.avg_market_value_eur ? Number(row.avg_market_value_eur) : null,
    top_clubs:            row.top_clubs ?? [],
  }));

  return NextResponse.json({
    flows:               shaped,
    total_players:       Number(totalPlayers),
    total_nationalities: Number(totalNationalities),
    season:              SEASON,
  });
}
