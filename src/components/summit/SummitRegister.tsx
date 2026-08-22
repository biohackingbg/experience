import Link from "next/link";

import { EarlyAccessForm } from "@/components/summit/EarlyAccessForm";
import { EARLY_ACCESS, isEarlyAccess } from "@/lib/tickets";
import { Reveal } from "@/components/ui/Reveal";
import { Calendar, Pin, TicketIcon } from "@/components/ui/Pictograms";

/**
 * The closing call to action.
 *
 * Until sales opened this section collected a waitlist. Now the sale itself is
 * the primary ask, and the email form serves the visitor who is not ready to
 * pay - the hook is the one the page already makes: new speakers announced
 * every week. Under the v2 consent, that is also exactly what they sign up for.
 */
export function SummitRegister() {
  const early = isEarlyAccess();

  const facts = [
    { label: "Дати", value: "07-08 ноември 2026", icon: Calendar },
    { label: "Място", value: "Гранд Хотел Милениум, София", icon: Pin },
    {
      label: "Достъп",
      value: early
        ? `Ранни цени до ${EARLY_ACCESS.endsLabel}`
        : "Билетите са в продажба",
      icon: TicketIcon,
    },
  ];

  return (
    <section id="register" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="rounded-[2rem] bg-bh-ink px-8 py-14 text-bh-paper sm:px-12 lg:px-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-lime">
              Запази мястото си
            </p>
            <h2 className="mt-5 text-[clamp(2.1rem,5vw,4rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight">
              Един ден. Реални числа. Личен план.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-bh-paper/65">
              Билетите са в продажба
              {early && (
                <>
                  {" "}
                  - на{" "}
                  <strong className="font-semibold text-bh-lime">
                    ранни цени до {EARLY_ACCESS.endsLabel}
                  </strong>
                  , като предварителна поръчка
                </>
              )}
              . Местата в работилниците и специалните преживявания са
              ограничени и се запазват с реда на купуване.
            </p>

            <Link
              href="/bilet"
              className="bh-gradient mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
            >
              Купи билет{early && <> от 35 €</>}
            </Link>

            {/* The fallback ask, deliberately quieter than the sale. */}
            <p className="mt-12 max-w-xl border-t border-bh-paper/15 pt-8 text-sm leading-relaxed text-bh-paper/65">
              Още се колебаеш? Обявяваме нови лектори всяка седмица - остави
              имейл и няма да пропуснеш нищо от програмата.
            </p>

            <EarlyAccessForm early={early} />
          </div>

          <dl className="mt-14 grid gap-8 border-t border-bh-paper/15 pt-8 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label}>
                <f.icon className="h-6 w-6 text-bh-lime" />
                <dt className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-bh-paper/45">
                  {f.label}
                </dt>
                <dd className="mt-2 text-lg font-bold tracking-tight">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
