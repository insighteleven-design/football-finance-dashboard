import { clubs } from "@/lib/clubs";
import SortableTable from "@/components/SortableTable";
import MetricChart from "@/components/MetricChart";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Premier League Financial Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 max-w-2xl">
          Key financial metrics for all 20 Premier League clubs, extracted from the latest
          annual accounts filed at Companies House. Figures in £ millions.
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-xs">
        <MetricChart clubs={clubs} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">All Clubs</h2>
          <span className="text-xs text-gray-400">
            Click a column header to sort · Click a club name for full profile
          </span>
        </div>
        <SortableTable clubs={clubs} />
      </section>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Positive value
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Negative value / net debt
        </span>
        <span>— Not available</span>
      </div>
    </div>
  );
}
