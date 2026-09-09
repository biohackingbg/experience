"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  MARKETING_CONSENT_COOKIE,
  MARKETING_CONSENT_MAX_AGE,
  type MarketingConsent,
  marketingConsentValue,
  readMarketingConsent,
} from "@/lib/marketing-consent";

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

const PUBLIC_PATHS = ["/", "/en", "/programa", "/en/programa", "/bilet"];

function isConsentSurface(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname === "/poveritelnost" ||
    pathname.startsWith("/lektor/") ||
    pathname.startsWith("/en/lektor/")
  );
}

function shouldTrack(pathname: string): boolean {
  return pathname !== "/poveritelnost" && isConsentSurface(pathname);
}

function cookieValue(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function remember(choice: MarketingConsent): void {
  document.cookie = `${encodeURIComponent(MARKETING_CONSENT_COOKIE)}=${encodeURIComponent(marketingConsentValue(choice))}; Max-Age=${MARKETING_CONSENT_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
  window.dispatchEvent(new Event("sls:marketing-consent"));
}

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener("sls:marketing-consent", onStoreChange);
  return () => window.removeEventListener("sls:marketing-consent", onStoreChange);
}

function consentSnapshot(): MarketingConsent | null {
  return readMarketingConsent(cookieValue(MARKETING_CONSENT_COOKIE));
}

function removeMetaCookie(name: "_fbp" | "_fbc"): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
  document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.thelongevitysummit.eu; SameSite=Lax; Secure`;
}

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
  const choice = useSyncExternalStore(
    subscribeToConsent,
    consentSnapshot,
    () => "pending" as const,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  if (!id || !isConsentSurface(pathname) || choice === "pending") return null;

  const showDialog = choice === null || settingsOpen;
  const accept = () => {
    remember("granted");
    setSettingsOpen(false);
  };
  const decline = () => {
    const wasGranted = choice === "granted";
    remember("denied");
    (window as MetaWindow).fbq?.("consent", "revoke");
    removeMetaCookie("_fbp");
    removeMetaCookie("_fbc");
    setSettingsOpen(false);
    if (wasGranted) window.location.reload();
  };

  return (
    <>
      {showDialog ? (
        <section
          role="dialog"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-description"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-3xl border border-bh-ink/15 bg-bh-paper p-5 shadow-2xl sm:p-6"
        >
          <h2 id="cookie-title" className="text-lg font-bold text-bh-ink">
            Поверителност и Meta / Privacy and Meta
          </h2>
          <p id="cookie-description" className="mt-2 text-sm leading-relaxed text-bh-ink/70">
            С твое съгласие използваме Meta Pixel, за да измерваме кои реклами водят до интерес и продажби. При отказ сайтът и покупката работят нормално. / With your consent, Meta Pixel helps us measure ad results. The site and checkout work normally if you decline.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-bh-ink/55">
            Подробности в <Link href="/poveritelnost" className="underline underline-offset-2">политиката за поверителност</Link>.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={accept}
              className="bh-gradient rounded-full px-5 py-3 text-sm font-semibold text-bh-ink"
            >
              Приемам / Accept
            </button>
            <button
              type="button"
              onClick={decline}
              className="rounded-full border border-bh-ink/25 px-5 py-3 text-sm font-semibold text-bh-ink"
            >
              Без маркетинг / Decline
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="fixed bottom-3 left-3 z-40 rounded-full border border-bh-ink/15 bg-bh-paper/95 px-3 py-2 text-[11px] font-medium text-bh-ink/65 shadow-md backdrop-blur transition-colors hover:text-bh-ink"
        >
          Бисквитки / Cookies
        </button>
      )}
    </>
  );
}
