import { Reveal } from "@/components/ui/Reveal";
import { Flask, Stage, Stall, Waves } from "@/components/ui/Pictograms";

/** The four zones are peers, so they share one card treatment. */
const zones = [
  {
    no: "01",
    icon: Stage,
    tag: "Сцена",
    title: "Знанието",
    body: "Същите международни имена, но на разбираем език, по 25 минути. Главна сцена 600 места, втора сцена 150.",
  },
  {
    no: "02",
    icon: Flask,
    tag: "Лаборатория",
    title: "Числата",
    body: "12 станции за измерване. Влизаш с празен паспорт, излизаш с реални показатели и обяснение.",
  },
  {
    no: "03",
    icon: Waves,
    tag: "Ритуали",
    title: "Тялото",
    body: "Сесии по 30 минути със записан час. Студ, сауна, дишане, red light, PEMF.",
  },
  {
    no: "04",
    icon: Stall,
    tag: "Village",
    title: "Брандовете",
    body: "30 подбрани компании: добавки, устройства, лаборатории, клиники, храна.",
  },
];

export function SummitConcept() {
  return (
    <section id="concept" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
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
            Посетителят се движи между зоните през целия ден: слуша, измерва се,
            изпробва, тръгва си с план.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((z, i) => (
            <Reveal key={z.no} delay={i * 90}>
            <article className="bh-mint flex h-full min-h-[17rem] flex-col justify-between rounded-3xl p-7 text-bh-ink transition-transform duration-300 hover:-translate-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-bh-ink/40">
                  / {z.no}
                </span>
                <span className="rounded-full bg-bh-ink/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-bh-ink/70">
                  {z.tag}
                </span>
              </div>
              <div>
                <z.icon className="h-9 w-9 text-bh-pine/70" />
                <h3 className="mt-5 text-2xl font-bold tracking-tight">
                  {z.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-bh-ink/60">
                  {z.body}
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
