import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const links = [
  { href: "#concept", label: "Концепция" },
  { href: "#passport", label: "Паспорт" },
  { href: "#program", label: "Програма" },
  { href: "#tickets", label: "Билети" },
];

export function SummitNav() {
  return (
    <header className="px-5 pt-5 sm:px-8 lg:px-10">
      <nav className="flex items-center justify-between border-b border-bh-ink/15 pb-5">
        <Link
          href="#top"
          aria-label="Biohacking Experience — начало"
          className="flex items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Biohacking Experience"
            className="bh-logo-light-bg h-7 w-auto sm:h-8"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-dark.svg"
            alt=""
            aria-hidden
            className="bh-logo-dark-bg h-7 w-auto sm:h-8"
          />
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

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <a
            href="#tickets"
            className="inline-flex items-center rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
          >
            Купи билет
          </a>
        </div>
      </nav>
    </header>
  );
}
