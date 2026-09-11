"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import {
  consentPending,
  consentSnapshot,
  forgetCookie,
  isConsentSurface,
  rememberConsent,
  subscribeToConsent,
} from "@/lib/consent-browser";

type TaggedWindow = Window & { fbq?: (...args: unknown[]) => void };

/**
 * Stripe's cookie banner, one to one: their sentence, their card, their two
 * equal buttons - measured off stripe.com rather than remembered. Only the
 * accent is ours. "Improve your experience" is true here too: the analytics
 * half of what the visitor accepts is what tells us which pages work.
 */
const COPY = {
  bg: {
    title: "Съгласие за бисквитки",
    body: "Използваме бисквитки, за да подобрим изживяването ти и за маркетинг. Прочети нашата ",
    policy: "политика за бисквитки",
    tail: ".",
    accept: "Приемам всички",
    decline: "Отказвам всички",
    reopen: "Бисквитки",
  },
  en: {
    title: "Cookie consent",
    body: "We use cookies to improve your experience and for marketing. Read our ",
    policy: "cookie policy",
    tail: ".",
    accept: "Accept all",
    decline: "Reject all",
    reopen: "Cookies",
  },
} as const;

/** Google names the per-property cookie after the measurement id, so it can
    only be found by prefix. */
function forgetGoogleCookies(): void {
  forgetCookie("_ga");
  for (const part of document.cookie.split(";")) {
    const name = part.trim().split("=")[0];
    if (name.startsWith("_ga_")) forgetCookie(name);
  }
}

/**
 * One choice for every advertising tag on the site.
 *
 * It lives apart from the tags themselves because it is the thing that turns
 * them on: asked once, it decides for Meta and Google alike, and it is shown
 * as soon as any of them is connected.
 */
export function ConsentBanner({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const choice = useSyncExternalStore(subscribeToConsent, consentSnapshot, consentPending);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!enabled || !isConsentSurface(pathname) || choice === "pending") return null;

  const t = COPY[pathname === "/en" || pathname.startsWith("/en/") ? "en" : "bg"];
  const showDialog = choice === null || settingsOpen;
  const accept = () => {
    rememberConsent("granted");
    setSettingsOpen(false);
  };
  const decline = () => {
    const wasGranted = choice === "granted";
    rememberConsent("denied");
    (window as TaggedWindow).fbq?.("consent", "revoke");
    forgetCookie("_fbp");
    forgetCookie("_fbc");
    forgetGoogleCookies();
    setSettingsOpen(false);
    // A tag already running cannot be unloaded; a reload is the honest way to
    // be rid of it.
    if (wasGranted) window.location.reload();
  };

  return (
    <>
      {showDialog ? (
        // Stripe's numbers: a 380px card in the bottom-left corner, 18px of
        // padding, 6px corners, a soft shadow; 14px text; two identical
        // 36px buttons with a hairline border, 8px apart.
        <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4">
          <section
            role="dialog"
            aria-labelledby="cookie-title"
            aria-describedby="cookie-description"
            className="flex max-w-[380px] flex-col gap-[14px] rounded-[6px] bg-white p-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <h2 id="cookie-title" className="sr-only">
              {t.title}
            </h2>
            <p id="cookie-description" className="text-[14px] leading-[1.4] text-[#5a6677]">
              {t.body}
              <Link href="/poveritelnost" className="underline underline-offset-2">
                {t.policy}
              </Link>
              {t.tail}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={accept}
                className="rounded-[4px] border border-[rgba(20,100,85,0.3)] bg-transparent px-6 py-[10.5px] text-[12px] leading-[12px] text-[#146455]"
              >
                {t.accept}
              </button>
              <button
                type="button"
                onClick={decline}
                className="rounded-[4px] border border-[rgba(20,100,85,0.3)] bg-transparent px-6 py-[10.5px] text-[12px] leading-[12px] text-[#146455]"
              >
                {t.decline}
              </button>
            </div>
          </section>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="fixed bottom-3 left-3 z-40 rounded-full border border-bh-ink/15 bg-bh-paper/95 px-3 py-2 text-[11px] font-medium text-bh-ink/65 shadow-md backdrop-blur transition-colors hover:text-bh-ink"
        >
          {t.reopen}
        </button>
      )}
    </>
  );
}
