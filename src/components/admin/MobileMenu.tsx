"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NavLink } from "./NavLink";

/**
 * The whole sidebar, folded into a sheet for narrow screens.
 *
 * Below `lg` the sidebar in AdminShell is hidden outright, so this is the
 * only way to reach anything past the handful of links that used to sit in
 * the header - which on a phone meant most of the admin was unreachable.
 *
 * AdminShell's layout stays mounted across /admin/* navigation (Next keeps
 * a shared layout across route changes), so nothing else would close this
 * sheet after a tap - the pathname effect below does it explicitly.
 */
export function MobileMenu({
  groups,
  admin,
  label,
  subtitle,
  logoutAction,
  keyIcon,
  globeIcon,
  outIcon,
}: {
  groups: { title: string; items: { href: string; label: string; icon: React.ReactNode }[] }[];
  admin: boolean;
  label: string;
  subtitle: string;
  logoutAction: () => Promise<void>;
  keyIcon: React.ReactNode;
  globeIcon: React.ReactNode;
  outIcon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // AdminShell's layout stays mounted across /admin/* navigation, so a tap
  // that follows a link would otherwise leave the sheet open over the next
  // page - closed here during render (React's own pattern for resetting
  // state on a prop change) rather than in an effect after the fact.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Отвори менюто"
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0b2a22] ring-1 ring-[#0b2a22]/10 lg:hidden"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-5 w-5">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Затвори менюто"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#0b2a22]/40"
          />
          <nav className="absolute inset-y-0 left-0 flex w-[82vw] max-w-xs flex-col overflow-y-auto bg-[#f6f7f5] px-4 py-6 shadow-2xl">
            <div className="flex items-center justify-between px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Biohacking Experience" className="h-8 w-auto max-w-full" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Затвори менюто"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0b2a22]/60 hover:bg-[#0b2a22]/5"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
                  <path d="M5 5l10 10M15 5l-10 10" />
                </svg>
              </button>
            </div>

            <p className="mt-4 px-2 text-sm font-semibold text-[#0b2a22]">{label}</p>
            <p className="px-2 text-xs text-[#0b2a22]/55">{subtitle}</p>

            {groups.map((g) => (
              <div key={g.title} className="mt-6">
                <p className="px-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b2a22]/45">{g.title}</p>
                <div className="mt-2 flex flex-col gap-0.5">
                  {g.items.map((m) => (
                    <NavLink key={m.href} href={m.href} label={m.label} icon={m.icon} />
                  ))}
                </div>
              </div>
            ))}

            <p className="mt-6 px-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b2a22]/45">Общи</p>
            <div className="mt-2 flex flex-col gap-0.5">
              {admin && (
                <Link
                  href="/admin/dostap"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] text-[#0b2a22]/70 transition-colors hover:bg-[#0b2a22]/5 hover:text-[#0b2a22]"
                >
                  <span className="h-5 w-5 shrink-0">{keyIcon}</span>Достъп
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] text-[#0b2a22]/70 transition-colors hover:bg-[#0b2a22]/5 hover:text-[#0b2a22]"
              >
                <span className="h-5 w-5 shrink-0">{globeIcon}</span>Сайтът
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.95rem] text-[#0b2a22]/70 transition-colors hover:bg-[#0b2a22]/5 hover:text-[#0b2a22]"
                >
                  <span className="h-5 w-5 shrink-0">{outIcon}</span>Изход
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
