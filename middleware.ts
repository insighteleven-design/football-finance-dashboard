import { NextRequest, NextResponse } from "next/server";

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
  const valid  = hasValidAccess(request);
  const isProd = process.env.NODE_ENV === "production";

  // Full-page gate — redirect users without access
  if (pathname === "/rankings" || pathname === "/compare") {
    if (!valid) return gateRedirect(request);
  }

  // Backfill the non-httpOnly UI cookie for owner-code holders so client
  // components can detect access without reading the httpOnly cookie.
  if (valid && !request.cookies.has("intelligence_unlocked")) {
    const res = NextResponse.next();
    res.cookies.set("intelligence_unlocked", "1", {
      httpOnly: false,
      secure:   isProd,
      maxAge:   60 * 60 * 24 * 365,
      path:     "/",
      sameSite: "lax",
    });
    return res;
  }
}

export const config = {
  matcher: ["/clubs/:path*", "/directory", "/rankings", "/compare"],
};
