import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import type { Lang } from "@/lib/i18n";
import { getRemainingAll } from "@/lib/orders";
import { GALA_SECTION } from "@/lib/site-copy";
import { GALA, SALES_OPEN, formatPrice } from "@/lib/tickets";

/**
 * The gala dinner, sold as its own ticket.
 *
 * A section of its own rather than a fourth card among the tiers: it is a
 * separate evening, not a deeper level of the same ticket, and the couvert
 * has no early-bird stage to compare against.
 *
 * How many places are left is counted but never printed. "Местата са
 * ограничени" is the claim; the number behind it stops the sale on its own
 * when it runs out, and the page then says so plainly.
 */
export async function SummitGala({ lang = "bg" }: { lang?: Lang }) {
  const c = GALA_SECTION[lang];
  const remaining = SALES_OPEN ? await getRemainingAll() : {};
  const gone = SALES_OPEN && remaining[GALA.id] === 0;

  return (
    <section id="gala" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <div className="bh-forest bh-gradient-outline bh-mesh relative overflow-hidden rounded-3xl p-8 text-bh-paper sm:p-12">
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-paper/50">
              {c.eyebrow}
            </p>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.8rem,4vw,3rem)] font-display font-[900] uppercase leading-[1.02] tracking-tight">
              {c.title}
            </h2>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <p className="max-w-xl text-base leading-relaxed text-bh-paper/80">{c.body}</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-bh-paper/60">{c.cause}</p>
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-bh-paper/50">
                  {c.when}
                </p>
              </div>

              <div className="lg:text-right">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-bh-paper/50">
                  {c.priceLabel}
                </p>
                <div className="mt-2 flex items-baseline gap-1 lg:justify-end">
                  <span className="text-6xl font-black tracking-tight">
                    {formatPrice(GALA.listPriceCents)}
                  </span>
                  <span className="text-2xl font-semibold">€</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-bh-lime">
                  {gone ? c.soldOutNote : c.limited}
                </p>

                {SALES_OPEN && !gone ? (
                  <Link
                    href={`/bilet?nivo=${GALA.id}${lang === "en" ? "&lang=en" : ""}`}
                    className="bh-gradient mt-6 inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
                  >
                    {c.buy}
                  </Link>
                ) : (
                  <span className="mt-6 inline-flex items-center justify-center rounded-full border border-bh-paper/30 px-7 py-3.5 text-sm font-semibold text-bh-paper/70">
                    {gone ? c.soldOut : c.buy}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
