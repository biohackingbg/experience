import "server-only";

import { createHash } from "node:crypto";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, signups, siteViews } from "@/lib/db/schema";

/**
 * Our own visit counting for the public site.
 *
 * Written instead of adding Google Analytics or Vercel Analytics for two
 * reasons: the numbers stay in our database rather than a third party's, and
 * because nothing is stored on the visitor's device there is no consent
 * banner to put in front of people who came to buy a ticket.
 *
 * What it answers is deliberately narrow - how many came, what they opened,
 * where from, and how many of them reached the checkout. Anything finer than
 * that would need consent, and would not change a decision we actually make.
 */

/** Paths we never record: the admin side and the partner deck, which counts itself. */
const IGNORED = ["/admin", "/za-partniori", "/api"];

/**
 * Same person, same day, same number. The salt changes at midnight UTC, so
 * yesterday's rows cannot be matched to today's and no row can be tested
 * against a suspected address without also knowing the server secret.
 */
function dailySalt(): string {
  // Any server-only secret works; DATABASE_URL is always set, so tracking
  // never silently degrades because an extra variable was forgotten.
  const secret = process.env.ANALYTICS_SALT ?? process.env.DATABASE_URL ?? "";
  return `${secret}:${new Date().toISOString().slice(0, 10)}`;
}

