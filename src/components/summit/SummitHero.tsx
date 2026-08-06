import { Gauge, Hotel, People } from "@/components/ui/Pictograms";

const zoneTags = ["Сцена", "Лаборатория", "Ритуали", "Village"];

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 17L17 7M17 7H8M17 7V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SummitHero() {
  return (
    <section id="top" className="px-5 pt-6 sm:px-8 sm:pt-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-stretch">
          <div className="self-end">
            <p className="hu-rise flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[clamp(1.05rem,2.5vw,1.9rem)] font-[900] uppercase leading-none tracking-[-0.01em] text-bh-pine">
              Biohacking Experience
              <span className="text-bh-ink/35">·</span>
              07—08.11.2026
            </p>

            <h1
              /* Two sizes, because the column changes shape: below lg the
                 heading owns the full width, at lg it shares the row with the
                 venue card and only gets ~60% of it. */
              className="hu-rise mt-3 font-display text-[clamp(3.3rem,16vw,9.6rem)] font-[1000] uppercase leading-[0.82] tracking-[-0.035em] text-bh-ink lg:text-[clamp(3.3rem,10.3vw,9.6rem)]"
              style={{ animationDelay: "80ms" }}
            >
              Sofia Life
              <br />
              Summit
            </h1>
          </div>

          <article
            className="hu-rise bh-mint flex flex-col justify-between rounded-3xl p-7 text-bh-ink"
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full border border-bh-ink/25 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-bh-ink">
                Гранд Хотел Милениум
              </span>
              <Hotel className="h-8 w-8 shrink-0 text-bh-ink/70" />
            </div>
            <p className="mt-10 text-sm leading-relaxed text-bh-ink/75">
              Не конференция със столове в редици. Longevity медицината излиза
              от лабораторията — на разбираем език, за един ден, в който
              слушаш, измерваш се, изпробваш и си тръгваш с личен протокол.
            </p>
          </article>
        </div>

        <div
          className="hu-rise mt-6 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href="#tickets"
            className="bh-gradient inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
          >
            Купи билет от 50 €
          </a>
          <a
            href="#program"
            className="bh-gradient-outline inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
          >
            Виж програмата
          </a>
        </div>

        {/* bento */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* passport — tall dark */}
          <article className="bh-mint flex flex-col justify-between rounded-3xl p-7 text-bh-ink sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <div className="flex items-start justify-between">
              <span className="text-3xl leading-none text-bh-pine">✳</span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">
                Ядрото
              </span>
            </div>
            <div className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight">
                Longevity паспортът
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-bh-ink/65">
                Влизаш с празен паспорт, излизаш с реални показатели и обяснение
                от специалист на място.
              </p>
              <a
                href="#passport"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-bh-pine"
              >
                Виж какво се мери <Arrow className="h-4 w-4" />
              </a>
            </div>
          </article>

          {/* zones — lime accent */}
          <article className="bh-mint flex flex-col justify-between rounded-3xl p-7 text-bh-ink sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {zoneTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-bh-ink/10 px-3 py-1 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-10 flex items-end justify-between">
              <div>
                <div className="text-5xl font-black tracking-tight lg:text-6xl">
                  4 зони
                </div>
                <p className="mt-2 max-w-xs text-sm text-bh-ink/70">
                  Един ден в тялото ти — движиш се между зоните, не седиш на
                  стол.
                </p>
              </div>
              <a
                href="#concept"
                aria-label="Към концепцията"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bh-ink text-bh-lime transition-transform hover:-translate-y-0.5"
              >
                <Arrow className="h-5 w-5" />
              </a>
            </div>
          </article>

          {/* stat — light */}
          <article className="bh-mint rounded-3xl p-7">
            <People className="h-7 w-7 text-bh-pine/70" />
            <div className="mt-4 text-5xl font-black tracking-tight text-bh-ink">
              1 000+
            </div>
            <div className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/50">
              посетители
            </div>
          </article>

          {/* stat — dark */}
          <article className="rounded-3xl bg-bh-ink p-7 text-bh-paper">
            <Gauge className="h-7 w-7 text-bh-lime" />
            <div className="mt-4 text-5xl font-black tracking-tight">12</div>
            <div className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-bh-paper/50">
              станции за измерване
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
