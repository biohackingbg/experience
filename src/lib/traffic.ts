import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, signups } from "@/lib/db/schema";
import { SALE } from "@/lib/sold";
import { sofiaDaysBack } from "@/lib/sofia-days";
import { listSpeakers } from "@/lib/speakers-data";

/**
 * The report behind /admin/poseshteniya.
 *
 * Everything here is built from two tables we own - site_views (one row per
 * page opened) and orders - so a figure on the page can always be traced to
 * rows. The visitor code rotates at midnight (see site-views.ts), which sets
 * the one limit on every number below: a person who comes back tomorrow is a
 * new visitor tomorrow. "Visitors" over several days therefore means
 * person-days, and nothing here pretends to know who is new and who returns.
 */

export type PeriodId = "dnes" | "vchera" | "7" | "30" | "90" | "vsichko";

export const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "dnes", label: "Днес" },
  { id: "vchera", label: "Вчера" },
  { id: "7", label: "7 дни" },
  { id: "30", label: "30 дни" },
  { id: "90", label: "90 дни" },
  { id: "vsichko", label: "Всичко" },
];

export const isPeriod = (v: string | undefined): v is PeriodId => PERIODS.some((p) => p.id === v);

const SOFIA = "Europe/Sofia";
/** Midnight Sofia, `n` calendar days back - not 24-hour lumps, which slip an hour across a clock change. */
const back = (n: number) => `((date_trunc('day', now() at time zone '${SOFIA}') - interval '${n} days') at time zone '${SOFIA}')`;
const TODAY0 = back(0);

type Window = { start: string; end: string };

/** The period and the one just before it, as SQL timestamp expressions. */
function windows(p: PeriodId): { cur: Window; prev: Window | null; days: number } {
  switch (p) {
    case "dnes":
      return {
        cur: { start: TODAY0, end: "now() + interval '1 second'" },
        // Yesterday up to the same time of day: a fair comparison at 16:30.
        prev: { start: back(1), end: "now() - interval '1 day'" },
        days: 1,
      };
    case "vchera":
      return {
        cur: { start: back(1), end: TODAY0 },
        prev: { start: back(2), end: back(1) },
        days: 1,
      };
    case "vsichko":
      return { cur: { start: "timestamptz '2000-01-01'", end: "now() + interval '1 second'" }, prev: null, days: 365 };
    default: {
      const n = Number(p);
      return {
        cur: { start: back(n - 1), end: "now() + interval '1 second'" },
        prev: { start: back(2 * n - 1), end: back(n - 1) },
        days: n,
      };
    }
  }
}

/**
 * Cities that are data centres, not people: Meta's and Apple's link-preview
 * and ad-review crawlers, and the cloud regions behind scanners. They are
 * counted as visitors by any beacon that runs JavaScript, and they never buy.
 */
const BOT_CITIES = ["Prineville", "Forest City", "Luleå", "Lulea", "Ashburn", "Council Bluffs", "The Dalles", "Boardman", "Denver", "Santa Clara", "Des Moines", "Boydton", "Quincy", "San Jose", "Hillsboro", "Altoona", "Omaha", "Fort Worth", "Taiyuan", "Moses Lake", "Cheyenne", "Lenoir", "Papillion", "New Albany", "Eagle Mountain", "Los Lunas", "Mesa"];
const BOT_SQL = `(city is null or city not in (${BOT_CITIES.map((c) => `'${c.replace(/'/g, "''")}'`).join(", ")}))`;
const NOT_BOT = sql.raw(BOT_SQL);
const IS_BOT = sql.raw(`(city in (${BOT_CITIES.map((c) => `'${c.replace(/'/g, "''")}'`).join(", ")}))`);

const inWin = (col: string, w: Window) => sql.raw(`${col} >= ${w.start} and ${col} < ${w.end}`);

export type PeriodStats = {
  views: number;
  visitors: number;
  ticketVisitors: number;
  started: number;
  sales: number;
  tickets: number;
  grossCents: number;
};

