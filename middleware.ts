import { NextRequest, NextResponse } from "next/server";

// All 20 Premier League clubs for 2025/26 — full access, no gate
const PL_SLUGS = new Set([
  "arsenal", "aston-villa", "bournemouth", "brentford", "brighton",
  "burnley", "chelsea", "crystal-palace", "everton", "fulham",
  "leeds", "liverpool", "man-city", "man-united", "newcastle",
  "nottm-forest", "sunderland", "tottenham", "west-ham", "wolves",
]);

function hasValidAccess(request: NextRequest): boolean {
  const ownerCode   = process.env.OWNER_ACCESS_CODE;
  const accessCodes = (process.env.ACCESS_CODES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const ownerCookie  = request.cookies.get("intelligence_owner")?.value;
  const accessCookie = request.cookies.get("intelligence_access")?.value;

  if (ownerCode && ownerCookie === ownerCode) return true;
  if (accessCookie && accessCodes.includes(accessCookie)) return true;
  return false;
}

function gateRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/request-access";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always gate /rankings and /compare
  if (pathname === "/rankings" || pathname === "/compare") {
    if (!hasValidAccess(request)) return gateRedirect(request);
    return;
  }

  // Gate /clubs/[slug] for non-Premier League clubs only
  if (pathname.startsWith("/clubs/")) {
    const slug = pathname.split("/")[2];
    if (slug && !PL_SLUGS.has(slug)) {
      if (!hasValidAccess(request)) return gateRedirect(request);
    }
  }
}

export const config = {
  matcher: ["/clubs/:path*", "/rankings", "/compare"],
};
