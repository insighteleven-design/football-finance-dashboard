import { clubs } from "@/lib/clubs";
import { euClubs, EU_COUNTRY_CONFIG } from "@/lib/euClubs";
import { japanClubs, JAPAN_LEAGUES } from "@/lib/japanClubs";
import CountryClubs from "@/components/CountryClubs";

const EN_DIVISION_LABELS: Record<string, string> = {
  "premier-league": "Premier League",
  "championship":   "Championship",
  "league-one":     "League One",
  "league-two":     "League Two",
};

const EN_FLAG = "🏴󠁧󠁢󠁥󠁮󠁧󠁿";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; league?: string }>;
}) {
  const { country, league } = await searchParams;

  let initialView: Parameters<typeof CountryClubs>[0]["initialView"];

  const JP_FLAG = "🇯🇵";

  if (country && league) {
    if (country === "England") {
      const leagueLabel = EN_DIVISION_LABELS[league] ?? league;
      initialView = { level: "clubs", country: "England", flag: EN_FLAG, leagueKey: league, leagueLabel };
    } else if (country === "Japan") {
      const leagueConfig = JAPAN_LEAGUES.find((l) => l.key === league);
      const leagueLabel = leagueConfig?.label ?? league;
      initialView = { level: "clubs", country: "Japan", flag: JP_FLAG, leagueKey: league, leagueLabel };
    } else {
      const config = EU_COUNTRY_CONFIG.find((c) => c.country === country);
      if (config) {
        const leagueConfig = config.leagues.find((l) => l.key === league);
        const leagueLabel = leagueConfig?.label ?? league;
        initialView = { level: "clubs", country, flag: config.flag, leagueKey: league, leagueLabel };
      }
    }
  } else if (country) {
    if (country === "England") {
      initialView = { level: "leagues", country: "England", flag: EN_FLAG };
    } else if (country === "Japan") {
      initialView = { level: "leagues", country: "Japan", flag: JP_FLAG };
    } else {
      const config = EU_COUNTRY_CONFIG.find((c) => c.country === country);
      if (config) {
        initialView = { level: "leagues", country, flag: config.flag };
      }
    }
  }

  return (
    <div style={{ backgroundColor: "#080808", minHeight: "100vh" }}>
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-14 sm:py-20">
        <CountryClubs clubs={clubs} euClubs={euClubs} japanClubs={japanClubs} initialView={initialView} />
      </div>
    </div>
  );
}
