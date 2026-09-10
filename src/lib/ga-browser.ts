"use client";

import { cookieValue } from "@/lib/consent-browser";
import { gaId } from "@/lib/ga-id";
import { MARKETING_CONSENT_COOKIE, hasMarketingConsent } from "@/lib/marketing-consent";

type GaWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  __slsGaId?: string;
};

/**
 * Loads the tag if it is not loaded yet, and hands it back.
 *
 * Every event goes through here rather than assuming some component has run
 * first: effects fire from the inside of the page outwards, so the ticket
 * form's events happen before the tag in the layout would have loaded, and
 * an event sent into a missing tag disappears without a word.
 */
function ensureGa(): GaWindow["gtag"] | null {
  const id = gaId();
  if (!id) return null;
  const w = window as GaWindow;
  if (w.__slsGaId === id) return w.gtag ?? null;

  w.dataLayer ??= [];
  w.gtag ??= function gtag(...args: unknown[]) {
    w.dataLayer!.push(args);
  };
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  w.gtag("js", new Date());
  // The automatic page view would count only the first screen: a page change
  // here replaces the content without a page load.
  w.gtag("config", id, { send_page_view: false });
  w.__slsGaId = id;
  return w.gtag;
}

/** Browser events stay inert unless the visitor explicitly accepted measurement. */
export function trackGaEvent(name: string, parameters?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!hasMarketingConsent(cookieValue(MARKETING_CONSENT_COOKIE))) return;
  ensureGa()?.("event", name, parameters ?? {});
}

export function trackGaPageView(): void {
  trackGaEvent("page_view", {
    page_location: window.location.href,
    page_title: document.title,
  });
}
