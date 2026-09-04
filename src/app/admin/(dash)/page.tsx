import type { Metadata } from "next";
import Link from "next/link";

import { getAbandonedOrders, getPendingOrders } from "@/lib/abandoned";
import { requireAccess } from "@/lib/access";
import { getDashboardData, searchOrders } from "@/lib/admin-stats";
import { getFinances } from "@/lib/finances";
import { getPricing } from "@/lib/pricing";
import { getTrafficData } from "@/lib/site-views";
import { formatPrice } from "@/lib/tickets";

import { setTestOrder } from "./actions";
import { DailyChart } from "./DailyChart";
import { ResendForm } from "./fakturi/ResendForm";
import { PriceStages } from "./PriceStages";
import { ReminderForm } from "./ReminderForm";
import { TierBars } from "./TierBars";

export const metadata: Metadata = {
  title: "Табло | Администрация",
  robots: { index: false, follow: false },
};

// Always read live numbers - a cached dashboard is a misleading dashboard.
export const dynamic = "force-dynamic";

const GREEN = "#146455";
const HATCH =
  "repeating-linear-gradient(135deg, #c9cfca 0 2px, transparent 2px 7px)";

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

function StatusChip({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-[#0E8C7D]/12 text-[#0b6d61]"
      : status === "refunded"
        ? "bg-[#C4607F]/12 text-[#9c3d5c]"
        : "bg-[#0b2a22]/8 text-[#0b2a22]/60";
  const label = status === "paid" ? "платена" : status === "pending" ? "незавършена" : status === "refunded" ? "върната" : status;
  return <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${tone}`}>{label}</span>;
}

/** One click hides a test purchase from every figure; the invoice stays. The same button brings it back. */
function TestToggle({ reference, isTest }: { reference: string; isTest: boolean }) {
  return (
    <form action={setTestOrder}>
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="to" value={isTest ? "0" : "1"} />
      <button
        type="submit"
        title={isTest ? "Върни в статистиката" : "Скрий от статистиката като тестова поръчка"}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          isTest ? "bg-[#d0a11a]/20 text-[#7a5c05] hover:bg-[#d0a11a]/35" : "border border-[#0b2a22]/20 text-[#0b2a22]/70 hover:border-[#0b2a22] hover:text-[#0b2a22]"
        }`}
      >
        {isTest ? "тестова · покажи" : "тестова"}
      </button>
    </form>
  );
}

