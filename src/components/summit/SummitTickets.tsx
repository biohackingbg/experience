import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import { WaitlistForm } from "@/components/summit/WaitlistForm";
import type { Lang } from "@/lib/i18n";
import { getRemainingAll } from "@/lib/orders";
import { cheapestOf, discountLabelOf, getPricing, priceOf } from "@/lib/pricing";
import { TICKETS_SECTION, TIER_FEATURES } from "@/lib/site-copy";
import { TIERS, SALES_OPEN, SALES_SOON_LABEL, formatPrice } from "@/lib/tickets";


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

/** Below this many seats the card says so - a true number, not a countdown gimmick. */
const SCARCE_BELOW = 15;

export async function SummitTickets({ lang = "bg" }: { lang?: Lang }) {
  const [pricing, remaining] = await Promise.all([getPricing(), SALES_OPEN ? getRemainingAll() : Promise.resolve({} as Record<string, number>)]);
  const c = TICKETS_SECTION[lang];
  const early = pricing.discounted;
  // In English the launch window is named in words rather than by the
  // Bulgarian label, which is written for the Bulgarian sentence.
  const offerLabel = lang === "en" && pricing.stage === "launch" ? "the first 200 tickets" : pricing.label;
  const badge = pricing.stage === "launch" ? c.launchBadge(offerLabel) : c.specialBadge(offerLabel);
  void cheapestOf;

  return (
    <section id="tickets" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
                {c.eyebrow}
              </p>
              {early && (
                /* Colours written out, not tokens: bh-ink flips in dark mode,
                   and this pill came out pale-on-pale there. */
                <span className="rounded-full bg-[#cef870] px-3.5 py-1.5 text-[0.72rem] font-bold tracking-tight text-[#02251f]">
                  {badge}
                </span>
              )}
            </div>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              {c.title}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            {c.intro}
            {early && (
              <>
                {" "}
                <strong className="font-semibold text-bh-ink">
                  {c.introOffer(offerLabel, pricing.stage === "launch")}
                </strong>
              </>
            )}
          </p>
        </Reveal>



        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const featured = tier.featured;
            const left = remaining[tier.id];
            const gone = SALES_OPEN && left === 0;
            const scarce = SALES_OPEN && !gone && left !== undefined && left < SCARCE_BELOW;
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
                {gone ? (
                  <span className={`absolute right-6 top-6 rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] ${featured ? "bg-bh-paper/15 text-bh-paper" : "bg-bh-ink/10 text-bh-ink"}`}>
                    {c.soldOut}
                  </span>
                ) : featured ? (
                  <span className="bh-gradient absolute right-6 top-6 rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-bh-ink">
                    {c.featured}
                  </span>
                ) : null}

                <h3 className="text-xl font-black uppercase tracking-tight">
                  {tier.name}
                </h3>
                {(TIER_FEATURES[tier.id]?.[lang].tagline ?? tier.tagline) ? (
                  <span className={`mt-1 font-mono text-xs uppercase tracking-[0.15em] ${tone.tagline}`}>
                    {TIER_FEATURES[tier.id]?.[lang].tagline ?? tier.tagline}
                  </span>
                ) : (
                  <span className="mt-1 block h-4" />
                )}

                <div className="mt-6">
                  {SALES_OPEN ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-black tracking-tight">
                        {formatPrice(priceOf(pricing, tier))}
                      </span>
                      <span className="text-2xl font-semibold">€</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-black uppercase leading-tight tracking-tight">
                      {SALES_SOON_LABEL}
                    </div>
                  )}
                  {/* On its own line rather than beside the headline figure:
                      "101,50 €" plus a struck price plus a badge overflows a
                      third of the grid and wraps unevenly between cards. */}
                  {SALES_OPEN && early && (
                    <>
                      <div className="mt-2 flex items-center gap-2.5">
                        <s className={`text-xl font-semibold ${tone.struck}`}>
                          {formatPrice(tier.listPriceCents)} €
                        </s>
                        <span className="bh-gradient rounded-full px-2.5 py-1 text-xs font-bold tracking-tight text-bh-ink">
                          {discountLabelOf(pricing, tier)}
                        </span>
                      </div>
                      {/* The struck figure is named as the price that starts on
                          a date, not one that was ever charged - see the note
                          in lib/tickets.ts. */}
                      <p className={`mt-1.5 text-[0.7rem] leading-snug ${tone.note}`}>
                        {c.regularAfter(lang === "en" && pricing.stage === "launch" ? "after the first 200 tickets" : pricing.regularAfter)}
                      </p>
                    </>
                  )}
                </div>

                <ul className={`mt-8 flex flex-1 flex-col gap-3 text-sm ${tone.list}`}>
                  {(TIER_FEATURES[tier.id]?.[lang].features ?? tier.features).map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className={tone.check}>
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                  {(TIER_FEATURES[tier.id]?.[lang].absent ?? tier.absent).map((f) => (
                    <li key={f} className="flex gap-3 opacity-40 line-through">
                      <Check muted />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Straight to the checkout with the tier pre-selected. This
                    pointed at the waitlist while sales had not started - a
                    buyer who picked a tier landed on an email form. */}
                {scarce && (
                  <p className={`mt-6 text-xs font-semibold ${featured ? "text-bh-lime" : "text-bh-pine"}`}>
                    {c.left(left ?? 0)}
                  </p>
                )}

                {gone ? (
                  <WaitlistForm tierId={tier.id} dark={featured} lang={lang} />
                ) : SALES_OPEN ? (
                  <Link
                    href={`/bilet?nivo=${tier.id}${lang === "en" ? "&lang=en" : ""}`}
                    className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                      featured
                        ? "bh-gradient text-bh-ink"
                        : "bg-bh-ink text-bh-paper"
                    }`}
                  >
                    {c.choose(tier.name)}
                  </Link>
                ) : (
                  <span
                    className={`mt-8 inline-flex items-center justify-center rounded-full border px-6 py-3.5 text-sm font-semibold ${
                      featured ? "border-bh-paper/30 text-bh-paper/70" : "border-bh-ink/25 text-bh-ink/60"
                    }`}
                  >
                    {c.soon}
                  </span>
                )}
              </div>
              </Reveal>
            );
          })}
        </div>


        {/* The full matrix from the sales sheet. The cards carry each tier's
            highlights; the table is where the three get compared row by row,
            which a stack of bullet lists cannot do. */}
        <Reveal className="mt-14">
          <h3 className="text-xl font-black uppercase tracking-tight text-bh-ink">
            {c.compare}
          </h3>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="text-left font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/45">
                  <th className="w-1/3 py-3 pr-4 font-normal" />
                  {TIERS.map((tier) => (
                    <th key={tier.id} className="py-3 pr-4 font-bold normal-case tracking-normal text-sm text-bh-ink">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  SALES_OPEN
                    ? [c.priceRow, ...TIERS.map((t) => `${early ? (lang === "en" ? "Now " : "Сега ") : ""}€${formatPrice(priceOf(pricing, t))}`)]
                    : [c.priceRow, SALES_SOON_LABEL, SALES_SOON_LABEL, SALES_SOON_LABEL],
                  ...c.rows,
                ].map(([label, ...cells]) => (
                  <tr key={label} className="border-t border-bh-ink/8 align-top">
                    <td className="py-3 pr-4 font-semibold text-bh-ink">{label}</td>
                    {cells.map((cell, i) => (
                      <td
                        key={i}
                        className={`py-3 pr-4 ${cell === "-" ? "text-bh-ink/30" : "text-bh-ink/75"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Folded into the existing line rather than given a box of its own:
            someone who scrolls straight to the prices never sees the two-track
            section, and this is the moment the money is decided. */}
        <p className="mt-6 max-w-3xl font-mono text-[0.7rem] leading-relaxed uppercase tracking-[0.12em] text-bh-ink/40">
          {c.footnote(
            early
              ? lang === "en"
                ? ` · the special prices apply ${offerLabel}, whichever level you choose`
                : ` · специалните цени важат ${pricing.stage === "launch" ? "за " : ""}${offerLabel}, независимо от нивото`
              : "",
          )}
        </p>
      </div>
    </section>
  );
}
