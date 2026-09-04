import type { Metadata } from "next";
import Link from "next/link";

import { isTestMode } from "@/lib/stripe";
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
  searchParams: Promise<{ nivo?: string; otkazano?: string; utm_source?: string; utm_campaign?: string }>;
}) {
  const { nivo, otkazano, utm_source, utm_campaign } = await searchParams;
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

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink"
        >
          ← Обратно към сайта
        </Link>

        {testMode && (
          <p className="mt-6 rounded-2xl bg-amber-100 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-300">
            <strong>Тестов режим.</strong> Плащанията не са истински. Използвай
            карта 4242 4242 4242 4242 с произволна бъдеща дата и CVC.
          </p>
        )}

        {otkazano && (
          <p className="mt-6 rounded-2xl bg-bh-cloud px-5 py-3 text-sm text-bh-ink/70 ring-1 ring-bh-ink/10">
            Плащането беше прекратено. Поръчката не е завършена - можеш да
            опиташ отново.
          </p>
        )}

        <h1 className="mt-8 text-[clamp(2rem,4.5vw,3.2rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
          Купи билет
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-bh-ink/60">
          Sofia Life Summit · 07-08 ноември 2026 · Гранд Хотел Милениум, София.
          Цените са крайни, с включен ДДС.
        </p>

        {SALES_OPEN && early && (
          /* Said before the money, not after: the price on this page depends
             on a number that is moving while the buyer reads it. */
          <p className="mt-4 max-w-xl rounded-2xl bg-bh-cloud px-5 py-4 text-sm leading-relaxed text-bh-ink/70 ring-1 ring-bh-ink/10">
            <strong className="font-semibold text-bh-ink">
              {pricing.stage === "launch" ? "Стартова цена" : "Специална цена"}
            </strong>{" "}
            - тази цена важи {pricing.stage === "launch" ? "за " : ""}{pricing.label}. Плащаш сега, билетът и
            мястото ти са запазени, а програмата се допълва до събитието.
          </p>
        )}

        <CheckoutForm initialTier={nivo} prices={pricing.prices} soldOut={soldOut} utm={{ source: utm_source, campaign: utm_campaign }} />
      </div>
    </div>
  );
}
