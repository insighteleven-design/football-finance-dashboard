import { clubs } from "@/lib/clubs";
import { euClubs } from "@/lib/euClubs";
import SearchBar from "@/components/SearchBar";
import CountryClubs from "@/components/CountryClubs";

export default function Home() {
  return (
    <div style={{ backgroundColor: "#080808", minHeight: "100vh" }}>

      {/* ── Masthead ──────────────────────────────────────────────────────────── */}
      <header>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 pt-14 sm:pt-20 pb-10 sm:pb-16">
          <h1
            className="font-serif font-light leading-none"
            style={{ color: "#ffffff", fontSize: "clamp(52px, 9vw, 112px)", letterSpacing: "-0.03em" }}
          >
            Intelligence
          </h1>
          <p
            className="font-serif font-light mt-2"
            style={{ color: "#2a2a2a", fontSize: "clamp(18px, 2.5vw, 36px)", letterSpacing: "-0.01em" }}
          >
            by Insight Eleven
          </p>
        </div>
      </header>

      {/* ── Search ────────────────────────────────────────────────────────────── */}
      <div
        className="max-w-screen-xl mx-auto px-6 lg:px-12 pb-10 sm:pb-14"
        style={{ borderBottom: "1px solid #181818" }}
      >
        <SearchBar clubs={clubs} euClubs={euClubs} />
      </div>

      {/* ── Club browser ──────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-10 sm:py-14 pb-24 sm:pb-32">
        <CountryClubs clubs={clubs} euClubs={euClubs} />
      </div>

    </div>
  );
}
