"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Sends one beacon per page opened, including the in-app navigations that a
 * server log would never see as separate pages.
 *
 * Nothing is written to the visitor's device - no cookie, no localStorage -
 * so this needs no consent banner. Everything it sends is in plain sight
 * here: the path, where the visit came from, and whether the screen is a
 * phone or a computer.
 */
export function ViewTracker() {
  const pathname = usePathname();
  const sent = useRef<string | null>(null);

  useEffect(() => {
    // React runs effects twice in development; without this the numbers
    // would be double from the first day.
    if (sent.current === pathname) return;
    sent.current = pathname;

    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
    });

    // keepalive, so a visit still counts when the click that caused it also
    // navigates away from the page.
    void fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // A missed count is not worth an error in anyone's console.
    });
  }, [pathname]);

  return null;
}
