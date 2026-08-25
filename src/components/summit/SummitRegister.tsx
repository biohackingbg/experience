import Link from "next/link";

// import { EarlyAccessForm } from "@/components/summit/EarlyAccessForm";
import { EARLY_ACCESS, SALES_OPEN, TIERS, formatPrice, isEarlyAccess } from "@/lib/tickets";
import { Reveal } from "@/components/ui/Reveal";
import { Calendar, Pin, TicketIcon } from "@/components/ui/Pictograms";

/**
 * The closing call to action.
 *
 * Until sales opened this section collected a waitlist; the email form is
 * hidden for now (24.08.2026) because nothing sends to that list, and with
 * the early-price deadline days away the quiet slot is better spent naming
 * what the visitor loses by waiting. The form, its consent copy and the
 * signups table all stay in place for when there is something to send.
 */
export function SummitRegister() {
  const early = isEarlyAccess();

  const facts = [
    { label: "Дати", value: "07-08 ноември 2026", icon: Calendar },
    { label: "Място", value: "Гранд Хотел Милениум, София", icon: Pin },
    {
      label: "Достъп",
      value: !SALES_OPEN
        ? "Билетите - съвсем скоро"
        : early
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
              {!SALES_OPEN ? (
                <>
                  Билетите отварят съвсем скоро. Финализираме нивата и цените,
                  за да са честни и към теб, и към програмата, която строим.
                  Местата в работилниците и специалните преживявания са
                  ограничени и се запазват с реда на купуване.
                </>
              ) : (
                <>
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
                </>
              )}
            </p>

            {SALES_OPEN ? (
              <Link
                href="/bilet"
                className="bh-gradient mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
              >
                Купи билет{early && <> от 35 €</>}
              </Link>
            ) : (
              <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-bh-paper/30 px-8 py-4 text-base font-semibold text-bh-paper/75">
                Очаквайте скоро
              </span>
            )}

            {/* The quiet slot under the sale: what waiting costs, in the
                event's own numbers rather than a countdown gimmick. */}
            {SALES_OPEN && early && (
              <p className="mt-12 max-w-xl border-t border-bh-paper/15 pt-8 text-sm leading-relaxed text-bh-paper/65">
                <strong className="font-semibold text-bh-lime">
                  Ранните цени важат до {EARLY_ACCESS.endsLabel}.
                </strong>{" "}
                От {EARLY_ACCESS.regularFrom} билетите минават на редовни цени:{" "}
                {TIERS.map((t, i) => (
                  <span key={t.id}>
                    {i > 0 && ", "}
                    {t.name} става {formatPrice(t.listPriceCents)} €
                  </span>
                ))}
                .
              </p>
            )}

            {/* Hidden while nothing sends to the list - see the note above.
            <EarlyAccessForm early={early} /> */}
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
