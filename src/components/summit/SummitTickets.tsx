import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import {
  EARLY_ACCESS,
  PRE_ORDER,
  TIERS,
  SALES_OPEN,
  SALES_SOON_LABEL,
  formatPrice,
  isEarlyAccess,
  isPreOrder,
  priceCents,
  tierDiscountLabel,
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
  const preOrder = SALES_OPEN && isPreOrder();

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
            дните, работилниците и специалните преживявания.
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
                  {SALES_OPEN ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-black tracking-tight">
                        {formatPrice(priceCents(tier, early))}
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
                          {tierDiscountLabel(tier)}
                        </span>
                      </div>
                      {/* The struck figure is named as the price that starts on
                          a date, not one that was ever charged - see the note
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
                    pointed at the waitlist while sales had not started - a
                    buyer who picked a tier landed on an email form. */}
                {SALES_OPEN ? (
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
                ) : (
                  <span
                    className={`mt-8 inline-flex items-center justify-center rounded-full border px-6 py-3.5 text-sm font-semibold ${
                      featured ? "border-bh-paper/30 text-bh-paper/70" : "border-bh-ink/25 text-bh-ink/60"
                    }`}
                  >
                    Скоро в продажба
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
            Сравни билетите
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
                    ? ["Цена", early ? "Ранна €35" : "€49", early ? "Ранна €89" : "€129", early ? "Ранна €249" : "€349"]
                    : ["Цена", SALES_SOON_LABEL, SALES_SOON_LABEL, SALES_SOON_LABEL],
                  ["Достъп", "1 ден по избор", "И двата дни", "И двата дни"],
                  ["Лекции", "При наличие на места", "Приоритетен достъп", "Гарантиран достъп"],
                  ["Запазени места", "-", "-", "Премиум зона"],
                  ["Работилници", "-", "Включени", "Включени с приоритет"],
                  ["Специални преживявания", "-", "1 по избор", "Всички включени"],
                  ["Храна и напитки", "-", "Смути + обяд в избран ден", "Смути + обяд и през двата дни"],
                  ["Goody bag", "-", "Стойност €100+", "Стойност €250+"],
                  ["Premium Lounge", "-", "-", "Включен"],
                  ["Meet & Greet с лектори", "-", "-", "Включен"],
                  ["Приоритетен вход", "-", "-", "Включен"],
                  ["Партньорски оферти и привилегии", "✓", "✓", "✓"],
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
