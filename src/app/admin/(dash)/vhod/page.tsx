import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getDoorStats, searchTickets } from "@/lib/tickets-lookup";

import { admitTicket } from "./actions";
import { Scanner } from "./Scanner";

export const metadata: Metadata = {
  title: "Вход | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const time = (d: Date) =>
  d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });

/**
 * The door. Three ways in, in the order they get used: the phone camera on
 * the QR, a handheld scanner or a typed code, and a name lookup for the
 * person whose phone died. Every device at the door sees the same counters
 * and the same recent list, so two entrances do not need to shout.
 */
export default async function DoorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  if (!(await isAdmin())) redirect("/admin/login");

  const { q = "" } = await searchParams;
  const [stats, hits] = await Promise.all([getDoorStats(), searchTickets(q)]);

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Проверка
            </p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-bh-ink">
              Вход
            </h1>
          </div>
          <Link
            href="/admin"
            className="font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/50 transition-colors hover:text-bh-ink"
          >
            Продажби →
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            [stats.today, "влезли днес"],
            [stats.checkedIn, "влезли общо"],
            [stats.total - stats.checkedIn, "очаквани"],
          ].map(([n, label]) => (
            <div key={label} className="rounded-2xl bg-bh-cloud px-4 py-4 ring-1 ring-bh-ink/8">
              <div className="text-2xl font-black tracking-tight text-bh-ink">{n}</div>
              <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/50">
                {label}
              </div>
            </div>
          ))}
        </div>

        <Scanner />

        {/* For the phone that died in the queue: find the person, let them in. */}
        <section className="mt-10">
          <h2 className="text-sm font-bold tracking-tight text-bh-ink">Търси по име</h2>
          <form action="/admin/vhod" method="get" className="mt-3 flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="име, имейл или номер на поръчка"
              className="w-full rounded-full border border-bh-ink/15 bg-bh-cloud px-4 py-2.5 text-sm text-bh-ink placeholder:text-bh-ink/35"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-bh-ink px-4 py-2.5 text-sm font-semibold text-bh-paper"
            >
              Търси
            </button>
          </form>
          {q.trim().length >= 2 &&
            (hits.length === 0 ? (
              <p className="mt-3 text-sm text-bh-ink/55">Няма платен билет за „{q}“.</p>
            ) : (
              <ul className="mt-3 divide-y divide-bh-ink/8 rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
                {hits.map((t) => (
                  <li key={t.code} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium text-bh-ink">{t.attendeeName ?? t.buyerName}</div>
                      <div className="truncate text-xs text-bh-ink/55">
                        {t.tierName} · {t.code} · {t.reference}
                        {t.attendeeName ? ` · купил ${t.buyerName}` : ""}
                      </div>
                    </div>
                    {t.checkedInAt ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-900">
                        влязъл {time(t.checkedInAt)}
                      </span>
                    ) : (
                      <form action={admitTicket}>
                        <input type="hidden" name="code" value={t.code} />
                        <input type="hidden" name="q" value={q} />
                        <button
                          type="submit"
                          className="shrink-0 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                        >
                          Пусни
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </section>

        {stats.recent.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold tracking-tight text-bh-ink">Последни на входа</h2>
            <p className="mt-1 text-xs text-bh-ink/55">от всички устройства на входа</p>
            <ul className="mt-3 divide-y divide-bh-ink/8 rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
              {stats.recent.map((r) => (
                <li key={r.code} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-bh-ink">
                    {r.name}
                    <span className="ml-2 text-xs text-bh-ink/55">{r.tierName}</span>
                  </span>
                  <span className="font-mono text-xs text-bh-ink/60">{time(r.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
