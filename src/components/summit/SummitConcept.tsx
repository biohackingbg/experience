import { Reveal } from "@/components/ui/Reveal";
import {
  Bike,
  Body,
  Brain,
  Composition,
  Droplet,
  Plank,
  Plate,
  Pulse,
  Reformer,
  Sphere,
  Stretch,
  SunSkin,
  Walk,
  Waves,
} from "@/components/ui/Pictograms";
import type { Lang } from "@/lib/i18n";
import { CONCEPT, type Station, type StationId } from "@/lib/site-copy";

/**
 * The floor, in two groups: the Experience (things you do with your own body:
 * movement, breath, workshops) and the stations (measuring and recovery
 * points). Partners are named on the cards as they sign; a card carries its
 * own emblem and number, so the set reads as one even while the photos
 * arrive one by one.
 */

/** Icons by station id; the titles are in site-copy.ts. */
const icons: Record<StationId, typeof Composition> = {
  "pilates-reformer": Reformer,
  lagree: Plank,
  mobility: Stretch,
  "mat-pilates": Body,
  psychosomatics: Brain,
  "power-of-breath": Waves,
  mitolight: Pulse,
  "power-plate-rev": Bike,
  "power-plate-platform": Plate,
  yoga: Walk,
  endosphera: Sphere,
  restart: Waves,
  obsidian: Pulse,
  n8: SunSkin,
  inbody: Composition,
  hydration: Droplet,
};

/** A photo for a station that has one. Cards without one stay mint. */
const photos: Partial<Record<StationId, string>> = {
  "pilates-reformer": "/stations/reformer.webp",
  lagree: "/stations/lagree.webp",
  mobility: "/stations/mobilnost.webp",
  psychosomatics: "/stations/mentalno.webp",
  "power-plate-rev": "/stations/rev.webp",
  "power-plate-platform": "/stations/powerplate.webp",
  endosphera: "/stations/endosfera.webp",
  inbody: "/stations/inbody.webp",
};

function Cards({ items }: { items: Station[] }) {
  const cards = items.map((it, i) => ({
    ...it,
    no: String(i + 1).padStart(2, "0"),
    icon: icons[it.id],
    photo: photos[it.id] ?? null,
  }));
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((s, i) => (
        <Reveal key={s.id} delay={(i % 4) * 70}>
          <article
            className={`group relative flex h-full min-h-[15rem] flex-col justify-between overflow-hidden rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1.5 ${
              s.photo ? "text-white" : "bh-mint text-bh-ink"
            }`}
          >
            {s.photo && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                {/* The title sits on the darkest part of the photo, and
                    the gradient makes sure there is one. */}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#02251f]/85 via-[#02251f]/25 to-[#02251f]/10" />
              </>
            )}
            <div className="relative flex items-start justify-between">
              {/* A tinted disc gives each pictogram a stage of its own, so
                  the cards read as a set of emblems rather than a row of
                  thin lines. */}
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl transition-colors ${
                  s.photo
                    ? "bg-white/15 text-white backdrop-blur-sm group-hover:bg-white group-hover:text-bh-pine"
                    : "bg-bh-pine/10 text-bh-pine group-hover:bg-bh-pine group-hover:text-bh-paper"
                }`}
              >
                <s.icon className="h-7 w-7" />
              </span>
              <span className={`font-mono text-sm ${s.photo ? "text-white/60" : "text-bh-ink/40"}`}>
                / {s.no}
              </span>
            </div>
            <div className="relative">
              <h3 className="text-xl font-bold leading-tight tracking-tight">{s.title}</h3>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

function GroupHeader({ eyebrow, title, intro, first }: { eyebrow: string; title: string; intro: string; first?: boolean }) {
  return (
    <Reveal className={`flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between ${first ? "" : "mt-20"}`}>
      <div>
        <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">{eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
          {title}
        </h2>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">{intro}</p>
    </Reveal>
  );
}

export function SummitConcept({ lang = "bg" }: { lang?: Lang }) {
  const c = CONCEPT[lang];
  return (
    <section id="concept" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <GroupHeader first eyebrow={c.experience.eyebrow} title={c.experience.title(c.experience.items.length)} intro={c.experience.intro} />

        {/* The hall itself, before the list of what happens in it: the one
            image that answers "where is this" at the scale of the event. */}
        <Reveal className="mt-12">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zala-wide.webp"
              srcSet="/zala-wide-1000.webp 1000w, /zala-wide.webp 1550w"
              sizes="(min-width: 80rem) 80rem, 100vw"
              alt={c.hall}
              loading="lazy"
              decoding="async"
              width={1550}
              height={540}
              className="w-full rounded-[1.6rem] object-cover"
            />
            <figcaption className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/55">
              {c.hall}
            </figcaption>
          </figure>
        </Reveal>

        <Cards items={c.experience.items} />

        <GroupHeader eyebrow={c.stations.eyebrow} title={c.stations.title(c.stations.items.length)} intro={c.stations.intro} />
        <Cards items={c.stations.items} />
      </div>
    </section>
  );
}
