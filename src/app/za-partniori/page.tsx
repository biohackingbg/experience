import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Партньорска програма | Sofia Life Summit",
  robots: { index: false, follow: false },
};

/**
 * The bare address, without a share token.
 *
 * It used to 404, which is what anyone holding the deck's original link -
 * sent before the page moved behind per-partner tokens - would have hit. A
 * dead end for exactly the people we are courting, so it now explains itself
 * and offers the one thing that helps: a way to ask for a link.
 */
export default function PartnersEntryPage() {
  return (
    <div className="bh-doc min-h-screen px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/60 transition-colors hover:text-bh-ink"
        >
          ← Към сайта
        </Link>

        <h1 className="mt-10 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
          Партньорската презентация
          <br />
          се отваря с личен линк
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-bh-ink/75">
          Всеки партньор получава свой адрес - така знаем с кого говорим и какво
          сме изпратили. Ако линкът ти не се отваря или си го получил счупен от
          месинджър, пиши ни и ще ти изпратим нов до минути.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="mailto:hi@biohacking.bg?subject=Линк%20към%20партньорската%20презентация"
            className="rounded-full bg-bh-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Поискай линк
          </a>
          <Link
            href="/"
            className="rounded-full border border-bh-ink/25 px-6 py-3.5 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
          >
            Виж събитието
          </Link>
        </div>

        <p className="mt-12 border-t border-bh-ink/10 pt-6 text-sm text-bh-ink/70">
          Sofia Life Summit · 07-08 ноември 2026 · Гранд Хотел Милениум, София
          <br />
          Партньорства: Мария Варсанова · hi@biohacking.bg
        </p>
      </div>
    </div>
  );
}
