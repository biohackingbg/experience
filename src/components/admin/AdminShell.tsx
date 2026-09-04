import Link from "next/link";

import { logout } from "@/app/admin/actions";
import type { Access } from "@/lib/access";

import { NavLink } from "./NavLink";

/**
 * The frame every admin page sits in: a sidebar with the whole menu, a top
 * bar with the order search, and a light ground with white cards.
 *
 * The light palette is pinned here on purpose. The public site flips its
 * tokens in dark mode; a dashboard read at a venue on whatever phone is to
 * hand should look the same on all of them.
 */

const I = {
  plane: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l-6 6-7-2-1.5 1.5L8 11l-2 3H3.5L5 16.5V18l2.5-1.5L9 14l2.5 5.5L13 18l-2-7 6-6z"/></svg>,
  rota: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8.5h14M7 2.5v3M13 2.5v3M6.5 12h3M6.5 14.5h5"/></svg>,
  grid: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/></svg>,
  wallet: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="14" height="11" rx="2"/><path d="M3 9h14M13 12.5h1.5"/></svg>,
  chart: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 16V9M10 16V4M16 16v-5"/></svg>,
  check: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M6.5 10.5l2.5 2.5 4.5-5"/></svg>,
  deck: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="14" height="9" rx="2"/><path d="M10 13v3M7 16h6"/></svg>,
  file: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M5 3h7l3 3v11H5z"/><path d="M12 3v3h3M8 10h4M8 13h4"/></svg>,
  list: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M7 5h9M7 10h9M7 15h9"/><circle cx="4" cy="5" r=".8" fill="currentColor"/><circle cx="4" cy="10" r=".8" fill="currentColor"/><circle cx="4" cy="15" r=".8" fill="currentColor"/></svg>,
  door: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17V4a1 1 0 0 1 1-1h7v14M12 17h4M12 6l4-2v13"/><circle cx="9.5" cy="10" r=".8" fill="currentColor"/></svg>,
  key: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="7" cy="10" r="3.5"/><path d="M10.5 10H17M15 10v2.5"/></svg>,
  globe: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c2.5 2.5 2.5 11.5 0 14M10 3c-2.5 2.5-2.5 11.5 0 14"/></svg>,
  mega: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"><path d="M3 9v2a1 1 0 0 0 1 1h2l6 3V4L6 7H4a1 1 0 0 0-1 1v1zM15 8a3 3 0 0 1 0 4M7 12v3.5a1 1 0 0 0 1 1h1"/></svg>,
  tag: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 10V4h6l8 8-6 6z"/><circle cx="6.5" cy="7.5" r="1" fill="currentColor"/></svg>,
  clock: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></svg>,
  person: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10" cy="7" r="3.5"/><path d="M4 17c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5"/></svg>,
  ticket: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 7a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M8 5v10" strokeDasharray="2 2"/></svg>,
  hands: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-1l-1.5-1.5a1.5 1.5 0 0 1 2-2L7 11"/></svg>,
  mail: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="5" width="14" height="11" rx="2"/><path d="m3 7 7 5 7-5"/></svg>,
  out: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 7l3 3-3 3M15 10H8"/></svg>,
};

const MENU = [
  { page: "tablo" as const, href: "/admin", label: "Табло", icon: I.grid },
  { page: "finansi" as const, href: "/admin/finansi", label: "Финанси", icon: I.wallet },
  { page: "poseshteniya" as const, href: "/admin/poseshteniya", label: "Посещения", icon: I.chart },
  { page: "podgotovka" as const, href: "/admin/podgotovka", label: "Подготовка", icon: I.check },
  { page: "prezentaciya" as const, href: "/admin/prezentaciya", label: "Презентация", icon: I.deck },
  { page: "fakturi" as const, href: "/admin/fakturi", label: "Фактури", icon: I.file },
  { page: "zapisvaniya" as const, href: "/admin/zapisvaniya", label: "Записвания", icon: I.list },
  { page: "pisma" as const, href: "/admin/pisma", label: "Писма", icon: I.mail },
  { page: "reklama" as const, href: "/admin/reklama", label: "Реклама", icon: I.mega },
  { page: "promo" as const, href: "/admin/promo", label: "Промо кодове", icon: I.tag },
  { page: "programa" as const, href: "/admin/programa", label: "Програма", icon: I.clock },
  { page: "lektori" as const, href: "/admin/lektori", label: "Лектори", icon: I.person },
  { page: "vhod" as const, href: "/admin/vhod", label: "Вход на събитието", icon: I.door },
  { page: "izdai" as const, href: "/admin/izdai", label: "Издаване на билети", icon: I.ticket },
  { page: "rabotilnici" as const, href: "/admin/rabotilnici", label: "Работилници", icon: I.hands },
  { page: "logistika" as const, href: "/admin/logistika", label: "Логистика на лекторите", icon: I.plane },
  { page: "smeni" as const, href: "/admin/smeni", label: "Смени", icon: I.rota },
];

