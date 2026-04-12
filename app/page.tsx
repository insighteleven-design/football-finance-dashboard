import { clubs } from "@/lib/clubs";
import DashboardView from "@/components/DashboardView";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Football Club Financial Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 max-w-2xl">
          Key financial metrics for Premier League and Championship clubs, extracted from the
          latest annual accounts filed at Companies House. Figures in £ millions.
        </p>
      </div>
      <DashboardView clubs={clubs} />
    </div>
  );
}
