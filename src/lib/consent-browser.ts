"use client";

import {
  type ConsentChoice,
  MARKETING_CONSENT_COOKIE,
  MARKETING_CONSENT_MAX_AGE,
  MARKETING_CONSENT_VERSION,
  type StoredConsent,
  marketingConsentValue,
  readConsent,
} from "@/lib/marketing-consent";

/** Both measurement tags read the one choice, so they can never disagree. */
export const CONSENT_EVENT = "sls:marketing-consent";

export function cookieValue(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

export function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onStoreChange);
  return () => window.removeEventListener(CONSENT_EVENT, onStoreChange);
}

/** What a component sees: the stored choice, nothing yet, or "pending" while the server renders. */
export type ConsentState = StoredConsent | null | "pending";

// useSyncExternalStore compares snapshots by identity, so the same cookie
// must yield the same object or the banner re-renders on every read.
let lastRaw: string | null | undefined;
let lastParsed: StoredConsent | null = null;
export function consentSnapshot(): ConsentState {
  const raw = cookieValue(MARKETING_CONSENT_COOKIE);
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastParsed = readConsent(raw);
  }
  return lastParsed;
}

/** Server rendering has no cookies to read, so it must render as undecided. */
export const consentPending = (): ConsentState => "pending";

/** The two questions the tags ask of a snapshot. */
export const allowsAnalytics = (c: ConsentState) => c !== null && c !== "pending" && c.analytics;
export const allowsMarketing = (c: ConsentState) => c !== null && c !== "pending" && c.marketing;

/** Where the banner is offered, and therefore where a tag may run at all. */
const PUBLIC_PATHS = ["/", "/en", "/programa", "/en/programa", "/bilet"];

export function isConsentSurface(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname === "/poveritelnost" ||
    pathname.startsWith("/lektor/") ||
    pathname.startsWith("/en/lektor/")
  );
}

/** The privacy page explains the choice; measuring the reader of it would be
    a poor way to make the point. */
export function shouldTrack(pathname: string): boolean {
  return pathname !== "/poveritelnost" && isConsentSurface(pathname);
}

/** Random, URL-safe, and meaningless on its own: the key to one row of the consent log. */
function newConsentId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Stores the choice, tells Google's tags, tells the page, and writes the
 * record.
 *
 * The consent id survives a change of mind: the log then shows the same
 * person accepting and later withdrawing, which is the honest history. A
 * fresh id is minted only when there was no valid cookie to begin with.
 */
export function rememberConsent(choice: ConsentChoice): void {
  const current = consentSnapshot();
  const id = current && current !== "pending" ? current.id : newConsentId();
  document.cookie = `${encodeURIComponent(MARKETING_CONSENT_COOKIE)}=${encodeURIComponent(marketingConsentValue(choice, id))}; Max-Age=${MARKETING_CONSENT_MAX_AGE}; Path=/; SameSite=Lax; Secure`;

  // Google Consent Mode: the same choice, in Google's vocabulary. `gtag` is
  // the bootstrap stub the layout defines on every page a Google product is
  // connected to - optional-chained because a site with only Meta never
  // sets it. Functionality and personalization follow marketing: they gate
  // the agency's tags, not the site's own theme or consent cookie.
  const a = choice.analytics ? "granted" : "denied";
  const m = choice.marketing ? "granted" : "denied";
  (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.("consent", "update", {
    ad_storage: m,
    ad_user_data: m,
    ad_personalization: m,
    analytics_storage: a,
    personalization_storage: m,
    functionality_storage: m,
    security_storage: "granted",
  });
  window.dispatchEvent(new Event(CONSENT_EVENT));

  // The record. Fire-and-forget with keepalive, so a click followed by a
  // navigation still lands; a failure here must never block the choice.
  try {
    void fetch("/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        id,
        version: MARKETING_CONSENT_VERSION,
        analytics: choice.analytics,
        marketing: choice.marketing,
        path: window.location.pathname,
      }),
    });
  } catch {
    /* the choice is already stored; the log is evidence, not the gate */
  }
}

/** Withdrawal has to take the identifiers with it, not just stop new events. */
export function forgetCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
  document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.thelongevitysummit.eu; SameSite=Lax; Secure`;
}
