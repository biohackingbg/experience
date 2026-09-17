"use client";

import {
  MARKETING_CONSENT_COOKIE,
  MARKETING_CONSENT_MAX_AGE,
  type MarketingConsent,
  marketingConsentValue,
  readMarketingConsent,
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

export function consentSnapshot(): MarketingConsent | null {
  return readMarketingConsent(cookieValue(MARKETING_CONSENT_COOKIE));
}

/** Server rendering has no cookies to read, so it must render as undecided. */
export const consentPending = () => "pending" as const;

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

export function rememberConsent(choice: MarketingConsent): void {
  document.cookie = `${encodeURIComponent(MARKETING_CONSENT_COOKIE)}=${encodeURIComponent(marketingConsentValue(choice))}; Max-Age=${MARKETING_CONSENT_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
  // Google Consent Mode: the same choice, told to Google's own tags in their
  // own vocabulary. `gtag` here is the bootstrap stub the layout defines on
  // every page a Google product is connected to (before this can ever run) -
  // optional-chained because a site with only Meta connected never sets it.
  const state = choice === "granted" ? "granted" : "denied";
  // The same seven signals the layout's default sets; keep the two in step.
  (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
    personalization_storage: state,
    functionality_storage: state,
    security_storage: "granted",
  });
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Withdrawal has to take the identifiers with it, not just stop new events. */
export function forgetCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
  document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.thelongevitysummit.eu; SameSite=Lax; Secure`;
}
