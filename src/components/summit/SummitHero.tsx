const stats = [
  { value: "07—08", label: "ноември 2026" },
  { value: "4", label: "зони" },
  { value: "1 000+", label: "посетители" },
  { value: "2", label: "сцени" },
];

export function SummitHero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-bh-ink pt-16 pb-0 text-white"
    >
      {/* soft lime glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full opacity-30 blur-[120px]"
        style={{ background: "var(--color-bh-lime)" }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <p className="hu-rise font-mono text-xs uppercase tracking-[0.3em] text-bh-lime">
          Sofia Life Summit · Потребителска програма
        </p>

        <h1
          className="hu-rise mt-8 font-display text-[clamp(2.3rem,9vw,7.5rem)] font-extrabold uppercase leading-[0.92] tracking-tight"
          style={{ animationDelay: "80ms" }}
        >
          <span className="text-bh-teal">Biohacking</span>
          <br />
          <span className="text-bh-lime">Experience</span>
        </h1>

        <div
          className="hu-rise mt-8 flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          style={{ animationDelay: "160ms" }}
        >
          <p className="text-lg leading-relaxed text-white/70">
            Longevity медицината излиза от лабораторията. Един ден се движиш
            между четири зони: слушаш, измерваш се, изпробваш и си тръгваш с
            личен план.
          </p>
        </div>

        <div
          className="hu-rise mt-10 flex flex-wrap items-center gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href="#tickets"
            className="inline-flex items-center gap-2 rounded-full bg-bh-lime px-7 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
          >
            Купи билет от 50 €
          </a>
          <a
            href="#program"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-bh-lime hover:text-bh-lime"
          >
            Виж програмата
          </a>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
            Гранд Хотел Милениум, София
          </span>
        </div>

        {/* stat strip */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-white/10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-bh-ink px-6 py-8">
              <div className="font-display text-4xl font-extrabold text-bh-lime lg:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
