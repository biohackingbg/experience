const facts = [
  { label: "Дати", value: "07—08 ноември 2026" },
  { label: "Място", value: "Гранд Хотел Милениум, София" },
  { label: "Достъп", value: "Ранни билети от септември" },
];

export function SummitRegister() {
  return (
    <section id="register" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="rounded-[2rem] bg-bh-ink px-8 py-14 text-bh-paper sm:px-12 lg:px-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-lime">
              Запази мястото си
            </p>
            <h2 className="mt-5 text-[clamp(2.1rem,5vw,4rem)] font-black uppercase leading-[0.95] tracking-tight">
              Един ден. Реални числа. Личен план.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-bh-paper/65">
              Местата в Лабораторията и ритуалите са с предварително записване.
              Ранните билети тръгват от септември — остави имейл и ще си сред
              първите, които ще ги получат.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="mailto:hello@biohacking.bg?subject=Ранен%20билет%20—%20Biohacking%20Experience"
                className="inline-flex items-center gap-2 rounded-full bg-bh-lime px-7 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
              >
                Заяви ранен билет
              </a>
              <a
                href="#tickets"
                className="inline-flex items-center gap-2 rounded-full border border-bh-paper/25 px-7 py-3.5 text-sm font-semibold text-bh-paper transition-colors hover:border-bh-paper"
              >
                Виж нивата
              </a>
            </div>
          </div>

          <dl className="mt-14 grid gap-8 border-t border-bh-paper/15 pt-8 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="font-mono text-xs uppercase tracking-[0.2em] text-bh-paper/45">
                  {f.label}
                </dt>
                <dd className="mt-2 text-lg font-bold tracking-tight">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
