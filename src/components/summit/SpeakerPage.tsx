import Image from "next/image";
import Link from "next/link";

import { SummitFooter } from "@/components/summit/SummitFooter";
import { SummitNav } from "@/components/summit/SummitNav";
import type { Lang } from "@/lib/i18n";
import { cheapestOf, getPricing, priceOf } from "@/lib/pricing";
import { SPEAKER_PAGE } from "@/lib/site-copy";
import type { getSpeakerPage } from "@/lib/speakers-data";
import { SALES_OPEN, formatPrice } from "@/lib/tickets";

type Data = NonNullable<Awaited<ReturnType<typeof getSpeakerPage>>>;

function LinkOut({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer me"
      className="inline-flex items-center gap-1.5 rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
    >
      {label}
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-3.5 w-3.5">
        <path d="M7 13L13 7M13 7H8.5M13 7v4.5" />
      </svg>
    </a>
  );
}

/**
 * One speaker, on their own address.
 *
 * The point is not a bio page for its own sake: it is what someone finds
 * when they search the person's name, and what the speaker has to share.
 * So it carries their credentials, the slots they are actually in, and one
 * way to buy - and nothing else.
 */
export async function SpeakerPage({ data, lang = "bg" }: { data: Data; lang?: Lang }) {
  const { speaker: s, links, sessions } = data;
  const c = SPEAKER_PAGE[lang];
  const pricing = await getPricing();
  const from = formatPrice(priceOf(pricing, cheapestOf(pricing)));
  const credit = [s.role, s.affiliation].filter(Boolean).join(", ");

  return (
    <div className="overflow-clip rounded-[1.75rem] bg-bh-paper">
      <SummitNav lang={lang} />
      <main className="px-5 pb-20 pt-10 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <Link href={lang === "en" ? "/en#lektori" : "/#lektori"} className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink">
            ← {c.allSpeakers}
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-bh-forest">
              {s.photo && (
                <Image src={s.photo} alt={s.name} fill sizes="(max-width: 1024px) 90vw, 22rem" className="object-cover object-top" priority />
              )}
            </div>

            <div>
              {s.title && <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">{s.title}</p>}
              <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
                {s.name}
              </h1>
              {s.specialty && <p className="mt-3 text-lg text-bh-ink/80">{s.specialty}</p>}
              {credit && <p className="mt-1 text-sm font-semibold text-bh-pine">{credit}</p>}
              {s.country && <p className="mt-1 text-sm text-bh-ink/55">{s.country}</p>}
              {s.topic && <p className="mt-4 max-w-2xl leading-relaxed text-bh-ink/70">{s.topic}</p>}

              {(links.website || links.linkedin || links.instagram) && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {links.website && <LinkOut href={links.website} label={c.website} />}
                  {links.linkedin && <LinkOut href={links.linkedin} label="LinkedIn" />}
                  {links.instagram && <LinkOut href={links.instagram} label="Instagram" />}
                </div>
              )}
            </div>
          </div>

          {sessions.length > 0 && (
            <section className="mt-14 border-t border-bh-ink/15 pt-8">
              <h2 className="text-lg font-bold tracking-tight text-bh-ink">{c.onStage}</h2>
              <ul className="mt-4 flex flex-col divide-y divide-bh-ink/8">
                {sessions.map((slot) => (
                  <li key={`${slot.date}-${slot.time}-${slot.title}`} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
                    <div className="shrink-0 font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/50 sm:w-44">
                      {slot.day} {slot.date} · {slot.time}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-bh-ink">{slot.title}</div>
                      {slot.note && <p className="mt-1 text-sm leading-relaxed text-bh-ink/65">{slot.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
              <Link href={lang === "en" ? "/en/programa" : "/programa"} className="mt-5 inline-flex text-sm font-semibold text-bh-pine underline underline-offset-4">
                {c.fullProgramme}
              </Link>
            </section>
          )}

          <section className="mt-14 rounded-3xl bg-bh-forest p-8 text-bh-paper sm:p-10">
            <h2 className="max-w-xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{c.ctaTitle}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-bh-paper/70">{c.ctaBody}</p>
            <Link
              href={lang === "en" ? "/bilet?lang=en" : "/bilet"}
              className="mt-6 inline-flex rounded-full bg-bh-lime px-6 py-3 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
            >
              {SALES_OPEN ? c.ctaButton(from) : c.ctaSoon}
            </Link>
          </section>
        </div>
      </main>
      <SummitFooter lang={lang} />
    </div>
  );
}