/** The arrow-in-a-ring every stat tile carries, pointing at its detail. */
function Arrow({ href, dark }: { href: string; dark?: boolean }) {
  return (
    <Link
      href={href}
      aria-label="Подробно"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
        dark ? "ring-white/40 text-white hover:bg-white/10" : "ring-[#0b2a22]/25 text-[#0b2a22] hover:bg-[#0b2a22]/5"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M6 14 14 6M8 6h6v6" />
      </svg>
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  href,
  dark,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  href: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-6 ${
        dark
          ? "bg-[radial-gradient(120%_120%_at_0%_100%,#1f8a6c_0%,#146455_45%,#0b3f31_100%)] text-white shadow-[0_18px_40px_-24px_rgba(20,100,85,.8)]"
          : "bg-white text-[#0b2a22] ring-1 ring-[#0b2a22]/6"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-lg font-semibold leading-snug">{label}</div>
        <Arrow href={href} dark={dark} />
      </div>
      <div className="mt-4 text-5xl font-black tracking-tight">{value}</div>
      <div className={`mt-4 text-xs ${dark ? "text-[#cef870]" : "text-[#0b2a22]/60"}`}>{sub}</div>
    </div>
  );
}

/** Seven pills, one per day; an empty day is a hatched ghost, the busiest is labelled. */
function WeekStrip({ week }: { week: { day: string; label: string; orders: number; grossCents: number; today: boolean }[] }) {
  const max = week.reduce((m, d) => Math.max(m, d.orders), 0);
  return (
    <div className="mt-6 flex h-44 items-end gap-3 sm:gap-5">
      {week.map((d) => {
        const h = max ? Math.max((d.orders / max) * 100, 8) : 8;
        const peak = max > 0 && d.orders === max;
        return (
          <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
            {peak && (
              <span className="mb-2 rounded-md bg-[#0b2a22] px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                {d.orders}
              </span>
            )}
            <div
              className="w-full max-w-[3.25rem] rounded-full"
              style={{
                height: `${d.orders > 0 ? h : 100}%`,
                background: d.orders > 0 ? (peak ? "#0b3f31" : d.today ? "#5fbf9a" : GREEN) : HATCH,
              }}
              title={`${d.day} · ${d.orders} поръчки · ${formatPrice(d.grossCents)} €`}
            />
            <span className={`mt-3 font-mono text-xs ${d.today ? "font-bold text-[#0b2a22]" : "text-[#0b2a22]/45"}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Half-ring: sold share of the room, the rest hatched. Number and caption
 * are SVG text, so they scale with the ring and never collide with it on a
 * phone. The fill keeps the same round caps as the track, so its start sits
 * exactly inside the track's rounded end; a tiny share is stretched to a
 * short pill rather than left as a dot or given flat ends that stick out.
 */
function Gauge({ pct }: { pct: number }) {
  const r = 80;
  const c = Math.PI * r; // half circumference
  const share = Math.min(100, Math.max(0, pct)) / 100;
  const filled = share > 0 ? Math.max(share * c, 6) : 0;
  return (
    <svg viewBox="0 0 200 118" className="mx-auto mt-2 w-full max-w-[17rem]" role="img" aria-label={`${pct}% от залата е продадена`}>
      <defs>
        <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="7" fill="#c9cfca" />
        </pattern>
      </defs>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#hatch)" strokeWidth="26" strokeLinecap="round" />
      {share > 0 && (
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={GREEN}
          strokeWidth="26"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c + 30}`}
        />
      )}
      <text x="100" y="88" textAnchor="middle" fontSize="34" fontWeight="900" fill="#0b2a22" fontFamily="inherit" letterSpacing="-1">
        {pct}%
      </text>
      <text x="100" y="106" textAnchor="middle" fontSize="9" fill="#0b2a22" fillOpacity=".55" fontFamily="inherit">
        от залата е продадена
      </text>
    </svg>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  await requireAccess("tablo");

  const { q = "" } = await searchParams;
  const [d, traffic, found, fin, pricing, abandoned, pendingNow] = await Promise.all([
    getDashboardData(),
    getTrafficData(30),
    searchOrders(q),
    getFinances(),
    getPricing(),
    getAbandonedOrders(),
    getPendingOrders(),
  ]);
  const soldPct = d.capacityTotal ? Math.round((d.ticketsSold / d.capacityTotal) * 100) : 0;

  // The one sentence the morning glance is for: are we on pace to fill the
  // room, at the pace we are actually selling at?
  const daysLeft = d.daysToEvent;
  const seatsLeft = Math.max(0, d.capacityTotal - d.ticketsSold);
  const neededPerDay = seatsLeft / daysLeft;
  const pacePerDay = d.soldLast7Days / 7;
  const onPace = seatsLeft === 0 || pacePerDay >= neededPerDay;
  const fmt1 = (n: number) => n.toLocaleString("bg-BG", { maximumFractionDigits: 1 });

  const opened = traffic.funnel[1]?.value ?? 0;
  const bought = traffic.funnel[3]?.value ?? 0;
  const buyRate = opened ? Math.round((bought / opened) * 100) : null;
  const toRemind = abandoned.filter((o) => o.canRemind).length;

  return (
    <div className="px-5 py-7 sm:px-7">
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#0b2a22]">Табло</h1>
          <p className={`mt-2 text-sm ${onPace ? "text-[#0b2a22]/60" : "text-[#9c3d5c]"}`}>
            {daysLeft} дни до събитието · продадени {d.ticketsSold} от {d.capacityTotal} ·{" "}
            {seatsLeft === 0
              ? "залата е пълна."
              : `нужни ${fmt1(neededPerDay)} на ден, продаваме ${fmt1(pacePerDay)} ${onPace ? "- темпото стига, ако се задържи." : "- под темпото, смятано по последните 7 дни."}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/vhod" className="inline-flex items-center gap-2 rounded-full bg-[#146455] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-16px_rgba(20,100,85,.9)] transition-transform hover:-translate-y-0.5">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><path d="M10 4v12M4 10h12" /></svg>
            Вход на събитието
          </Link>
          <Link href="/admin/fakturi/eksport" className="rounded-full border border-[#146455]/40 px-5 py-3 text-sm font-semibold text-[#0b2a22] transition-colors hover:border-[#146455]">
            Експорт CSV
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          dark
          label="Продадени билети"
          value={d.ticketsSold}
          href="#niva"
          sub={
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[0.62rem]">{soldPct}%</span>
              днес {d.soldToday} · вчера {d.soldYesterday} · от {d.capacityTotal} места
              {d.testOrders ? ` · ${d.testOrders} тестови скрити` : ""}
            </span>
          }
        />
        <Stat
          label="Приходи"
          value={<Money cents={d.grossCents} />}
          href="/admin/finansi"
          sub={`нето ${formatPrice(d.netCents)} € · ДДС ${formatPrice(d.vatCents)} € · резултат ${fin.result.actualCents >= 0 ? "+" : ""}${formatPrice(fin.result.actualCents)} €`}
        />
        <Stat
          label="Поръчки"
          value={d.paidOrders}
          href="#porachki"
          sub={
            [
              d.pendingOrders ? `${d.pendingOrders} в процес` : null,
              d.refundedOrders ? `${d.refundedOrders} върнати` : null,
              buyRate !== null ? `${buyRate}% от отворилите билетите купуват` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "няма незавършени"
          }
        />
        <Stat
          label="Недовършени"
          value={abandoned.length}
          href="#nedovarsheni"
          sub={abandoned.length ? `${toRemind} чакат напомняне · последните 14 дни` : "никой не е спрял на плащането"}
        />
      </div>

      {/* Search results, only when asked */}
      {q.trim().length >= 2 && (
        <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-[#0b2a22]/6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight">Резултати за „{q}“</h2>
            <Link href="/admin" className="text-xs text-[#0b2a22]/55 underline underline-offset-2">изчисти</Link>
          </div>
          {found.length === 0 ? (
            <p className="mt-4 text-sm text-[#0b2a22]/55">Нищо. Провери номера или пробвай само фамилията.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {found.map((o) => (
                <li key={o.reference} className="rounded-2xl bg-[#f6f7f5] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-[#0b2a22]/70">{o.reference}</span>
                      <span className="ml-3 font-medium">{o.name}</span>
                      <CompanyChip company={o.company} />
                      <span className="ml-2 text-xs text-[#0b2a22]/55">{o.email}{o.phone ? ` · ${o.phone}` : ""}</span>
                      <div className="mt-0.5 text-xs text-[#0b2a22]/55">{when(o)}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-[#0b2a22]/60">{o.items} · <Money cents={o.totalCents} /></span>
                      <StatusChip status={o.status} />
                      {o.status === "paid" && <ResendForm reference={o.reference} />}
                      <TestToggle reference={o.reference} isTest={o.isTest} />
                    </div>
                  </div>
                  {o.tickets.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {o.tickets.map((t) => (
                        <li key={t.code} className="rounded-lg bg-white px-2.5 py-1 font-mono text-[0.68rem] text-[#0b2a22]/75 ring-1 ring-[#0b2a22]/8">
                          {t.code} · {t.tierName}{t.checkedIn ? " · влязъл" : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Middle band: week strip · prices · recent + countdown */}
      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-[#0b2a22]/6 xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold tracking-tight">Поръчки тази седмица</h2>
            <span className="text-xs text-[#0b2a22]/55">{d.soldLast7Days} билета за 7 дни</span>
          </div>
          <WeekStrip week={d.week} />
        </section>

        <div className="xl:col-span-1">
          <PriceStages pricing={pricing} sold={d.ticketsSold} />
        </div>

        <div className="flex flex-col gap-4 xl:col-span-1 xl:row-span-2">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-[#0b2a22]/6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Последни поръчки</h2>
              <a href="#porachki" className="rounded-full border border-[#0b2a22]/20 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[#0b2a22]">всички</a>
            </div>
            {d.recent.length === 0 ? (
              <p className="mt-5 text-sm text-[#0b2a22]/55">Още няма поръчки.</p>
            ) : (
              <ul className="mt-5 flex flex-col gap-4">
                {d.recent.filter((o) => !o.isTest).slice(0, 5).map((o) => (
                  <li key={o.reference} className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        o.status === "paid" ? "bg-[#146455]" : o.status === "refunded" ? "bg-[#C4607F]" : "bg-[#0b2a22]/25"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{o.name}</div>
                      <div className="text-xs text-[#0b2a22]/55">{o.items} · <Money cents={o.totalCents} /></div>
                      <div className="text-[0.68rem] text-[#0b2a22]/45">{when(o)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="relative flex-1 overflow-hidden rounded-3xl bg-[#0b2a22] p-6 text-white">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full border-[18px] border-[#146455]/50" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-6 h-56 w-56 rounded-full border-[18px] border-[#146455]/30" />
            <h2 className="relative text-lg font-bold tracking-tight">До събитието</h2>
            <div className="relative mt-4 text-5xl font-black tracking-tight">
              {daysLeft} <span className="text-2xl font-semibold text-white/60">{daysLeft === 1 ? "ден" : "дни"}</span>
            </div>
            <p className="relative mt-3 text-sm text-white/65">07-08 ноември · Гранд Хотел Милениум</p>
            <p className="relative mt-1 text-xs text-white/45">остават {seatsLeft} места</p>
          </section>
        </div>

        {/* Abandoned: money that got as far as the checkout and stopped. One
            nudge each, by hand, a day later - never automatic, never twice. */}
        <section id="nedovarsheni" className="rounded-3xl bg-white p-6 ring-1 ring-[#0b2a22]/6 xl:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight">Недовършени поръчки</h2>
            <p className="text-xs text-[#0b2a22]/50">
              14 дни · без купилите после · едно напомняне, най-рано след денонощие · „кликнал“ е сигурно, „отворено“ е знак
            </p>
          </div>
          {pendingNow.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#f6f7f5] px-4 py-3">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-[#0b2a22]/50">
                В процес на плащане · последните 35 минути
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {pendingNow.map((o) => (
                  <li key={o.reference} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="font-medium">{o.name}</span>
                      <span className="ml-2 font-mono text-xs text-[#0b2a22]/50">{o.reference}</span>
                      <span className="ml-2 text-xs text-[#0b2a22]/55">{o.items} · <Money cents={o.totalCents} /> · {o.email}</span>
                    </span>
                    <span className="text-xs text-[#0b2a22]/50">
                      преди {o.minutesAgo} мин · ако не плати, ще се появи долу след 35 мин
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {abandoned.length === 0 ? (
            <p className="mt-5 text-sm text-[#0b2a22]/55">Няма недовършени поръчки.</p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-[#0b2a22]/6">
              {abandoned.map((o) => (
                <li key={o.reference} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f6f7f5] text-sm font-bold text-[#146455]">
                      {o.name.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {o.name} <span className="font-mono text-xs text-[#0b2a22]/50">{o.reference}</span>
                      </div>
                      <div className="truncate text-xs text-[#0b2a22]/55">
                        {o.items} · <Money cents={o.totalCents} /> · {o.email} · {o.ago}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReminderForm
                      reference={o.reference}
                      canRemind={o.canRemind}
                      note={
                        o.remindedAgo
                          ? `напомнено ${o.remindedAgo}${o.reminderClickedAt ? " · кликнал" : o.reminderOpenedAt ? " · отворено" : ""}`
                          : "може от утре"
                      }
                    />
                    {/* A test checkout by the team is hidden the same way a test sale is. */}
                    <form action={setTestOrder}>
                      <input type="hidden" name="reference" value={o.reference} />
                      <input type="hidden" name="to" value="1" />
                      <button
                        type="submit"
                        title="Скрий - това е тестова поръчка на екипа"
                        className="rounded-full border border-[#0b2a22]/15 px-2.5 py-1.5 text-xs text-[#0b2a22]/50 transition-colors hover:border-[#0b2a22] hover:text-[#0b2a22]"
                      >
                        тестова
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-[#0b2a22]/6 xl:col-span-1">
          <h2 className="text-lg font-bold tracking-tight">Запълване</h2>
          <Gauge pct={soldPct} />
          <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-[#0b2a22]/65">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#146455]" />продадени {d.ticketsSold}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#c9cfca]" />свободни {seatsLeft}</span>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TierBars tiers={d.perTier} />
        <DailyChart data={d.daily} />
      </div>

      {d.odd.length > 0 && (
        <section className="mt-4 rounded-3xl bg-[#C4607F]/8 p-6 ring-1 ring-[#C4607F]/30">
          <h2 className="text-lg font-bold tracking-tight">Проверка: {d.odd.length} платени поръчки, които не се връзват</h2>
          <p className="mt-1 text-xs text-[#0b2a22]/60">
            Броят се като поръчки, но не и като билети, или са платени без плащане в Stripe. Ако е тест - „тестова“. Ако не е - прати екрана.
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-[#0b2a22]/8">
            {d.odd.map((o) => (
              <li key={o.reference} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 text-sm">
                  <span className="font-mono text-xs text-[#0b2a22]/60">{o.reference}</span>
                  <span className="ml-2 font-medium">{o.name}</span>
                  <span className="ml-2 text-xs text-[#0b2a22]/55">{o.email} · <Money cents={o.totalCents} />{o.paidAt ? ` · ${when({ paidAt: o.paidAt, createdAt: o.paidAt })}` : ""}</span>
                  <div className="mt-0.5 text-xs font-semibold text-[#9c3d5c]">{o.issues.join(" · ")}</div>
                </div>
                <TestToggle reference={o.reference} isTest={o.isTest} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="porachki" className="mt-4 rounded-3xl bg-white p-6 ring-1 ring-[#0b2a22]/6">
        <h2 className="text-lg font-bold tracking-tight">Последни поръчки</h2>
        {d.recent.length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-[#0b2a22]/55">Още няма поръчки. Тук ще се появят веднага щом продажбите тръгнат.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0b2a22]/8 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#0b2a22]/50">
                  <th className="px-4 py-3 font-medium">Номер</th>
                  <th className="px-4 py-3 font-medium">Кога</th>
                  <th className="px-4 py-3 font-medium">Купувач</th>
                  <th className="px-4 py-3 font-medium">Билети</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 text-right font-medium">Сума</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {d.recent.map((o) => (
                  <tr key={o.reference} className={`border-b border-[#0b2a22]/6 last:border-0 ${o.isTest ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#0b2a22]/70">
                      {o.reference}
                      {o.status === "paid" && (
                        <Link href={`/faktura/${o.reference}`} className="ml-2 font-sans text-[0.65rem] text-[#0b2a22]/50 underline underline-offset-2 hover:text-[#0b2a22]">
                          фактура
                        </Link>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#0b2a22]/70">{when(o)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {o.name}
                        <CompanyChip company={o.company} />
                      </div>
                      <div className="text-xs text-[#0b2a22]/55">{o.email}{o.phone ? ` · ${o.phone}` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-[#0b2a22]/75">{o.items}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={o.status} />
                      {o.isTest && <span className="ml-1.5 rounded-full bg-[#d0a11a]/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#7a5c05]">тест</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold"><Money cents={o.totalCents} /></td>
                    <td className="px-4 py-3 text-right"><TestToggle reference={o.reference} isTest={o.isTest} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
