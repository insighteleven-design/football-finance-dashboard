"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface TabDef {
  key: string;
  label: string;
  labelFull?: string;
  content: ReactNode | null;
  gated?: boolean;
}

function InlineAccessGate({ href }: { href: string }) {
  return (
    <div className="py-20 text-center">
      <p
        className="font-serif font-light mb-3"
        style={{ fontSize: "clamp(22px, 3vw, 28px)", color: "#111111", letterSpacing: "-0.01em" }}
      >
        Access required
      </p>
      <p style={{ color: "#888888", fontSize: "14px", lineHeight: 1.65, marginBottom: "28px" }}>
        This section is available to Intelligence subscribers.
      </p>
      <a
        href={href}
        style={{
          display:       "inline-block",
          padding:       "13px 32px",
          background:    "#111111",
          color:         "#ffffff",
          fontSize:      "11px",
          fontWeight:    700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          textDecoration: "none",
          fontFamily:    "inherit",
        }}
      >
        Request Access
      </a>
    </div>
  );
}

export default function ClubProfileTabs({
  tabs,
  requestAccessHref = "/request-access",
}: {
  tabs: TabDef[];
  requestAccessHref?: string;
}) {
  const [hasAccess, setHasAccess] = useState(false);
  useEffect(() => {
    setHasAccess(
      document.cookie.split("; ").some(
        (c) => c.startsWith("intelligence_unlocked=") || c.startsWith("intelligence_access=")
      )
    );
  }, []);

  const visible = tabs.filter((t) => t.content != null);
  const [active, setActive] = useState<string>(() => visible[0]?.key ?? "");

  if (!visible.length) return null;

  const activeTab = visible.find((t) => t.key === active);
  const isGated   = !hasAccess && !!activeTab?.gated;

  return (
    <div>
      <div className="flex border-b border-[#e0e0e0] mb-6 overflow-x-auto">
        {visible.map(({ key, label, labelFull }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`px-5 sm:px-7 py-4 text-base font-bold tracking-[0.04em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
              active === key
                ? "border-[#111111] text-[#111111]"
                : "border-transparent text-[#aaaaaa] hover:text-[#555555]"
            }`}
          >
            {labelFull ? (
              <>
                <span className="sm:hidden">{label}</span>
                <span className="hidden sm:inline">{labelFull}</span>
              </>
            ) : (
              label
            )}
          </button>
        ))}
      </div>
      {isGated ? <InlineAccessGate href={requestAccessHref} /> : activeTab?.content}
    </div>
  );
}
