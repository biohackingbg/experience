"use client";

import { useEffect } from "react";

/**
 * Reports one opening of the deck. Fired from the browser rather than counted
 * on the server so that link previews (Slack, WhatsApp, LinkedIn fetch the
 * page to draw a card) and crawlers do not inflate the number — they do not
 * run scripts. A reload in the same tab is not a second opening.
 *
 * Sends the token, the referrer and a coarse device class. Nothing else.
 */
export function ViewBeacon({ token }: { token: string }) {
  useEffect(() => {
    const key = `deck-viewed:${token}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked — count anyway; a double count beats a lost one.
    }
    const body = JSON.stringify({
      token,
      referrer: document.referrer || null,
      device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/deck-view", blob)) {
      fetch("/api/deck-view", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  }, [token]);

  return null;
}
