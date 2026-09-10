"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  consentPending,
  consentSnapshot,
  shouldTrack,
  subscribeToConsent,
} from "@/lib/consent-browser";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  push?: Fbq;
  queue?: unknown[][];
  version?: string;
};

type MetaWindow = Window & {
  fbq?: Fbq;
  _fbq?: Fbq;
  __slsMetaPixelId?: string;
};

function initializePixel(id: string): Fbq {
  const meta = window as MetaWindow;
  if (!meta.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    } as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    meta.fbq = fbq;
    meta._fbq ??= fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
    else document.head.appendChild(script);
  }
  meta.fbq("consent", "grant");
  if (meta.__slsMetaPixelId !== id) {
    meta.fbq("init", id);
    meta.__slsMetaPixelId = id;
  }
  return meta.fbq;
}

/**
 * Meta is privacy-off by default. The script is not even requested until a
 * visitor chooses marketing cookies; declining leaves the site fully usable.
 */
export function MetaPixel({ id }: { id: string | null }) {
  const pathname = usePathname();
  const choice = useSyncExternalStore(subscribeToConsent, consentSnapshot, consentPending);
  const trackedPath = useRef<string | null>(null);
  const viewedTicketPath = useRef<string | null>(null);

  useEffect(() => {
    if (!id || choice !== "granted" || !shouldTrack(pathname)) return;
    const fbq = initializePixel(id);
    if (trackedPath.current !== pathname) {
      fbq("track", "PageView");
      trackedPath.current = pathname;
    }
    if (pathname === "/bilet" && viewedTicketPath.current !== pathname) {
      fbq("track", "ViewContent", {
        content_name: "Sofia Life Summit tickets",
        content_category: "Tickets",
      });
      viewedTicketPath.current = pathname;
    }
  }, [choice, id, pathname]);

  return null;
}