export function visitorHash(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${dailySalt()}|${ip}|${userAgent}`)
    .digest("base64url")
    .slice(0, 22);
}

/** Query strings carry campaign tags and sometimes an email; the path is enough. */
export function cleanPath(raw: string): string | null {
  const path = raw.split("?")[0]?.split("#")[0]?.trim() ?? "";
  if (!path.startsWith("/") || path.length > 120) return null;
  if (IGNORED.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return path.length > 1 ? path.replace(/\/+$/, "") : "/";
}

export async function recordSiteView(row: {
  path: string;
  visitor: string;
  referrerHost: string | null;
  device: string | null;
  country: string | null;
  city: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
}): Promise<void> {
  await getDb().insert(siteViews).values(row);
}

export type FunnelStep = {
  label: string;
  value: number;
  /** Share of the step above it, or null for the first step. */
  ofPrev: number | null;
  hint: string;
};

export type TrafficData = {
  days: number;
  tracking: boolean;
  views: number;
  visitors: number;
  todayVisitors: number;
  funnel: FunnelStep[];
  /**
   * Kept out of the funnel: while the tickets are not on sale the waiting
   * list is the real conversion, but it is a different question and mixing
   * the two would make both percentages meaningless.
   */
  signups: number;
  topPages: { path: string; views: number; visitors: number }[];
  referrers: { host: string; n: number }[];
  places: { place: string; n: number }[];
  devices: { device: string; n: number }[];
  daily: { day: string; views: number; visitors: number }[];
};

const pct = (part: number, whole: number): number | null =>
  whole > 0 ? Math.round((part / whole) * 100) : null;

export async function getTrafficData(days = 30): Promise<TrafficData> {
  const db = getDb();
  const since = sql.raw(`now() - interval '${Math.max(1, Math.min(365, days))} days'`);

  const [totals, ticketRow, orderRow, signupRow, pages, refs, places, devices, daily] =
    await Promise.all([
      db
        .select({
          views: sql<number>`count(*)::int`,
          visitors: sql<number>`count(distinct ${siteViews.visitor})::int`,
          today: sql<number>`count(distinct ${siteViews.visitor}) filter (where ${siteViews.createdAt} >= date_trunc('day', now()))::int`,
        })
        .from(siteViews)
        .where(sql`${siteViews.createdAt} >= ${since}`),

      db
        .select({ n: sql<number>`count(distinct ${siteViews.visitor})::int` })
        .from(siteViews)
        .where(sql`${siteViews.createdAt} >= ${since} and ${siteViews.path} like '/bilet%'`),

      db
        .select({
          started: sql<number>`count(*)::int`,
          paid: sql<number>`count(*) filter (where ${orders.status} in ('paid', 'refunded') and not ${orders.isTest})::int`,
        })
        .from(orders)
        .where(sql`${orders.createdAt} >= ${since}`),

      db
        .select({ n: sql<number>`count(*)::int` })
        .from(signups)
        .where(sql`${signups.createdAt} >= ${since}`),

      db
        .select({
          path: siteViews.path,
          views: sql<number>`count(*)::int`,
          visitors: sql<number>`count(distinct ${siteViews.visitor})::int`,
        })
        .from(siteViews)
        .where(sql`${siteViews.createdAt} >= ${since}`)
        .groupBy(siteViews.path)
        .orderBy(sql`count(*) desc`)
        .limit(12),

      db
        .select({ host: siteViews.referrerHost, n: sql<number>`count(*)::int` })
        .from(siteViews)
        .where(sql`${siteViews.createdAt} >= ${since} and ${siteViews.referrerHost} is not null`)
        .groupBy(siteViews.referrerHost)
        .orderBy(sql`count(*) desc`)
        .limit(10),

      db
        .select({
          place: sql<string>`coalesce(${siteViews.city}, ${siteViews.country}, 'неизвестно')`,
          n: sql<number>`count(distinct ${siteViews.visitor})::int`,
        })
        .from(siteViews)
        .where(sql`${siteViews.createdAt} >= ${since}`)
        .groupBy(sql`coalesce(${siteViews.city}, ${siteViews.country}, 'неизвестно')`)
        .orderBy(sql`count(distinct ${siteViews.visitor}) desc`)
        .limit(8),

      db
        .select({
          device: sql<string>`coalesce(${siteViews.device}, 'неизвестно')`,
          n: sql<number>`count(distinct ${siteViews.visitor})::int`,
        })
        .from(siteViews)
        .where(sql`${siteViews.createdAt} >= ${since}`)
        .groupBy(sql`coalesce(${siteViews.device}, 'неизвестно')`),

      db
        .select({
          day: sql<string>`to_char(${siteViews.createdAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`,
          views: sql<number>`count(*)::int`,
          visitors: sql<number>`count(distinct ${siteViews.visitor})::int`,
        })
        .from(siteViews)
        .where(sql`${siteViews.createdAt} >= ${since}`)
        .groupBy(sql`to_char(${siteViews.createdAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${siteViews.createdAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`),
    ]);

  const visitors = totals[0]?.visitors ?? 0;
  const onTickets = ticketRow[0]?.n ?? 0;
  const started = orderRow[0]?.started ?? 0;
  const paid = orderRow[0]?.paid ?? 0;

  const funnel: FunnelStep[] = [
    {
      label: "Посетители",
      value: visitors,
      ofPrev: null,
      hint: "различни хора, отворили сайта",
    },
    {
      label: "Отворили билетите",
      value: onTickets,
      ofPrev: pct(onTickets, visitors),
      hint: "стигнали до страницата с билетите",
    },
    {
      label: "Стигнали до плащане",
      value: started,
      ofPrev: pct(started, onTickets),
      hint: "натиснали „Купи“ и отишли към Stripe",
    },
    {
      label: "Платили",
      value: paid,
      ofPrev: pct(paid, started),
      hint: "завършени поръчки",
    },
  ];

  return {
    days,
    // Nothing recorded yet means tracking has not been live long enough,
    // not that nobody came - the dashboard should say so rather than show 0.
    tracking: (totals[0]?.views ?? 0) > 0,
    views: totals[0]?.views ?? 0,
    visitors,
    todayVisitors: totals[0]?.today ?? 0,
    funnel,
    topPages: pages,
    referrers: refs.filter((r): r is { host: string; n: number } => !!r.host),
    places,
    devices,
    daily,
    signups: signupRow[0]?.n ?? 0,
  };
}
