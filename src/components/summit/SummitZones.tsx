import { Reveal } from "@/components/ui/Reveal";
import { Stage, Stall, Walk, Waves } from "@/components/ui/Pictograms";

/**
 * The four zones - the map of the day, sitting above the stations, which are
 * the detail inside it.
 *
 * The wording is the partner deck's, word for word. It has to be: a sponsor
 * buys "името на зоната", so the zone a brand is sold has to exist under the
 * same name on the public page, or the thing they paid for cannot be shown.
 */
const zones = [
  {
    no: "01",
    tag: "Знанието",
    title: "Сцена",
    icon: Stage,
    text: "18 лекции и панела - лекари и изследователи на разбираем език.",
  },
  {
    no: "02",
    tag: "Тялото",
    title: "Движение",
    icon: Walk,
    text: "Power Plate зона и пилатес - на постелка и на реформър, със записан час.",
  },
  {
    no: "03",
    tag: "Балансът",
    title: "Възстановяване",
    icon: Waves,
    text: "Breathwork сесии и Recovery зона, по 30 минути.",
  },
  {
    no: "04",
    tag: "Брандовете",
    title: "Village",
    icon: Stall,
    text: "30 подбрани компании: добавки, устройства, клиники, храна.",
  },
];

export function SummitZones() {
  return (
    <section id="zoni" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Концепцията
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              Четири зони, един ден в тялото ти
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Един ден се движи през четирите - знание, движение, възстановяване
            и брандовете, които стоят зад тях.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((z, i) => (
            <Reveal key={z.no} delay={i * 70}>
              <article className="bh-mint group flex h-full min-h-[15rem] flex-col justify-between rounded-3xl p-6 text-bh-ink transition-transform duration-300 hover:-translate-y-1.5">
                <div className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bh-pine/10 text-bh-pine transition-colors group-hover:bg-bh-pine group-hover:text-bh-paper">
                    <z.icon className="h-7 w-7" />
                  </span>
                  <span className="font-mono text-sm text-bh-ink/40">/ {z.no}</span>
                </div>
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">
                    {z.tag}
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight">
                    {z.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-bh-ink/65">{z.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
