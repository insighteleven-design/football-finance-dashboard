import { EUClub } from "@/lib/euClubs";

export default function EUClubInfoPanel({ club }: { club: EUClub }) {
  const hasStadium = !!club.stadium?.name;
  const hasOwnership = !!(club.ownership?.summary || club.ownership?.category);

  if (!hasStadium && !hasOwnership) {
    return <p className="text-sm text-[#aaaaaa] italic">No club information available.</p>;
  }

  return (
    <div className="grid lg:grid-cols-2 border border-[#e0e0e0] overflow-hidden">
      {hasStadium && club.stadium && (
        <div
          className={`px-4 sm:px-6 py-4 sm:py-5 bg-white ${
            hasOwnership ? "border-b lg:border-b-0 border-r border-[#e0e0e0]" : "lg:col-span-2"
          }`}
        >
          <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-3">Stadium</p>
          <p className="text-sm font-medium text-[#111111] mb-1">{club.stadium.name}</p>
          {club.stadium.capacity && (
            <p className="text-xs text-[#666666] mb-1.5">{club.stadium.capacity.toLocaleString()} capacity</p>
          )}
          {club.stadium.ownership && (
            <p className="text-xs text-[#aaaaaa] leading-relaxed">{club.stadium.ownership}</p>
          )}
        </div>
      )}
      {hasOwnership && club.ownership && (
        <div className={`px-4 sm:px-6 py-4 sm:py-5 bg-white ${!hasStadium ? "lg:col-span-2" : ""}`}>
          <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#555555] mb-3">Ownership</p>
          {club.ownership.category && (
            <p className="text-xs text-[#666666] mb-1">{club.ownership.category}</p>
          )}
          {club.ownership.fifty_plus_one && (
            <p className="text-xs text-[#aaaaaa] mb-1.5">50+1: {club.ownership.fifty_plus_one}</p>
          )}
          {club.ownership.summary && (
            <p className="text-xs text-[#aaaaaa] leading-relaxed">{club.ownership.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
