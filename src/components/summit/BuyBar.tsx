"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { NAV } from "@/lib/site-copy";

/**
 * A buy button that follows you down the page, on phones only.
 *
 * The page is long: past the line-up and the programme, the nearest way to
 * buy is a small pill far back up in the sticky bar. This appears once the
 * hero is behind you and steps aside over the ticket cards, where a second
 * button beside three real ones is just noise.
 */
export function BuyBar({ lang = "bg", from, tierId }: { lang?: Lang; from: string; tierId: string }) {
  const c = NAV[lang];
  const [show, setShow] = useState(false);

  useEffect(() => {
    const tickets = document.getElementById("tickets");
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.9;
      const box = tickets?.getBoundingClientRect();
      const overTickets = !!box && box.top < window.innerHeight && box.bottom > 0;
      setShow(past && !overTickets);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-bh-ink/10 bg-bh-paper/95 px-4 py-3 backdrop-blur-lg transition-transform duration-300 motion-reduce:transition-none sm:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      aria-hidden={!show}
    >
      <Link
        href={`/bilet?nivo=${tierId}${lang === "en" ? "&lang=en" : ""}`}
        tabIndex={show ? undefined : -1}
        className="bh-gradient flex items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold text-bh-ink"
      >
        {c.buy(from)}
      </Link>
    </div>
  );
}
