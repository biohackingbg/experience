"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  consentPending,
  consentSnapshot,
  forgetCookie,
  isConsentSurface,
  rememberConsent,
  subscribeToConsent,
} from "@/lib/consent-browser";
import {
  ACCEPT_ALL,
  type ConsentChoice,
  REJECT_ALL,
} from "@/lib/marketing-consent";

type TaggedWindow = Window & { fbq?: (...args: unknown[]) => void };

/**
 * The cookie dialog: a centred window over a dimmed page, three tabs, three
 * ways out.
 *
 * It sits in the middle and dims the page on purpose - a card in a corner
 * is ignored, and an ignored banner measures nobody. What keeps this on the
 * right side of the line is that every way out is one click and the same
 * size: "Отказ" is a real button beside "Съгласявам се", not a link hidden
 * behind "Персонализация". A dialog that made refusing harder than agreeing
 * would collect consents that do not count, and the Meta and Google data
 * built on them would be worth nothing.
 *
 * Two categories, because they are two different things going to two
 * different companies. Necessary cookies are not offered: there is nothing
 * to choose.
 */

const COPY = {
  bg: {
    tabs: { consent: "Съгласие", details: "Детайли", about: "За нас" },
    title: "Нашият сайт използва бисквитки, за да функционира правилно.",
    body: "Освен необходимите за работата му, ползваме бисквитки за две неща: да разберем кои страници работят (статистика) и да покажем събитието на хората, които вече са го гледали (маркетинг).",
    policy: "Пълното описание е в политиката за поверителност.",
    policyLink: "политиката за поверителност",
    reject: "Отказ",
    customise: "Персонализация",
    accept: "Съгласявам се",
    save: "Запази избора",
    reopen: "Бисквитки",
    close: "Затвори",
    categories: {
      necessary: {
        name: "Необходими",
        body: "Една бисквитка, която пази избора ти от този прозорец за 180 дни, и сесията при плащане. Без тях сайтът не работи; не се използват за реклама.",
        always: "винаги включени",
      },
      analytics: {
        name: "Статистика",
        body: "Google Analytics: кои страници се отварят, докъде стига човек по пътя към билета. Помага ни да оправим това, което не работи. Получател е Google Ireland Ltd.",
      },
      marketing: {
        name: "Маркетинг",
        body: "Meta (Facebook, Instagram) и рекламната част на Google: да покажем събитието на хора, които вече са били тук, и да разберем коя реклама е довела до билет. Получатели са Meta Platforms Ireland Ltd. и Google Ireland Ltd.",
      },
    },
    about: [
      "Сайтът е на Biohacking.bg, организатор на Sofia Life Summit заедно с Bulgarian Longevity Association. Въпроси за данните: hi@biohacking.bg.",
      "Изборът ти важи 180 дни и може да се смени по всяко време от бутона „Бисквитки“ в долния ляв ъгъл. При оттегляне спираме бъдещите събития и изтриваме достъпните бисквитки на Meta и Google от този домейн.",
      "Всеки избор се записва с номер, дата и версия на този текст, така че да е ясно какво точно си приел/а. Номерът ти е:",
    ],
  },
  en: {
    tabs: { consent: "Consent", details: "Details", about: "About" },
    title: "Our site uses cookies so that it works properly.",
    body: "Beyond the ones it needs to work, we use cookies for two things: to see which pages work (statistics) and to show the event to people who have already looked at it (marketing).",
    policy: "The full description is in the privacy policy.",
    policyLink: "privacy policy",
    reject: "Reject",
    customise: "Customise",
    accept: "Accept",
    save: "Save choice",
    reopen: "Cookies",
    close: "Close",
    categories: {
      necessary: {
        name: "Necessary",
        body: "One cookie that keeps your choice from this window for 180 days, and the session during payment. The site does not work without them; they are not used for advertising.",
        always: "always on",
      },
      analytics: {
        name: "Statistics",
        body: "Google Analytics: which pages are opened, how far someone gets on the way to a ticket. It helps us fix what does not work. Recipient: Google Ireland Ltd.",
      },
      marketing: {
        name: "Marketing",
        body: "Meta (Facebook, Instagram) and the advertising side of Google: to show the event to people who have already been here, and to learn which advert led to a ticket. Recipients: Meta Platforms Ireland Ltd. and Google Ireland Ltd.",
      },
    },
    about: [
      "The site belongs to Biohacking.bg, organiser of Sofia Life Summit together with the Bulgarian Longevity Association. Questions about data: hi@biohacking.bg.",
      "Your choice lasts 180 days and can be changed at any time from the “Cookies” button in the bottom-left corner. On withdrawal we stop future events and delete the Meta and Google cookies reachable from this domain.",
      "Every choice is recorded with a number, a date and the version of this text, so it is clear what exactly you agreed to. Your number is:",
    ],
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

type Tab = "consent" | "details" | "about";

export function ConsentBanner({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const stored = useSyncExternalStore(
    subscribeToConsent,
    consentSnapshot,
    consentPending,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("consent");
  const [draft, setDraft] = useState<ConsentChoice>(REJECT_ALL);

  const open =
    enabled &&
    isConsentSurface(pathname) &&
    stored !== "pending" &&
    (stored === null || settingsOpen);

  // The page behind must not scroll while the question is on screen.
  // `overflow: hidden` alone is honoured on desktop but not by iOS Safari or
  // in-app browsers, where the page kept scrolling under the dialog and a
  // visitor could read the whole site without answering. Pinning the body
  // with `position: fixed` holds there too; the scroll position is put back
  // when the dialog closes.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const root = document.documentElement;
    const y = window.scrollY;
    const before = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      rootOverflow: root.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    return () => {
      body.style.position = before.position;
      body.style.top = before.top;
      body.style.left = before.left;
      body.style.right = before.right;
      body.style.width = before.width;
      body.style.overflow = before.overflow;
      root.style.overflow = before.rootOverflow;
      window.scrollTo({ top: y, behavior: "instant" });
    };
  }, [open]);

  if (!enabled || !isConsentSurface(pathname) || stored === "pending")
    return null;

  const t = pathname.startsWith("/en") ? COPY.en : COPY.bg;
  const previous = stored;

  const apply = (choice: ConsentChoice) => {
    const losingMarketing = previous?.marketing === true && !choice.marketing;
    const losingAnalytics = previous?.analytics === true && !choice.analytics;
    rememberConsent(choice);
    if (losingMarketing) {
      (window as TaggedWindow).fbq?.("consent", "revoke");
      forgetCookie("_fbp");
      forgetCookie("_fbc");
    }
    if (losingAnalytics) forgetGoogleCookies();
    setSettingsOpen(false);
    setTab("consent");
    // A tag already running cannot be unloaded; a reload is the honest way to be rid of it.
    if (losingMarketing || losingAnalytics) window.location.reload();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // Reopened from the corner: start from what is stored, not from nothing.
          if (previous)
            setDraft({
              analytics: previous.analytics,
              marketing: previous.marketing,
            });
          setTab("consent");
          setSettingsOpen(true);
        }}
        className="fixed bottom-3 left-3 z-40 rounded-full border border-bh-ink/15 bg-bh-paper/95 px-3 py-2 text-[11px] font-medium text-bh-ink/65 shadow-md backdrop-blur transition-colors hover:text-bh-ink"
      >
        {t.reopen}
      </button>
    );
  }

  const tabButton = (id: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`flex-1 border-b-2 px-3 py-4 text-sm font-semibold transition-colors ${
        tab === id
          ? "border-[#146455] text-[#146455]"
          : "border-transparent text-[#02251f]/55 hover:text-[#02251f]"
      }`}
    >
      {label}
    </button>
  );

  const toggle = (key: "analytics" | "marketing") => (
    <button
      type="button"
      role="switch"
      aria-checked={draft[key]}
      onClick={() => setDraft((d) => ({ ...d, [key]: !d[key] }))}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${draft[key] ? "bg-[#146455]" : "bg-[#02251f]/20"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${draft[key] ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overscroll-contain bg-[#02251f]/55 p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white text-[#02251f] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center justify-between px-6 pt-5 sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Biohacking Experience"
            className="h-6 w-auto sm:h-7"
          />
          {previous && (
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="text-xs font-medium text-[#02251f]/50 hover:text-[#02251f]"
            >
              {t.close}
            </button>
          )}
        </div>

        <div
          role="tablist"
          className="mt-3 flex border-b border-[#02251f]/10 px-2 sm:px-4"
        >
          {tabButton("consent", t.tabs.consent)}
          {tabButton("details", t.tabs.details)}
          {tabButton("about", t.tabs.about)}
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          {tab === "consent" && (
            <>
              <h2
                id="cookie-title"
                className="text-[15px] font-bold leading-snug"
              >
                {t.title}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-[#02251f]/85">
                {t.body}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-[#02251f]/60">
                {t.policy.replace(t.policyLink + ".", "")}
                <Link
                  href="/poveritelnost"
                  className="underline underline-offset-2 hover:text-[#02251f]"
                >
                  {t.policyLink}
                </Link>
                .
              </p>
            </>
          )}

          {tab === "details" && (
            <ul className="flex flex-col divide-y divide-[#02251f]/10">
              <li className="flex items-start justify-between gap-6 py-4">
                <div>
                  <div className="text-[15px] font-semibold">
                    {t.categories.necessary.name}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#02251f]/65">
                    {t.categories.necessary.body}
                  </p>
                </div>
                <span className="shrink-0 pt-1 text-[11px] font-medium uppercase tracking-wide text-[#02251f]/45">
                  {t.categories.necessary.always}
                </span>
              </li>
              <li className="flex items-start justify-between gap-6 py-4">
                <div>
                  <div className="text-[15px] font-semibold">
                    {t.categories.analytics.name}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#02251f]/65">
                    {t.categories.analytics.body}
                  </p>
                </div>
                {toggle("analytics")}
              </li>
              <li className="flex items-start justify-between gap-6 py-4">
                <div>
                  <div className="text-[15px] font-semibold">
                    {t.categories.marketing.name}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#02251f]/65">
                    {t.categories.marketing.body}
                  </p>
                </div>
                {toggle("marketing")}
              </li>
            </ul>
          )}

          {tab === "about" && (
            <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-[#02251f]/80">
              <p>{t.about[0]}</p>
              <p>{t.about[1]}</p>
              <p>
                {t.about[2]}{" "}
                <code className="rounded bg-[#02251f]/8 px-1.5 py-0.5 font-mono text-[12px] text-[#02251f]">
                  {previous?.id ?? "—"}
                </code>
              </p>
            </div>
          )}
        </div>

        {/* The row from the reference, one to one: "Отказ" and
            "Персонализация" as plain text, "Съгласявам се" the only thing
            shaped like a button. All three are one click and on the same
            row; the difference is in how loudly each one is drawn. That
            imbalance is the organisers' call, made knowing what it is. */}
        <div className="border-t border-[#02251f]/10 px-6 py-4 sm:px-8">
          {/* Three equal columns from tablet up. On a phone the three labels
            do not fit one row, so the pill goes on top at full width and
            the two plain choices share the row beneath - still one tap each,
            still the same words. `sm:contents` dissolves the pair's wrapper
            so the desktop grid sees three children in the reference order. */}
          <div className="grid gap-2 sm:grid-cols-3 sm:items-center">
            <button
              type="button"
              onClick={() => apply(ACCEPT_ALL)}
              className="bh-gradient order-first inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-3 text-[15px] font-semibold text-[#02251f] transition-transform hover:-translate-y-0.5 sm:order-last"
            >
              {t.accept}
            </button>
            <div className="grid grid-cols-2 sm:contents">
              <button
                type="button"
                onClick={() => apply(REJECT_ALL)}
                className="py-3 text-center text-[15px] font-semibold text-[#02251f] transition-colors hover:text-[#146455]"
              >
                {t.reject}
              </button>
              {tab === "details" ? (
                <button
                  type="button"
                  onClick={() => apply(draft)}
                  className="py-3 text-center text-[15px] font-semibold text-[#02251f] transition-colors hover:text-[#146455]"
                >
                  {t.save}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("details")}
                  className="inline-flex items-center justify-center gap-1.5 py-3 text-[15px] font-semibold text-[#02251f] transition-colors hover:text-[#146455]"
                >
                  {t.customise}
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path
                      d="M7.5 5l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
