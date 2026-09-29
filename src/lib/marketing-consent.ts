/**
 * The visitor's cookie choice, as the site stores it.
 *
 * Two categories rather than one switch, because they answer different
 * questions and go to different companies: "статистика" is Google Analytics,
 * "маркетинг" is Meta and the advertising half of Google. Necessary cookies
 * are not a category - nothing to choose.
 *
 * The value is versioned so a material change to the disclosure asks
 * visitors again instead of silently reusing an older choice. It also
 * carries a consent id: a random token that means nothing on its own, but
 * lets a visitor point at the exact record of what they agreed to and when
 * (the log in consent_log), which is what "proof of consent" is.
 *
 * Shape: `<version>:a<0|1>m<0|1>:<id>`. Anything else - an older version,
 * a mangled value - reads as "not asked yet".
 */
export const MARKETING_CONSENT_COOKIE = "sls_marketing_consent";
export const MARKETING_CONSENT_VERSION = "v4-2026-09-29";
export const MARKETING_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export type ConsentChoice = { analytics: boolean; marketing: boolean };

export type StoredConsent = ConsentChoice & { id: string };

/** Kept for the callers that only ever asked "may Meta run" - the answer is the marketing flag. */
export type MarketingConsent = "granted" | "denied";

export const ACCEPT_ALL: ConsentChoice = { analytics: true, marketing: true };
export const REJECT_ALL: ConsentChoice = { analytics: false, marketing: false };

export function marketingConsentValue(choice: ConsentChoice, id: string): string {
  return `${MARKETING_CONSENT_VERSION}:a${choice.analytics ? 1 : 0}m${choice.marketing ? 1 : 0}:${id}`;
}

export function readConsent(value?: string | null): StoredConsent | null {
  if (!value) return null;
  const m = /^([^:]+):a([01])m([01]):([A-Za-z0-9_-]{8,40})$/.exec(value);
  if (!m || m[1] !== MARKETING_CONSENT_VERSION) return null;
  return { analytics: m[2] === "1", marketing: m[3] === "1", id: m[4] };
}

/** The one-word answer the tag gates ask for. */
export function readMarketingConsent(value?: string | null): MarketingConsent | null {
  const c = readConsent(value);
  return c ? (c.marketing ? "granted" : "denied") : null;
}

export function hasMarketingConsent(value?: string | null): boolean {
  return readConsent(value)?.marketing === true;
}

export function hasAnalyticsConsent(value?: string | null): boolean {
  return readConsent(value)?.analytics === true;
}
