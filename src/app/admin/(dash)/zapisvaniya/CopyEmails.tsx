"use client";

import { useState } from "react";

/**
 * Copies the addresses to the clipboard, comma separated, ready to paste into
 * a mail tool's BCC field.
 *
 * Only the ones passed in — the page filters out anyone who unsubscribed
 * before it gets here, so the button cannot quietly hand back an address that
 * asked to be left alone.
 */
export function CopyEmails({ emails }: { emails: string[] }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(emails.join(", "));
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }}
      className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
    >
      {done ? "Копирани ✓" : `Копирай ${emails.length} имейла`}
    </button>
  );
}
