"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e0e0e0] bg-[#f5f5f5]">
      <div className="mx-auto h-14 flex items-center justify-between gap-4 min-w-0 px-6 lg:px-12">
        <Link href="/" className="shrink-0 min-w-0">
          <Image
            src="/logo.png"
            alt="Insight Eleven"
            width={1601}
            height={234}
            className="h-6 sm:h-9"
            style={{ filter: "brightness(0) opacity(0.85)", width: "auto", maxWidth: "none" }}
            priority
          />
        </Link>

      </div>
    </header>
  );
}
