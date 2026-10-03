import type { Metadata } from "next";
import Link from "next/link";

import { isTestMode } from "@/lib/stripe";
import { CHECKOUT, langOf } from "@/lib/i18n";
import { getRemainingAll } from "@/lib/orders";
import { getPricing } from "@/lib/pricing";
import { SALES_OPEN } from "@/lib/tickets";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Купи билет | Sofia Life Summit 2026",
  description:
    "Билети за Sofia Life Summit - 07-08 ноември 2026, Гранд Хотел Милениум, София.",
};

// Availability changes with every sale, so nothing here may be cached.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ nivo?: string; otkazano?: string; utm_source?: string; utm_campaign?: string; lang?: string }>;
}) {
  const { nivo, otkazano, utm_source, utm_campaign, lang: langRaw } = await searchParams;
  const lang = langOf(langRaw);
  const t = CHECKOUT[lang];
  const testMode = isTestMode();
  const [pricing, remaining] = await Promise.all([getPricing(), getRemainingAll()]);
  const early = pricing.discounted;
  const soldOut = Object.entries(remaining).filter(([, n]) => n === 0).map(([id]) => id);

  // While sales are closed the page still answers - a shared link should
  // explain itself rather than 404 - but it carries no prices and no form.
  if (!SALES_OPEN) {
    return (
      <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/60 transition-colors hover:text-bh-ink"
          >
            ← Обратно към сайта
          </Link>
          <h1 className="mt-10 text-[clamp(2.2rem,5vw,3.4rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
            Билетите отварят скоро
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bh-ink/70">
            Финализираме нивата и цените за Sofia Life Summit. Обявяваме ги в
            рамките на дни - заедно с това какво включва всяко ниво.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-bh-ink/70">
            07-08 ноември 2026 · Гранд Хотел Милениум, София
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/#tickets"
              className="rounded-full bg-bh-ink px-6 py-3.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
            >
              Виж какво включват нивата
            </Link>
            <a
              href="mailto:hi@biohacking.bg?subject=Билети%20Sofia%20Life%20Summit"
              className="rounded-full border border-bh-ink/25 px-6 py-3.5 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              Пиши ни
            </a>
          </div>
        </div>
      </div>
    );
  }

  const keep = new URLSearchParams();
  if (nivo) keep.set("nivo", nivo);
  if (utm_source) keep.set("utm_source", utm_source);
  if (utm_campaign) keep.set("utm_campaign", utm_campaign);
  keep.set("lang", lang === "en" ? "bg" : "en");

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink"
          >
            {t.back}
          </Link>
          {/* The one place the site speaks English: a guest of a foreign speaker buys here. */}
          <Link
            href={`/bilet?${keep.toString()}`}
            hrefLang={lang === "en" ? "bg" : "en"}
            className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
          >
            {t.switchTo}
          </Link>
        </div>

        {testMode && (
          <p className="mt-6 rounded-2xl bg-amber-100 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-300">
            {t.testMode}
          </p>
        )}

        {otkazano && (
          <p className="mt-6 rounded-2xl bg-bh-cloud px-5 py-3 text-sm text-bh-ink/70 ring-1 ring-bh-ink/10">
            {t.cancelled}
          </p>
        )}

        <h1 className="mt-8 text-[clamp(2rem,4.5vw,3.2rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
          {t.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-bh-ink/60">
          {t.intro}
        </p>

        {/* The offer line sits under the cards now, and the page opens on
            PLUS unless the link asked for a tier: an ad that lands here
            should meet the ticket most people buy, not the cheapest row. */}
        <CheckoutForm
          initialTier={nivo ?? "plus"}
          prices={pricing.prices}
          soldOut={soldOut}
          lang={lang}
          utm={{ source: utm_source, campaign: utm_campaign }}
          discounted={early}
          regularAfter={lang === "en" ? (pricing.stage === "launch" ? "after the first 200 tickets" : pricing.regularAfter) : pricing.regularAfter}
          offerNote={
            early
              ? `${pricing.stage === "launch" ? t.launchPrice : t.specialPrice} ${
                  lang === "en"
                    ? CHECKOUT.en.priceNote(pricing.stage === "launch" ? "to the first 200 tickets" : pricing.label)
                    : CHECKOUT.bg.priceNote(pricing.label, pricing.stage === "launch")
                }`
              : undefined
          }
        />
      </div>
    </div>
  );
}
