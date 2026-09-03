import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";

import { getAbandonedOrders } from "@/lib/abandoned";
import { getDashboardData, searchOrders } from "@/lib/admin-stats";
import { getTrafficData } from "@/lib/site-views";
import { getFinances } from "@/lib/finances";
import { getEarlyAccessState } from "@/lib/settings";
import { ResendForm } from "./fakturi/ResendForm";
import { formatPrice } from "@/lib/tickets";
import { logout } from "../actions";
import { DailyChart } from "./DailyChart";
import { PriceSwitch } from "./PriceSwitch";
import { ReminderForm } from "./ReminderForm";
import { TierBars } from "./TierBars";

export const metadata: Metadata = {
  title: "Продажби | Администрация",
  robots: { index: false, follow: false },
};

// Always read live numbers - a cached dashboard is a misleading dashboard.
export const dynamic = "force-dynamic";

function Money({ cents }: { cents: number }) {
  return <>{formatPrice(cents)} €</>;
}

/** "03.09 · 23:04", Sofia time. A sale is dated by its payment, not its start. */
function when(o: { paidAt: Date | null; createdAt: Date }): string {
  const t = o.paidAt ?? o.createdAt;
  const opts = { timeZone: "Europe/Sofia" } as const;
  return `${t.toLocaleDateString("bg-BG", { ...opts, day: "2-digit", month: "2-digit" })} · ${t.toLocaleTimeString("bg-BG", { ...opts, hour: "2-digit", minute: "2-digit" })}`;
}