export function AdminShell({ access, children }: { access: Access; children: React.ReactNode }) {
  const admin = access.kind === "admin";
  const menu = MENU.filter((m) => admin || access.scopes.includes(m.page));
  return (
    <div
      className="bh-admin min-h-screen bg-[#e9ebe8] p-3 text-[#0b2a22] sm:p-5"
      style={
        {
          "--color-bh-paper": "#f2f3f1",
          "--color-bh-cloud": "#ffffff",
          "--color-bh-ink": "#0b2a22",
          "--color-bh-pine": "#146455",
          "--color-bh-lime": "#cef870",
          "--color-bh-stone": "#dfe3de",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[110rem] gap-4 rounded-[2rem] bg-white p-3 shadow-[0_20px_60px_-30px_rgba(2,37,31,.35)] sm:p-4">
        <aside className="hidden w-64 shrink-0 flex-col rounded-[1.5rem] bg-[#f6f7f5] px-4 py-6 lg:flex">
          <Link href="/admin" className="block px-2" aria-label="Biohacking Experience - табло">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Biohacking Experience" className="h-9 w-auto max-w-full" />
            <span className="mt-2 block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b2a22]/45">Sofia Life Summit · админ</span>
          </Link>

          <p className="mt-8 px-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b2a22]/45">Меню</p>
          <nav className="mt-2 flex flex-col gap-0.5">
            {menu.map((m) => (
              <NavLink key={m.href} href={m.href} label={m.label} icon={m.icon} />
            ))}
          </nav>

          <p className="mt-8 px-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b2a22]/45">Общи</p>
          <nav className="mt-2 flex flex-col gap-0.5">
            {admin && <NavLink href="/admin/dostap" label="Достъп" icon={I.key} />}
            <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] text-[#0b2a22]/60 transition-colors hover:bg-[#0b2a22]/5 hover:text-[#0b2a22]">
              <span className="h-5 w-5">{I.globe}</span>Сайтът
            </Link>
            <form action={logout}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.95rem] text-[#0b2a22]/60 transition-colors hover:bg-[#0b2a22]/5 hover:text-[#0b2a22]">
                <span className="h-5 w-5">{I.out}</span>Изход
              </button>
            </form>
          </nav>

          <div className="mt-auto rounded-2xl bg-[#0b2a22] p-5 text-white">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/50">Събитието</p>
            <p className="mt-2 text-base font-bold leading-snug">07-08 ноември 2026</p>
            <p className="mt-1 text-xs text-white/60">Гранд Хотел Милениум, София</p>
            <Link href="/admin/vhod" className="mt-4 inline-flex rounded-full bg-[#146455] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1a7a67]">
              Вход на събитието
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-[#f6f7f5] px-4 py-3">
            {(admin || access.scopes.includes("tablo")) ? (
            <form action="/admin" method="get" className="flex min-w-[16rem] flex-1 items-center gap-3 rounded-full bg-white px-4 py-2.5 ring-1 ring-[#0b2a22]/8 sm:max-w-md">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#0b2a22]/50"><circle cx="9" cy="9" r="5.5"/><path d="M13.5 13.5 17 17" strokeLinecap="round"/></svg>
              <input
                type="search"
                name="q"
                placeholder="Търси поръчка: номер, имейл или име"
                className="w-full bg-transparent text-sm text-[#0b2a22] outline-none placeholder:text-[#0b2a22]/40"
              />
            </form>
            ) : (
              <div className="flex-1 text-sm text-[#0b2a22]/60">Sofia Life Summit · админ</div>
            )}
            <div className="flex items-center gap-3 lg:hidden">
              {menu.slice(0, 4).map((m) => (
                <Link key={m.href} href={m.href} className="text-xs font-semibold text-[#0b2a22]/70">{m.label}</Link>
              ))}
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              {admin ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/team-avatar.jpg" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover ring-2 ring-[#146455]/30" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#146455] text-sm font-bold text-[#cef870]">
                  {access.label.trim().slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="leading-tight">
                <div className="text-sm font-semibold">{access.label}</div>
                <div className="text-xs text-[#0b2a22]/55">{admin ? "hi@biohacking.bg" : `достъп до ${menu.length} ${menu.length === 1 ? "страница" : "страници"}`}</div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 rounded-[1.5rem] bg-[#f6f7f5]">{children}</main>
        </div>
      </div>
    </div>
  );
}
