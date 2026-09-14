"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import {
  consentPending,
  consentSnapshot,
  shouldTrack,
  subscribeToConsent,
} from "@/lib/consent-browser";

type GtmWindow = Window & {
  dataLayer?: unknown[];
  // Matches GTM_ID_GLOBAL in @/lib/gtm-id - not imported here, the same way
  // GoogleAnalytics repeats "__slsGaId" rather than importing GA_ID_GLOBAL:
  // that module is server-only, and importing anything from it, even a
  // constant, into client code fails the build.
  __slsGtmId?: string;
};

/**
 * The container itself, loaded only after the visitor accepts measurement -
 * whatever the agency wires up inside it inherits that gate for free, since
 * nothing in the container can run before the loader that starts it does.
 *
 * Unlike the page-view-per-route Meta/GA components, the container is a
 * single global script: it fires its own page-view equivalent (and anything
 * else configured inside it) from the container's own logic once loaded, so
 * this only ever needs to load it the one time consent is granted - not on
 * every route change.
 *
 * There is deliberately no `<noscript>` fallback pixel: that variant fires
 * unconditionally, and a site whose whole premise is "nothing loads before
 * consent" has no safe way to gate a tag that only exists for visitors
 * without JavaScript to grant that consent in the first place.
 */
export function GoogleTagManager() {
  const pathname = usePathname();
  const choice = useSyncExternalStore(subscribeToConsent, consentSnapshot, consentPending);

  useEffect(() => {
    if (choice !== "granted" || !shouldTrack(pathname)) return;
    const w = window as GtmWindow;
    const id = w.__slsGtmId;
    if (!id || document.querySelector(`script[src*="gtm.js?id=${id}"]`)) return;

    w.dataLayer ??= [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }, [choice, pathname]);

  return null;
}
