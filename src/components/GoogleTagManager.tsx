"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { shouldTrack } from "@/lib/consent-browser";

type GtmWindow = Window & {
  dataLayer?: unknown[];
  // Matches GTM_ID_GLOBAL in @/lib/gtm-id - not imported here, the same way
  // GoogleAnalytics repeats "__slsGaId" rather than importing GA_ID_GLOBAL:
  // that module is server-only, and importing anything from it, even a
  // constant, into client code fails the build.
  __slsGtmId?: string;
};

/**
 * The container, loaded for every visitor - not gated on consent the way
 * Meta and GA4's own scripts are.
 *
 * This is Google's "Basic" Consent Mode shape rather than the blocking one
 * this used to do: the empty shell sets no cookie and sends no personal data
 * on its own, so loading it needs no consent under ePrivacy - only reading
 * or writing something on the visitor's device does. What used to gate the
 * whole container now gates each tag inside it instead: the layout's default
 * `gtag('consent','default',...)` denies everything before this ever runs,
 * and Google's own tag types (a GA4 Configuration tag, a Google Ads
 * conversion tag) already refuse to fire - no cookie, no request - until
 * rememberConsent's `update` grants it. A tag the agency adds that is NOT
 * one of Google's own types (a Custom HTML tag for another platform's pixel,
 * say) does not get this for free - it has to be told, in that tag's own
 * Consent Settings inside GTM, which consent state to wait for.
 *
 * Loading it always is also the practical reason to make this change at
 * all: the agency's own tools read the container as connected only once it
 * has actually loaded somewhere, and it used to wait on a real visitor's
 * "yes" to do that.
 */
export function GoogleTagManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldTrack(pathname)) return;
    const w = window as GtmWindow;
    const id = w.__slsGtmId;
    if (!id || document.querySelector(`script[src*="gtm.js?id=${id}"]`)) return;

    w.dataLayer ??= [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }, [pathname]);

  return null;
}
