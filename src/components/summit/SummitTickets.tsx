import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import {
  EARLY_ACCESS,
  PRE_ORDER,
  TIERS,
  discountLabel,
  formatPrice,
  isEarlyAccess,
  isPreOrder,
  priceCents,
} from "@/lib/tickets";


function Check({ muted }: { muted?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`mt-0.5 h-4 w-4 shrink-0 ${muted ? "opacity-40" : ""}`}
      aria-hidden
    >
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SummitTickets() {
  const early = isEarlyAccess();
  const preOrder = isPreOrder();

  return (
    <section id="tickets" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Билети
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              Три нива, една логика: колко надълбоко
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Всички билети дават достъп до сцената и Village. Разликата е в
            лабораторията и в това с какво си тръгва посетителят.
            {preOrder && (
              <>
                {" "}
                <strong className="font-semibold text-bh-ink">
                  До {PRE_ORDER.endsLabel} билетите са предварителни поръчки.
                </strong>
              </>
            )}
          </p>
        </Reveal>



        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const featured = tier.featured;
            // Whole class names, never assembled from pieces: Tailwind reads
            // the source statically, so `${x}/50` would never be generated.
            const tone = featured
              ? {
                  tagline: "text-bh-paper/50",
                  struck: "text-bh-paper/35",
                  note: "text-bh-paper/45",
                  list: "text-bh-paper/75",
                  check: "text-bh-paper",
                }
              : {
                  tagline: "text-bh-ink/50",
                  struck: "text-bh-ink/35",
                  note: "text-bh-ink/45",
                  list: "text-bh-ink/75",
                  check: "text-bh-ink",
                };
            return (
              <Reveal key={tier.name} delay={i * 110}>
              {/* The featured tier is the dark one, so the eye lands on it
                  before reading a single price. `tone` carries the foreground
                  colours that have to invert along with the surface. */}
              <div
                className={`relative flex h-full flex-col rounded-3xl p-8 ${
                  featured
                    ? "bh-forest bh-gradient-outline text-bh-paper"
                    : "bh-mint text-bh-ink"
                }`}
              >
                {featured && (
                  <span className="bh-gradient absolute right-6 top-6 rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-bh-ink">
                    Най-избиран
                  </span>
                )}

                <h3 className="text-xl font-black uppercase tracking-tight">
                  {tier.name}
                </h3>
                {tier.tagline ? (
                  <span className={`mt-1 font-mono text-xs uppercase tracking-[0.15em] ${tone.tagline}`}>
                    {tier.tagline}
                  </span>
                ) : (
                  <span className="mt-1 block h-4" />
                )}

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black tracking-tight">
                      {formatPrice(priceCents(tier, early))}
                    </span>
                    <span className="text-2xl font-semibold">€</span>
                  </div>
                  {/* On its own line rather than beside the headline figure:
                      "101,50 €" plus a struck price plus a badge overflows a
                      third of the grid and wraps unevenly between cards. */}
                  {early && (
                    <>
                      <div className="mt-2 flex items-center gap-2.5">
                        <s className={`text-xl font-semibold ${tone.struck}`}>
                          {formatPrice(tier.listPriceCents)} €
                        </s>
                        <span className="bh-gradient rounded-full px-2.5 py-1 text-xs font-bold tracking-tight text-bh-ink">
                          {discountLabel()}
                        </span>
                      </div>
                      {/* The struck figure is named as the price that starts on
                          a date, not one that was ever charged — see the note
                          in lib/tickets.ts. */}
                      <p className={`mt-1.5 text-[0.7rem] leading-snug ${tone.note}`}>
                        редовна цена от {EARLY_ACCESS.regularFrom}
                      </p>
                    </>
                  )}
                </div>

                <ul className={`mt-8 flex flex-1 flex-col gap-3 text-sm ${tone.list}`}>
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className={tone.check}>
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                  {tier.absent.map((f) => (
                    <li key={f} className="flex gap-3 opacity-40 line-through">
                      <Check muted />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Straight to the checkout with the tier pre-selected. This
                    pointed at the waitlist while sales had not started — a
                    buyer who picked a tier landed on an email form. */}
                <Link
                  href={`/bilet?nivo=${tier.id}`}
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                    featured
                      ? "bh-gradient text-bh-ink"
                      : "bg-bh-ink text-bh-paper"
                  }`}
                >
                  Избери {tier.name}
                </Link>
              </div>
              </Reveal>
            );
          })}
        </div>

        {/* Folded into the existing line rather than given a box of its own:
            someone who scrolls straight to the prices never sees the two-track
            section, and this is the moment the money is decided. */}
        <p className="mt-6 max-w-3xl font-mono text-[0.7rem] leading-relaxed uppercase tracking-[0.12em] text-bh-ink/40">
          Билетите тук са за Biohacking Experience · медицинската конференция
          има отделна регистрация · продажбите започват през август, до{" "}
          {PRE_ORDER.endsLabel} като предварителна поръчка · групи над 10 души и
          корпоративни пакети по договаряне · отстъпка за студенти и медицински
          специалисти.
        </p>
      </div>
    </section>
  );
}
