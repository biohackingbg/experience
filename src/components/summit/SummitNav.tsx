import Link from "next/link";

const links = [
  { href: "#concept", label: "Концепция" },
  { href: "#passport", label: "Паспорт" },
  { href: "#program", label: "Програма" },
  { href: "#tickets", label: "Билети" },
];

export function SummitNav() {
  return (
    <header className="px-5 pt-5 sm:px-8 lg:px-10">
      <nav className="flex items-center justify-between">
        <Link
          href="#top"
          aria-label="Biohacking Experience — начало"
          className="flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="h-9 w-9" />
          <span className="text-sm font-bold uppercase leading-none tracking-tight text-bh-ink">
            Biohacking
            <span className="block text-[0.6rem] font-medium tracking-[0.3em] text-bh-ink/45">
              EXPERIENCE
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-bh-ink/70 transition-colors hover:text-bh-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#tickets"
          className="inline-flex items-center rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
        >
          Купи билет
        </a>
      </nav>
    </header>
  );
}
