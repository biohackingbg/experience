import {
  Arrow,
  Flask,
  Gauge,
  Hotel,
  People,
  Stage,
  Stall,
  Waves,
} from "@/components/ui/Pictograms";

const zoneTags = [
  { label: "Сцена", icon: Stage },
  { label: "Лаборатория", icon: Flask },
  { label: "Ритуали", icon: Waves },
  { label: "Village", icon: Stall },
];

/**
 * Editorial signature from the reference: circular type slowly orbiting a
 * spark. Static SVG, spun by CSS only when the visitor allows motion.
 */
function OrbitBadge() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-4 left-2 hidden h-24 w-24 lg:block"
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full motion-safe:animate-[spin_22s_linear_infinite]"
      >
        <defs>
          <path
            id="orbit"
            d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
            fill="none"
          />
        </defs>
        <text className="fill-bh-ink/55 font-mono text-[8.5px] uppercase tracking-[0.28em]">
          <textPath href="#orbit">
            Sofia Life Summit · Biohacking Experience ·
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 grid place-items-center text-2xl text-bh-pine">
        ✦
      </span>
    </div>
  );
}

export function SummitHero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden px-5 pt-6 sm:px-8 lg:px-10 lg:pt-4"
    >
      <div aria-hidden className="bh-aurora -z-10" />
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[2.45fr_1fr] lg:items-stretch">
          {/* Staggered editorial headline, the reference's defining move:
              each line takes its own indent, and the date rides inside the
              first line as a pill instead of hanging above as a subtitle. */}
          <div className="relative self-center pb-8 lg:pb-6">
            <p className="hu-rise font-display text-[clamp(1.2rem,2.5vw,1.9rem)] font-[900] uppercase tracking-[-0.01em] text-bh-pine">
              Sofia Life Summit
            </p>

            <h1
              className="hu-rise mt-2 font-display text-[clamp(2.2rem,7.5vw,3rem)] font-[1000] uppercase leading-[0.94] tracking-[-0.03em] text-bh-ink"
              style={{ animationDelay: "80ms" }}
            >
              <span className="block">
                Два дни,{" "}
                <span className="mx-1 inline-block -translate-y-[0.32em] whitespace-nowrap rounded-full border border-bh-ink/30 px-[0.5em] py-[0.22em] align-middle font-mono text-[0.3em] font-semibold tracking-[0.16em] text-bh-ink/80">
                  07—08.11.2026
                </span>{" "}
                които могат да
              </span>
              <span className="block">променят начина, по който живееш</span>
              <span className="block lg:pl-[24%]">следващите 20 години.</span>
            </h1>

            <OrbitBadge />
          </div>

          {/* The dark welcome card from the reference, in our forest. */}
          <article
            className="hu-rise bh-forest flex flex-col justify-between gap-6 rounded-3xl p-6 text-bh-paper"
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full border border-bh-paper/30 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-bh-paper/90">
                Гранд Хотел Милениум
              </span>
              <Hotel className="h-8 w-8 shrink-0 text-bh-lime" />
            </div>
            <p className="text-sm leading-relaxed text-bh-paper/80">
              Не конференция със столове в редици. Науката за дълголетието и
              биохакинга излиза от лабораторията — на разбираем език, за един
              ден, в който слушаш, измерваш се, изпробваш и си тръгваш с личен
              протокол.
            </p>
          </article>
        </div>


        {/* Bento after the reference: a tall card and two square stats on the
            left, one large accent card owning the right. */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-3">
            {/* passport — tall */}
            <article className="bh-mint flex flex-1 flex-col justify-between rounded-3xl p-6 text-bh-ink">
              <div className="flex items-start justify-between">
                <span className="text-3xl leading-none text-bh-pine">✳</span>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">
                  Ядрото
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  Longevity паспортът
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-bh-ink/65">
                  Влизаш с празен паспорт, излизаш с реални показатели и
                  обяснение от специалист на място.
                </p>
                <a
                  href="#passport"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-bh-pine"
                >
                  Виж какво се мери <Arrow className="h-4 w-4" />
                </a>
              </div>
            </article>

            {/* two square stats, one light one dark, like the reference */}
            <div className="grid grid-cols-2 gap-3">
              <article className="bh-mint rounded-3xl p-5">
                <People className="h-6 w-6 text-bh-pine/70" />
                <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">
                  1 000+
                </div>
                <div className="mt-1.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                  посетители
                </div>
              </article>
              <article className="bh-forest rounded-3xl p-5 text-bh-paper">
                <Gauge className="h-6 w-6 text-bh-lime" />
                <div className="mt-3 text-3xl font-black tracking-tight">
                  12
                </div>
                <div className="mt-1.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-paper/50">
                  станции за измерване
                </div>
              </article>
            </div>
          </div>

          {/* zones — the big accent card: tags, headline word, rule, copy,
              and the diagonal arrow anchoring the corner. */}
          <article className="bh-mint flex flex-col rounded-3xl p-6 text-bh-ink lg:p-7">
            <div className="flex flex-wrap gap-2">
              {zoneTags.map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-bh-ink/10 px-3 py-1 text-xs font-medium"
                >
                  <t.icon className="h-3.5 w-3.5 text-bh-pine" />
                  {t.label}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-5">
              <div className="text-5xl font-black tracking-tight lg:text-7xl">
                4 зони
              </div>
              <div className="mt-6 border-t border-bh-ink/15 pt-5" />
              <div className="flex items-end justify-between gap-6">
                <p className="max-w-md text-sm leading-relaxed text-bh-ink/70 lg:text-base">
                  Един ден в тялото ти — движиш се между зоните, не седиш на
                  стол. Слушаш, измерваш се, изпробваш, възстановяваш се.
                </p>
                <a
                  href="#concept"
                  aria-label="Към концепцията"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bh-ink text-bh-lime transition-transform hover:-translate-y-0.5"
                >
                  <Arrow className="h-5 w-5" />
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
