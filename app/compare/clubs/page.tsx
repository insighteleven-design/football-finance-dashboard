import { Suspense } from "react";
import { clubs } from "@/lib/clubs";
import ClubVsClub from "@/components/ClubVsClub";

export default function ClubVsClubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Club vs Club</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select 2–4 clubs to compare side by side · link is shareable
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
        <ClubVsClub allClubs={clubs} />
      </Suspense>
    </div>
  );
}
