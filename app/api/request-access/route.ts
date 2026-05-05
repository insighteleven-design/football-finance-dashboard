import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "access_requests.json");

async function appendRequest(entry: object): Promise<void> {
  let existing: object[] = [];
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    existing = JSON.parse(raw);
  } catch {
    // File absent or empty — start fresh
  }
  existing.push(entry);
  await fs.writeFile(DATA_FILE, JSON.stringify(existing, null, 2), "utf8");
}

async function sendNotification(name: string, email: string, from: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to:   "olliecantrill@insighteleven.co.uk",
    subject: "New access request — Intelligence",
    text: [
      "New access request received.",
      "",
      `Name:  ${name}`,
      `Email: ${email}`,
      `Page:  ${from}`,
      `Time:  ${new Date().toISOString()}`,
    ].join("\n"),
  });
}

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; from?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name = "", email = "", from = "/" } = body;

  if (!name.trim()) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!email.trim()) {
    return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const entry = {
    name:      name.trim(),
    email:     email.trim(),
    timestamp: new Date().toISOString(),
    from:      from || "/",
  };

  // Save to JSON — best effort; don't block or fail the response
  appendRequest(entry).catch(() => {});

  // Send email notification — failure is silent to the user
  sendNotification(entry.name, entry.email, entry.from).catch(() => {});

  return NextResponse.json({ ok: true });
}
