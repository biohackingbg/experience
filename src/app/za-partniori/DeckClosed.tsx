import Link from "next/link";

/**
 * The summit is over: the partner deck is closed, on every personal link and
 * on the bare address. The links stay in the pipeline (stands, profiles and
 * documents still read them); only the page stops showing the offer.
 */
export function DeckClosed() {
  return (
    <div className="bh-doc min-h-screen px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/60 transition-colors hover:text-bh-ink">
          ← Към сайта
        </Link>
        <h1 className="mt-10 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
          Партньорската програма
          <br />
          за 2026 е затворена
        </h1>
        <p className="mt-6 text-lg font-light leading-relaxed text-bh-ink/75">
          Sofia Life Summit 2026 приключи. Благодарим на всички партньори! Ако искаш да говорим за следващото издание, пиши ни.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="mailto:hi@biohacking.bg?subject=Партньорство%20за%20следващото%20издание"
            className="rounded-full bg-bh-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Пиши ни
          </a>
        </div>
        <p className="mt-12 border-t border-bh-ink/10 pt-6 text-sm text-bh-ink/70">
          Партньорства: Мария Варсанова, hi@biohacking.bg
        </p>
      </div>
    </div>
  );
}