type Row<T> = T & Record<string, unknown>;

async function periodStats(w: Window, human: boolean): Promise<PeriodStats> {
  const db = getDb();
  const filter = human ? NOT_BOT : sql`true`;
  const [v, o] = await Promise.all([
    db.execute<Row<{ views: number; visitors: number; tix: number }>>(sql`
      select count(*)::int as views,
             count(distinct visitor)::int as visitors,
             count(distinct visitor) filter (where path like '/bilet%')::int as tix
      from site_views
      where ${inWin("created_at", w)} and ${filter}`),
    db.execute<Row<{ started: number; sales: number; tickets: number; gross: number }>>(sql`
      select
        count(*) filter (where not ${orders.isTest})::int as started,
        count(*) filter (where ${SALE} and ${sql.raw(`paid_at >= ${w.start} and paid_at < ${w.end}`)})::int as sales,
        coalesce((select sum(oi.quantity) from order_items oi join orders o2 on o2.id = oi.order_id
                  where o2.status = 'paid' and not o2.is_test and o2.total_cents > 0
                    and ${sql.raw(`o2.paid_at >= ${w.start} and o2.paid_at < ${w.end}`)}), 0)::int as tickets,
        coalesce(sum(${orders.totalCents} - coalesce(${orders.refundedCents}, 0))
                 filter (where ${SALE} and ${sql.raw(`paid_at >= ${w.start} and paid_at < ${w.end}`)}), 0)::int as gross
      from ${orders}
      where ${sql.raw(`created_at >= ${w.start} and created_at < ${w.end}`)} or ${sql.raw(`paid_at >= ${w.start} and paid_at < ${w.end}`)}`),
  ]);
  return {
    views: v[0]?.views ?? 0,
    visitors: v[0]?.visitors ?? 0,
    ticketVisitors: v[0]?.tix ?? 0,
    started: o[0]?.started ?? 0,
    sales: o[0]?.sales ?? 0,
    tickets: o[0]?.tickets ?? 0,
    grossCents: o[0]?.gross ?? 0,
  };
}

/** A source as the team reads it: Instagram, Meta advert, newsletter, direct. */
export function channelOf(utmSource: string | null, referrerHost: string | null): string {
  const u = (utmSource ?? "").toLowerCase();
  // A tag that is really a host name ("chatgpt.com") is read as that host.
  if (u.includes(".")) return channelOf(null, u);
  if (u) {
    if (["meta", "fb", "facebook-ads", "ig-ads"].includes(u)) return "Meta реклама";
    if (["instagram", "ig"].includes(u)) return "Instagram";
    if (["facebook"].includes(u)) return "Facebook";
    if (["newsletter", "email", "mail", "pisma", "sequence"].includes(u)) return "Имейл";
    if (u === "linkedin") return "LinkedIn";
    if (u === "google") return "Google";
    return `Код: ${u}`;
  }
  const h = (referrerHost ?? "").toLowerCase().replace(/^www\./, "");
  if (!h) return "Директно / съобщения";
  if (h.includes("instagram")) return "Instagram";
  if (h.includes("facebook") || h === "fb.com" || h === "l.messenger.com" || h.includes("messenger")) return "Facebook";
  if (h.startsWith("google.") || h.includes(".google.") || h === "google.com") return "Google";
  if (h.includes("linkedin") || h === "lnkd.in") return "LinkedIn";
  if (h.includes("youtube") || h === "youtu.be") return "YouTube";
  if (h === "t.co" || h.includes("twitter") || h === "x.com") return "X";
  if (h === "checkout.stripe.com" || h.includes("stripe.com")) return "Връщане от плащане";
  if (h.includes("tiktok")) return "TikTok";
  if (h.includes("chatgpt") || h.includes("openai")) return "ChatGPT";
  if (h.includes("perplexity")) return "Perplexity";
  return h;
}

export type DayRow = {
  day: string;
  visitors: number;
  views: number;
  ticketVisitors: number;
  sales: number;
  tickets: number;
  grossCents: number;
  partial: boolean;
};

