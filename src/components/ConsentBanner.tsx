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
 * The banner says the least the law allows, the way Stripe says it: one
 * sentence for what the cookies are for, one that leads to the details, two
 * equal buttons - in the language of the page rather than both at once.
 * Not Stripe's words, though: theirs are also "to improve your experience",
 * and ours are for measuring advertising and nothing else.
 */
const COPY = {
  bg: {
    title: "Съгласие за маркетингови бисквитки",
    body: "Използваме бисквитки за измерване на рекламата.",
    policy: "Прочети политиката за поверителност.",
    accept: "Приемам всички",
    decline: "Отказвам всички",
    reopen: "Бисквитки",
  },
  en: {
    title: "Consent for marketing cookies",
    body: "We use cookies to measure our advertising.",
    policy: "Read our privacy policy.",
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
        <section
          role="dialog"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-description"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-3xl border border-bh-ink/15 bg-bh-paper p-4 shadow-2xl sm:p-5"
        >
          <h2 id="cookie-title" className="sr-only">
            {t.title}
          </h2>
          <p id="cookie-description" className="text-sm leading-relaxed text-bh-ink/75">
            {t.body}{" "}
            <Link href="/poveritelnost" className="underline underline-offset-2">
              {t.policy}
            </Link>
          </p>
          {/* Equal prominence, by the letter: same shape, same weight, same
              size - the supervisory authorities read a bold accept beside a
              faint decline as nudging. */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={accept}
              className="rounded-full border border-bh-ink bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper"
            >
              {t.accept}
            </button>
            <button
              type="button"
              onClick={decline}
              className="rounded-full border border-bh-ink bg-transparent px-5 py-2.5 text-sm font-semibold text-bh-ink"
            >
              {t.decline}
            </button>
          </div>
        </section>
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
