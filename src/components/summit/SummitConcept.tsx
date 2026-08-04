const zones = [
  {
    no: "01",
    tag: "Сцена",
    title: "Знанието",
    body: "Същите международни имена, но на разбираем език, по 25 минути. Главна сцена 600 места, втора сцена 150.",
    theme: "ink",
  },
  {
    no: "02",
    tag: "Лаборатория",
    title: "Числата",
    body: "12 станции за измерване. Влизаш с празен паспорт, излизаш с реални показатели и обяснение.",
    theme: "lime",
  },
  {
    no: "03",
    tag: "Ритуали",
    title: "Тялото",
    body: "Сесии по 30 минути със записан час. Студ, сауна, дишане, red light, PEMF.",
    theme: "forest",
  },
  {
    no: "04",
    tag: "Village",
    title: "Брандовете",
    body: "30 подбрани компании: добавки, устройства, лаборатории, клиники, храна.",
    theme: "stone",
  },
] as const;

const themes = {
  ink: "bg-bh-ink text-white",
  lime: "bg-bh-lime text-bh-ink",
  forest: "bg-bh-forest text-white",
  stone: "bg-bh-stone text-bh-ink",
} as const;

const noColor = {
  ink: "text-bh-lime",
  lime: "text-bh-forest",
  forest: "text-bh-lime",
  stone: "text-bh-ink/40",
} as const;

export function SummitConcept() {
  return (
    <section id="concept" className="bg-bh-paper py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-bh-forest">
            Концепцията
          </p>
          <h2 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-bh-ink sm:text-5xl lg:text-6xl">
            Четири зони,
            <br />
            един ден в тялото ти
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-bh-ink/70">
            Не конференция със столове в редици. Посетителят се движи между
            зоните през целия ден: слуша, измерва се, изпробва, тръгва си с план.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((z) => (
            <article
              key={z.no}
              className={`flex min-h-[19rem] flex-col justify-between rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1.5 ${themes[z.theme]}`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`font-mono text-sm font-semibold ${noColor[z.theme]}`}
                >
                  / {z.no}
                </span>
                <span className="rounded-full border border-current/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] opacity-80">
                  {z.tag}
                </span>
              </div>

              <div>
                <h3 className="font-display text-3xl font-extrabold uppercase tracking-tight">
                  {z.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed opacity-80">
                  {z.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
