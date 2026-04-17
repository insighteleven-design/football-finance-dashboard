"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const linkClass = isHome
    ? "text-[#888888] hover:text-white hover:bg-[#111111]"
    : "text-[#666666] hover:text-[#111111] hover:bg-[#e8e8e8]";

  return (
    <header
      className={`sticky top-0 z-50 ${
        isHome
          ? "border-b border-[#2a2a2a] bg-[#0a0a0a]"
          : "border-b border-[#e0e0e0] bg-[#f5f5f5]"
      }`}
    >
      <div className={`${isHome ? "max-w-screen-xl px-6 lg:px-12" : "max-w-6xl px-4 sm:px-6 lg:px-8"} mx-auto h-14 flex items-center justify-between gap-4 min-w-0`}>
        <Link href="/" className="shrink-0 min-w-0">
          <Image
            src="/logo.png"
            alt="Insight Eleven"
            width={1601}
            height={234}
            className="w-auto h-6 sm:h-9"
            style={isHome ? undefined : { filter: "brightness(0) opacity(0.85)" }}
            priority
          />
        </Link>

      </div>
    </header>
  );
}
