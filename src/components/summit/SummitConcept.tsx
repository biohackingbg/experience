import { Reveal } from "@/components/ui/Reveal";
import {
  Capsule,
  Chip,
  Heart,
  Neural,
  Pulse,
  TestTube,
  Watch,
  Waves,
} from "@/components/ui/Pictograms";

/**
 * The station categories. Partners are announced per category as they sign,
 * so a card carries the field rather than a logo — the promise is "you will
 * try things in this area", which holds before any name is public.
 */
const stations = [
  { no: "01", icon: Pulse, title: "Диагностика" },
  { no: "02", icon: Watch, title: "Wearables" },
  { no: "03", icon: Waves, title: "Recovery" },
  { no: "04", icon: Neural, title: "AI & Precision Medicine" },
  { no: "05", icon: Capsule, title: "Хранителни добавки" },
  { no: "06", icon: Chip, title: "Медицински технологии" },
  { no: "07", icon: Heart, title: "Women’s Health" },
  { no: "08", icon: TestTube, title: "Functional Testing" },
];

export function SummitConcept() {
  return (
    <section id="concept" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Станциите
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              10+ интерактивни станции
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Не гледаш отстрани — измерваш се, пробваш, питаш. Всяка станция е
            водена от партньор в своята област.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stations.map((s, i) => (
            <Reveal key={s.no} delay={i * 70}>
              <article className="bh-mint group flex h-full min-h-[15rem] flex-col justify-between rounded-3xl p-6 text-bh-ink transition-transform duration-300 hover:-translate-y-1.5">
                <div className="flex items-start justify-between">
                  {/* A tinted disc gives each pictogram a stage of its own,
                      so the eight read as a set of emblems rather than a
                      row of thin lines. */}
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bh-pine/10 text-bh-pine transition-colors group-hover:bg-bh-pine group-hover:text-bh-paper">
                    <s.icon className="h-7 w-7" />
                  </span>
                  <span className="font-mono text-sm text-bh-ink/40">
                    / {s.no}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-tight tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/45">
                    Партньорите ще бъдат обявени скоро.
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
