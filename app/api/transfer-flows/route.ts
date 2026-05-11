import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const LEAGUE_ORDER = ["GB1", "L1", "ES1", "IT1", "FR1"];

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");

  if (!country) {
    const { data, error } = await sb.rpc("get_transfer_countries");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ countries: data });
  }

  const { data, error } = await sb.rpc("get_country_transfer_flows", { p_country: country });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seasonMap: Record<string, Record<string, { count: number; value: number }>> = {};
  const leagueMap: Record<string, { name: string; count: number; value: number }> = {};
  let totalTransfers = 0;
  let totalValue = 0;

  for (const row of data as Array<{
    season: string;
    competition_id: string;
    competition_name: string;
    transfer_count: number;
    total_value: number;
  }>) {
    const count = Number(row.transfer_count);
    const value = Number(row.total_value);

    if (!seasonMap[row.season]) seasonMap[row.season] = {};
    seasonMap[row.season][row.competition_id] = { count, value };

    if (!leagueMap[row.competition_id]) {
      leagueMap[row.competition_id] = { name: row.competition_name, count: 0, value: 0 };
    }
    leagueMap[row.competition_id].count += count;
    leagueMap[row.competition_id].value += value;

    totalTransfers += count;
    totalValue += value;
  }

  const allSeasons: string[] = [];
  for (let y = 2015; y <= 2024; y++) {
    allSeasons.push(`${y}-${String(y + 1).slice(2)}`);
  }

  const bySeasonArray = allSeasons.map((season) => {
    const leagues = seasonMap[season] ?? {};
    return {
      season,
      total: Object.values(leagues).reduce((s, l) => s + l.count, 0),
      value: Object.values(leagues).reduce((s, l) => s + l.value, 0),
      ...Object.fromEntries(LEAGUE_ORDER.map((id) => [id, leagues[id]?.count ?? 0])),
    };
  });

  const byLeague = LEAGUE_ORDER.filter((id) => leagueMap[id]).map((id) => ({
    id,
    name: leagueMap[id].name,
    count: leagueMap[id].count,
    value: leagueMap[id].value,
  }));

  return NextResponse.json({
    country,
    by_season: bySeasonArray,
    by_league: byLeague,
    total_transfers: totalTransfers,
    total_value: totalValue,
  });
}
