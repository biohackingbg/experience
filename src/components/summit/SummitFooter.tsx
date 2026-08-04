const nav = [
  { href: "#concept", label: "Концепция" },
  { href: "#passport", label: "Паспорт" },
  { href: "#program", label: "Програма" },
  { href: "#tickets", label: "Билети" },
];

export function SummitFooter() {
  return (
    <footer className="bg-bh-ink pb-12 pt-4 text-white">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-10 border-t border-white/10 pt-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-extrabold uppercase tracking-tight">
              Biohacking<span className="text-bh-lime">.</span>Experience
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Потребителската част на Sofia Life Summit. Куратор и продуцент —
              Biohacking.bg, в партньорство с Bulgarian Longevity Association.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                Навигация
              </p>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {nav.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-white/70 transition-colors hover:text-bh-lime"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                Контакт
              </p>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                <li>
                  <a
                    href="mailto:hello@biohacking.bg"
                    className="text-white/70 transition-colors hover:text-bh-lime"
                  >
                    hello@biohacking.bg
                  </a>
                </li>
                <li className="text-white/70">Гранд Хотел Милениум, София</li>
                <li className="text-white/70">07—08 ноември 2026</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-[0.15em] text-white/35 sm:flex-row sm:justify-between">
          <span>© 2026 Biohacking.bg</span>
          <span>Sofia Life Summit · Longevity for everyone</span>
        </div>
      </div>
    </footer>
  );
}
