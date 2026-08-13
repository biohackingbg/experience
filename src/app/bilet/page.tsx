import type { Metadata } from "next";
import Link from "next/link";

import { isTestMode } from "@/lib/stripe";
import { isEarlyAccess } from "@/lib/tickets";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Купи билет | Sofia Life Summit 2026",
  description:
    "Билети за Sofia Life Summit — 07–08 ноември 2026, Гранд Хотел Милениум, София.",
};

// Availability changes with every sale, so nothing here may be cached.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ nivo?: string; otkazano?: string }>;
}) {
  const { nivo, otkazano } = await searchParams;
  const testMode = isTestMode();

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
            Плащането беше прекратено. Поръчката не е завършена — можеш да
            опиташ отново.
          </p>
        )}

        <h1 className="mt-8 text-[clamp(2rem,4.5vw,3.2rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
          Купи билет
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-bh-ink/60">
          Sofia Life Summit · 07—08 ноември 2026 · Гранд Хотел Милениум, София.
          Цените са крайни, с включен ДДС.
        </p>

        <CheckoutForm initialTier={nivo} early={isEarlyAccess()} />
      </div>
    </div>
  );
}
