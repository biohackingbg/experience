import { Reveal } from "@/components/ui/Reveal";

const zones = [
  {
    no: "01",
    tag: "Сцена",
    title: "Знанието",
    body: "Същите международни имена, но на разбираем език, по 25 минути. Главна сцена 600 места, втора сцена 150.",
    dark: false,
  },
  {
    no: "02",
    tag: "Лаборатория",
    title: "Числата",
    body: "12 станции за измерване. Влизаш с празен паспорт, излизаш с реални показатели и обяснение.",
    dark: true,
  },
  {
    no: "03",
    tag: "Ритуали",
    title: "Тялото",
    body: "Сесии по 30 минути със записан час. Студ, сауна, дишане, red light, PEMF.",
    dark: false,
    fill: "bh-gradient-soft",
  },
  {
    no: "04",
    tag: "Village",
    title: "Брандовете",
    body: "30 подбрани компании: добавки, устройства, лаборатории, клиники, храна.",
    dark: false,
    fill: "bh-gradient-sky",
  },
];

export function SummitConcept() {
  return (
    <section id="concept" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
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
            <article
              className={`flex h-full min-h-[17rem] flex-col justify-between rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1.5 ${
                z.dark
                  ? "bg-bh-ink text-bh-paper"
                  : z.fill
                    ? `${z.fill} text-bh-ink`
                    : "bg-bh-cloud text-bh-ink ring-1 ring-bh-ink/8"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-sm ${
                    z.dark ? "text-bh-lime" : "text-bh-ink/40"
                  }`}
                >
                  / {z.no}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
                    z.dark
                      ? "bg-bh-paper/10 text-bh-paper/80"
                      : "bg-bh-ink/10 text-bh-ink/70"
                  }`}
                >
                  {z.tag}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">{z.title}</h3>
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    z.dark ? "text-bh-paper/60" : "text-bh-ink/60"
                  }`}
                >
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
