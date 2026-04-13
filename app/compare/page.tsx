import { Suspense } from "react";
import { clubs } from "@/lib/clubs";
import ClubVsClub from "@/components/ClubVsClub";

export default function ComparePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Club Comparison</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search for two clubs to compare their financials side by side · link is shareable
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
        <ClubVsClub allClubs={clubs} />
      </Suspense>
    </div>
  );
}
