import type { Metadata } from "next";
import Link from "next/link";

import { requireAccess } from "@/lib/access";
import { getConsentStats } from "@/lib/consent-log";
import { PERIODS, getTrafficReport, isPeriod, type ChannelRow, type PeriodId } from "@/lib/traffic";
import { insightsOf } from "@/lib/traffic-insights";
import type { FunnelStep } from "@/lib/site-views";

import { Funnel } from "./Funnel";
import { HoursGrid } from "./HoursGrid";
import { DaysChart, HoursChart } from "./TrendChart";
import { HomeLink } from "@/components/admin/HomeLink";

export const metadata: Metadata = {
  title: "Посещения | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const eur = (cents: number) =>
  new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
const num = (n: number) => new Intl.NumberFormat("bg-BG").format(n);
const pct = (part: number, whole: number): number | null => (whole > 0 ? Math.round((part / whole) * 100) : null);

function ago(date: Date | null): string {
  if (!date) return "-";
  const min = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (min < 1) return "току-що";
  if (min < 60) return `преди ${min} мин`;
  const h = Math.floor(min / 60);
  if (h < 24) return `преди ${h} ч`;
  return `преди ${Math.floor(h / 24)} дни`;
}

/** Up or down against the period before, in the colour of good or bad. */
function Delta({ cur, prev, suffix = "" }: { cur: number; prev: number | null | undefined; suffix?: string }) {
  if (prev === null || prev === undefined) return null;
  if (prev === 0 && cur === 0) return <span className="text-xs text-bh-ink/40">без промяна</span>;
  if (prev === 0) return <span className="text-xs font-semibold text-[#146455]">▲ ново{suffix}</span>;
  const d = Math.round(((cur - prev) / prev) * 100);
  if (d === 0) return <span className="text-xs text-bh-ink/45">≈ като преди</span>;
  return (
    <span className={`text-xs font-semibold ${d > 0 ? "text-[#146455]" : "text-[#b3261e]"}`}>
      {d > 0 ? "▲ +" : "▼ "}
      {d}%
      <span className="ml-1 font-normal text-bh-ink/45">(преди {num(prev)}{suffix})</span>
    </span>
  );
}

function Tile({ label, value, sub, delta }: { label: string; value: React.ReactNode; sub?: string; delta?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/50">{label}</div>
      <div className="mt-2.5 text-3xl font-black tracking-tight text-bh-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-bh-ink/55">{sub}</div>}
      {delta && <div className="mt-1.5">{delta}</div>}
    </div>
  );
}

