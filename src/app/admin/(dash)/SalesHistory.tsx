"use client";

import { useState } from "react";

import type { Launch, WeekDay } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/tickets";

import { TIER_COLORS } from "./TierBars";

/**
 * Sales against marketing, on one timeline.
 *
 * Bars are the tickets of each day (or week), stacked by tier. Over them a
 * line with dots: how many of those tickets arrived through a tagged link -
 * the certain part of what advertising brought. Under the dates, a flag for
 * every post or advert in the marketing log on the day it went out, so a
 * bump after a flag can be read for what it is. The hover on a bar lists
 * the tiers, the tagged sales by campaign and the launches of that day.
 *
 * Ranges: 14 or 30 days by day; 90 days or everything by week - more than
 * ~40 bars stop reading as days. Client-side so a switch never reloads a
 * page that queries the database.
 */

const RANGES = [
  { id: "14", label: "14 дни", days: 14 },
  { id: "30", label: "30 дни", days: 30 },
  { id: "90", label: "90 дни", days: 90 },
  { id: "all", label: "целият период", days: Infinity },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

type Bar = {
  key: string;
  label: string;
  sub: string;
  tickets: number;
  orders: number;
  grossCents: number;
  byTier: WeekDay["byTier"];
  tagged: WeekDay["tagged"];
  launches: Launch[];
  today: boolean;
};

/** Monday of the week a day falls in, as YYYY-MM-DD. */
function weekStart(day: string): string {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const dm = (day: string) => `${Number(day.slice(8, 10))}.${Number(day.slice(5, 7))}`;

function toBars(days: WeekDay[], launches: Launch[], weekly: boolean): Bar[] {
  const out: Bar[] = [];
  for (const d of days) {
    const key = weekly ? weekStart(d.day) : d.day;
    let b = out[out.length - 1];
    if (!b || b.key !== key) {
      b = {
        key,
        label: weekly ? dm(key) : d.label,
        sub: weekly ? `седмица от ${dm(key)}` : dm(d.day),
        tickets: 0,
        orders: 0,
        grossCents: 0,
        byTier: [],
        tagged: [],
        launches: [],
        today: false,
      };
      out.push(b);
    }
    b.tickets += d.tickets;
    b.orders += d.orders;
    b.grossCents += d.grossCents;
    b.today = b.today || d.today;
    for (const t of d.byTier) {
      const cur = b.byTier.find((x) => x.id === t.id);
      if (cur) {
        cur.n += t.n;
        cur.grossCents += t.grossCents;
      } else b.byTier.push({ ...t });
    }
    for (const t of d.tagged) {
      const cur = b.tagged.find((x) => x.code === t.code);
      if (cur) cur.n += t.n;
      else b.tagged.push({ ...t });
    }
    b.launches.push(...launches.filter((l) => l.day === d.day));
  }
  return out;
}

const HATCH = "repeating-linear-gradient(135deg, rgba(11,42,34,.14) 0 3px, transparent 3px 7px)";
const LINE = "#0b2a22";
const money = (c: number) => formatPrice(c).replace(/,\d\d$/, "");
const taggedOf = (b: Bar) => b.tagged.reduce((a, t) => a + t.n, 0);

export function SalesHistory({ history, launches }: { history: WeekDay[]; launches: Launch[] }) {
  const [range, setRange] = useState<RangeId>("30");
  const r = RANGES.find((x) => x.id === range)!;
  const days = Number.isFinite(r.days) ? history.slice(-r.days) : history;
  const weekly = days.length > 40;
  const bars = toBars(days, launches, weekly);
  const max = bars.reduce((m, b) => Math.max(m, b.tickets), 0);
  const tickets = bars.reduce((a, b) => a + b.tickets, 0);
  const gross = bars.reduce((a, b) => a + b.grossCents, 0);
  const tagged = bars.reduce((a, b) => a + taggedOf(b), 0);
  const launched = bars.reduce((a, b) => a + b.launches.length, 0);
  const tiersSeen = new Set(bars.flatMap((b) => b.byTier.map((t) => t.id)));
  // With many bars the labels would collide, so only every n-th is written.
  const every = bars.length > 20 ? Math.ceil(bars.length / 15) : 1;
  const n = bars.length;
  const pct = (v: number) => (max ? (v / max) * 100 : 0);
  // The tagged line, in the bar area's own coordinates (0-100 both ways).
  const linePoints = bars.map((b, i) => `${((i + 0.5) / n) * 100},${100 - pct(taggedOf(b))}`).join(" ");

  return (
    <section className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Продажби и реклама · {r.label}</h2>
          <p className="mt-1 text-sm text-bh-ink/55">
            {tickets} билета · {formatPrice(gross)} € · {tagged} по линк с код{launched ? ` · ${launched} ${launched === 1 ? "пускане" : "пускания"}` : ""}
            {weekly ? " · по седмици" : ""}
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-bh-ink/6 p-1">
          {RANGES.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setRange(x.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${range === x.id ? "bg-bh-ink text-bh-paper" : "text-bh-ink/60 hover:text-bh-ink"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {/* The bar area: bars, their numbers, the tagged line and its dots all
          share this box, so one scale places them against each other. */}
      <div className="relative mt-6 h-48">
        <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-1.5">
          {bars.map((b) => {
            const h = b.tickets > 0 ? Math.max(pct(b.tickets), 4) : 0;
            const peak = max > 0 && b.tickets === max;
            const title = [
              `${b.sub} · ${b.tickets} билета · ${b.orders} поръчки · ${formatPrice(b.grossCents)} €`,
              ...b.byTier.map((t) => `${t.name} ${t.n} · ${formatPrice(t.grossCents)} €`),
              ...(b.tagged.length ? ["по линк с код:", ...b.tagged.map((t) => `  ${t.title ?? t.code}: ${t.n}`)] : []),
              ...(b.launches.length ? ["пуснато:", ...b.launches.map((l) => `  ${l.title}${l.spendCents ? ` · ${formatPrice(l.spendCents)} €` : ""}`)] : []),
            ].join("\n");
            return (
              <div key={b.key} className="relative flex h-full flex-1 items-end justify-center" title={title}>
                {(peak || (n <= 20 && b.tickets > 0)) && (
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1 py-0.5 text-[0.6rem] font-semibold ${peak ? "bg-bh-ink text-bh-paper" : "text-bh-ink"}`}
                    style={{ bottom: `calc(${h}% + 4px)` }}
                  >
                    {b.tickets}
                  </span>
                )}
                <div
                  className="flex w-full max-w-[1.6rem] flex-col-reverse overflow-hidden rounded-full"
                  style={{ height: `${b.tickets > 0 ? h : 100}%`, background: b.tickets > 0 ? undefined : HATCH }}
                >
                  {b.byTier.map((t) => (
                    <div key={t.id} style={{ height: `${(t.n / b.tickets) * 100}%`, background: TIER_COLORS[t.id] ?? "#146455", opacity: b.today ? 0.75 : 1 }} />
                  ))}
                </div>
                {taggedOf(b) > 0 && (
                  <span
                    className="pointer-events-none absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 bg-[#ACEC1D]"
                    style={{ bottom: `${pct(taggedOf(b))}%`, borderColor: LINE }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {tagged > 0 && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polyline points={linePoints} fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Under the bars: the date, the money, and a flag for every launch. */}
      <div className="mt-2 flex gap-[3px] sm:gap-1.5">
        {bars.map((b, i) => {
          const labelled = i % every === 0 || i === n - 1;
          return (
            <div key={b.key} className="flex flex-1 flex-col items-center" title={b.launches.map((l) => l.title).join("\n") || undefined}>
              <span className={`font-mono text-[0.6rem] ${labelled ? (b.today ? "font-bold text-bh-ink" : "text-bh-ink/45") : "invisible"}`}>{b.label}</span>
              {n <= 31 && (
                <span className={`hidden font-mono text-[0.55rem] tabular-nums sm:block ${b.grossCents > 0 ? "text-bh-ink/60" : "text-bh-ink/25"}`}>
                  {b.grossCents > 0 ? money(b.grossCents) : "–"}
                </span>
              )}
              <span className="mt-1 flex h-3 items-start gap-px">
                {b.launches.slice(0, 4).map((l, k) => (
                  <svg key={k} viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden>
                    <path d="M5 0L10 10H0z" fill={l.kind === "ad" ? LINE : "none"} stroke={LINE} strokeWidth="1.5" />
                  </svg>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem] text-bh-ink/55">
        {(["core", "plus", "peak"] as const)
          .filter((id) => tiersSeen.has(id))
          .map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: TIER_COLORS[id] }} />
              {id.toUpperCase()}
            </span>
          ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 bg-[#ACEC1D]" style={{ borderColor: LINE }} />
          продажби по линк с код
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden><path d="M5 0L10 10H0z" fill={LINE} /></svg>
          платена реклама
          <svg viewBox="0 0 10 10" className="ml-1 h-2.5 w-2.5" aria-hidden><path d="M5 0L10 10H0z" fill="none" stroke={LINE} strokeWidth="1.5" /></svg>
          пост
        </span>
        <span className="ml-auto">посочи колонка за нива, кодове и пускания</span>
      </div>
      {launched === 0 && (
        <p className="mt-3 text-xs text-bh-ink/50">
          Няма пуснати реклами в този период в лога „Реклама“. Всяка реклама или пост, записани там с датата си, се появяват тук като знаме под деня, а продажбите по техния линк с код - като точка над колонката.
        </p>
      )}
    </section>
  );
}
