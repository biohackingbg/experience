"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** The two campaign tags we read from a link; nothing else in the query is looked at. */
function campaignTags(): { source: string | null; campaign: string | null } {
  const p = new URLSearchParams(window.location.search);
  return { source: p.get("utm_source"), campaign: p.get("utm_campaign") };
}

/**
 * Sends one beacon per page opened, including the in-app navigations that a
 * server log would never see as separate pages.
 *
 * Nothing is written to the visitor's device - no cookie, no localStorage -
 * so this needs no consent banner. Everything it sends is in plain sight
 * here: the path, where the visit came from, whether the screen is a phone
 * or a computer, and the utm_source / utm_campaign tags if the link had them.
 *
 * Those tags are also carried onto the "buy a ticket" links on the same page
 * - in the URL, at click time, not in any storage - so an order can say which
 * campaign brought it.
 */
export function ViewTracker() {
  const pathname = usePathname();
  const router = useRouter();
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const tags = campaignTags();
    if (!tags.source && !tags.campaign) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="/bilet"]');
      const href = a?.getAttribute("href");
      if (!href) return;
      const url = new URL(href, window.location.origin);
      if (tags.source) url.searchParams.set("utm_source", tags.source);
      if (tags.campaign) url.searchParams.set("utm_campaign", tags.campaign);
      e.preventDefault();
      router.push(url.pathname + url.search);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, router]);

  useEffect(() => {
    // React runs effects twice in development; without this the numbers
    // would be double from the first day.
    if (sent.current === pathname) return;
    sent.current = pathname;

    const tags = campaignTags();
    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
      utmSource: tags.source,
      utmCampaign: tags.campaign,
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
