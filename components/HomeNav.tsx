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
      {ITEMS.map((item, i) => (
        <Link
          key={item.id}
          href={item.href}
          className="w-full flex items-center justify-between group py-12 sm:py-16 transition-colors"
          style={{
            borderTop: i === 0 ? "1px solid #1a1a1a" : undefined,
            borderBottom: "1px solid #1a1a1a",
            textAlign: "left",
          }}
        >
          <div>
            <p
              className="font-serif font-normal leading-none group-hover:text-[#cccccc] transition-colors"
              style={{ color: "#ffffff", fontSize: "clamp(48px, 8vw, 96px)", letterSpacing: "-0.025em" }}
            >
              {item.title}
            </p>
            <p
              className="mt-4"
              style={{ color: "#666666", fontSize: "clamp(17px, 2vw, 24px)", letterSpacing: "0.005em" }}
            >
              {item.tagline(totalClubs, totalCountries)}
            </p>
          </div>
          <span
            className="shrink-0 ml-8 group-hover:text-[#888888] transition-colors"
            style={{ color: "#333333", fontSize: "2.5rem" }}
          >
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
