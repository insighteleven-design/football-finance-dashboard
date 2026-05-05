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
          <div className="flex items-center" style={{ gap: "clamp(20px, 3.5vw, 44px)" }}>
            {/* Mark */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logomark.svg"
              alt=""
              aria-hidden="true"
              style={{ height: "clamp(60px, 11vw, 130px)", width: "auto", flexShrink: 0 }}
            />

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "clamp(60px, 11vw, 130px)",
                backgroundColor: "rgba(255,255,255,0.22)",
                flexShrink: 0,
              }}
            />

            {/* Wordmark + tagline — both share the same left edge */}
            <div>
              <h1
                className="font-serif font-normal leading-none"
                style={{ color: "#ffffff", fontSize: "clamp(26px, 5.5vw, 68px)", letterSpacing: "-0.03em", textTransform: "uppercase" }}
              >
                Intelligence
              </h1>
              <p
                style={{
                  color: "#888888",
                  fontSize: "clamp(13px, 3vw, 22px)",
                  letterSpacing: "0.01em",
                  marginTop: "clamp(8px, 1.2vw, 16px)",
                }}
              >
                The comprehensive football finance database, by Insight Eleven
              </p>
            </div>
          </div>
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
