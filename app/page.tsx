import { clubs } from "@/lib/clubs";
import { euClubs, EU_COUNTRY_CONFIG } from "@/lib/euClubs";
import SearchBar from "@/components/SearchBar";
import HomeNav from "@/components/HomeNav";

function hasEuFinancialData(club: (typeof euClubs)[0]): boolean {
  const f = club.financials;
  return (
    f.revenue !== null || f.net_profit !== null || f.wage_bill !== null ||
    f.equity !== null || f.total_liabilities !== null ||
    club.historical.some((h) => h.revenue !== null)
  );
}

export default function Home() {
  const visibleEuClubs = euClubs.filter(hasEuFinancialData);
  const totalClubs = clubs.length + visibleEuClubs.length;
  const totalCountries = 1 + EU_COUNTRY_CONFIG.filter((c) =>
    euClubs.some((cl) => cl.country === c.country && hasEuFinancialData(cl))
  ).length;

  return (
    <div style={{ backgroundColor: "#080808", minHeight: "100vh" }}>

      {/* ── Masthead ──────────────────────────────────────────────────────────── */}
      <header>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 pt-16 sm:pt-28 pb-12 sm:pb-20">
          <h1
            className="font-serif font-normal leading-none"
            style={{ color: "#ffffff", fontSize: "clamp(40px, 12vw, 180px)", letterSpacing: "-0.03em" }}
          >
            Intelligence
          </h1>
          <p
            className="mt-6 sm:mt-8"
            style={{ color: "#888888", fontSize: "clamp(15px, 4vw, 28px)", letterSpacing: "0.01em" }}
          >
            The comprehensive football finance database, by Insight Eleven
          </p>
        </div>
      </header>

      {/* ── Search ────────────────────────────────────────────────────────────── */}
      <div
        className="max-w-screen-xl mx-auto px-6 lg:px-12 pb-12 sm:pb-16"
        style={{ borderBottom: "1px solid #181818" }}
      >
        <SearchBar clubs={clubs} euClubs={euClubs} />
      </div>

      {/* ── Main navigation ───────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-0 pb-28 sm:pb-40">
        <HomeNav
          totalClubs={totalClubs}
          totalCountries={totalCountries}
        />
      </div>

    </div>
  );
}
