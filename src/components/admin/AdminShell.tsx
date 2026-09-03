import Link from "next/link";

import { logout } from "@/app/admin/actions";

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
  out: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 7l3 3-3 3M15 10H8"/></svg>,
};

const MENU = [
  { href: "/admin", label: "Табло", icon: I.grid },
  { href: "/admin/finansi", label: "Финанси", icon: I.wallet },
  { href: "/admin/poseshteniya", label: "Посещения", icon: I.chart },
  { href: "/admin/podgotovka", label: "Подготовка", icon: I.check },
  { href: "/admin/prezentaciya", label: "Презентация", icon: I.deck },
  { href: "/admin/fakturi", label: "Фактури", icon: I.file },
  { href: "/admin/zapisvaniya", label: "Записвания", icon: I.list },
  { href: "/admin/vhod", label: "Вход на събитието", icon: I.door },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#e9ebe8] p-3 text-[#0b2a22] sm:p-5"
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
          <Link href="/admin" className="flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#146455] text-[#cef870]">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="M4 11l4 4 8-9"/></svg>
            </span>
            <span className="text-lg font-black tracking-tight">Sofia Life Summit</span>
          </Link>

          <p className="mt-8 px-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b2a22]/45">Меню</p>
          <nav className="mt-2 flex flex-col gap-0.5">
            {MENU.map((m) => (
              <NavLink key={m.href} {...m} />
            ))}
          </nav>

          <p className="mt-8 px-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b2a22]/45">Общи</p>
          <nav className="mt-2 flex flex-col gap-0.5">
            <NavLink href="/admin/dostap" label="Достъп" icon={I.key} />
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
            <form action="/admin" method="get" className="flex min-w-[16rem] flex-1 items-center gap-3 rounded-full bg-white px-4 py-2.5 ring-1 ring-[#0b2a22]/8 sm:max-w-md">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#0b2a22]/50"><circle cx="9" cy="9" r="5.5"/><path d="M13.5 13.5 17 17" strokeLinecap="round"/></svg>
              <input
                type="search"
                name="q"
                placeholder="Търси поръчка: номер, имейл или име"
                className="w-full bg-transparent text-sm text-[#0b2a22] outline-none placeholder:text-[#0b2a22]/40"
              />
            </form>
            <div className="flex items-center gap-3 lg:hidden">
              {MENU.slice(0, 4).map((m) => (
                <Link key={m.href} href={m.href} className="text-xs font-semibold text-[#0b2a22]/70">{m.label}</Link>
              ))}
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#146455] text-sm font-bold text-[#cef870]">SL</span>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Екипът</div>
                <div className="text-xs text-[#0b2a22]/55">hi@biohacking.bg</div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 rounded-[1.5rem] bg-[#f6f7f5]">{children}</main>
        </div>
      </div>
    </div>
  );
}
