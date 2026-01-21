"use client";

import { useState } from "react";

export function ShareLinkButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("failed");
      window.setTimeout(() => setStatus("idle"), 1200);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
    >
      {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Share link"}
    </button>
  );
}
