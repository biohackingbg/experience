"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * Proof that the numbers are fresh. Every admin page is rendered on request,
 * so a reload does change the data - but a table of the same numbers looks
 * exactly like the one before it, and nothing on screen said the page had
 * moved at all. The stamp is the server's clock at render time; it ticks
 * on every reload, and the button next to it refetches without a full
 * reload, going dim while the new render is on its way.
 */
export function RefreshStamp({ renderedAt }: { renderedAt: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Flash once when a fresh render lands, so a reload is seen even by
  // someone not reading the seconds.
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(t);
  }, [renderedAt]);

  return (
    <button
      type="button"
      onClick={() => start(() => router.refresh())}
      disabled={pending}
      title="Обнови данните"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[0.68rem] tracking-wide transition-colors ${
        flash ? "bg-[#146455] text-white" : "bg-white text-[#0b2a22]/60 ring-1 ring-[#0b2a22]/8 hover:text-[#0b2a22]"
      } disabled:opacity-60`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
        aria-hidden
      >
        <path d="M16 10a6 6 0 1 1-1.8-4.3" />
        <path d="M16 3v4h-4" />
      </svg>
      {pending ? "обновява…" : `обновено ${renderedAt}`}
    </button>
  );
}
