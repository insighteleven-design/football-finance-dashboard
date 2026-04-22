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
                className="font-serif font-normal leading-none group-hover:text-[#cccccc] transition-colors"
                style={{ color: "#ffffff", fontSize: "clamp(36px, 6vw, 72px)", letterSpacing: "-0.02em" }}
              >
                {item.title}
              </p>
              <p
                className="mt-3"
                style={{ color: "#777777", fontSize: "clamp(15px, 1.6vw, 19px)", letterSpacing: "0.01em" }}
              >
                {item.tagline(totalClubs, totalCountries)}
              </p>
            </div>
            <span
              className="shrink-0 ml-6 group-hover:text-[#888888] transition-colors"
              style={{ color: "#444444", fontSize: "2rem" }}
            >
              →
            </span>
          </>
        );

        return (
          <Link
            key={item.id}
            href={item.href}
            className="w-full flex items-center justify-between group py-10 sm:py-14 transition-colors"
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
