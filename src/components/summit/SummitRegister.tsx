const facts = [
  { label: "Дати", value: "07—08 ноември 2026" },
  { label: "Място", value: "Гранд Хотел Милениум, София" },
  { label: "Достъп", value: "Ранни билети от септември" },
];

export function SummitRegister() {
  return (
    <section id="register" className="bg-bh-ink py-20 text-white lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-bh-lime px-8 py-14 text-bh-ink lg:px-16 lg:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-bh-forest/20 blur-3xl"
          />

          <div className="relative max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-bh-forest">
              Запази мястото си
            </p>
            <h2 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Един ден. Реални числа. Личен план.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-bh-ink/75">
              Местата в Лабораторията и ритуалите са с предварително записване.
              Ранните билети тръгват от септември — остави имейл и ще си сред
              първите, които ще ги получат.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="mailto:hello@biohacking.bg?subject=Ранен%20билет%20—%20Biohacking%20Experience"
                className="inline-flex items-center gap-2 rounded-full bg-bh-ink px-7 py-3.5 text-sm font-semibold text-bh-lime transition-transform hover:-translate-y-0.5"
              >
                Заяви ранен билет
              </a>
              <a
                href="#tickets"
                className="inline-flex items-center gap-2 rounded-full border border-bh-ink/25 px-7 py-3.5 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
              >
                Виж нивата
              </a>
            </div>

            <dl className="mt-12 grid gap-6 border-t border-bh-ink/15 pt-8 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50">
                    {f.label}
                  </dt>
                  <dd className="mt-2 font-display text-lg font-bold tracking-tight">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
