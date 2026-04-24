"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ClubVsClub from "@/components/ClubVsClub";
import LeagueVsLeague from "@/components/LeagueVsLeague";
import { type ComparableClub } from "@/lib/comparable";

type Mode = "clubs" | "leagues";

export default function CompareWrapper({ allClubs }: { allClubs: ComparableClub[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode: Mode = searchParams.get("mode") === "leagues" ? "leagues" : "clubs";
  const [mode, setMode] = useState<Mode>(initialMode);

  function switchMode(m: Mode) {
    setMode(m);
    router.replace(`/compare?mode=${m}`, { scroll: false });
  }

  return (
    <div>
      {/* ── Mode switcher ── */}
      <div className="flex border-b-2 border-[#eeeeee] mb-10 sm:mb-14 overflow-x-auto">
        {(["clubs", "leagues"] as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="shrink-0 transition-colors"
              style={{
                padding: "1.1rem 2.25rem",
                fontSize: "15px",
                fontWeight: active ? 700 : 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? "#111111" : "#aaaaaa",
                background: "none",
                border: "none",
                borderBottom: `3px solid ${active ? "#111111" : "transparent"}`,
                marginBottom: "-2px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {m === "clubs" ? "Club vs Club" : "League vs League"}
            </button>
          );
        })}
      </div>

      {mode === "clubs"   && <ClubVsClub   allClubs={allClubs} />}
      {mode === "leagues" && <LeagueVsLeague allClubs={allClubs} />}
    </div>
  );
}