function CompanyChip({ company }: { company: string | null }) {
  if (!company) return null;
  return (
    <span className="ml-2 rounded-full bg-[#d0a11a]/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-[#7a5c05]" title={company}>
      фирма
    </span>
  );
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">
        {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-bh-ink/55">{sub}</div>}
    </div>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  if (!(await isAdmin())) redirect("/admin/login");

  const { q = "" } = await searchParams;
  const [d, traffic, found, fin, early, abandoned] = await Promise.all([
    getDashboardData(),
    getTrafficData(30),
    searchOrders(q),
    getFinances(),
    getEarlyAccessState(),
    getAbandonedOrders(),
  ]);
  const soldPct = d.capacityTotal
    ? Math.round((d.ticketsSold / d.capacityTotal) * 100)
    : 0;

  // The one sentence the morning glance is for: are we on pace to fill the
  // room, at the pace we are actually selling at?
  const daysLeft = d.daysToEvent;
  const seatsLeft = Math.max(0, d.capacityTotal - d.ticketsSold);
  const neededPerDay = seatsLeft / daysLeft;
  const pacePerDay = d.soldLast7Days / 7;
  const onPace = pacePerDay >= neededPerDay;
  const fmt1 = (n: number) => n.toLocaleString("bg-BG", { maximumFractionDigits: 1 });

  const opened = traffic.funnel[1]?.value ?? 0;
  const bought = traffic.funnel[3]?.value ?? 0;
  const buyRate = opened ? Math.round((bought / opened) * 100) : null;

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bh-ink/15 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Администрация
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-bh-ink">
              Продажби
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              ["/admin/finansi", "Финанси"],
              ["/admin/poseshteniya", "Посещения"],
              ["/admin/dostap", "Достъп"],
              ["/admin/fakturi", "Фактури"],
              ["/admin/zapisvaniya", "Записвания"],
              ["/admin/prezentaciya", "Презентация"],
              ["/admin/vhod", "Вход на събитието"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-bh-ink/20 px-5 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
              >
                {label}
              </Link>
            ))}
            <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-bh-ink/20 px-5 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              Изход
              </button>
            </form>
          </div>
        </header>

        {/* Pace, before any figure: the figures below explain it, this one
            decides the day. Colour follows the verdict, not the number. */}
        <div
          className={`mt-8 rounded-2xl px-6 py-5 ring-1 ${
            onPace ? "bg-[#0E8C7D]/10 ring-[#0E8C7D]/25" : "bg-[#d0a11a]/12 ring-[#d0a11a]/30"
          }`}
        >
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/55">Темпо</p>
          <p className="mt-2 text-lg font-bold leading-snug tracking-tight text-bh-ink">
            {daysLeft} дни до събитието · продадени {d.ticketsSold} от {d.capacityTotal} ·{" "}
            {seatsLeft === 0
              ? "залата е пълна"
              : `нужни ${fmt1(neededPerDay)} на ден, продаваме ${fmt1(pacePerDay)}`}
          </p>
          <p className="mt-1 text-xs text-bh-ink/55">
            {seatsLeft === 0
              ? "Няма свободни места."
              : onPace
                ? "Темпото стига, ако се задържи. Смятано по последните 7 дни."
                : `С това темпо до ноември ще се продадат още около ${Math.round(pacePerDay * daysLeft)} - остават ${seatsLeft} места. Смятано по последните 7 дни.`}
          </p>
        </div>

        <PriceSwitch open={early.open} changedAt={early.changedAt} sold={d.ticketsSold} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Tile
            label="Приходи"
            value={<Money cents={d.grossCents} />}
            sub={`нето ${formatPrice(d.netCents)} € · ДДС ${formatPrice(d.vatCents)} €`}
          />
          <Tile
            label="Продадени билета"
            value={d.ticketsSold}
            sub={`${soldPct}% от ${d.capacityTotal} места · днес ${d.soldToday} · вчера ${d.soldYesterday}`}
          />
          <Tile
            label="Поръчки"
            value={d.paidOrders}
            sub={
              [
                d.pendingOrders ? `${d.pendingOrders} в процес` : null,
                d.refundedOrders ? `${d.refundedOrders} върнати` : null,
                d.abandonedOrders ? `${d.abandonedOrders} изоставени` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "няма незавършени"
            }
          />
          <Tile
            label="Финанси"
            value={<span className={fin.result.actualCents < 0 ? "text-[#9c3d5c]" : ""}>{fin.result.actualCents >= 0 ? "+" : ""}{formatPrice(fin.result.actualCents)} €</span>}
            sub={`прогноза ${fin.result.forecastCents >= 0 ? "+" : ""}${formatPrice(fin.result.forecastCents)} € · нето, без ДДС`}
          />
          <Tile
            label="Отворили билетите → купили"
            value={buyRate === null ? "-" : `${buyRate}%`}
            sub={
              opened
                ? `${opened} отворили страницата с билетите · ${bought} платили · 30 дни`
                : "още няма посещения на страницата с билетите"
            }
          />
        </div>

        {/* The email that always comes: "платих, нямам билет". One box, and
            the order, its tickets and the resend button are on this screen. */}
        <section className="mt-10 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
          <h2 className="text-sm font-bold tracking-tight text-bh-ink">Намери поръчка</h2>
          <form action="/admin" method="get" className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="номер (SLS-…), имейл или име"
              className="w-72 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
            />
            <button
              type="submit"
              className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
            >
              Търси
            </button>
            {q && (
              <Link href="/admin" className="text-xs text-bh-ink/55 underline underline-offset-2">
                изчисти
              </Link>
            )}
          </form>

          {q.trim().length >= 2 && (
            found.length === 0 ? (
              <p className="mt-4 text-sm text-bh-ink/55">Нищо за „{q}“. Провери номера или пробвай само фамилията.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {found.map((o) => (
                  <li key={o.reference} className="rounded-xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-bh-ink/70">{o.reference}</span>
                        <span className="ml-3 font-medium text-bh-ink">{o.name}</span>
                        <CompanyChip company={o.company} />
                        <span className="ml-2 text-xs text-bh-ink/55">{o.email}{o.phone ? ` · ${o.phone}` : ""}</span>
                        <div className="mt-0.5 text-xs text-bh-ink/55">{when(o)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-bh-ink/60">{o.items} · <Money cents={o.totalCents} /></span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                            o.status === "paid"
                              ? "bg-[#0E8C7D]/15 text-[#0b6d61]"
                              : o.status === "refunded"
                                ? "bg-[#C4607F]/15 text-[#9c3d5c]"
                                : "bg-bh-ink/10 text-bh-ink/60"
                          }`}
                        >
                          {o.status === "paid" ? "платена" : o.status === "pending" ? "незавършена" : o.status === "refunded" ? "върната" : o.status}
                        </span>
                        {o.status === "paid" && <ResendForm reference={o.reference} />}
                      </div>
                    </div>
                    {o.tickets.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {o.tickets.map((t) => (
                          <li key={t.code} className="rounded-lg bg-bh-cloud px-2.5 py-1 font-mono text-[0.68rem] text-bh-ink/75">
                            {t.code} · {t.tierName}{t.checkedIn ? " · влязъл" : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )
          )}
        </section>

        {/* Money that got as far as the checkout and stopped. One nudge each,
            by hand, a day later - never automatic, never twice. */}
        <section className="mt-6 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold tracking-tight text-bh-ink">Недовършени поръчки</h2>
            <p className="text-xs text-bh-ink/55">
              последните 14 дни · без хората, които после са купили · едно напомняне на поръчка, най-рано след денонощие
            </p>
          </div>
          {abandoned.length === 0 ? (
            <p className="mt-4 text-sm text-bh-ink/55">Няма недовършени поръчки.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {abandoned.map((o) => (
                <li key={o.reference} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bh-paper px-4 py-3 ring-1 ring-bh-ink/8">
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-bh-ink/70">{o.reference}</span>
                    <span className="ml-3 font-medium text-bh-ink">{o.name}</span>
                    <span className="ml-2 text-xs text-bh-ink/55">{o.email}</span>
                    <div className="mt-0.5 text-xs text-bh-ink/60">
                      {o.items} · <Money cents={o.totalCents} /> · {o.ago}
                    </div>
                  </div>
                  <ReminderForm
                    reference={o.reference}
                    canRemind={o.canRemind}
                    note={o.remindedAgo ? `напомнено ${o.remindedAgo}` : "може от утре"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <TierBars tiers={d.perTier} />
        <DailyChart data={d.daily} />

        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">
            Последни поръчки
          </h2>

          {d.recent.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-bh-cloud p-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
              Още няма поръчки. Тук ще се появят веднага щом продажбите тръгнат.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                    <th className="px-5 py-3 font-medium">Номер</th>
                    <th className="px-5 py-3 font-medium">Кога</th>
                    <th className="px-5 py-3 font-medium">Купувач</th>
                    <th className="px-5 py-3 font-medium">Билети</th>
                    <th className="px-5 py-3 font-medium">Статус</th>
                    <th className="px-5 py-3 text-right font-medium">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent.map((o) => (
                    <tr
                      key={o.reference}
                      className="border-b border-bh-ink/8 last:border-0"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-bh-ink/70">
                        {o.reference}
                        {o.status === "paid" && (
                          <Link href={`/faktura/${o.reference}`} className="ml-2 font-sans text-[0.65rem] text-bh-ink/50 underline underline-offset-2 hover:text-bh-ink">
                            фактура
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-bh-ink/70">{when(o)}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-bh-ink">
                          {o.name}
                          <CompanyChip company={o.company} />
                        </div>
                        <div className="text-xs text-bh-ink/55">{o.email}{o.phone ? ` · ${o.phone}` : ""}</div>
                      </td>
                      <td className="px-5 py-3 text-bh-ink/75">{o.items}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                            o.status === "paid"
                              ? "bg-[#0E8C7D]/15 text-[#0b6d61]"
                              : o.status === "refunded"
                                ? "bg-[#C4607F]/15 text-[#9c3d5c]"
                                : "bg-bh-ink/10 text-bh-ink/60"
                          }`}
                        >
                          {o.status === "paid"
                            ? "платена"
                            : o.status === "pending"
                              ? "незавършена"
                              : o.status === "refunded"
                                ? "върната"
                                : o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-bh-ink">
                        <Money cents={o.totalCents} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
