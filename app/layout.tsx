import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelligence | Insight Eleven",
  description: "The comprehensive database of football club finances, sourced from Companies House filings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-8">
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.png"
                alt="Insight Eleven"
                width={1601}
                height={234}
                className="w-auto h-9"
                priority
              />
            </Link>

            <nav className="flex items-center gap-0.5">
              <Link href="/" className="px-3 py-1.5 text-sm text-[#888888] hover:text-white hover:bg-[#111111] rounded-md transition-colors">
                Home
              </Link>
              <Link href="/compare" className="px-3 py-1.5 text-sm text-[#888888] hover:text-white hover:bg-[#111111] rounded-md transition-colors whitespace-nowrap">
                Club Comparison
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[#2a2a2a] py-6 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs text-[#444444]">
              This data is for informational purposes only and does not constitute financial advice.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
