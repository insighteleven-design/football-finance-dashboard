import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Finance",
  description: "Financial data for every English Football League club, extracted from Companies House filings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black tracking-tighter">FF</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm tracking-tight">Football Finance</span>
            </Link>

            <nav className="flex items-center gap-0.5">
              <Link href="/" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
                Search
              </Link>
              <Link href="/compare" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
                Compare
              </Link>
              <Link href="/compare/clubs" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap">
                Club vs Club
              </Link>
            </nav>

            <span className="text-xs text-gray-400 hidden sm:block shrink-0">Source: Companies House</span>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-100 py-5 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs text-gray-400">
            <span>Data from Companies House annual accounts · Figures in £m · Not financial advice</span>
            <span>2024/25 season</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
