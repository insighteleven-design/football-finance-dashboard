import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelligence | Insight Eleven",
  description: "Comprehensive database of football club financial data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <Header />

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
