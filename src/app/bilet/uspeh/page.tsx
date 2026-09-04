import type { Metadata } from "next";
import Link from "next/link";

import { SUCCESS, langOf } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Благодарим | Sofia Life Summit 2026",
  robots: { index: false, follow: false },
};

/**
 * Shown after Stripe redirects the buyer back.
 *
 * Deliberately does NOT confirm payment from this page: the URL can be opened
 * without paying, and a buyer may close the tab before it loads. The webhook is
 * what marks the order paid, so this page reassures rather than asserts.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; lang?: string }>;
}) {
  const { ref, lang } = await searchParams;
  const t = SUCCESS[langOf(lang)];

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-pine">
          {t.eyebrow}
        </p>

        <h1 className="mt-5 text-[clamp(2rem,5vw,3rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
          {t.title}
        </h1>

        <p className="mt-5 text-sm leading-relaxed text-bh-ink/70">
          {t.body}
        </p>

        {ref && (
          <p className="mt-6 inline-block rounded-2xl bg-bh-cloud px-5 py-3 ring-1 ring-bh-ink/10">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50">
              {t.ref}
            </span>
            <span className="mt-1 block font-mono text-lg font-semibold text-bh-ink">
              {ref}
            </span>
          </p>
        )}

        <p className="mt-8 text-xs leading-relaxed text-bh-ink/50">
          {t.keep}
        </p>

        <p className="mt-3 text-xs text-bh-ink/50">
          <Link href={`/bilet/moite?lang=${langOf(lang)}`} className="underline underline-offset-2">
            {langOf(lang) === "en" ? "Ticket did not arrive?" : "Билетът не пристигна?"}
          </Link>
        </p>

        <Link
          href="/"
          className="bh-gradient mt-8 inline-flex rounded-full px-7 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
        >
          {t.back}
        </Link>
      </div>
    </div>
  );
}
