"use client";

import {
  MARKETING_CONSENT_COOKIE,
  hasMarketingConsent,
} from "@/lib/marketing-consent";

type MetaParameters = Record<string, string | number | string[]>;
type MetaWindow = Window & { fbq?: (...args: unknown[]) => void };

function cookieValue(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

/** Browser events remain inert unless the visitor explicitly accepted Meta. */
export function trackMetaEvent(name: string, parameters?: MetaParameters): void {
  if (typeof window === "undefined") return;
  if (!hasMarketingConsent(cookieValue(MARKETING_CONSENT_COOKIE))) return;
  (window as MetaWindow).fbq?.("track", name, parameters ?? {});
}