function Card({ title, note, children, className = "" }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8 ${className}`}>
      <h2 className="text-sm font-bold tracking-tight text-bh-ink">{title}</h2>
      {note && <p className="mt-1 text-xs leading-relaxed text-bh-ink/55">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A plain ranked list: name on the left, count on the right, bar behind it. */
function Ranked({
  rows,
  empty,
}: {
  rows: { key: string; label: string; n: number; sub?: string }[];
  empty: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.n), 0);
  if (rows.length === 0) return <p className="text-sm text-bh-ink/50">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <li key={r.key} className="relative overflow-hidden rounded-lg px-3 py-2 text-sm">
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-bh-ink/8" style={{ width: `${max ? Math.max((r.n / max) * 100, 2) : 0}%` }} />
          <span className="relative flex items-baseline justify-between gap-3">
            <span className="truncate text-bh-ink">{r.label}</span>
            <span className="shrink-0 font-semibold text-bh-ink">
              {num(r.n)}
              {r.sub && <span className="ml-2 font-normal text-bh-ink/55">{r.sub}</span>}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const th = "px-3 py-2 text-left font-mono text-[0.6rem] font-medium uppercase tracking-[0.14em] text-bh-ink/45";
const td = "px-3 py-2.5 text-sm text-bh-ink tabular-nums";

function ChannelsTable({ rows, unknown }: { rows: ChannelRow[]; unknown: { tickets: number; grossCents: number } }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse">
        <thead>
          <tr className="border-b border-bh-ink/10">
            <th className={th}>Канал</th>
            <th className={`${th} text-right`}>Хора</th>
            <th className={`${th} text-right`}>Стигат до билетите</th>
            <th className={`${th} text-right`}>Билети с код</th>
            <th className={`${th} text-right`}>Приход</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const reach = pct(c.ticketVisitors, c.visitors);
            return (
              <tr key={c.channel} className="border-b border-bh-ink/5 last:border-0">
                <td className={`${td} font-medium`}>{c.channel}</td>
                <td className={`${td} text-right`}>{num(c.visitors)}</td>
                <td className={`${td} text-right`}>{reach === null ? "-" : `${reach}%`}</td>
                <td className={`${td} text-right`}>{c.tickets || "-"}</td>
                <td className={`${td} text-right`}>{c.grossCents ? eur(c.grossCents) : "-"}</td>
              </tr>
            );
          })}
          {(unknown.tickets > 0 || rows.length === 0) && (
            <tr className="border-t border-bh-ink/10">
              <td className={`${td} text-bh-ink/60`}>Продажби без код (източникът не се знае)</td>
              <td className={`${td} text-right text-bh-ink/40`}>-</td>
              <td className={`${td} text-right text-bh-ink/40`}>-</td>
              <td className={`${td} text-right`}>{unknown.tickets || "-"}</td>
              <td className={`${td} text-right`}>{unknown.grossCents ? eur(unknown.grossCents) : "-"}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * What the site did: who came, from where, how far down the path to a ticket
 * they got, and what that was worth - for one chosen period, against the one
 * before it.
 */
export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; bot?: string }>;
}) {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  await requireAccess("poseshteniya");

  const sp = await searchParams;
  const period: PeriodId = isPeriod(sp.p) ? sp.p : "30";
  const human = sp.bot !== "1";
  const r = await getTrafficReport(period, human);
  const consent = await getConsentStats(period === "dnes" || period === "vchera" ? 2 : r.days);

  const { cur, prev } = r;
  const funnel: FunnelStep[] = [
    { label: "Посетители", value: cur.visitors, ofPrev: null, hint: "различни хора, отворили сайта" },
    { label: "Отворили билетите", value: cur.ticketVisitors, ofPrev: pct(cur.ticketVisitors, cur.visitors), hint: "стигнали до страницата с билетите" },
    { label: "Стигнали до плащане", value: cur.started, ofPrev: pct(cur.started, cur.ticketVisitors), hint: "натиснали „Купи“ и отишли към Stripe" },
    { label: "Платили", value: cur.sales, ofPrev: pct(cur.sales, cur.started), hint: "платени поръчки" },
  ];
  const insights = insightsOf(r);
  const conv = cur.visitors ? (cur.sales / cur.visitors) * 100 : 0;
  const prevConv = prev && prev.visitors ? (prev.sales / prev.visitors) * 100 : null;
  const periodLabel = PERIODS.find((x) => x.id === period)?.label ?? "";
  const prevLabel = period === "dnes" ? "вчера до същия час" : period === "vchera" ? "завчера" : "предишния период";
  const href = (p: PeriodId, bot = !human) => `/admin/poseshteniya?p=${p}${bot ? "&bot=1" : ""}`;

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Посещения</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PERIODS.map((x) => (
              <Link
                key={x.id}
                href={href(x.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  x.id === period ? "bg-bh-ink text-bh-paper" : "border border-bh-ink/20 text-bh-ink hover:border-bh-ink"
                }`}
              >
                {x.label}
              </Link>
            ))}
            <HomeLink />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-bh-ink/60">
          <p className="max-w-2xl leading-relaxed">
            Броим сами, без Google Analytics и без бисквитки. Сравнението е с {prevLabel}.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={href(period, human)} className="font-semibold text-bh-pine underline underline-offset-4">
              {human ? "Покажи и ботовете" : "Скрий ботовете"}
            </Link>
            <a href={`/admin/poseshteniya/eksport?p=${period}${human ? "" : "&bot=1"}`} className="font-semibold text-bh-pine underline underline-offset-4">
              Свали таблица (CSV)
            </a>
          </div>
        </div>

        {cur.views === 0 && period !== "dnes" && (
          <p className="mt-6 rounded-2xl bg-bh-lime-pale/40 px-6 py-5 text-sm leading-relaxed text-bh-ink">
            Няма записани посещения за „{periodLabel}“.
          </p>
        )}

        {/* Right now: the answer to "is the site getting people at all?" */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Сега" value={r.live.last30min} sub="души през последните 30 минути" />
          <Tile label="Последния час" value={r.live.lastHourViews} sub="отваряния на страници" />
          <Tile
            label="Днес до момента"
            value={r.live.todayVisitors}
            sub={`вчера по същото време: ${r.live.yesterdaySameTime}`}
            delta={<Delta cur={r.live.todayVisitors} prev={r.live.yesterdaySameTime} />}
          />
          <Tile label="Последна продажба" value={ago(r.live.lastSaleAt)} sub={r.live.lastSaleAt ? r.live.lastSaleAt.toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : undefined} />
        </div>

        <h2 className="mt-12 text-lg font-bold tracking-tight text-bh-ink">{periodLabel}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Хора" value={num(cur.visitors)} sub="на ден, без повторенията в деня" delta={<Delta cur={cur.visitors} prev={prev?.visitors} />} />
          <Tile
            label="Стигнали до билетите"
            value={num(cur.ticketVisitors)}
            sub={`${pct(cur.ticketVisitors, cur.visitors) ?? 0}% от посетителите`}
            delta={<Delta cur={cur.ticketVisitors} prev={prev?.ticketVisitors} />}
          />
          <Tile
            label="Започнали плащане"
            value={num(cur.started)}
            sub={`${pct(cur.started, cur.ticketVisitors) ?? 0}% от стигналите до билетите`}
            delta={<Delta cur={cur.started} prev={prev?.started} />}
          />
          <Tile
            label="Продадени билети"
            value={num(cur.tickets)}
            sub={`${cur.sales} поръчки`}
            delta={<Delta cur={cur.tickets} prev={prev?.tickets} />}
          />
          <Tile label="Приход" value={eur(cur.grossCents)} sub="с ДДС, без върнатите" delta={<Delta cur={Math.round(cur.grossCents / 100)} prev={prev ? Math.round(prev.grossCents / 100) : null} suffix=" €" />} />
          <Tile
            label="Купуват"
            value={`${conv.toFixed(1)}%`}
            sub="от посетителите до платена поръчка"
            delta={
              prevConv === null ? null : (
                <span className={`text-xs font-semibold ${conv >= prevConv ? "text-[#146455]" : "text-[#b3261e]"}`}>
                  {conv >= prevConv ? "▲" : "▼"} {Math.abs(conv - prevConv).toFixed(1)} пункта
                  <span className="ml-1 font-normal text-bh-ink/45">(преди {prevConv.toFixed(1)}%)</span>
                </span>
              )
            }
          />
          <Tile label="Отваряния" value={num(cur.views)} sub={cur.visitors ? `${(cur.views / cur.visitors).toFixed(1)} страници на човек` : undefined} delta={<Delta cur={cur.views} prev={prev?.views} />} />
          <Tile label="В списъка за новини" value={r.signups} sub={`нови записвания · ${periodLabel.toLowerCase()}`} />
        </div>

        {insights.length > 0 && (
          <section className="mt-8 rounded-2xl bg-bh-ink p-6 text-bh-paper">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-lime">Какво се вижда</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {insights.map((i, k) => (
                <li key={k} className="flex gap-3 text-sm leading-relaxed">
                  <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i.tone === "good" ? "bg-bh-lime" : i.tone === "warn" ? "bg-[#ff8a6b]" : "bg-bh-paper/50"}`} />
                  <span className="text-bh-paper/90">{i.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Card className="mt-8" title={r.hourly ? "Посетители по часове" : "Посетители и продажби по дни"}>
          {r.hourly ? (
            <HoursChart data={r.hourly} label={periodLabel} prevLabel={period === "dnes" ? "вчера" : "завчера"} />
          ) : (
            <DaysChart data={r.daily} />
          )}
        </Card>

        <Funnel steps={funnel} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card title="Откъде идват и колко стигат до билет" note="Източникът е откъдето е дошъл човекът при първото отваряне за деня - линк с код, реклама или друг сайт. Продажбите са само тези, чийто линк е бил с код.">
            <ChannelsTable rows={r.channels} unknown={r.unknownSales} />
          </Card>
          <Card title="Телефон или компютър" note="Колко от хората на всеки тип устройство стигат до билетите.">
            <ul className="flex flex-col gap-3">
              {r.devices.map((d) => {
                const reach = pct(d.ticketVisitors, d.visitors) ?? 0;
                return (
                  <li key={d.device}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-bh-ink">{d.device === "mobile" ? "Телефон" : d.device === "desktop" ? "Компютър" : d.device}</span>
                      <span className="tabular-nums text-bh-ink">{num(d.visitors)} <span className="text-bh-ink/50">· {reach}% до билетите</span></span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bh-ink/8">
                      <div className="h-full rounded-full bg-[#0E8C7D]" style={{ width: `${Math.max(reach, 2)}%` }} />
                    </div>
                  </li>
                );
              })}
              {r.devices.length === 0 && <p className="text-sm text-bh-ink/50">Още няма данни.</p>}
            </ul>
            <h3 className="mt-6 text-sm font-bold text-bh-ink">Език</h3>
            <div className="mt-3">
              <Ranked rows={r.languages.map((l) => ({ key: l.lang, label: l.lang, n: l.visitors }))} empty="Още няма данни." />
            </div>
          </Card>
        </div>

        {r.campaigns.length > 0 && (
          <Card
            className="mt-6"
            title="Кампании по линк с код"
            note="Кодът в линка (utm_campaign) е Meta campaign ID за рекламите и свой код за постовете. Името и платените пари идват от „Реклама“."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse">
                <thead>
                  <tr className="border-b border-bh-ink/10">
                    <th className={th}>Кампания</th>
                    <th className={`${th} text-right`}>Хора</th>
                    <th className={`${th} text-right`}>До билетите</th>
                    <th className={`${th} text-right`}>Билети</th>
                    <th className={`${th} text-right`}>Приход</th>
                    <th className={`${th} text-right`}>Платено</th>
                    <th className={`${th} text-right`}>€ на билет</th>
                  </tr>
                </thead>
                <tbody>
                  {r.campaigns.map((c) => (
                    <tr key={c.code} className="border-b border-bh-ink/5 last:border-0">
                      <td className={`${td} max-w-[18rem]`}>
                        <div className="truncate font-medium">{c.title ?? c.code}</div>
                        {c.title && <div className="truncate font-mono text-[0.65rem] text-bh-ink/40">{c.code}</div>}
                      </td>
                      <td className={`${td} text-right`}>{num(c.visitors)}</td>
                      <td className={`${td} text-right`}>{pct(c.ticketVisitors, c.visitors) ?? 0}%</td>
                      <td className={`${td} text-right`}>{c.tickets || "-"}</td>
                      <td className={`${td} text-right`}>{c.grossCents ? eur(c.grossCents) : "-"}</td>
                      <td className={`${td} text-right`}>{c.spendCents ? eur(c.spendCents) : "-"}</td>
                      <td className={`${td} text-right`}>{c.spendCents && c.tickets ? eur(c.spendCents / c.tickets) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card title="Най-отваряни страници" note="отваряния · в скоби различни хора">
            <Ranked rows={r.topPages.map((p) => ({ key: p.path, label: p.path, n: p.views, sub: `(${p.visitors})` }))} empty="Още няма отворени страници." />
          </Card>
          <Card title="През коя страница влизат" note="първата страница за деня - къде попадат хората от реклама и постове">
            <Ranked rows={r.entryPages.map((p) => ({ key: p.path, label: p.path, n: p.n }))} empty="Още няма данни." />
          </Card>
          <Card title="Най-гледани лектори" note="различни хора, отворили страницата на лектора - за кого да правим още постове">
            <Ranked rows={r.speakers.map((s) => ({ key: s.id, label: s.name, n: s.visitors }))} empty="Още няма отворени страници на лектори." />
          </Card>
        </div>

        <div className="mt-6">
          <HoursGrid hours={r.hours} days={period === "vsichko" ? 365 : r.days} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Откъде са" note="различни хора по град">
            <Ranked rows={r.places.map((p) => ({ key: p.place, label: p.place, n: p.n }))} empty="Още няма данни." />
          </Card>
          <Card title="На живо - последните отваряния" note="последните 6 часа; ботовете са посочени, ако ги показваш">
            <ul className="flex flex-col divide-y divide-bh-ink/5 text-sm">
              {r.live.recent.length === 0 && <li className="py-2 text-bh-ink/50">Няма посещения през последните 6 часа.</li>}
              {r.live.recent.map((v, i) => (
                <li key={i} className={`flex items-baseline justify-between gap-3 py-2 ${v.bot ? "opacity-50" : ""}`}>
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-bh-ink">{v.path}</span>
                    <span className="ml-2 text-xs text-bh-ink/50">
                      {v.channel} · {v.place}
                      {v.device ? ` · ${v.device === "mobile" ? "телефон" : "компютър"}` : ""}
                      {v.bot ? " · бот" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.65rem] text-bh-ink/45">{ago(v.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* How the cookie window is doing - each person's latest answer, so a
            change of mind counts once, the honest way. This is the number
            the whole Meta and Google measurement stands on: nothing is
            measured for the people in "отказ". */}
        <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold tracking-tight text-bh-ink">Съгласия за бисквитки</h2>
            <span className="text-xs text-bh-ink/55">
              {consent.people} души · {consent.answers} отговора
            </span>
          </div>
          {consent.people === 0 ? (
            <p className="mt-3 text-sm text-bh-ink/55">Още няма отговори под сегашния текст на прозорчето.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Tile label="Маркетинг · да" value={`${Math.round(consent.marketingRate * 100)}%`} sub="Meta и Google Ads работят за тях" />
              <Tile label="Статистика · да" value={`${Math.round(consent.analyticsRate * 100)}%`} sub="Google Analytics ги брои" />
              <Tile label="Приели всичко" value={consent.all} sub={`само статистика ${consent.analyticsOnly} · само маркетинг ${consent.marketingOnly}`} />
              <Tile label="Отказ" value={consent.none} sub="нищо не се измерва за тях" />
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-bh-ink/10 p-6 text-xs leading-relaxed text-bh-ink/60">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Как се броят числата</h2>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4">
            <li>Човек се разпознава само в рамките на деня, като число, което се сменя в полунощ. Който се върне утре, е нов посетител утре - затова „Хора“ за няколко дни е сбор по дни, не различни личности, и не можем да делим на нови и връщащи се.</li>
            <li>Ботовете са посещения от центрове за данни (проверки на Meta и Apple, скенери) и по подразбиране са скрити.</li>
            <li>Продадени билети и приход са от поръчките, по часа на плащането в българско време, без тестовите и без върнатите изцяло.</li>
            <li>„Стигат до билетите“ е спрямо хората, отворили страницата на билетите, а източникът е този при първото отваряне за деня.</li>
            <li>Днес е непълен: сравнението е с вчера до същия час.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
