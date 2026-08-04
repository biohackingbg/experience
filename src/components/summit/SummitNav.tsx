import Link from "next/link";

const links = [
  { href: "#concept", label: "Концепция" },
  { href: "#passport", label: "Паспорт" },
  { href: "#program", label: "Програма" },
  { href: "#tickets", label: "Билети" },
];

export function SummitNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bh-ink/85 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link
          href="#top"
          aria-label="Biohacking Experience — начало"
          className="flex items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Biohacking Experience"
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-bh-lime"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#tickets"
          className="inline-flex items-center gap-2 rounded-full bg-bh-lime px-5 py-2.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
        >
          Купи билет
        </a>
      </nav>
    </header>
  );
}
