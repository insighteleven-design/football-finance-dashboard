"use client";

import { useState } from "react";
import Link from "next/link";
import CountryClubs from "@/components/CountryClubs";
import type { ClubFinancials } from "@/lib/clubs";
import type { EUClub } from "@/lib/euClubs";

type View = "menu" | "clubs";

interface Props {
  clubs: ClubFinancials[];
  euClubs: EUClub[];
  totalClubs: number;
  totalCountries: number;
}

const ITEMS = [
  {
    id: "clubs" as const,
    title: "Club Data",
    href: null,
  },
  {
    id: "compare" as const,
    title: "Compare Clubs",
    href: "/compare",
    tagline: "Benchmark club financial performance against each other",
  },
  {
    id: "rankings" as const,
    title: "Rankings",
    href: "/rankings",
    tagline: "See which clubs perform best and worst across each metric",
  },
];

export default function HomeNav({ clubs, euClubs, totalClubs, totalCountries }: Props) {
  const [view, setView] = useState<View>("menu");

  if (view === "clubs") {
    return (
      <div>
        <button
          onClick={() => setView("menu")}
          className="flex items-center gap-2.5 mb-10 sm:mb-14 group transition-colors"
          style={{ color: "#777777" }}
        >
          <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
          <span
            className="group-hover:text-[#cccccc] transition-colors"
            style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}
          >
            Home
          </span>
        </button>
        <CountryClubs clubs={clubs} euClubs={euClubs} />
      </div>
    );
  }

  return (
    <div>
      {ITEMS.map((item, i) => {
        const tagline = item.id === "clubs"
          ? `See financial data from ${totalClubs} clubs across ${totalCountries} countries`
          : item.tagline!;

        const inner = (
          <>
            <div>
              <p
                className="font-serif font-light leading-none group-hover:text-[#cccccc] transition-colors"
                style={{ color: "#ffffff", fontSize: "clamp(28px, 5vw, 56px)", letterSpacing: "-0.02em" }}
              >
                {item.title}
              </p>
              <p
                className="mt-2.5"
                style={{ color: "#888888", fontSize: "clamp(12px, 1.4vw, 15px)", letterSpacing: "0.01em" }}
              >
                {tagline}
              </p>
            </div>
            <span
              className="shrink-0 ml-6 group-hover:text-[#888888] transition-colors"
              style={{ color: "#555555", fontSize: "1.5rem" }}
            >
              →
            </span>
          </>
        );

        const sharedClass = "w-full flex items-center justify-between group py-9 sm:py-12 transition-colors";
        const sharedStyle = {
          borderTop: i === 0 ? "1px solid #1a1a1a" : undefined,
          borderBottom: "1px solid #1a1a1a",
        };

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} className={sharedClass} style={sharedStyle}>
              {inner}
            </Link>
          );
        }

        return (
          <button key={item.id} onClick={() => setView("clubs")} className={sharedClass} style={sharedStyle}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
