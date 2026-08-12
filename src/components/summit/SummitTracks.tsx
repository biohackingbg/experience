import { Reveal } from "@/components/ui/Reveal";
import {
  Calendar,
  People,
  Pin,
  Stethoscope,
} from "@/components/ui/Pictograms";

/**
 * The two tracks, side by side.
 *
 * Its real job is commercial clarity, not decoration: a buyer paying €145 has
 * to see that the medical conference is a separate event with its own
 * registration, so nobody arrives expecting a session their ticket never
 * covered. The shared band above the columns carries what genuinely is common
 * — dates, venue and the speakers — because that is the part worth selling.
 */

const shared = [
  { icon: Calendar, label: "07—08 ноември 2026" },
  { icon: Pin, label: "Гранд Хотел Милениум" },
];

const tracks = [
  {
    id: "medical",
    icon: Stethoscope,
    eyebrow: "Медицинска конференция",
    audience: "За лекари и специалисти",
    organiser: "Bulgarian Longevity Association",
    points: [
      "Научни доклади и клинични данни",
      "Международни лектори в пълен формат",
      "Регистрация през сайта на Асоциацията",
    ],
    dark: true,
  },
  {
    id: "consumer",
    icon: People,
    eyebrow: "Biohacking Experience",
    audience: "За всички, без медицинско образование",
    organiser: "Biohacking.bg",
    points: [
      "Четири зони: сцена, лаборатория, ритуали, Village",
      "Същите лектори, на разбираем език, по 25 минути",
      "Билетите на тази страница",
    ],
    dark: false,
  },
];

export function SummitTracks() {
  return (
    <section id="dve-sabitiya" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Как е устроено
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              Две събития под един покрив
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Медицинската конференция и потребителският фест вървят паралелно, в
            същите дни и същата сграда — но са отделни събития с отделни билети.
          </p>
        </Reveal>

        {/* Shared band */}
        <Reveal className="mt-12">
          <div className="bh-mint flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-3xl px-7 py-5">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/50">
              Общо за двете
            </span>
            {shared.map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-2.5 text-sm font-medium text-bh-ink"
              >
                <item.icon className="h-5 w-5 shrink-0 text-bh-pine" />
                {item.label}
              </span>
            ))}
          </div>

          {/* A fork, not a divider: a single centred line read as a boundary
              between the two cards rather than as one thing becoming two. */}
          <svg
            aria-hidden
            viewBox="0 0 400 48"
            preserveAspectRatio="none"
            className="hidden h-12 w-full md:block"
          >
            <path
              d="M200 0v12 M200 12c0 12-90 12-90 24 M200 12c0 12 90 12 90 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="text-bh-ink/25"
            />
          </svg>
          {/* Stacked on phones, so the fork would point nowhere. */}
          <div aria-hidden className="h-6 md:hidden" />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {tracks.map((track, i) => (
            <Reveal key={track.id} delay={i * 110}>
              <article
                className={`flex h-full flex-col rounded-3xl p-7 ${
                  track.dark
                    ? "bg-bh-ink text-bh-paper"
                    : "bh-mint text-bh-ink"
                }`}
              >
                <track.icon
                  className={`h-8 w-8 ${
                    track.dark ? "text-bh-lime" : "text-bh-pine"
                  }`}
                />

                <p
                  className={`mt-5 font-mono text-[0.65rem] uppercase tracking-[0.2em] ${
                    track.dark ? "text-bh-paper/50" : "text-bh-ink/45"
                  }`}
                >
                  {track.organiser}
                </p>
                <h3 className="mt-2 font-display text-2xl font-[900] uppercase leading-none tracking-tight">
                  {track.eyebrow}
                </h3>
                <p
                  className={`mt-3 text-sm font-semibold ${
                    track.dark ? "text-bh-lime" : "text-bh-pine"
                  }`}
                >
                  {track.audience}
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {track.points.map((point) => (
                    <li
                      key={point}
                      className={`flex gap-3 text-sm leading-relaxed ${
                        track.dark ? "text-bh-paper/75" : "text-bh-ink/70"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`mt-2 h-1 w-3 shrink-0 rounded-full ${
                          track.dark ? "bg-bh-lime" : "bg-bh-pine"
                        }`}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 max-w-3xl font-mono text-[0.7rem] leading-relaxed uppercase tracking-[0.12em] text-bh-ink/40">
          Билетът от тази страница дава достъп до Biohacking Experience.
          Медицинската конференция има отделна регистрация през Bulgarian
          Longevity Association.
        </p>
      </div>
    </section>
  );
}
