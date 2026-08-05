const nav = [
  { href: "#concept", label: "Концепция" },
  { href: "#passport", label: "Паспорт" },
  { href: "#program", label: "Програма" },
  { href: "#tickets", label: "Билети" },
];

export function SummitFooter() {
  return (
    <footer className="px-5 pb-10 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-10 border-t border-bh-ink/15 pt-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Biohacking Experience"
              className="bh-logo-light-bg h-9 w-auto"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.svg"
              alt=""
              aria-hidden
              className="bh-logo-dark-bg h-9 w-auto"
            />
            <p className="mt-5 text-sm leading-relaxed text-bh-ink/55">
              Потребителската част на Sofia Life Summit. Куратор и продуцент —
              Biohacking.bg, в партньорство с Bulgarian Longevity Association.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/40">
                Навигация
              </p>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {nav.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-bh-ink/70 transition-colors hover:text-bh-ink"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/40">
                Контакт
              </p>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                <li>
                  <a
                    href="mailto:hello@biohacking.bg"
                    className="text-bh-ink/70 transition-colors hover:text-bh-ink"
                  >
                    hello@biohacking.bg
                  </a>
                </li>
                <li className="text-bh-ink/70">Гранд Хотел Милениум, София</li>
                <li className="text-bh-ink/70">07—08 ноември 2026</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-bh-ink/10 pt-6 font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/35 sm:flex-row sm:justify-between">
          <span>© 2026 Biohacking.bg</span>
          <span>Sofia Life Summit · Longevity for everyone</span>
        </div>
      </div>
    </footer>
  );
}
