import { clubs } from "@/lib/clubs";
import SearchBar from "@/components/SearchBar";
import CountryClubs from "@/components/CountryClubs";

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 pt-20 pb-24">
      {/* Hero */}
      <div className="w-full max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-serif font-light text-white tracking-tight mb-4 leading-tight">
          Intelligence, by Insight Eleven
        </h1>
        <p className="text-[#888888] text-base mb-10">
          The comprehensive database of football club finances
        </p>
        <SearchBar clubs={clubs} />
      </div>

      {/* Country selection */}
      <CountryClubs clubs={clubs} />
    </div>
  );
}
