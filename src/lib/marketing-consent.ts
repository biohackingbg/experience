/**
 * The value is versioned so a material change to the advertising disclosure
 * can ask visitors again instead of silently reusing an older choice.
 */
export const MARKETING_CONSENT_COOKIE = "sls_marketing_consent";
export const MARKETING_CONSENT_VERSION = "meta-ga-v2-2026-09-10";
export const MARKETING_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export type MarketingConsent = "granted" | "denied";

export function marketingConsentValue(choice: MarketingConsent): string {
  return `${MARKETING_CONSENT_VERSION}:${choice}`;
}

export function readMarketingConsent(value?: string | null): MarketingConsent | null {
  if (value === marketingConsentValue("granted")) return "granted";
  if (value === marketingConsentValue("denied")) return "denied";
  return null;
}

export function hasMarketingConsent(value?: string | null): boolean {
  return readMarketingConsent(value) === "granted";
}
