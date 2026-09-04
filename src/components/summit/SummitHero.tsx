import {
  ArrowDownLeft,
  Dna,
  Gauge,
  Hotel,
  People,
  Stage,
} from "@/components/ui/Pictograms";
import type { Lang } from "@/lib/i18n";
import { HERO } from "@/lib/site-copy";
import { SALES_OPEN } from "@/lib/tickets";

/**
 * Editorial signature from the reference: circular type slowly orbiting a
 * spark. Static SVG, spun by CSS only when the visitor allows motion.
 */
function OrbitBadge() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative hidden h-24 w-24 shrink-0 lg:block"
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full motion-safe:animate-[spin_22s_linear_infinite]"
      >
        <defs>
          <path
            id="orbit"
            d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
            fill="none"
          />
        </defs>
        <text className="fill-bh-ink/55 font-mono text-[8.5px] uppercase tracking-[0.28em]">
          <textPath href="#orbit">
            Sofia Life Summit · Biohacking Experience ·
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 grid place-items-center text-2xl text-bh-pine">
        ✦
      </span>
    </div>
  );
}

/**
 * `speakerCount` is passed in rather than counted here: the page below shows
 * the announced line-up, and the two numbers on one screen must be the same
 * number. `from` is the cheapest ticket, so the button quotes the price the
 * next screen charges.
 */
export function SummitHero({
  lang = "bg",
  speakerCount,
  from,
}: {
  lang?: Lang;
  speakerCount: number;
  from: string;
}) {
  const c = HERO[lang];
  const en = lang === "en";
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden px-5 pt-6 sm:px-8 lg:px-10 lg:pt-4"
    >
      <div aria-hidden className="bh-aurora -z-10" />
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[2.45fr_1fr] lg:items-stretch">
          {/* Staggered editorial headline, the reference's defining move:
              each line takes its own indent, and the date rides inside the
              first line as a pill instead of hanging above as a subtitle. */}
          <div className="relative flex flex-col gap-8 lg:justify-between lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <p className="hu-rise font-display text-[clamp(1.5rem,3.4vw,2.7rem)] font-[900] uppercase tracking-[-0.01em] text-bh-pine">
                Sofia Life Summit
              </p>
              <OrbitBadge />
            </div>

            <h1
              className="hu-rise font-display text-[clamp(2.2rem,7.5vw,3rem)] font-[1000] uppercase leading-[0.94] tracking-[-0.03em] text-bh-ink"
              style={{ animationDelay: "80ms" }}
            >
              <span className="block">
                {c.line1a}{" "}
                <span className="mx-1 inline-block -translate-y-[0.32em] whitespace-nowrap rounded-full border border-bh-ink/30 px-[0.5em] py-[0.22em] align-middle font-mono text-[0.3em] font-semibold tracking-[0.16em] text-bh-ink/80">
                  {c.date}
                </span>{" "}
                {c.line1b}
              </span>
              <span className="block">{c.line2}</span>
              <span className="block lg:pl-[24%]">{c.line3}</span>
            </h1>

            {/* The first screen used to offer no way forward at all: the only
                buy button was the pill in the sticky bar, which reads as
                navigation. These two say where they lead, and the line under
                them answers the question the page otherwise answers halfway
                down - whether this event is for someone without a medical
                degree. */}
            <div className="hu-rise" style={{ animationDelay: "120ms" }}>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#tickets"
                  className="bh-gradient inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
                >
                  {SALES_OPEN ? c.ctaTickets(from) : c.ctaTicketsPlain}
                </a>
                <a
                  href="#program"
                  className="inline-flex items-center rounded-full border border-bh-ink/25 px-6 py-3 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
                >
                  {c.ctaProgramme}
                </a>
              </div>
              <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-bh-ink/50">
                {en ? "7-8 November 2026" : "07-08 ноември 2026"} · {c.venue} · {c.forWhom}
              </p>
            </div>
          </div>

          {/* The dark welcome card from the reference, in our forest. */}
          <article
            className="hu-rise bh-forest flex flex-col justify-between gap-6 rounded-3xl p-6 text-bh-paper"
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full border border-bh-paper/30 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-bh-paper/90">
                {c.venue}
              </span>
              <Hotel className="h-8 w-8 shrink-0 text-bh-lime" />
            </div>
            <p className="text-sm leading-relaxed text-bh-paper/80">
              {c.welcome}
            </p>
          </article>
        </div>


        {/* Bento after the reference: a tall card and two square stats on the
            left, one large accent card owning the right. */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-3">
            {/* Held back until the passport programme is confirmed - the card
                stays, and carries the claim that is true today. */}
            <article className="bh-mint flex flex-1 flex-col justify-between rounded-3xl p-6 text-bh-ink">
              <div className="flex items-start justify-between">
                <Dna className="h-8 w-8 text-bh-pine" />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">
                  {c.firstTag}
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-[1.35rem] font-bold leading-snug tracking-tight">
                  {c.firstTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-bh-ink/65">
                  {c.firstBody}
                </p>
              </div>
            </article>

            {/* two square stats, one light one dark, like the reference */}
            <div className="grid grid-cols-2 gap-3">
              <article className="bh-forest rounded-3xl p-5 text-bh-paper">
                <People className="h-6 w-6 text-bh-lime" />
                <div className="mt-3 text-3xl font-black tracking-tight">
                  1 000+
                </div>
                <div className="mt-1.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-paper/50">
                  {c.visitors}
                </div>
              </article>
              <article className="bh-mint rounded-3xl p-5">
                <Gauge className="h-6 w-6 text-bh-pine/70" />
                <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">
                  10
                </div>
                <div className="mt-1.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                  {c.stations}
                </div>
              </article>
            </div>
          </div>

          {/* speakers - the big accent card: tags, headline word, rule, copy,
              and the diagonal arrow anchoring the corner. */}
          <article className="bh-mint flex flex-col rounded-3xl p-6 text-bh-ink lg:p-7">
            <div className="flex items-start justify-between">
              <Stage className="h-8 w-8 text-bh-pine" />
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">
                {c.stageTag}
              </span>
            </div>

            <div className="mt-auto pt-5">
              <div className="text-5xl font-black tracking-tight lg:text-7xl">
                {speakerCount}
              </div>
              <div className="mt-2 text-[1.35rem] font-bold leading-snug tracking-tight">
                {c.speakersLabel}
              </div>
              <div className="mt-6 border-t border-bh-ink/15 pt-5" />
              <div className="flex items-end justify-between gap-6">
                <p className="max-w-md text-sm leading-relaxed text-bh-ink/70 lg:text-base">
                  {c.speakersBody}
                </p>
                <a
                  href="#lektori"
                  aria-label={c.toSpeakers}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bh-ink text-bh-lime transition-transform hover:-translate-y-0.5"
                >
                  {/* Down-left: the speakers sit below and start at the left
                      edge, so the arrow points at where they actually are. */}
                  <ArrowDownLeft className="h-5 w-5" />
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
