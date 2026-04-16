import { clubs } from "@/lib/clubs";
import { euClubs } from "@/lib/euClubs";
import SearchBar from "@/components/SearchBar";
import CountryClubs from "@/components/CountryClubs";

function hasEuFinancialData(club: (typeof euClubs)[0]): boolean {
  const f = club.financials;
  return (
    f.revenue !== null ||
    f.net_profit !== null ||
    f.wage_bill !== null ||
    f.equity !== null ||
    f.total_liabilities !== null ||
    club.historical.some((h) => h.revenue !== null)
  );
}

export default function Home() {
  const totalClubs = clubs.length + euClubs.filter(hasEuFinancialData).length;

  const stats = [
    { value: `${totalClubs}`, label: "Clubs covered" },
    { value: "6",            label: "Countries" },
    { value: "11",           label: "Leagues" },
    { value: "6",            label: "Seasons of data" },
  ];

  return (
    <div style={{ backgroundColor: "#080808", minHeight: "100vh" }}>

      {/* ── Masthead ─────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid #181818" }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 pt-10 sm:pt-16 pb-8 sm:pb-14">
          <h1
            className="font-serif font-light leading-none"
            style={{ color: "#ffffff", fontSize: "clamp(44px, 8vw, 96px)", letterSpacing: "-0.02em" }}
          >
            Intelligence
          </h1>
          <p
            className="font-serif font-light mt-1.5"
            style={{ color: "#3a3a3a", fontSize: "clamp(15px, 2vw, 24px)", letterSpacing: "-0.01em" }}
          >
            by Insight Eleven
          </p>
          <p
            className="mt-3 sm:mt-4"
            style={{ color: "#555555", fontSize: "clamp(11px, 1.2vw, 14px)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}
          >
            The comprehensive football finance database
          </p>
        </div>
      </header>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid #181818" }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {stats.map(({ value, label }, i) => {
              // On mobile (2-col): left border on odd indices (col 2)
              // On sm+ (4-col): left border on all except first
              // We can't do responsive inline styles, so use a wrapper class trick:
              const isOdd = i % 2 !== 0;
              return (
                <div
                  key={label}
                  className={`py-5 sm:py-6 ${isOdd ? "pl-5 sm:pl-6 lg:pl-8" : "pr-5 sm:pr-6 lg:pr-8 sm:pl-0"}`}
                  style={{
                    borderLeft: isOdd ? "1px solid #181818" : undefined,
                    borderTop: i >= 2 ? "1px solid #181818" : undefined,
                  }}
                >
                  <p className="text-2xl sm:text-3xl font-light tabular-nums leading-none" style={{ color: "#ffffff" }}>
                    {value}
                  </p>
                  <p className="text-[9px] font-medium tracking-[0.22em] uppercase mt-2" style={{ color: "#3a3a3a" }}>
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────── */}
      <div
        className="max-w-screen-xl mx-auto px-6 lg:px-12 py-6 sm:py-8"
        style={{ borderBottom: "1px solid #181818" }}
      >
        <SearchBar clubs={clubs} euClubs={euClubs} />
      </div>

      {/* ── Club browser ──────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-8 sm:py-12 pb-20 sm:pb-28">
        <CountryClubs clubs={clubs} euClubs={euClubs} />
      </div>

    </div>
  );
}