export type ChannelRow = {
  channel: string;
  visitors: number;
  ticketVisitors: number;
  tickets: number;
  grossCents: number;
};

export type CampaignRow = {
  code: string;
  title: string | null;
  platform: string | null;
  visitors: number;
  ticketVisitors: number;
  tickets: number;
  grossCents: number;
  spendCents: number;
};

export type LiveView = { at: Date; path: string; channel: string; place: string; device: string | null; bot: boolean };

export type TrafficReport = {
  period: PeriodId;
  human: boolean;
  days: number;
  cur: PeriodStats;
  prev: PeriodStats | null;
  botViews: number;
  daily: DayRow[];
  /** Visitors per hour of the day - only for "Днес" and "Вчера", where a day-by-day chart would be one bar. */
  hourly: { hour: number; cur: number; prev: number }[] | null;
  signups: number;
  channels: ChannelRow[];
  unknownSales: { tickets: number; grossCents: number };
  campaigns: CampaignRow[];
  devices: { device: string; visitors: number; ticketVisitors: number }[];
  languages: { lang: string; visitors: number }[];
  places: { place: string; n: number }[];
  topPages: { path: string; views: number; visitors: number }[];
  entryPages: { path: string; n: number }[];
  speakers: { id: string; name: string; visitors: number }[];
  hours: { weekday: number; hour: number; views: number }[];
  live: {
    last30min: number;
    lastHourViews: number;
    todayVisitors: number;
    yesterdaySameTime: number;
    lastSaleAt: Date | null;
    recent: LiveView[];
  };
};

const sofiaDate = new Intl.DateTimeFormat("en-CA", { timeZone: SOFIA });

