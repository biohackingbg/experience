import Link from "next/link";

// import { EarlyAccessForm } from "@/components/summit/EarlyAccessForm";
import type { Lang } from "@/lib/i18n";
import { cheapestOf, getPricing, priceOf } from "@/lib/pricing";
import { REGISTER } from "@/lib/site-copy";
import { SALES_OPEN, TIERS, formatPrice } from "@/lib/tickets";
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
export async function SummitRegister({ lang = "bg" }: { lang?: Lang }) {
  const pricing = await getPricing();
  const c = REGISTER[lang];
  const early = pricing.discounted;
  const offer =
    lang === "en"
      ? `${pricing.stage === "launch" ? "launch prices for" : "special prices"} ${pricing.stage === "launch" ? "the first 200 tickets" : pricing.label}`
      : `${pricing.stage === "launch" ? "стартови цени за" : "специални цени"} ${pricing.label}`;
  const from = formatPrice(priceOf(pricing, cheapestOf(pricing)));

  const facts = [
    { label: c.factDates, value: c.dates, icon: Calendar },
    { label: c.factPlace, value: c.venue, icon: Pin },
    {
      label: c.factAccess,
      value: !SALES_OPEN ? c.accessSoon : early ? offer.charAt(0).toUpperCase() + offer.slice(1) : c.accessOpen,
      icon: TicketIcon,
    },
  ];

  return (
    <section id="register" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="rounded-[2rem] bg-bh-ink px-8 py-14 text-bh-paper sm:px-12 lg:px-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-lime">
              {c.eyebrow}
            </p>
            <h2 className="mt-5 text-[clamp(2.1rem,5vw,4rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight">
              {c.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-bh-paper/65">
              {!SALES_OPEN ? (
                <>{c.bodyClosed}</>
              ) : (
                <>
              {c.bodyOpen}
              {early && (
                <>
                  {lang === "en" ? " - at " : " - на "}
                  <strong className="font-semibold text-bh-lime">{offer}</strong>
                </>
              )}
              {lang === "en"
                ? ". Places in the workshops and the special experiences are limited and go in the order people buy."
                : ". Местата в работилниците и специалните преживявания са ограничени и се запазват с реда на купуване."}
                </>
              )}
            </p>

            {SALES_OPEN ? (
              <Link
                href={lang === "en" ? "/bilet?lang=en" : "/bilet"}
                className="bh-gradient mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
              >
                {c.buy}{early && c.buyFrom(from)}
              </Link>
            ) : (
              <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-bh-paper/30 px-8 py-4 text-base font-semibold text-bh-paper/75">
                {c.soon}
              </span>
            )}

            {/* The quiet slot under the sale: what waiting costs, in the
                event's own numbers rather than a countdown gimmick. */}
            {SALES_OPEN && early && (
              <p className="mt-12 max-w-xl border-t border-bh-paper/15 pt-8 text-sm leading-relaxed text-bh-paper/65">
                <strong className="font-semibold text-bh-lime">{c.offerNote(offer)}</strong>{" "}
                {c.regularAfter}
                {TIERS.map((t, i) => (
                  <span key={t.id}>
                    {i > 0 && ", "}
                    {c.becomes(t.name, formatPrice(t.listPriceCents))}
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
