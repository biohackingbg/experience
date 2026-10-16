import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/ui/Reveal";
import { findActiveLink } from "@/lib/deck-links";
import { DECK_CONTACT, DECK_COPY, deckLangOf } from "@/lib/deck-copy";
import { DECK_SECTIONS } from "@/lib/deck-sections";
import { PARTNERS } from "@/lib/partners";

import { JourneyTimeline } from "./JourneyTimeline";
import { ScrollRule } from "./ScrollRule";
import { ViewBeacon } from "./ViewBeacon";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ lang?: string }> };

/** ?lang= wins; otherwise the language the link was made with. */
async function langFor(params: Props["params"], searchParams: Props["searchParams"]) {
  const [{ token }, { lang }] = await Promise.all([params, searchParams]);
  if (lang) return deckLangOf(lang);
  const link = await findActiveLink(token);
  return deckLangOf(link?.lang);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { ui } = DECK_COPY[await langFor(params, searchParams)];
  return {
    title: ui.metaTitle,
    description: ui.metaDescription,
    // Shared by link with prospective partners, not found by search.
    robots: { index: false, follow: false },
  };
}

// Every request checks the token - a revoked link must close at once.
export const dynamic = "force-dynamic";

/*
 * The partner deck as a page. Content mirrors the approved PDF
 * (sofia-life-summit-sponsori-svetla, Aug 2026) word for word - the copy is
 * the client's, the layout is the site's. Every word lives in
 * lib/deck-copy.ts, in both languages; ?lang=en flips the whole page.
 */

/* ── primitives ─────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/70">
      <span className="text-bh-pine" aria-hidden>
        ✳
      </span>
      {children}
    </p>
  );
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`mt-5 max-w-3xl font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-[900] leading-[1.04] tracking-[-0.025em] text-bh-ink ${className}`}
    >
      {children}
    </h2>
  );
}

/**
 * `name` marks the section for the reading-progress beacon: the admin sees
 * the deepest section a reader reached, in the order they appear here.
 */
/**
 * `dark` flips the section to forest. It works by re-pinning the local
 * colour tokens, so every text-bh-ink/NN and bg-bh-cloud inside simply
 * follows - no per-element dark variants.
 */
const DARK_SECTION = {
  backgroundColor: "#0a3229",
  // Direct color too, not only the token: text without an explicit
  // text-bh-* class inherits the ROOT's already-resolved dark ink, so the
  // token flip alone leaves it dark-on-dark.
  color: "#f2f2ee",
  "--color-bh-ink": "#f2f2ee",
  "--color-bh-paper": "#0a3229",
  "--color-bh-cloud": "#0d3a30",
  "--color-bh-pine": "#cef870",
} as React.CSSProperties;

