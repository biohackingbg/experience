import { Reveal } from "@/components/ui/Reveal";
import { Stethoscope } from "@/components/ui/Pictograms";
import {
  EARLY_ACCESS,
  TIERS,
  discountLabel,
  formatPrice,
  isEarlyAccess,
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
          </p>
        </Reveal>

        {early && (
          <Reveal className="mt-8">
            <div className="bh-gradient-outline flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-6 py-4">
              <span className="bh-gradient rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-bh-ink">
                Early access {discountLabel()}
              </span>
              <p className="text-sm text-bh-ink/70">
                Ранните цени важат до{" "}
                <strong className="font-semibold text-bh-ink">
                  {EARLY_ACCESS.endsLabel}
                </strong>
                . От {EARLY_ACCESS.regularFrom} всички нива минават на редовна
                цена.
              </p>
            </div>
          </Reveal>
        )}

        {/* Stated here as well as in the tracks diagram: someone who scrolls
            straight to the prices never sees that section, and this is the
            moment the money is decided. */}
        <Reveal className="mt-8">
          <div className="flex items-start gap-4 rounded-2xl bg-bh-cloud px-6 py-5 ring-1 ring-bh-ink/10">
            <Stethoscope className="mt-0.5 h-6 w-6 shrink-0 text-bh-pine" />
            <p className="text-sm leading-relaxed text-bh-ink/70">
              <strong className="font-semibold text-bh-ink">
                Билетите тук са за Biohacking Experience
              </strong>{" "}
              — потребителската част на Sofia Life Summit, за посетители без
              медицинско образование. Ако си лекар или медицински специалист и
              търсиш научната програма, регистрацията за медицинската
              конференция е през{" "}
              <a
                href="#dve-sabitiya"
                className="font-semibold text-bh-pine underline underline-offset-2"
              >
                Bulgarian Longevity Association
              </a>
              .
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const featured = tier.featured;
            return (
              <Reveal key={tier.name} delay={i * 110}>
              {/* All three tiers are light; the featured one is marked by the
                  gradient — on its edge, its badge and its button — rather
                  than by a different card colour. */}
              <div
                className={`bh-mint relative flex h-full flex-col rounded-3xl p-8 text-bh-ink ${
                  featured ? "bh-gradient-outline" : ""
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
                  <span className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/50">
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
                        <s className="text-xl font-semibold text-bh-ink/35">
                          {formatPrice(tier.listPriceCents)} €
                        </s>
                        <span className="bh-gradient rounded-full px-2.5 py-1 text-xs font-bold tracking-tight text-bh-ink">
                          {discountLabel()}
                        </span>
                      </div>
                      {/* The struck figure is named as the price that starts on
                          a date, not one that was ever charged — see the note
                          in lib/tickets.ts. */}
                      <p className="mt-1.5 text-[0.7rem] leading-snug text-bh-ink/45">
                        редовна цена от {EARLY_ACCESS.regularFrom}
                      </p>
                    </>
                  )}
                </div>

                <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-bh-ink/75">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="text-bh-ink">
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

                <a
                  href="#register"
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                    featured
                      ? "bh-gradient text-bh-ink"
                      : "bg-bh-ink text-bh-paper"
                  }`}
                >
                  Избери {tier.name}
                </a>
              </div>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-bh-ink/40">
          Групи над 10 души и корпоративни пакети по договаряне · отстъпка за
          студенти и медицински специалисти.
        </p>
      </div>
    </section>
  );
}
