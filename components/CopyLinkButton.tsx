"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] text-sm text-[#666666] hover:border-[#111111] hover:text-[#111111] transition-colors"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
