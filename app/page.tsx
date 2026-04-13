import { clubs } from "@/lib/clubs";
import SearchBar from "@/components/SearchBar";
import CountryClubs from "@/components/CountryClubs";

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 pt-20 pb-20">
      {/* Logo + tagline */}
      <div className="w-full max-w-2xl mx-auto text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-sm font-black tracking-tighter">FF</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Football Finance</h1>
        </div>
        <p className="text-gray-500 mb-8">
          Financial data for all 92 English football league clubs, sourced from Companies House filings
        </p>
        <SearchBar clubs={clubs} />
      </div>

      {/* Country buttons + club list */}
      <CountryClubs clubs={clubs} />
    </div>
  );
}