export async function getTrafficReport(period: PeriodId, human: boolean): Promise<TrafficReport> {
  const db = getDb();
  const { cur, prev, days } = windows(period);
  const filter = human ? NOT_BOT : sql`true`;
  const w = (col: string) => inWin(col, cur);

  // Per visitor and day: the first page opened (that is where they came in),
  // and whether they ever reached the ticket page that day. The channel,
  // device and entry page of a visit are read off that first row.
  const visits = sql`
    with first as (
      select distinct on (visitor, d) visitor, d, path, referrer_host, utm_source, utm_campaign, device
      from (select *, (created_at at time zone 'Europe/Sofia')::date as d from site_views
            where ${w("created_at")} and ${filter}) s
      order by visitor, d, created_at
    ),
    tix as (
      select distinct visitor, (created_at at time zone 'Europe/Sofia')::date as d
      from site_views where ${w("created_at")} and ${filter} and path like '/bilet%'
    )`;

  const [
    curStats,
    prevStats,
    botRow,
    dailyViews,
    dailyOrders,
    channelRows,
    campaignRows,
    orderChannels,
    orderCampaigns,
    deviceRows,
    langRows,
    placeRows,
    pageRows,
    entryRows,
    speakerRows,
    hourRows,
    signupRow,
    liveRow,
    recentRows,
    saleRow,
    codeRows,
  ] = await Promise.all([
    periodStats(cur, human),
    prev ? periodStats(prev, human) : Promise.resolve(null),
    db.execute<Row<{ n: number }>>(sql`select count(*)::int as n from site_views where ${w("created_at")} and ${IS_BOT}`),
    db.execute<Row<{ day: string; views: number; visitors: number; tix: number }>>(sql`
      select to_char(created_at at time zone 'Europe/Sofia', 'YYYY-MM-DD') as day,
             count(*)::int as views,
             count(distinct visitor)::int as visitors,
             count(distinct visitor) filter (where path like '/bilet%')::int as tix
      from site_views where ${w("created_at")} and ${filter} group by 1 order by 1`),
    db.execute<Row<{ day: string; sales: number; tickets: number; gross: number }>>(sql`
      select to_char(o.paid_at at time zone 'Europe/Sofia', 'YYYY-MM-DD') as day,
             count(*)::int as sales,
             coalesce(sum((select sum(oi.quantity) from order_items oi where oi.order_id = o.id)), 0)::int as tickets,
             coalesce(sum(o.total_cents - coalesce(o.refunded_cents, 0)), 0)::int as gross
      from orders o
      where o.status = 'paid' and not o.is_test and o.total_cents > 0
        and (o.total_cents = 0 or coalesce(o.refunded_cents, 0) < o.total_cents)
        and ${sql.raw(`o.paid_at >= ${cur.start} and o.paid_at < ${cur.end}`)}
      group by 1 order by 1`),
    db.execute<Row<{ utm_source: string | null; referrer_host: string | null; visitors: number; tix: number }>>(sql`
      ${visits}
      select f.utm_source, f.referrer_host, count(*)::int as visitors, count(t.visitor)::int as tix
      from first f left join tix t on t.visitor = f.visitor and t.d = f.d
      group by 1, 2`),
    db.execute<Row<{ code: string; visitors: number; tix: number }>>(sql`
      ${visits}
      select f.utm_campaign as code, count(*)::int as visitors, count(t.visitor)::int as tix
      from first f left join tix t on t.visitor = f.visitor and t.d = f.d
      where f.utm_campaign is not null
      group by 1 order by 2 desc limit 12`),
    db.execute<Row<{ src: string | null; tickets: number; gross: number }>>(sql`
      select o.utm_source as src,
             coalesce(sum((select sum(oi.quantity) from order_items oi where oi.order_id = o.id)), 0)::int as tickets,
             coalesce(sum(o.total_cents - coalesce(o.refunded_cents, 0)), 0)::int as gross
      from orders o
      where o.status = 'paid' and not o.is_test and o.total_cents > 0
        and (coalesce(o.refunded_cents, 0) < o.total_cents)
        and ${sql.raw(`o.paid_at >= ${cur.start} and o.paid_at < ${cur.end}`)}
      group by 1`),
    db.execute<Row<{ code: string | null; tickets: number; gross: number }>>(sql`
      select o.utm_campaign as code,
             coalesce(sum((select sum(oi.quantity) from order_items oi where oi.order_id = o.id)), 0)::int as tickets,
             coalesce(sum(o.total_cents - coalesce(o.refunded_cents, 0)), 0)::int as gross
      from orders o
      where o.status = 'paid' and not o.is_test and o.total_cents > 0
        and (coalesce(o.refunded_cents, 0) < o.total_cents)
        and ${sql.raw(`o.paid_at >= ${cur.start} and o.paid_at < ${cur.end}`)}
        and o.utm_campaign is not null
      group by 1`),
    db.execute<Row<{ device: string; visitors: number; tix: number }>>(sql`
      ${visits}
      select coalesce(f.device, 'неизвестно') as device, count(*)::int as visitors, count(t.visitor)::int as tix
      from first f left join tix t on t.visitor = f.visitor and t.d = f.d
      group by 1 order by 2 desc`),
    db.execute<Row<{ lang: string; visitors: number }>>(sql`
      select case when path = '/en' or path like '/en/%' then 'English' else 'Български' end as lang,
             count(distinct visitor)::int as visitors
      from site_views where ${w("created_at")} and ${filter} group by 1 order by 2 desc`),
    db.execute<Row<{ place: string; n: number }>>(sql`
      select coalesce(city, country, 'неизвестно') as place, count(distinct visitor)::int as n
      from site_views where ${w("created_at")} and ${filter}
      group by 1 order by 2 desc limit 10`),
    db.execute<Row<{ path: string; views: number; visitors: number }>>(sql`
      select path, count(*)::int as views, count(distinct visitor)::int as visitors
      from site_views where ${w("created_at")} and ${filter}
      group by 1 order by 2 desc limit 12`),
    db.execute<Row<{ path: string; n: number }>>(sql`
      ${visits}
      select path, count(*)::int as n from first group by 1 order by 2 desc limit 8`),
    db.execute<Row<{ slug: string; visitors: number }>>(sql`
      select regexp_replace(path, '^/en', '') as slug, count(distinct visitor)::int as visitors
      from site_views
      where ${w("created_at")} and ${filter} and (path like '/lektor/%' or path like '/en/lektor/%')
      group by 1 order by 2 desc limit 10`),
    db.execute<Row<{ weekday: number; hour: number; views: number }>>(sql`
      select extract(isodow from created_at at time zone 'Europe/Sofia')::int as weekday,
             extract(hour from created_at at time zone 'Europe/Sofia')::int as hour,
             count(*)::int as views
      from site_views where ${w("created_at")} and ${filter} group by 1, 2`),
    db.select({ n: sql<number>`count(*)::int` }).from(signups).where(sql`${sql.raw(`created_at >= ${cur.start} and created_at < ${cur.end}`)}`),
    db.execute<Row<{ m30: number; h1: number; today: number; ydaySame: number }>>(sql`
      select
        count(distinct visitor) filter (where created_at >= now() - interval '30 minutes')::int as m30,
        count(*) filter (where created_at >= now() - interval '1 hour')::int as h1,
        count(distinct visitor) filter (where created_at >= ${sql.raw(TODAY0)})::int as today,
        count(distinct visitor) filter (where created_at >= ${sql.raw(back(1))}
                                          and created_at < now() - interval '1 day')::int as "ydaySame"
      from site_views
      where created_at >= ${sql.raw(back(1))} and ${filter}`),
    db.execute<Row<{ at: Date; path: string; utm_source: string | null; referrer_host: string | null; city: string | null; country: string | null; device: string | null; bot: boolean }>>(sql`
      select created_at as at, path, utm_source, referrer_host, city, country, device, ${IS_BOT} as bot
      from site_views
      where created_at >= now() - interval '6 hours' ${human ? sql`and ${NOT_BOT}` : sql``}
      order by created_at desc limit 14`),
    db.execute<Row<{ at: Date | null }>>(sql`
      select max(paid_at) as at from orders where status = 'paid' and not is_test and total_cents > 0`),
    db.execute<Row<{ code: string; title: string; platform: string; spend: number }>>(sql`
      select utm_campaign as code, title, platform, sum(spend_cents)::int as spend
      from campaigns where utm_campaign is not null group by 1, 2, 3`),
  ]);

  // Daily series, gaps filled so a quiet day shows as a quiet day.
  const vMap = new Map(dailyViews.map((r) => [r.day, r]));
  const oMap = new Map(dailyOrders.map((r) => [r.day, r]));
  const todayStr = sofiaDate.format(new Date());
  const firstDay = period === "vsichko" ? (dailyViews[0]?.day ?? todayStr) : sofiaDaysBack(days)[0];
  const startDay = period === "vchera" ? sofiaDaysBack(2)[0] : firstDay;
  const endDay = period === "vchera" ? startDay : todayStr;
  const daily: DayRow[] = [];
  for (let t = Date.parse(`${startDay}T12:00:00Z`); daily.length < 400; t += 86_400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    if (day > endDay) break;
    const v = vMap.get(day);
    const o = oMap.get(day);
    daily.push({
      day,
      visitors: v?.visitors ?? 0,
      views: v?.views ?? 0,
      ticketVisitors: v?.tix ?? 0,
      sales: o?.sales ?? 0,
      tickets: o?.tickets ?? 0,
      grossCents: o?.gross ?? 0,
      partial: day === todayStr,
    });
  }

  // Channels: traffic by the mapped name, sales by the tag on the order.
  const chMap = new Map<string, ChannelRow>();
  const ch = (name: string): ChannelRow => {
    let c = chMap.get(name);
    if (!c) chMap.set(name, (c = { channel: name, visitors: 0, ticketVisitors: 0, tickets: 0, grossCents: 0 }));
    return c;
  };
  for (const r of channelRows) {
    const c = ch(channelOf(r.utm_source, r.referrer_host));
    c.visitors += r.visitors;
    c.ticketVisitors += r.tix;
  }
  const unknownSales = { tickets: 0, grossCents: 0 };
  for (const r of orderChannels) {
    if (!r.src) {
      unknownSales.tickets += r.tickets;
      unknownSales.grossCents += r.gross;
      continue;
    }
    const c = ch(channelOf(r.src, null));
    c.tickets += r.tickets;
    c.grossCents += r.gross;
  }
  const channels = [...chMap.values()]
    .filter((c) => c.channel !== "Връщане от плащане")
    .sort((a, b) => b.visitors - a.visitors || b.tickets - a.tickets)
    .slice(0, 12);

  // Campaigns: names and spend from the marketing log, where it knows the code.
  const named = new Map(codeRows.map((r) => [r.code, r]));
  const sold = new Map(orderCampaigns.map((r) => [r.code ?? "", r]));
  const campaigns: CampaignRow[] = campaignRows.map((r) => {
    const n = named.get(r.code);
    const s = sold.get(r.code);
    return {
      code: r.code,
      title: n?.title ?? null,
      platform: n?.platform ?? null,
      visitors: r.visitors,
      ticketVisitors: r.tix,
      tickets: s?.tickets ?? 0,
      grossCents: s?.gross ?? 0,
      spendCents: n?.spend ?? 0,
    };
  });

  let hourly: TrafficReport["hourly"] = null;
  if (prev && (period === "dnes" || period === "vchera")) {
    const per = async (win: Window) =>
      db.execute<Row<{ hour: number; n: number }>>(sql`
        select extract(hour from created_at at time zone 'Europe/Sofia')::int as hour, count(distinct visitor)::int as n
        from site_views where ${inWin("created_at", win)} and ${filter} group by 1`);
    const [c, p] = await Promise.all([per(cur), per(prev)]);
    hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      cur: c.find((r) => r.hour === hour)?.n ?? 0,
      prev: p.find((r) => r.hour === hour)?.n ?? 0,
    }));
  }

  const speakers = await listSpeakers().catch(() => []);
  const nameOf = (slug: string) => speakers.find((s) => `/lektor/${s.id}` === slug)?.name ?? slug.replace("/lektor/", "");

  return {
    period,
    human,
    days,
    cur: curStats,
    prev: prevStats,
    botViews: botRow[0]?.n ?? 0,
    daily,
    hourly,
    signups: signupRow[0]?.n ?? 0,
    channels,
    unknownSales,
    campaigns,
    devices: deviceRows.map((r) => ({ device: r.device, visitors: r.visitors, ticketVisitors: r.tix })),
    languages: langRows.map((r) => ({ lang: r.lang, visitors: r.visitors })),
    places: placeRows.map((r) => ({ place: r.place, n: r.n })),
    topPages: pageRows.map((r) => ({ path: r.path, views: r.views, visitors: r.visitors })),
    entryPages: entryRows.map((r) => ({ path: r.path, n: r.n })),
    speakers: speakerRows.map((r) => ({ id: r.slug, name: nameOf(r.slug), visitors: r.visitors })),
    hours: hourRows.map((r) => ({ weekday: r.weekday, hour: r.hour, views: r.views })),
    live: {
      last30min: liveRow[0]?.m30 ?? 0,
      lastHourViews: liveRow[0]?.h1 ?? 0,
      todayVisitors: liveRow[0]?.today ?? 0,
      yesterdaySameTime: (liveRow[0] as { ydaySame?: number } | undefined)?.ydaySame ?? 0,
      lastSaleAt: saleRow[0]?.at ? new Date(saleRow[0].at) : null,
      recent: recentRows.map((r) => ({
        at: new Date(r.at),
        path: r.path,
        channel: channelOf(r.utm_source, r.referrer_host),
        place: r.city ?? r.country ?? "неизвестно",
        device: r.device,
        bot: r.bot,
      })),
    },
  };
}
