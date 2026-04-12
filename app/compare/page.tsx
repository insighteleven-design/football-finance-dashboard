import { clubs } from "@/lib/clubs";
import DashboardView from "@/components/DashboardView";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ division?: string }>;
}) {
  const { division } = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Division Comparison</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revenue, wages and profitability across all clubs · click a column header to sort
        </p>
      </div>
      <DashboardView clubs={clubs} initialDivision={division ?? "premier-league"} />
    </div>
  );
}
