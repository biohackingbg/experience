import Link from "next/link";

/**
 * A wrong or expired token used to land on the site's generic 404, which
 * tells a prospective partner nothing and offers them no way forward. This
 * one names the likely cause - a link mangled in transit - and hands them
 * the one action that fixes it.
 */
export default function DeckNotFound() {
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
          Този линк не се отваря
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-bh-ink/75">
          Най-често причината е, че адресът се е счупил по пътя - месинджърите
          режат дълги линкове, а част от знаците се бъркат при преписване.
          Напиши ни и веднага ще получиш нов, работещ адрес.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="mailto:hi@biohacking.bg?subject=Нов%20линк%20към%20партньорската%20презентация"
            className="rounded-full bg-bh-ink px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Поискай нов линк
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
