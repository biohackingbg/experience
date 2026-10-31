import "server-only";

import { desc, inArray, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { genderSplit } from "@/lib/gender";
import { campaigns, orderItems, orders, signups, tickets } from "@/lib/db/schema";
import { PENDING_HOLD_MINUTES } from "@/lib/orders";
import { COMPED, GIFT, KEPT_CENTS, SALE, SOLD } from "@/lib/sold";
import { sofiaDaysBack } from "@/lib/sofia-days";
import { TIERS, VAT_RATE, type TierId, picksDay } from "@/lib/tickets";

/**
 * Everything the dashboard shows, in one round of queries.
 *
 * Only `paid` orders count towards revenue and sold seats - a pending order is
 * an abandoned checkout until Stripe confirms it, and counting those would
 * overstate both the money and how full the room is.
 */

export type TierSales = {
  id: TierId;
  name: string;
  sold: number;
  capacity: number;
  grossCents: number;
  /** Gift tickets of this tier (a gift promo code): seated like a sale, but not one. */
  gift: number;
  /**
   * For the tiers that admit one day: how the tickets split between the two.
   * `unset` are the ones sold or issued before the choice existed - they
   * admit either day, and pretending otherwise would misplan the room.
   */
  days?: { saturday: number; sunday: number; unset: number };
};

export type DailySales = {
  day: string;
  orders: number;
  tickets: number;
  grossCents: number;
};

export type RecentOrder = {
  reference: string;
  name: string;
  email: string;
  status: string;
  totalCents: number;
  createdAt: Date;
  /** Marked by the team as a test purchase - skipped by every statistic. */
  isTest: boolean;
  /** Analytics session the sale is tied to; null when the buyer refused statistics. */
  gaSessionId: string | null;
  /** When the money landed; null until it does. The date shown for a sale. */
  paidAt: Date | null;
  /** Set when the buyer asked for a company invoice - the accountant's flag. */
  company: string | null;
  phone: string | null;
  /** The promo code the buyer entered, and what it took off - null for a full-price sale. */
  promoCode: string | null;
  discountCents: number;
  /** The team's note on an order it issued by hand (partner, speaker, guest); null on a bought one. */
  note?: string | null;
  items: string;
};

/** One of the last seven Sofia days, zero-filled - the week strip on the dashboard. */
export type WeekDay = {
  day: string;
  label: string;
  orders: number;
  tickets: number;
  /** Free tickets that day: gift-code ones, and every other kind - drawn on top of the sales, never counted in them. */
  gift: number;
  free: number;
  /** Tickets and money of each tier that day, in tier order, only the ones sold. */
  byTier: { id: TierId; name: string; n: number; grossCents: number }[];
  grossCents: number;
  today: boolean;
  /** Tickets that day whose order arrived through a tagged link, per campaign code. */
  tagged: { code: string; title: string | null; n: number }[];
};

/** A row of the marketing log, placed on the sales timeline. */
export type Launch = { day: string; title: string; platform: string; kind: string; code: string | null; spendCents: number };

/** A paid order that does not look like a sale: no tickets, no items, or no payment behind it. */
export type OddOrder = {
  reference: string;
  name: string;
  email: string;
  totalCents: number;
  paidAt: Date | null;
  isTest: boolean;
  issues: string[];
};

export type DashboardData = {
  week: WeekDay[];
  /** Every Sofia day from the first sale to today, zero-filled, same shape as the week - the long chart. */
  history: WeekDay[];
  /** What marketing did, by day - drawn under the long chart. */
  launches: Launch[];
  /** What the sold figures leave out or should not include - for the team to look at, not for the count. */
  odd: OddOrder[];
  grossCents: number;
  netCents: number;
  vatCents: number;
  paidOrders: number;
  pendingOrders: number;
  abandonedOrders: number;
  refundedOrders: number;
  /** Orders marked as the team's own tests - skipped by every figure here. */
  testOrders: number;
  /** Bank-transfer orders still waiting for the money. */
  bankPending: number;
  ticketsSold: number;
  /** Issued at no charge - speakers, partners, the team. Seated, not sold. */
  ticketsComped: number;
  compedByTier: { id: TierId; name: string; count: number }[];
  /** Of the free tickets, those given through a gift code - drawn in their own colour. */
  ticketsGift: number;
  /** Free tickets that landed today (Sofia day): gift codes, and every other kind. */
  giftToday: number;
  freeToday: number;
  capacityTotal: number;
  /** Paid tickets in the last seven days - the pace the room is filling at. */
  soldLast7Days: number;
  /** Sofia calendar days, so "today" is the team's today. */
  soldToday: number;
  soldYesterday: number;
  /** Whole days until doors open, never below one - the pace line divides by it. */
  daysToEvent: number;
  signupCount: number;
  /** Joined in the last seven days - whether the list is actually growing. */
  signupWeek: number;
  checkedIn: number;
  perTier: TierSales[];
  daily: DailySales[];
  /** Paid orders by hour of the Sofia day, 0-23, and by weekday, Monday first. */
  byHour: number[];
  byWeekday: number[];
  /** The last three weeks, one row per day: which hour each order landed in. */
  punch: { day: string; hours: number[] }[];
  /** Buyers by an estimate from the name - see lib/gender.ts. */
  buyers: { female: number; male: number; unknown: number };
  recent: RecentOrder[];
  /** Which page of "Последни продажби" this is (1 = newest), how many rows a page holds, and how many sales there are in all. */
  recentPage: number;
  recentPageSize: number;
  recentTotal: number;
  /** The filter the list was cut with, how many tickets the matching orders hold, and the promo codes that exist to pick from. */
  recentFilter: RecentFilter;
  recentTickets: number;
  promoCodes: { code: string; orders: number }[];
};

/** What the sales list can be narrowed to. Empty = no narrowing on that axis. */
export type RecentFilter = {
  tier: "" | TierId;
  /** Upper-case promo code, "none" for orders without one, or "" for any. */
  code: string;
  kind: "" | "sale" | "gift" | "issued";
};

/** Doors open on the first festival morning. */
const EVENT_DAY = new Date("2026-11-07T09:00:00+02:00");

/** Rows on one page of the sales list. */
export const RECENT_PAGE_SIZE = 25;

export async function getDashboardData(page = 1, filter: RecentFilter = { tier: "", code: "", kind: "" }): Promise<DashboardData> {
  const db = getDb();
  // The sales list, narrowed. A tier matches an order that holds a ticket of it.
  const recentWhere = sql.join(
    [
      sql`${orders.status} in ('paid', 'refunded')`,
      filter.tier ? sql`exists (select 1 from ${orderItems} where ${orderItems.orderId} = ${orders.id} and ${orderItems.tierId} = ${filter.tier})` : undefined,
      filter.code === "none" ? sql`${orders.promoCode} is null` : filter.code ? sql`upper(${orders.promoCode}) = ${filter.code}` : undefined,
      filter.kind === "issued" ? sql`${orders.paymentMethod} = 'admin'` : filter.kind === "gift" ? sql`${orders.totalCents} = 0` : filter.kind === "sale" ? sql`${orders.totalCents} > 0` : undefined,
    ].filter((x): x is NonNullable<typeof x> => x !== undefined),
    sql` and `,
  );
  const recentPage = Math.max(1, Math.floor(page) || 1);
  // Read once here, on the server, rather than in the page's render - React
  // treats a clock read during render as impure, and it is right to.
  const daysToEvent = Math.max(1, Math.ceil((EVENT_DAY.getTime() - Date.now()) / 86_400_000));
  // The last seven Sofia calendar days, oldest first, for the week strip.
  const sofiaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" });
  // Fourteen days: seven made the bars thick and the picture short.
  const WINDOW = 14;
  const weekDays = sofiaDaysBack(WINDOW);

  const [totals, perTierRows, dailyRows, dayTierRows, recentRows, signupRow, last7Row, checkedInRow, daySplitRows, dayRow, oddRows, hourRows, weekdayRows, punchRows, buyerNames, compedRows, taggedRows, launchRows] =
    await Promise.all([
      db
        .select({
          gross: sql<number>`coalesce(sum(${KEPT_CENTS}) filter (where ${SALE}), 0)::int`,
          vat: sql<number>`coalesce(sum(round(${orders.vatCents} * ${KEPT_CENTS}::numeric / nullif(${orders.totalCents}, 0))) filter (where ${SALE}), 0)::int`,
          paid: sql<number>`count(*) filter (where ${SALE})::int`,
          refunded: sql<number>`count(*) filter (where not ${orders.isTest} and (${orders.status} = 'refunded' or coalesce(${orders.refundedCents}, 0) >= ${orders.totalCents}))::int`,
          test: sql<number>`count(*) filter (where ${orders.isTest})::int`,
          // Still inside the seat hold - a payment may yet land.
          bank: sql<number>`count(*) filter (where ${orders.status} = 'pending' and not ${orders.isTest} and ${orders.paymentMethod} = 'bank')::int`,
          pending: sql<number>`count(*) filter (where ${orders.status} = 'pending' and not ${orders.isTest} and ${orders.paymentMethod} = 'card' and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')::int`,
          // Hold expired without payment: the checkout was closed. Their seats
          // are already free again; kept as a number because a rising count
          // is a signal about the checkout, not a to-do.
          abandoned: sql<number>`count(*) filter (where ${orders.status} = 'pending' and not ${orders.isTest} and ${orders.paymentMethod} = 'card' and ${orders.createdAt} <= now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')::int`,
        })
        .from(orders),

      db
        .select({
          tierId: orderItems.tierId,
          sold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
          gross: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)::int`,
        })
        .from(orderItems)
        .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
        .where(SALE)
        .groupBy(orderItems.tierId),

      db
        .select({
          day: sql<string>`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
          // Tickets, not orders: one order can carry three seats, and the
          // week is read as "how many people did we sell to today".
          // `orders.id` spelled out: inside the correlated subquery Drizzle's
          // rendering of the column did not resolve to the outer row, and every
          // day came back as zero tickets. The raw name does, and the query
          // selects from "orders" under its own name.
          tickets: sql<number>`coalesce(sum((select sum(oi.quantity) from order_items oi where oi.order_id = orders.id)), 0)::int`,
          gross: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        })
        .from(orders)
        .where(sql`${SALE} and ${orders.paidAt} is not null`)
        .groupBy(sql`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`),

      // The same days, split by tier - what the strip shows on hover.
      db
        .select({
          day: sql<string>`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`,
          tierId: orderItems.tierId,
          n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
          gross: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)::int`,
        })
        .from(orderItems)
        .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
        .where(sql`${SALE} and ${orders.paidAt} is not null`)
        .groupBy(sql`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`, orderItems.tierId),

      db
        .select({
          id: orders.id,
          reference: orders.reference,
          name: orders.name,
          email: orders.email,
          status: orders.status,
          totalCents: orders.totalCents,
          createdAt: orders.createdAt,
          paidAt: orders.paidAt,
          company: orders.invoiceCompany,
          phone: orders.phone,
          isTest: orders.isTest,
          // Whether Analytics can tie this sale to a session - and so to the
          // advert that brought it. Shown per order, because when it broke
          // it broke silently, for a month, for every sale.
          gaSessionId: orders.gaSessionId,
          promoCode: orders.promoCode,
          discountCents: orders.discountCents,
          note: orders.note,
        })
        .from(orders)
        // Sales only. An unfinished checkout is not an order the team can act
        // on here; it has its own card, and mixed in it read as a sale.
        .where(recentWhere)
        .orderBy(desc(orders.createdAt))
        .limit(RECENT_PAGE_SIZE)
        .offset((recentPage - 1) * RECENT_PAGE_SIZE),

      db.select({ n: sql<number>`count(*) filter (where ${signups.unsubscribedAt} is null)::int`, week: sql<number>`count(*) filter (where ${signups.unsubscribedAt} is null and ${signups.createdAt} > now() - interval '7 days')::int` }).from(signups),

      db
        .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
        .from(orderItems)
        .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
        .where(sql`${SALE} and ${orders.paidAt} > now() - interval '7 days'`),

      db
        .select({
          n: sql<number>`count(*) filter (where ${tickets.checkedInAt} is not null)::int`,
        })
        .from(tickets),

      // A one-day ticket names its day; this is how the two days split.
      db
        .select({
          tierId: tickets.tierId,
          saturday: sql<number>`count(*) filter (where ${tickets.day} = 1)::int`,
          sunday: sql<number>`count(*) filter (where ${tickets.day} = 2)::int`,
          unset: sql<number>`count(*) filter (where ${tickets.day} is null)::int`,
        })
        .from(tickets)
        .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
        .where(SOLD)
        .groupBy(tickets.tierId),

      db
        .select({
          today: sql<number>`coalesce(sum(${orderItems.quantity}) filter (where (${orders.paidAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date), 0)::int`,
          yesterday: sql<number>`coalesce(sum(${orderItems.quantity}) filter (where (${orders.paidAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date - 1), 0)::int`,
        })
        .from(orderItems)
        .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
        .where(SALE),

      // Paid orders that do not add up: counted as an order but with no
      // tickets or items behind them, or paid with nothing from Stripe and
      // not a free order either. Shown, never silently dropped.
      db
        .select({
          reference: orders.reference,
          name: orders.name,
          email: orders.email,
          totalCents: orders.totalCents,
          paidAt: orders.paidAt,
          isTest: orders.isTest,
          // "orders.id" spelled out: in a SELECT field Drizzle drops the
          // table qualifier, and a bare "id" would bind to the subquery's own
          // table - so every order looked like it had no items and no tickets.
          items: sql<number>`(select coalesce(sum(i.quantity), 0) from order_items i where i.order_id = orders.id)::int`,
          tickets: sql<number>`(select count(*) from tickets t where t.order_id = orders.id)::int`,
          hasStripe: sql<boolean>`${orders.stripePaymentIntentId} is not null`,
          isUpgrade: sql<boolean>`${orders.upgradesTicketCode} is not null`,
          refundedCents: orders.refundedCents,
        })
        .from(orders)
        .where(sql`${orders.status} = 'paid' and not ${orders.isTest} and (
          ${orders.stripePaymentIntentId} is null and ${orders.totalCents} > 0 and ${orders.paymentMethod} = 'card'
          or (not exists (select 1 from tickets t where t.order_id = ${orders.id}) and ${orders.upgradesTicketCode} is null)
          or not exists (select 1 from order_items i where i.order_id = ${orders.id})
          or (${orders.totalCents} > 0 and coalesce(${orders.refundedCents}, 0) >= ${orders.totalCents})
        )`)
        .orderBy(desc(orders.createdAt))
        .limit(20),

      // When people actually pay, in Sofia time - the hour is what a post or a
      // letter can be aimed at, and it is meaningless in UTC.
      db
        .select({
          hour: sql<number>`extract(hour from ${orders.paidAt} at time zone 'Europe/Sofia')::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(sql`${SALE} and ${orders.paidAt} is not null`)
        .groupBy(sql`extract(hour from ${orders.paidAt} at time zone 'Europe/Sofia')`),

      db
        .select({
          dow: sql<number>`extract(isodow from ${orders.paidAt} at time zone 'Europe/Sofia')::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(sql`${SALE} and ${orders.paidAt} is not null`)
        .groupBy(sql`extract(isodow from ${orders.paidAt} at time zone 'Europe/Sofia')`),

      // Day and hour together: the pattern reads down the columns, a single
      // day's answer to a post reads across its row.
      db
        .select({
          day: sql<string>`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`,
          hour: sql<number>`extract(hour from ${orders.paidAt} at time zone 'Europe/Sofia')::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(sql`${SALE} and ${orders.paidAt} > now() - interval '21 days'`)
        .groupBy(
          sql`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`,
          sql`extract(hour from ${orders.paidAt} at time zone 'Europe/Sofia')`,
        ),

      // Only the names, for the aggregate estimate of who is buying.
      db.select({ name: orders.name }).from(orders).where(SOLD),

      // Tickets issued at no charge: seated, not sold. Their own card.
      db
        .select({ tierId: tickets.tierId, count: sql<number>`count(*)::int` })
        .from(tickets)
        .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
        .where(COMPED)
        .groupBy(tickets.tierId),

      // Sales that arrived through a tagged link, per day and campaign code:
      // the one certain tie between a day's bar and an advert.
      db
        .select({
          day: sql<string>`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`,
          code: orders.utmCampaign,
          tickets: sql<number>`coalesce(sum((select sum(oi.quantity) from order_items oi where oi.order_id = orders.id)), 0)::int`,
        })
        .from(orders)
        .where(sql`${SALE} and ${orders.paidAt} is not null and ${orders.utmCampaign} is not null`)
        .groupBy(sql`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`, orders.utmCampaign),

      // The marketing log: when each post or advert went out.
      db
        .select({ postedAt: campaigns.postedAt, title: campaigns.title, platform: campaigns.platform, kind: campaigns.kind, code: campaigns.utmCampaign, spendCents: campaigns.spendCents })
        .from(campaigns)
        .orderBy(campaigns.postedAt),
    ]);

  // Items for the listed orders, fetched separately and stitched in JS. A
  // correlated subquery read better but returned empty through the query
  // builder, and two plain queries over 25 rows cost nothing.
  const itemRows = recentRows.length
    ? await db
        .select({
          orderId: orderItems.orderId,
          tierName: orderItems.tierName,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            recentRows.map((o) => o.id),
          ),
        )
    : [];

  const itemsByOrder = new Map<string, string[]>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(`${item.quantity}× ${item.tierName}`);
    itemsByOrder.set(item.orderId, list);
  }

  // Gift tickets, per tier and today. Their own queries: the free total above
  // lumps speakers, partners and gifts together, and a gift is the one kind the
  // team wants to tell apart from a sale at a glance.
  const todaySofia = sql`(${orders.paidAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date`;
  const [giftRows, freeTodayRows, [recentTotalRow], promoCodeRows, [recentTicketsRow]] = await Promise.all([
    db
      .select({ tierId: tickets.tierId, count: sql<number>`count(*)::int`, today: sql<number>`count(*) filter (where ${todaySofia})::int` })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      .where(sql`${COMPED} and ${GIFT}`)
      .groupBy(tickets.tierId),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      .where(sql`${COMPED} and not ${GIFT} and ${todaySofia}`),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(recentWhere),
    db
      .select({ code: sql<string>`upper(${orders.promoCode})`, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`${orders.status} in ('paid', 'refunded') and ${orders.promoCode} is not null`)
      .groupBy(sql`upper(${orders.promoCode})`)
      .orderBy(sql`upper(${orders.promoCode})`),
    // Tickets, not orders: the tier filter counts only the tickets of that tier.
    db
      .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
      .from(orderItems)
      .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
      .where(filter.tier ? sql`${recentWhere} and ${orderItems.tierId} = ${filter.tier}` : recentWhere),
  ]);
  const giftByTier = new Map(giftRows.map((r) => [r.tierId, r.count]));

  // Free tickets per day, for the bar charts: a day that was mostly gifts must
  // not look like a quiet one, nor like a good one.
  const freeDayRows = await db
    .select({
      day: sql<string>`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`,
      gift: sql<number>`count(*) filter (where ${GIFT})::int`,
      other: sql<number>`count(*) filter (where not ${GIFT})::int`,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${COMPED} and ${orders.paidAt} is not null`)
    .groupBy(sql`to_char(${orders.paidAt} at time zone 'Europe/Sofia', 'YYYY-MM-DD')`);

  const soldByTier = new Map(perTierRows.map((r) => [r.tierId, r]));
  const daysByTier = new Map(daySplitRows.map((r) => [r.tierId, r]));

  const perTier: TierSales[] = TIERS.map((tier) => ({
    id: tier.id,
    name: tier.name,
    capacity: tier.capacity,
    sold: soldByTier.get(tier.id)?.sold ?? 0,
    grossCents: soldByTier.get(tier.id)?.gross ?? 0,
    gift: giftByTier.get(tier.id) ?? 0,
    days: picksDay(tier.id)
      ? {
          saturday: daysByTier.get(tier.id)?.saturday ?? 0,
          sunday: daysByTier.get(tier.id)?.sunday ?? 0,
          unset: daysByTier.get(tier.id)?.unset ?? 0,
        }
      : undefined,
  }));

  const grossCents = totals[0]?.gross ?? 0;

  // One day of the strip, from the per-day and per-day-per-tier rows.
  const dayOf = (day: string, today: boolean): WeekDay => {
    const row = dailyRows.find((r) => r.day === day);
    return {
      day,
      // The day of the month: fourteen weekday letters repeat twice and say
      // nothing; a number places the bar in the month at a glance.
      label: String(Number(day.slice(-2))),
      orders: row?.count ?? 0,
      tickets: row?.tickets ?? 0,
      gift: freeDayRows.find((r) => r.day === day)?.gift ?? 0,
      free: freeDayRows.find((r) => r.day === day)?.other ?? 0,
      byTier: TIERS.map((t) => {
        const r = dayTierRows.find((x) => x.day === day && x.tierId === t.id);
        return { id: t.id, name: t.name, n: r?.n ?? 0, grossCents: r?.gross ?? 0 };
      }).filter((t) => t.n > 0),
      grossCents: row?.gross ?? 0,
      today,
      tagged: taggedRows
        .filter((r) => r.day === day && r.code)
        .map((r) => ({ code: r.code as string, title: launchRows.find((l) => l.code === r.code)?.title ?? null, n: r.tickets })),
    };
  };
  // Every day from the first sale to today. dailyRows is ordered by day and
  // only holds days with a sale, so the gaps are filled here.
  const firstDay = dailyRows[0]?.day ?? weekDays[0];
  const todayStr = weekDays[weekDays.length - 1];
  const historyDays: string[] = [];
  for (let t = Date.parse(firstDay + "T12:00:00Z"); ; t += 86_400_000) {
    const d = new Date(t).toISOString().slice(0, 10);
    historyDays.push(d);
    if (d >= todayStr || historyDays.length > 400) break;
  }
  const vatCents = totals[0]?.vat ?? 0;

  const odd: OddOrder[] = oddRows.map((o) => ({
    reference: o.reference,
    name: o.name,
    email: o.email,
    totalCents: o.totalCents,
    paidAt: o.paidAt,
    isTest: o.isTest,
    issues: [
      ...(o.items === 0 ? ["няма артикули - не влиза в „продадени билета“"] : []),
      // An upgrade moves an existing ticket up a tier and mints none of its own.
      ...(o.tickets === 0 && !o.isUpgrade ? ["няма издадени билети"] : []),
      ...(!o.hasStripe && o.totalCents > 0 ? ["няма плащане в Stripe"] : []),
      ...((o.refundedCents ?? 0) >= o.totalCents && o.totalCents > 0 ? ["върната изцяло по сума - не се брои"] : []),
    ],
  }));

  const punchDays = sofiaDaysBack(21);

  return {
    odd,
    grossCents,
    vatCents,
    netCents: grossCents - vatCents,
    paidOrders: totals[0]?.paid ?? 0,
    pendingOrders: totals[0]?.pending ?? 0,
    abandonedOrders: totals[0]?.abandoned ?? 0,
    refundedOrders: totals[0]?.refunded ?? 0,
    testOrders: totals[0]?.test ?? 0,
    bankPending: totals[0]?.bank ?? 0,
    ticketsSold: perTier.reduce((sum, t) => sum + t.sold, 0),
    ticketsComped: compedRows.reduce((sum, r) => sum + r.count, 0),
    compedByTier: TIERS.map((tier) => ({ id: tier.id, name: tier.name, count: compedRows.find((r) => r.tierId === tier.id)?.count ?? 0 })).filter((t) => t.count > 0),
    recentPage,
    recentPageSize: RECENT_PAGE_SIZE,
    recentTotal: recentTotalRow?.n ?? 0,
    recentFilter: filter,
    recentTickets: recentTicketsRow?.n ?? 0,
    promoCodes: promoCodeRows.map((r) => ({ code: r.code, orders: r.n })),
    ticketsGift: giftRows.reduce((sum, r) => sum + r.count, 0),
    giftToday: giftRows.reduce((sum, r) => sum + r.today, 0),
    freeToday: freeTodayRows[0]?.n ?? 0,
    capacityTotal: TIERS.reduce((sum, t) => sum + t.capacity, 0),
    soldLast7Days: last7Row[0]?.n ?? 0,
    soldToday: dayRow[0]?.today ?? 0,
    soldYesterday: dayRow[0]?.yesterday ?? 0,
    daysToEvent,
    signupCount: signupRow[0]?.n ?? 0,
    signupWeek: signupRow[0]?.week ?? 0,
    checkedIn: checkedInRow[0]?.n ?? 0,
    perTier,
    byHour: Array.from({ length: 24 }, (_, h) => hourRows.find((r) => r.hour === h)?.count ?? 0),
    // Every day of the window, including the empty ones - a gap in sales is
    // information, and a grid with days missing cannot show it.
    buyers: genderSplit(buyerNames.map((r) => r.name)),
    punch: Array.from({ length: 21 }, (_, i) => {
      const day = punchDays[i];
      return {
        day,
        hours: Array.from({ length: 24 }, (_, h) => punchRows.find((r) => r.day === day && r.hour === h)?.count ?? 0),
      };
    }),
    byWeekday: Array.from({ length: 7 }, (_, i) => weekdayRows.find((r) => r.dow === i + 1)?.count ?? 0),
    daily: dailyRows.map((r) => ({
      day: r.day,
      orders: r.count,
      tickets: r.tickets,
      grossCents: r.gross,
    })),
    week: weekDays.map((day, i) => dayOf(day, i === weekDays.length - 1)),
    history: historyDays.map((day, i) => dayOf(day, i === historyDays.length - 1)),
    launches: launchRows.map((l) => ({ day: sofiaDay.format(l.postedAt), title: l.title, platform: l.platform, kind: l.kind, code: l.code, spendCents: l.spendCents })),
    recent: recentRows.map((o) => ({
      reference: o.reference,
      name: o.name,
      email: o.email,
      status: o.status,
      gaSessionId: o.gaSessionId,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      company: o.company,
      phone: o.phone,
      promoCode: o.promoCode,
      discountCents: o.discountCents,
      note: o.note,
      isTest: o.isTest,
      items: (itemsByOrder.get(o.id) ?? []).join(", "),
    })),
  };
}

export { VAT_RATE };

export type FoundOrder = RecentOrder & {
  tickets: { code: string; tierName: string; checkedIn: boolean }[];
};

/**
 * The question that arrives by email: "I paid and have no ticket". Matches
 * an order number, an email or a name, and brings the tickets with it so the
 * answer - and the resend button - is one screen away.
 */
export async function searchOrders(q: string): Promise<FoundOrder[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const db = getDb();
  const like = `%${term.replace(/[%_]/g, "")}%`;

  const rows = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      name: orders.name,
      email: orders.email,
      status: orders.status,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      company: orders.invoiceCompany,
      phone: orders.phone,
      isTest: orders.isTest,
      gaSessionId: orders.gaSessionId,
      promoCode: orders.promoCode,
      discountCents: orders.discountCents,
    })
    .from(orders)
    .where(
      or(
        sql`${orders.reference} ilike ${like}`,
        sql`${orders.email} ilike ${like}`,
        sql`${orders.name} ilike ${like}`,
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(20);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [items, tix] = await Promise.all([
    db
      .select({ orderId: orderItems.orderId, tierName: orderItems.tierName, quantity: orderItems.quantity })
      .from(orderItems)
      .where(inArray(orderItems.orderId, ids)),
    db
      .select({ orderId: tickets.orderId, code: tickets.code, tierId: tickets.tierId, checkedInAt: tickets.checkedInAt })
      .from(tickets)
      .where(inArray(tickets.orderId, ids)),
  ]);
  const tierName = new Map<string, string>(TIERS.map((t) => [t.id, t.name]));

  return rows.map((o) => ({
    reference: o.reference,
    name: o.name,
    email: o.email,
    status: o.status,
    gaSessionId: o.gaSessionId,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    company: o.company,
    phone: o.phone,
    promoCode: o.promoCode,
    discountCents: o.discountCents,
    isTest: o.isTest,
    items: items.filter((i) => i.orderId === o.id).map((i) => `${i.quantity}× ${i.tierName}`).join(", "),
    tickets: tix
      .filter((t) => t.orderId === o.id)
      .map((t) => ({ code: t.code, tierName: tierName.get(t.tierId) ?? t.tierId, checkedIn: !!t.checkedInAt })),
  }));
}
