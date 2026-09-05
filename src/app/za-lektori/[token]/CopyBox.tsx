"use client";

import { useState } from "react";

/** A line to take away: one tap copies it, and says so. */
export function CopyBox({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">{label}</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            } catch {
              // Some browsers refuse without a user gesture they recognise;
              // the text is selectable below either way.
            }
          }}
          className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-bh-ink"
        >
          {copied ? "Копирано" : "Копирай"}
        </button>
      </div>
      <p className={`mt-2 break-words text-sm text-bh-ink/80 ${multiline ? "leading-relaxed" : "font-mono text-xs"}`}>{value}</p>
    </div>
  );
}
