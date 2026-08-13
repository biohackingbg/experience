import { Reveal } from "@/components/ui/Reveal";
import {
  Arrow,
  ArrowDown,
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
 *
 * Each card is dressed in its owner's colours and carries its owner's mark:
 * the association's rose and green on theirs, ours on ours. Two brands sharing
 * a roof should still be told apart at a glance.
 */

const shared = [
  { icon: Calendar, label: "07—08 ноември 2026" },
  { icon: Pin, label: "Гранд Хотел Милениум" },
];

const CONFERENCE_URL = "https://www.longevitybulgaria.com/post/conference-2026";

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
          {/* ── The association's conference ─────────────────────────────── */}
          <Reveal>
            <article className="bh-mint flex h-full flex-col rounded-3xl p-7 text-bh-ink">
              <div className="flex items-start justify-between gap-4">
                <Stethoscope className="h-8 w-8 shrink-0 text-bh-assoc" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/partner-logo.png"
                  alt="Bulgarian Longevity Association"
                  className="h-10 w-auto max-w-[9rem] shrink-0 object-contain object-right"
                />
              </div>

              <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">
                Bulgarian Longevity Association
              </p>
              <h3 className="mt-2 font-display text-2xl font-[900] uppercase leading-none tracking-tight">
                Медицинска конференция
              </h3>
              <p className="mt-3 text-sm font-semibold text-bh-rose">
                За лекари и специалисти
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {[
                  "Научни доклади и клинични данни",
                  "Международни лектори в пълен формат",
                  "Регистрация през сайта на Асоциацията",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm leading-relaxed text-bh-ink/70"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-3 shrink-0 rounded-full bg-bh-assoc"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center justify-between gap-4">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/45">
                  Към регистрацията
                </span>
                <a
                  href={CONFERENCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Регистрация за медицинската конференция, longevitybulgaria.com"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bh-rose text-white transition-transform hover:-translate-y-0.5"
                >
                  <Arrow className="h-5 w-5" />
                </a>
              </div>
            </article>
          </Reveal>

          {/* ── Ours ─────────────────────────────────────────────────────── */}
          <Reveal delay={110}>
            <article className="bh-forest flex h-full flex-col rounded-3xl p-7 text-bh-paper">
              <div className="flex items-start justify-between gap-4">
                <People className="h-8 w-8 shrink-0 text-bh-lime" />
                {/* Always the lime mark: the card is dark in both themes now,
                    so there is nothing to swap. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-dark.svg"
                  alt="Biohacking Experience"
                  className="h-8 w-auto shrink-0"
                />
              </div>

              <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-paper/50">
                Biohacking.bg
              </p>
              <h3 className="mt-2 font-display text-2xl font-[900] uppercase leading-none tracking-tight">
                Biohacking Experience
              </h3>
              <p className="mt-3 text-sm font-semibold text-bh-lime">
                За всички, без медицинско образование
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {[
                  "Четири зони: сцена, лаборатория, ритуали, Village",
                  "Същите лектори, на разбираем език, по 25 минути",
                  "Билетите на тази страница",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm leading-relaxed text-bh-paper/75"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-3 shrink-0 rounded-full bg-bh-lime"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center justify-between gap-4">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-paper/50">
                  Към билетите
                </span>
                {/* Down rather than diagonal: this one stays on the page, and
                    the arrow should say so before it is clicked. */}
                <a
                  href="#tickets"
                  aria-label="Към билетите"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bh-lime text-bh-ink transition-transform hover:-translate-y-0.5"
                >
                  <ArrowDown className="h-5 w-5" />
                </a>
              </div>
            </article>
          </Reveal>
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
