"use client";

import { cookieValue } from "@/lib/consent-browser";
import { MARKETING_CONSENT_COOKIE, hasMarketingConsent } from "@/lib/marketing-consent";

type GaWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  /** Written into the page by the server when an account is connected. */
  __slsGaId?: string;
  __slsGaLoaded?: string;
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
  const w = window as GaWindow;
  const id = w.__slsGaId;
  if (!id) return null;
  if (w.__slsGaLoaded === id) return w.gtag ?? null;

  w.dataLayer ??= [];
  // Google's tag recognises a command by the `arguments` object it is pushed
  // as; a plain array of the same values is read as data and quietly does
  // nothing - the tag loads, the property registers, and not one hit leaves
  // the browser. Hence the old-style function.
  w.gtag ??= function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  } as (...args: unknown[]) => void;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  w.gtag("js", new Date());
  // The automatic page view would count only the first screen: a page change
  // here replaces the content without a page load.
  w.gtag("config", id, { send_page_view: false });
  w.__slsGaLoaded = id;
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
