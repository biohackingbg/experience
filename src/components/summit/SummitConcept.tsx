import { Reveal } from "@/components/ui/Reveal";
import { Bike, Brain, Composition, Plank, Plate, Reformer, Sphere, Stretch } from "@/components/ui/Pictograms";
import type { Lang } from "@/lib/i18n";
import { CONCEPT } from "@/lib/site-copy";

/**
 * The station categories. Partners are announced per category as they sign,
 * so a card carries the field rather than a logo - the promise is "you will
 * try things in this area", which holds before any name is public.
 */
/** Icons only; the titles are in site-copy.ts. */
// One per station, in the order the copy lists them: InBody, Lagree, reformer,
// Power Plate, Rev bikes, mobility, mental health, Endosphere.
const icons = [Composition, Plank, Reformer, Plate, Bike, Stretch, Brain, Sphere];

/**
 * A photo for a station that has one, by its position in the list. A card
 * with a photo keeps the same emblem and number, so the eight still read
 * as one set while the photos arrive one by one.
 */
const photos: Record<number, string> = {
  0: "/stations/inbody.webp",
  1: "/stations/lagree.webp",
  2: "/stations/reformer.webp",
  3: "/stations/powerplate.webp",
  4: "/stations/rev.webp",
  5: "/stations/mobilnost.webp",
  6: "/stations/mentalno.webp",
  7: "/stations/endosfera.webp",
};

export function SummitConcept({ lang = "bg" }: { lang?: Lang }) {
  const c = CONCEPT[lang];
  const stations = c.stations.map((title, i) => ({ title, no: String(i + 1).padStart(2, "0"), icon: icons[i], photo: photos[i] ?? null }));
  return (
    <section id="concept" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              {c.eyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              {c.title(stations.length)}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            {c.intro}
          </p>
        </Reveal>

        {/* The hall itself, before the list of what happens in it: the one
            image that answers "where is this" at the scale of the event. */}
        <Reveal className="mt-12">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zala.webp"
              srcSet="/zala-1000.webp 1000w, /zala.webp 1550w"
              sizes="(min-width: 80rem) 80rem, 100vw"
              alt={c.hall}
              loading="lazy"
              decoding="async"
              width={1550}
              height={1015}
              className="w-full rounded-[1.6rem] object-cover"
            />
            <figcaption className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/55">
              {c.hall}
            </figcaption>
          </figure>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stations.map((s, i) => (
            <Reveal key={s.no} delay={i * 70}>
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
                  {/* A tinted disc gives each pictogram a stage of its own,
                      so the eight read as a set of emblems rather than a
                      row of thin lines. */}
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
                  <h3 className="text-xl font-bold leading-tight tracking-tight">
                    {s.title}
                  </h3>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
