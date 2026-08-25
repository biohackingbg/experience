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
              Sofia Life Summit се организира съвместно от Bulgarian Longevity
              Association и Biohacking.bg.
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
                <li className="text-bh-ink/70">07-08 ноември 2026</li>
                <li>
                  {/* Where the weekly speaker reveals actually live - the
                      site had no way of sending anyone there until now.
                      The QR tracking parameter is stripped: it belongs on a
                      printed code, not in a link on our own page. */}
                  <a
                    href="https://www.instagram.com/longevitysummit.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-bh-ink/70 transition-colors hover:text-bh-ink"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden
                    >
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                    </svg>
                    @longevitysummit.eu
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/company/biohacking-bg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-bh-ink/70 transition-colors hover:text-bh-ink"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden
                    >
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M7.4 10.2v7M7.4 7.1v.1" strokeLinecap="round" />
                      <path d="M11.4 17.2v-7M11.4 13.1c0-1.7 1.1-2.9 2.7-2.9s2.5 1.1 2.5 2.9v4.1" strokeLinecap="round" />
                    </svg>
                    Biohacking.bg
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-bh-ink/10 pt-6 font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/35 sm:flex-row sm:justify-between">
          <span>© 2026 Biohacking.bg</span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="/usloviya" className="transition-colors hover:text-bh-ink">
              Общи условия
            </a>
            <a href="/poveritelnost" className="transition-colors hover:text-bh-ink">
              Поверителност
            </a>
          </span>
          <span>Sofia Life Summit · Longevity for everyone</span>
        </div>
      </div>
    </footer>
  );
}
