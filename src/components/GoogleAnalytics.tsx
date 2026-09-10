"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  consentPending,
  consentSnapshot,
  shouldTrack,
  subscribeToConsent,
} from "@/lib/consent-browser";
import { trackGaPageView } from "@/lib/ga-browser";

/**
 * Google Analytics, loaded only after the visitor accepts measurement.
 *
 * The same consent as Meta's, from the same banner: one choice, both tags.
 * Nothing is requested from Google before that choice, so declining leaves
 * the site cookieless as far as advertising is concerned.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const choice = useSyncExternalStore(subscribeToConsent, consentSnapshot, consentPending);
  const sentPath = useRef<string | null>(null);

  useEffect(() => {
    if (choice !== "granted" || !shouldTrack(pathname)) return;
    if (sentPath.current === pathname) return;
    sentPath.current = pathname;
    trackGaPageView();
  }, [choice, pathname]);

  return null;
}
