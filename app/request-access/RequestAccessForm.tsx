"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid #333333",
  color: "#ffffff",
  fontSize: "15px",
  padding: "13px 0",
  outline: "none",
  letterSpacing: "0.01em",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

// ─── Main form ────────────────────────────────────────────────────────────────

export default function RequestAccessForm({ from }: { from: string }) {
  const router = useRouter();

  // Request form state
  const [name,   setName]   = useState("");
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formError, setFormError]       = useState("");
  const [confirmedName, setConfirmedName] = useState("");

  // Code redemption state
  const [code,       setCode]       = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "loading" | "error">("idle");
  const [codeError,  setCodeError]  = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !email.trim()) {
      setFormError("Please enter your name and email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res  = await fetch("/api/request-access", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, from }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Something went wrong — please try again.");
        setStatus("error");
        return;
      }

      setConfirmedName(name.trim().split(" ")[0]);
      setStatus("success");
    } catch {
      setFormError("Something went wrong — please try again.");
      setStatus("error");
    }
  }

  async function handleRedeemCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setCodeStatus("loading");
    setCodeError("");

    try {
      const res  = await fetch("/api/redeem-code", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.error ?? "Invalid code — please check and try again.");
        setCodeStatus("error");
        return;
      }

      // Code accepted — navigate to the page they originally requested
      router.push(from);
      router.refresh();
    } catch {
      setCodeError("Something went wrong — please try again.");
      setCodeStatus("error");
    }
  }

  return (
    <div style={{ backgroundColor: "#080808", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: "460px",
          margin:   "0 auto",
          padding:  "clamp(48px, 8vh, 96px) 24px 80px",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "clamp(48px, 7vh, 72px)" }}>
          <Link href="/" style={{ display: "inline-block" }}>
            <Image
              src="/logo.png"
              alt="Insight Eleven"
              width={1601}
              height={234}
              style={{
                height: "24px",
                width:  "auto",
                filter: "brightness(0) invert(1) opacity(0.55)",
              }}
              priority
            />
          </Link>
        </div>

        {/* ── Success state ── */}
        {status === "success" ? (
          <div>
            <p
              style={{
                color:       "#ffffff",
                fontSize:    "clamp(26px, 5vw, 40px)",
                fontFamily:  "Georgia, 'Times New Roman', serif",
                fontWeight:  300,
                letterSpacing: "-0.02em",
                lineHeight:  1.25,
                marginBottom: "16px",
              }}
            >
              Thanks, {confirmedName}.
            </p>
            <p style={{ color: "#666666", fontSize: "16px", lineHeight: 1.65 }}>
              We&apos;ll be in touch shortly.
            </p>
          </div>
        ) : (
          <>
            {/* ── Heading ── */}
            <p
              style={{
                color:       "#ffffff",
                fontSize:    "clamp(26px, 5vw, 40px)",
                fontFamily:  "Georgia, 'Times New Roman', serif",
                fontWeight:  300,
                letterSpacing: "-0.02em",
                lineHeight:  1.25,
                marginBottom: "14px",
              }}
            >
              Request access to Intelligence
            </p>
            <p
              style={{
                color:        "#666666",
                fontSize:     "15px",
                lineHeight:   1.65,
                marginBottom: "clamp(36px, 5vh, 52px)",
              }}
            >
              Full access covers 300+ clubs across 14 countries.
            </p>

            {/* ── Request form ── */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFormError(""); }}
                  autoComplete="name"
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormError(""); }}
                  autoComplete="email"
                  style={{ ...inputStyle, marginTop: "20px" }}
                />
              </div>

              {status === "error" && formError && (
                <p style={{ color: "#7a4a4a", fontSize: "13px", marginTop: "14px", letterSpacing: "0.01em" }}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  marginTop:      "28px",
                  width:          "100%",
                  padding:        "15px",
                  background:     status === "loading" ? "#111111" : "#ffffff",
                  color:          status === "loading" ? "#555555" : "#111111",
                  border:         "none",
                  fontSize:       "12px",
                  fontWeight:     700,
                  letterSpacing:  "0.16em",
                  textTransform:  "uppercase",
                  cursor:         status === "loading" ? "not-allowed" : "pointer",
                  transition:     "background 0.15s, color 0.15s",
                  fontFamily:     "inherit",
                }}
              >
                {status === "loading" ? "Sending…" : "Request Access"}
              </button>
            </form>

            {/* ── Divider ── */}
            <div style={{ margin: "clamp(40px, 6vh, 60px) 0 clamp(28px, 4vh, 40px)", borderTop: "1px solid #161616" }} />

            {/* ── Code entry ── */}
            <p style={{ color: "#555555", fontSize: "13px", letterSpacing: "0.02em", marginBottom: "18px" }}>
              Already have an access code? Enter it here.
            </p>

            <form onSubmit={handleRedeemCode} noValidate style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <input
                type="text"
                placeholder="Access code"
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeError(""); setCodeStatus("idle"); }}
                autoComplete="off"
                spellCheck={false}
                style={{
                  ...inputStyle,
                  borderBottomColor: codeStatus === "error" ? "#7a4a4a" : "#2a2a2a",
                  letterSpacing:     "0.08em",
                  fontSize:          "14px",
                }}
              />
              <button
                type="submit"
                disabled={codeStatus === "loading"}
                style={{
                  flexShrink:    0,
                  background:    "none",
                  border:        "1px solid #2a2a2a",
                  color:         codeStatus === "loading" ? "#3a3a3a" : "#666666",
                  fontSize:      "11px",
                  fontWeight:    700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding:       "10px 18px",
                  cursor:        codeStatus === "loading" ? "not-allowed" : "pointer",
                  whiteSpace:    "nowrap",
                  fontFamily:    "inherit",
                  marginBottom:  "1px",
                }}
              >
                {codeStatus === "loading" ? "…" : "Unlock"}
              </button>
            </form>

            {codeStatus === "error" && codeError && (
              <p style={{ color: "#7a4a4a", fontSize: "12px", marginTop: "12px", letterSpacing: "0.01em" }}>
                {codeError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
