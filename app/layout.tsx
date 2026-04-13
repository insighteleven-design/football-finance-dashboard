import type { Metadata } from "next";
import Link from "next/link";
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
            <Link href="/" className="flex flex-col shrink-0 group">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[#888888] font-light tracking-[0.05em] text-sm leading-none">Insight</span>
                <span className="text-white font-bold tracking-[0.02em] text-sm leading-none">Eleven</span>
              </div>
              <span className="text-[9px] text-[#444444] tracking-[0.2em] uppercase font-light mt-0.5">
                Intelligence
              </span>
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
