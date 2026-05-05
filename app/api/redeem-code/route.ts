import { NextRequest, NextResponse } from "next/server";
import { isValidAccessCode, isOwnerCode } from "@/lib/accessCodes";

const THIRTY_DAYS = 60 * 60 * 24 * 30;
const ONE_YEAR    = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "Please enter a code." }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";

  if (isOwnerCode(code)) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("intelligence_owner", code, {
      httpOnly: true,
      secure:   isProd,
      maxAge:   ONE_YEAR,
      path:     "/",
      sameSite: "lax",
    });
    // Non-httpOnly UI signal so client components can detect owner access
    res.cookies.set("intelligence_unlocked", "1", {
      httpOnly: false,
      secure:   isProd,
      maxAge:   ONE_YEAR,
      path:     "/",
      sameSite: "lax",
    });
    return res;
  }

  if (isValidAccessCode(code)) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("intelligence_access", code, {
      httpOnly: false,
      secure:   isProd,
      maxAge:   THIRTY_DAYS,
      path:     "/",
      sameSite: "lax",
    });
    res.cookies.set("intelligence_unlocked", "1", {
      httpOnly: false,
      secure:   isProd,
      maxAge:   THIRTY_DAYS,
      path:     "/",
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json(
    { error: "Invalid code — please check and try again." },
    { status: 403 },
  );
}
