"use client";

import { useEffect } from "react";

/**
 * Reports one opening of the deck, then how far it was read.
 *
 * Fired from the browser rather than counted on the server so that link
 * previews (Slack, WhatsApp, LinkedIn fetch the page to draw a card) and
 * crawlers do not inflate the number — they do not run scripts. A reload in
 * the same tab is not a second opening.
 *
 * Two beacons: "open" once, and "progress" whenever the tab is hidden or
 * closed, carrying seconds actually spent with the tab visible, the deepest
 * scroll and the deepest section reached. The server keeps the maximum.
 *
 * What is sent: the token, a random id for this opening, a random per-link
 * id from localStorage (so repeat opens by one person can be told from
 * several people), the referrer, and coarse device / browser / OS names.
 * Nothing that names anyone.
 */
export function ViewBeacon({
  token,
  sections,
}: {
  token: string;
  sections: readonly { id: string }[];
}) {
  useEffect(() => {
    const url = "/api/deck-view";
    const send = (payload: object) => {
      const body = JSON.stringify(payload);
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon?.(url, blob)) {
        fetch(url, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
      }
    };

    // One opening per tab session; the id lets progress find the row.
    const openKey = `deck-view:${token}`;
    let viewId: string | null = null;
    let fresh = false;
    try {
      viewId = sessionStorage.getItem(openKey);
      if (!viewId) {
        viewId = crypto.randomUUID();
        sessionStorage.setItem(openKey, viewId);
        fresh = true;
      }
    } catch {
      viewId = crypto.randomUUID();
      fresh = true;
    }

    let visitor: string | null = null;
    try {
      const vKey = `deck-visitor:${token}`;
      visitor = localStorage.getItem(vKey);
      if (!visitor) {
        visitor = crypto.randomUUID();
        localStorage.setItem(vKey, visitor);
      }
    } catch {
      visitor = null;
    }

    if (fresh) {
      send({
        kind: "open",
        token,
        viewId,
        visitor,
        referrer: document.referrer || null,
        device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
        ...coarseClient(),
      });
    }

    // ── reading progress ────────────────────────────────────────────────
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let seconds = 0;
    let scrollPct = 0;
    let deepest = -1;
    let lastSent = "";

    const order = new Map(sections.map((s, i) => [s.id, i]));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.deckSection ?? "";
          const i = order.get(id) ?? -1;
          if (i > deepest) deepest = i;
        }
      },
      { threshold: 0.25 },
    );
    document.querySelectorAll<HTMLElement>("[data-deck-section]").forEach((el) => io.observe(el));

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.round(((window.scrollY + window.innerHeight * 0.5) / doc.scrollHeight) * 100);
      if (pct > scrollPct) scrollPct = Math.min(100, pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const flush = () => {
      if (visibleSince !== null) {
        seconds += Math.round((Date.now() - visibleSince) / 1000);
        visibleSince = document.visibilityState === "visible" ? Date.now() : null;
      }
      const payload = {
        kind: "progress",
        token,
        viewId,
        seconds,
        scrollPct,
        section: deepest >= 0 ? sections[deepest].id : null,
      };
      const key = JSON.stringify(payload);
      if (key === lastSent) return;
      lastSent = key;
      send(payload);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      } else if (visibleSince === null) {
        visibleSince = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    // Long reads on a device that never fires pagehide (some mobile browsers)
    // still get a checkpoint every so often.
    const tick = window.setInterval(flush, 45_000);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      window.clearInterval(tick);
    };
  }, [token, sections]);

  return null;
}

/** Browser and OS families only — enough to know "opened on an iPhone". */
function coarseClient(): { browser: string | null; os: string | null } {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua) && !/Chromium/.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua) && !/Chrome/.test(ua)
          ? "Safari"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : null;
  return { browser, os };
}
