import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PL Finance | Premier League Financial Dashboard",
  description: "Financial comparison of all 20 Premier League clubs from Companies House filings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-tight">PL</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm tracking-tight">
                PL Finance
              </span>
            </a>
            <span className="text-xs text-gray-400 hidden sm:block">
              Source: Companies House annual accounts
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
            Data extracted from Companies House filings. Figures in £ millions. Not financial advice.
          </div>
        </footer>
      </body>
    </html>
  );
}
