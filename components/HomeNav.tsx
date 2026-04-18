import Link from "next/link";

interface Props {
  totalClubs: number;
  totalCountries: number;
}

const ITEMS = [
  {
    id: "clubs",
    title: "Club Data",
    href: "/directory",
    tagline: (totalClubs: number, totalCountries: number) =>
      `See financial data from ${totalClubs} clubs across ${totalCountries} countries`,
  },
  {
    id: "compare",
    title: "Compare Clubs",
    href: "/compare",
    tagline: () => "Benchmark club financial performance against each other",
  },
  {
    id: "rankings",
    title: "Rankings",
    href: "/rankings",
    tagline: () => "See which clubs perform best and worst across each metric",
  },
];

export default function HomeNav({ totalClubs, totalCountries }: Props) {
  return (
    <div>
      {ITEMS.map((item, i) => {
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
                {item.tagline(totalClubs, totalCountries)}
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

        return (
          <Link
            key={item.id}
            href={item.href}
            className="w-full flex items-center justify-between group py-9 sm:py-12 transition-colors"
            style={{
              borderTop: i === 0 ? "1px solid #1a1a1a" : undefined,
              borderBottom: "1px solid #1a1a1a",
              textAlign: "left",
            }}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