function Section({
  name,
  id,
  dark,
  children,
  className = "",
}: {
  name: string;
  id?: string;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      data-deck-section={name}
      id={id}
      style={dark ? DARK_SECTION : undefined}
      className={`px-6 py-16 sm:px-10 sm:py-24 lg:px-14 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function Tick() {
  return (
    <span className="mt-0.5 shrink-0 text-bh-pine" aria-hidden>
      ✳
    </span>
  );
}

function Dash() {
  return (
    <span className="mt-0.5 shrink-0 text-bh-ink/30" aria-hidden>
      -
    </span>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

/**
 * Reachable only through a share link made in the admin. An unknown or
 * revoked token is a plain 404 - the deck does not confirm it exists.
 */
export default async function PartnersPage({ params, searchParams }: Props) {
  const { token } = await params;
  const link = await findActiveLink(token);
  if (!link) notFound();
  const query = (await searchParams).lang;
  const lang = deckLangOf(query ?? link.lang);
  const c = DECK_COPY[lang];
  const { ui } = c;
  const CONTACT = DECK_CONTACT;
  const other = lang === "bg" ? "en" : "bg";

  return (
    <div className="bh-doc relative min-h-screen text-bh-ink">
      <ViewBeacon token={token} sections={DECK_SECTIONS} />

      {/* header */}
      <header className="absolute inset-x-0 top-0 z-10 px-6 pt-5 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.svg" alt="Biohacking Experience" className="h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-white/75">{ui.headerTag}</p>
            {/* The same link, the other language: a partner switches without
                losing the token, and the reading beacon keeps counting. */}
            <Link
              href={`/za-partniori/${encodeURIComponent(token)}?lang=${other}`}
              className="rounded-full border border-white/30 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/85 transition-colors hover:border-white"
              aria-label={lang === "bg" ? "Switch to English" : "Към български"}
            >
              {other.toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {/* 01 cover - the full hall behind the opening, softened so the type
          carries; the photograph is the argument, the words are on it. */}
      <section
        data-deck-section="cover"
        className="relative isolate overflow-hidden px-6 pb-24 pt-32 sm:px-10 sm:pb-32 sm:pt-40 lg:px-14 lg:pb-40 lg:pt-44"
        style={DARK_SECTION}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/deck/hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 h-full w-full scale-[1.04] object-cover object-center blur-[3px]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(2,37,31,0.55),rgba(2,37,31,0.82))]"
        />
        <div className="mx-auto w-full max-w-6xl">
          <Eyebrow>{ui.coverEyebrow}</Eyebrow>
          <div className="mt-8 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <h1 className="font-display text-[clamp(3.2rem,9vw,7.6rem)] font-[900] leading-[0.92] tracking-[-0.04em] text-bh-ink">
                Sofia Life
                <br />
                Summit
              </h1>
              <p className="mt-6 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-[500] italic tracking-[-0.02em] text-bh-pine">{ui.coverTag}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">{ui.coverPill}</span>
                <a
                  href="#rabotilnici"
                  className="rounded-full border border-bh-ink/40 px-5 py-2.5 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
                >{ui.coverCta}</a>
              </div>
            </div>
            <div>
              <p className="max-w-md text-lg font-light leading-relaxed text-bh-ink/85">{ui.coverP}</p>
              <p className="mt-4 font-mono text-[0.68rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/70">{ui.coverOrg}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 форматът */}
      <Section name="format" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.formatEyebrow}</Eyebrow>
          <H2>{ui.formatH}</H2>
        </Reveal>
        <ScrollRule items={c.format} />
      </Section>

      {/* 03 мащаб */}
      <Section name="scale" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.scaleEyebrow}</Eyebrow>
          <H2>{ui.scaleH}</H2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {c.scale.map((s, i) => (
            <Reveal key={s.l} delay={i * 70}>
              <div>
                <div className="font-display text-[clamp(2.6rem,5.4vw,4.6rem)] font-[300] leading-none tracking-[-0.04em]">
                  {s.n}
                </div>
                <div className="mt-4 h-px w-full bg-bh-ink/15" />
                <p className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-bh-ink/70">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
        {/* Two halls, side by side: last year's, full, is the proof; this
            year's stage is the promise. The same scale, read twice. */}
        <Reveal className="mt-12">
          <div className="grid gap-5 md:grid-cols-2">
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/deck/zala.jpg"
                alt={ui.scaleAlt1}
                loading="lazy"
                className="aspect-[3/2] w-full rounded-[1.6rem] object-cover"
              />
              <figcaption className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/65">{ui.scaleCap1}</figcaption>
            </figure>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/zala.webp"
                alt={ui.scaleAlt2}
                loading="lazy"
                className="aspect-[3/2] w-full rounded-[1.6rem] object-cover"
              />
              <figcaption className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/65">{ui.scaleCap2}</figcaption>
            </figure>
          </div>
        </Reveal>
        <Reveal className="mt-10">
          <div className="rounded-[1.4rem] bg-bh-cloud p-7 ring-1 ring-bh-ink/8">
            <h3 className="text-lg font-semibold tracking-tight">{ui.scaleH3}</h3>
            <p className="mt-2 max-w-3xl text-sm font-light leading-relaxed text-bh-ink/65">{ui.scaleP}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              {/* Wraps to two lines rather than claiming the whole row, so the
                  logo can sit beside it instead of being pushed underneath. */}
              <p className="max-w-[26rem] font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.2em] text-bh-pine">{ui.scaleOrg}</p>
              {/* Their own colours on the transparent background, the same way
                  the public site shows them - measured on this section it sits
                  between 3.1 and 3.9:1, so a white plate would buy nothing and
                  would put a light box in the middle of a dark section. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/partner-logo.png"
                alt="Bulgarian Longevity Association"
                width={900}
                height={458}
                loading="lazy"
                className="h-11 w-auto shrink-0"
              />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* 04 организаторите */}
      <Section name="organizers" className="border-t border-bh-ink/10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
            <div className="max-w-2xl">
              <Eyebrow>{ui.orgEyebrow}</Eyebrow>
              <H2>{ui.orgH}</H2>
              <p className="mt-6 text-lg font-light leading-relaxed text-bh-ink/70">{ui.orgP}</p>
            </div>
            {/* In the heading's order, both in their own colours. Theirs is set
                taller on purpose: their lockup spends most of its height on the
                mark, so equal boxes would leave their wordmark visibly smaller
                than ours. */}
            <div className="flex shrink-0 items-center gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Biohacking Experience"
                // Its own aspect ratio, so the box is the right width before
                // the file has loaded; without it a lazy SVG measures zero wide.
                width={1412}
                height={381}
                loading="lazy"
                className="h-10 w-auto sm:h-11"
              />
              <span aria-hidden className="h-10 w-px bg-bh-ink/15" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/partner-logo.png"
                alt="Bulgarian Longevity Association"
                width={900}
                height={458}
                loading="lazy"
                className="h-12 w-auto sm:h-14"
              />
            </div>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {c.organizers.map((o, i) => (
            <Reveal key={o.l} delay={i * 70}>
              <div>
                <div className="font-display text-5xl font-[300] leading-none tracking-[-0.04em] text-bh-pine">
                  {o.n}
                </div>
                <h3 className="mt-4 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-bh-ink/70">{o.l}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{o.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 05 лекторите */}
      <Section name="speakers" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.speakersEyebrow}</Eyebrow>
          <H2>{ui.speakersH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.speakersP}</p>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.speakers.map((s, i) => (
            <Reveal key={s.name} delay={i * 70}>
              <article className="group relative aspect-[3/4] overflow-hidden rounded-[1.6rem] bg-[#0d3a30] text-white ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.photo}
                  alt={s.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                {/* Ink gradient from the foot so the type stays legible on any
                    portrait - the photographs range from studio white to dark. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#02251f]/90 via-[#02251f]/25 via-50% to-transparent"
                />
                <div className="absolute inset-x-4 bottom-4">
                  <h3 className="font-display text-[1.45rem] font-[500] leading-[1.05] tracking-[-0.02em] text-white">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/70">
                    {s.line1}
                  </p>
                  <p className="mt-1 text-[0.8rem] font-light leading-snug text-white/85">{s.line2}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 06 концепцията */}
      <Section name="concept" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.conceptEyebrow}</Eyebrow>
          <H2>{ui.conceptH}</H2>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {c.concept.map((z, i) => (
            <Reveal key={z.no} delay={i * 80}>
              <article className="relative flex min-h-[15rem] flex-col rounded-[1.4rem] bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <div className="flex items-start justify-between">
                  <span className="w-fit rounded-full border border-bh-ink/20 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/70">
                    {z.tag}
                  </span>
                  <span className="text-2xl text-bh-pine/70" aria-hidden>
                    {z.sym}
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{z.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{z.p}</p>
                <span className="mt-auto pt-6 font-display text-6xl font-[300] leading-none tracking-[-0.05em] text-bh-ink/85">
                  {z.no}
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 07 работилниците */}
      <Section name="zones" id="rabotilnici" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.zonesEyebrow}</Eyebrow>
          <H2>{ui.zonesH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.zonesP}</p>
        </Reveal>
        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {c.activities.map((a, i) => (
            <Reveal key={a.no} delay={i * 60}>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.img}
                  alt={a.h}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-[1.4rem] object-cover"
                />
                <figcaption className="mt-4 border-t border-bh-ink/15 pt-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-bh-pine">/ {a.no}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{a.h}</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{a.p}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 08 брандирана работилница - the LED-wall visual */}
      <Section name="brandzone" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.brandEyebrow}</Eyebrow>
          <H2>{ui.brandH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.brandP}</p>
        </Reveal>

        <Reveal className="mt-12">
          {/* The zone as the visitor sees it: the LED wall over the room. A
              styled mock rather than a render - honest about being a concept,
              and it puts the buyer's name on the wall. */}
          <figure>
            <div className="relative overflow-hidden rounded-[1.6rem] bg-[#0a3229] p-6 sm:p-10">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(11,180,160,0.22),transparent_65%)]" />
              {/* the LED wall */}
              <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#04231d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-10">
                <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.3em] text-white/70">
                  <span>Sofia Life Summit 26</span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bh-teal" aria-hidden />
                    Live
                  </span>
                </div>
                <p className="mt-8 font-display text-[clamp(1.8rem,5vw,3.6rem)] font-[600] uppercase leading-[0.95] tracking-[-0.02em] text-white">
                  Pilates
                  <br />
                  Reformer Flow
                </p>
                <p className="mt-4 inline-block rounded-md bg-[#cef870] px-3 py-1.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#02251f]">{ui.brandYou}</p>
                <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 font-mono text-[0.68rem] uppercase tracking-[0.25em] text-white/70">
                  <span className="rounded-full border border-white/20 px-3 py-1">13:45</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">{ui.min45}</span>
                </div>
              </div>
              {/* floor line, to ground the wall in a room */}
              <div aria-hidden className="relative mx-auto mt-6 h-px max-w-4xl bg-white/15" />
            </div>
            <figcaption className="mt-3 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/65">{ui.brandCap}</figcaption>
          </figure>
        </Reveal>

        <Reveal className="mt-10">
          <p className="max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.brandP2}</p>
          <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.brandZonePoints.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-bh-ink/80">
                <Tick />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* 09 публиката */}
      <Section name="audience" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.audienceEyebrow}</Eyebrow>
          <H2>{ui.audienceH}</H2>
        </Reveal>
        <Reveal className="mt-10">
          <div className="flex flex-wrap gap-2.5">
            {c.audience.map((label, i) => (
              <span
                key={label}
                className={
                  i % 3 === 0
                    ? "rounded-full bg-bh-pine px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full border border-bh-ink/20 px-4 py-2 text-sm text-bh-ink/80"
                }
              >
                {label}
              </span>
            ))}
          </div>
        </Reveal>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {c.audienceStats.map((s, i) => (
            <Reveal key={s.l} delay={i * 70}>
              <div>
                <div className="font-display text-5xl font-[300] leading-none tracking-[-0.04em]">{s.n}</div>
                <div className="mt-4 h-px w-full bg-bh-ink/15" />
                <h3 className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-bh-ink/70">{s.l}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 10 пътуването - timeline infographic */}
      <Section name="journey" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.journeyEyebrow}</Eyebrow>
          <H2>{ui.journeyH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.journeyP}</p>
        </Reveal>
        <Reveal className="mt-12">
          <JourneyTimeline steps={c.journey} brandLabel={ui.journeyBrand} />
        </Reveal>
        <Reveal className="mt-10">
          <div className="bh-orbit-stroke rounded-[1.4rem] p-[2px]">
            <p className="rounded-[calc(1.4rem-2px)] bg-bh-cloud p-6 text-sm font-medium leading-relaxed text-bh-ink">{ui.journeyBox}</p>
          </div>
        </Reveal>
      </Section>

      {/* 11 стойността */}
      <Section name="value" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.valueEyebrow}</Eyebrow>
          <H2>{ui.valueH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.valueP}</p>
        </Reveal>
        <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {c.value.map((v, i) => (
            <Reveal key={v.h} delay={i * 60}>
              <div className="border-t border-bh-ink/15 pt-5">
                <span className="text-bh-pine" aria-hidden>
                  ✳
                </span>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{v.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{v.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 12 нива */}
      {/* 11b кой вече е вътре - точно преди цената */}
      <Section name="partners" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.partnersEyebrow}</Eyebrow>
          <H2>{ui.partnersH(PARTNERS.length)}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.partnersP}</p>
        </Reveal>
        {/* A green band inside a light section rather than a dark section of
            its own: the marks are white, and the section before this one is
            already dark. Same treatment as the public page, same files. */}
        <Reveal className="mt-12">
          <div className="overflow-hidden rounded-[1.6rem] bg-[#0a3229] px-6 py-12 sm:px-10">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-10">
              {PARTNERS.map((p) => (
                <div key={p.name} className="w-[calc(50%-1.25rem)] sm:w-[calc(33.333%-1.7rem)] lg:w-[calc(25%-1.9rem)]">
                  {p.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.logo}
                      alt={p.name}
                      width={600}
                      height={300}
                      loading="lazy"
                      className="w-full"
                    />
                  ) : (
                    <span className="block text-center text-base font-semibold text-white">{p.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal className="mt-8">
          <p className="max-w-2xl text-sm font-light leading-relaxed text-bh-ink/65">{ui.partnersP2}</p>
        </Reveal>
      </Section>

      <Section name="packages" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.packagesEyebrow}</Eyebrow>
          <H2>{ui.packagesH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.packagesP}</p>
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {c.tiers.map((t, i) => (
            <Reveal key={t.no} delay={i * 80}>
              <article
                className={`relative flex h-full flex-col rounded-[1.6rem] p-7 ${
                  t.best
                    ? "bg-[#0a3229] text-white ring-1 ring-[#0a3229]"
                    : "bg-bh-cloud text-bh-ink ring-1 ring-bh-ink/8"
                }`}
              >
                {t.best && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#cef870] px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[#02251f]">{ui.bestValue}</span>
                )}
                <p className={`font-mono text-[0.62rem] uppercase tracking-[0.25em] ${t.best ? "text-white/50" : "text-bh-ink/65"}`}>
                  {ui.level} {t.no}
                </p>
                <h3 className="mt-3 font-display text-3xl font-[600] tracking-[-0.02em]">{t.name}</h3>
                <p className="mt-4 font-display text-4xl font-[300] tracking-[-0.03em]">
                  {t.price}
                  <span className={`ml-2 align-middle font-sans text-xs font-normal ${t.best ? "text-white/50" : "text-bh-ink/65"}`}>{ui.exVat}</span>
                </p>
                <ul className={`mt-7 flex flex-col gap-2.5 border-t pt-6 text-sm ${t.best ? "border-white/15" : "border-bh-ink/10"}`}>
                  {t.has.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 ${t.best ? "text-[#cef870]" : "text-bh-pine"}`} aria-hidden>
                        ✳
                      </span>
                      {f}
                    </li>
                  ))}
                  {t.not.map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 ${t.best ? "text-white/40" : "text-bh-ink/40"}`}>
                      <Dash />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 12b двете събития */}
      <Section name="congress" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.congressEyebrow}</Eyebrow>
          <H2>{ui.congressH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.congressP}</p>
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {c.congressTiers.map((t, i) => (
            <Reveal key={t.no} delay={i * 80}>
              <article
                className={`relative flex h-full flex-col rounded-[1.6rem] p-7 ${
                  t.best
                    ? "bg-[#cef870] text-[#02251f] ring-1 ring-[#cef870]"
                    : "bg-bh-cloud text-bh-ink ring-1 ring-white/10"
                }`}
              >
                {t.best && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#02251f] px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[#cef870]">{ui.mostChosen}</span>
                )}
                <p className={`font-mono text-[0.62rem] uppercase tracking-[0.25em] ${t.best ? "text-[#02251f]/60" : "text-bh-ink/65"}`}>
                  {ui.level} {t.no} · {ui.bothEvents}
                </p>
                <h3 className="mt-3 font-display text-3xl font-[600] tracking-[-0.02em]">{t.name}</h3>
                <p className="mt-4 font-display text-4xl font-[300] tracking-[-0.03em]">
                  {t.price}
                  <span className={`ml-2 align-middle font-sans text-xs font-normal ${t.best ? "text-[#02251f]/60" : "text-bh-ink/65"}`}>{ui.exVat}</span>
                </p>
                <ul className={`mt-7 flex flex-col gap-2.5 border-t pt-6 text-sm ${t.best ? "border-[#02251f]/20" : "border-bh-ink/10"}`}>
                  {t.has.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 ${t.best ? "text-[#146455]" : "text-bh-pine"}`} aria-hidden>
                        ✳
                      </span>
                      {f}
                    </li>
                  ))}
                  {t.not.map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 ${t.best ? "text-[#02251f]/45" : "text-bh-ink/40"}`}>
                      <Dash />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <p className="max-w-3xl text-sm font-light leading-relaxed text-bh-ink/70">{ui.congressNote}</p>
        </Reveal>
      </Section>

      {/* 13 Village щанд */}
      <Section name="village" className="border-t border-bh-ink/10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <Reveal>
            <Eyebrow>{ui.villageEyebrow}</Eyebrow>
            <H2>{ui.villageH}</H2>
            <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-bh-ink/70">{ui.villageP}</p>
            <p className="mt-6 font-display text-5xl font-[300] tracking-[-0.03em]">
              {ui.villagePrice}
              <span className="ml-2 align-middle font-sans text-xs font-normal text-bh-ink/65">{ui.exVat}</span>
            </p>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-bh-ink/65">{ui.villageP2}</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="rounded-[1.4rem] bg-bh-cloud p-2 ring-1 ring-bh-ink/8">
              <table className="w-full text-sm">
                <tbody>
                  {c.villageRows.map(([k, v]) => (
                    <tr key={k} className="border-b border-bh-ink/8 last:border-0">
                      <td className="px-5 py-3.5 text-bh-ink/75">{k}</td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        <span className="mr-2 text-bh-pine" aria-hidden>
                          ✳
                        </span>
                        {v}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-bh-ink/8">
                    <td className="px-5 py-3.5 text-bh-ink/40">{ui.villageNot1}</td>
                    <td className="px-5 py-3.5 text-right text-bh-ink/40">-</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 text-bh-ink/40">{ui.villageNot2}</td>
                    <td className="px-5 py-3.5 text-right text-bh-ink/40">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-right font-mono text-[0.6rem] uppercase tracking-[0.2em] text-bh-ink/40">{ui.pricesExVat}</p>
          </Reveal>
        </div>
      </Section>

      {/* 14 сравнение */}
      <Section name="compare" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.compareEyebrow}</Eyebrow>
          <H2>{ui.compareH}</H2>
        </Reveal>
        <Reveal className="mt-12">
          <div className="overflow-x-auto rounded-[1.4rem] bg-bh-cloud ring-1 ring-bh-ink/8">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-bh-ink/10">
                  <th className="px-5 py-4 text-left font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/65" />
                  {c.compareNames.map((n) => (
                    <th key={n} className="px-5 py-4 text-right font-display text-lg font-[600] tracking-tight">
                      {n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.compareRows.map((r) => (
                  <tr key={r.row} className="border-b border-bh-ink/8">
                    <td className="px-5 py-3 text-bh-ink/75">{r.row}</td>
                    {r.cells.map((c, i) => (
                      <td key={i} className="px-5 py-3 text-right">
                        {c === true ? (
                          <span className="text-bh-pine" aria-hidden>
                            ✳
                          </span>
                        ) : c === false ? (
                          <span className="text-bh-ink/30">-</span>
                        ) : (
                          <span className="font-medium">{c}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-5 py-4" />
                  {c.comparePrices.map((p) => (
                    <td key={p} className="px-5 py-4 text-right font-display text-xl font-[500] tracking-tight">
                      {p}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-light text-bh-ink/70">{ui.compareNote}</p>
          <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-bh-ink/40">{ui.pricesExVat}</p>
        </Reveal>
      </Section>

      {/* 15 по избор */}
      <Section name="extras" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.extrasEyebrow}</Eyebrow>
          <H2>{ui.extrasH}</H2>
        </Reveal>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {c.extras.map((e, i) => (
            <Reveal key={e.h} delay={i * 70}>
              <div className="border-t border-bh-ink/15 pt-5">
                <div className="font-display text-4xl font-[300] tracking-[-0.03em] text-bh-pine">{e.price}</div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{e.h}</h3>
                <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-bh-ink/65">{e.p}</p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={c.extras.length * 70}>
            <div className="border-t border-bh-ink/15 pt-5">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-[300] tracking-[-0.03em] text-bh-pine">Diamond</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/65">{ui.titleOnly}</span>
              </div>
              <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-bh-ink/65">{ui.titleP}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 16 след ноември */}
      <Section name="after" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.afterEyebrow}</Eyebrow>
          <H2>{ui.afterH}</H2>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.after.map((a, i) => (
            <Reveal key={a.h} delay={i * 80}>
              <article className="flex h-full flex-col rounded-[1.4rem] bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-pine">{a.t}</p>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{a.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{a.p}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 17 подкрепа */}
      <Section name="support" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.supportEyebrow}</Eyebrow>
          <H2>{ui.supportH}</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.supportP}</p>
        </Reveal>
        <Reveal className="mt-12">
          <div className="flex flex-col">
            {c.supportRows.map((r) => (
              <div
                key={r.l}
                className="flex flex-col gap-3 border-t border-bh-ink/10 py-5 last:border-b sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.25em] text-bh-ink/70">{r.l}</span>
                {r.names ? (
                  <span className="text-sm font-medium">{r.names}</span>
                ) : (
                  <span className="flex gap-2" aria-label={ui.freeSpots}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-9 w-24 rounded-lg bg-bh-ink/[0.04] ring-1 ring-bh-ink/8" />
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/65">{ui.supportNote}</p>
        </Reveal>
      </Section>

      {/* 18 founding partners */}
      <Section name="founding" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>{ui.foundingEyebrow}</Eyebrow>
          <H2>{ui.foundingH}</H2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <article className="flex h-full flex-col rounded-[1.6rem] bg-[#0a3229] p-8 text-white">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[#cef870]">
                Founding Partner 2026
              </p>
              <h3 className="mt-5 font-display text-[clamp(1.7rem,3vw,2.4rem)] font-[500] leading-[1.08] tracking-[-0.02em]">{ui.foundingH3}</h3>
              <ul className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/85">
                {c.foundingPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 text-[#cef870]" aria-hidden>
                      ✳
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.territories.map((t) => (
                <div
                  key={t.h}
                  className="flex items-center justify-between gap-3 rounded-[1.1rem] bg-bh-cloud px-5 py-4 ring-1 ring-bh-ink/8"
                >
                  <div>
                    <p className="font-semibold tracking-tight">{t.h}</p>
                    <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.15em] text-bh-ink/65">
                      {t.sub}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-bh-lime-pale px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#02251f]">{ui.open}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/65">{ui.foundingNote}</p>
          </Reveal>
        </div>
      </Section>

      {/* 19 следваща стъпка */}
      <Section name="next" dark className="border-t border-bh-ink/10 pb-24">
        <Reveal>
          <Eyebrow>{ui.nextEyebrow}</Eyebrow>
          <h2 className="mt-5 font-display text-[clamp(2.6rem,7vw,5.6rem)] font-[900] leading-[0.95] tracking-[-0.04em] text-bh-ink">
            {ui.nextH1}
            <br />
            {ui.nextH2}
          </h2>
          <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-bh-ink/70">{ui.nextP}</p>
          <a
            href={ui.mailto}
            className="mt-8 inline-block rounded-full bg-bh-ink px-8 py-4 text-base font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
          >
            {CONTACT}
          </a>
          <dl className="mt-14 grid gap-x-8 gap-y-6 border-t border-bh-ink/10 pt-8 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-bh-ink/65">{ui.dates}</dt>
              <dd className="mt-2 font-medium">{ui.datesV}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-bh-ink/65">{ui.venue}</dt>
              <dd className="mt-2 font-medium">{ui.venueV}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-bh-ink/65">{ui.partnerships}</dt>
              <dd className="mt-2 font-medium">{ui.partnershipsV}</dd>
            </div>
          </dl>
          <p className="mt-10 font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/40">
            thelongevitysummit.eu
          </p>
        </Reveal>
      </Section>
    </div>
  );
}
