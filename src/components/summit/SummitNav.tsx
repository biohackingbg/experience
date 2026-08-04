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
          className="font-display text-sm font-extrabold uppercase leading-none tracking-tight text-white"
        >
          Biohacking
          <span className="text-bh-lime">.</span>
          <span className="block text-[0.62rem] font-medium tracking-[0.35em] text-white/50">
            EXPERIENCE
          </span>
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
