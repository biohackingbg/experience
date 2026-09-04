import "server-only";

import { desc, inArray, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, signups, tickets } from "@/lib/db/schema";
import { PENDING_HOLD_MINUTES } from "@/lib/orders";
import { KEPT_CENTS, SOLD } from "@/lib/sold";
import { TIERS, VAT_RATE, type TierId } from "@/lib/tickets";

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
};

export type DailySales = {
  day: string;
  orders: number;
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
  /** When the money landed; null until it does. The date shown for a sale. */
  paidAt: Date | null;
  /** Set when the buyer asked for a company invoice - the accountant's flag. */
  company: string | null;
  phone: string | null;
  items: string;
};

/** One of the last seven Sofia days, zero-filled - the week strip on the dashboard. */
export type WeekDay = { day: string; label: string; orders: number; grossCents: number; today: boolean };

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
  ticketsSold: number;
  capacityTotal: number;
  /** Paid tickets in the last seven days - the pace the room is filling at. */
  soldLast7Days: number;
  /** Sofia calendar days, so "today" is the team's today. */
  soldToday: number;
  soldYesterday: number;
  /** Whole days until doors open, never below one - the pace line divides by it. */
  daysToEvent: number;
  signupCount: number;
  checkedIn: number;
  perTier: TierSales[];
  daily: DailySales[];
  recent: RecentOrder[];
};

/** Doors open on the first festival morning. */
const EVENT_DAY = new Date("2026-11-07T09:00:00+02:00");

export async function getDashboardData(): Promise<DashboardData> {
  const db = getDb();
  // Read once here, on the server, rather than in the page's render - React
  // treats a clock read during render as impure, and it is right to.
  const daysToEvent = Math.max(1, Math.ceil((EVENT_DAY.getTime() - Date.now()) / 86_400_000));
  // The last seven Sofia calendar days, oldest first, for the week strip.
  const sofiaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" });
  const weekDays = Array.from({ length: 7 }, (_, i) => sofiaDay.format(new Date(Date.now() - (6 - i) * 86_400_000)));

  const [totals, perTierRows, dailyRows, recentRows, signupRow, last7Row, checkedInRow, dayRow, oddRows] =
    await Promise.all([
      db
        .select({
          gross: sql<number>`coalesce(sum(${KEPT_CENTS}) filter (where ${SOLD}), 0)::int`,
          vat: sql<number>`coalesce(sum(round(${orders.vatCents} * ${KEPT_CENTS}::numeric / nullif(${orders.totalCents}, 0))) filter (where ${SOLD}), 0)::int`,
          paid: sql<number>`count(*) filter (where ${SOLD})::int`,
          refunded: sql<number>`count(*) filter (where not ${orders.isTest} and (${orders.status} = 'refunded' or coalesce(${orders.refundedCents}, 0) >= ${orders.totalCents}))::int`,
          test: sql<number>`count(*) filter (where ${orders.isTest})::int`,
          // Still inside the seat hold - a payment may yet land.
          pending: sql<number>`count(*) filter (where ${orders.status} = 'pending' and not ${orders.isTest} and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')::int`,
          // Hold expired without payment: the checkout was closed. Their seats
          // are already free again; kept as a number because a rising count
          // is a signal about the checkout, not a to-do.
          abandoned: sql<number>`count(*) filter (where ${orders.status} = 'pending' and not ${orders.isTest} and ${orders.createdAt} <= now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')::int`,
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
        .where(SOLD)
        .groupBy(orderItems.tierId),

      db
        .select({
          day: sql<string>`to_char(${orders.paidAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
          gross: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        })
        .from(orders)
        .where(sql`${SOLD} and ${orders.paidAt} is not null`)
        .groupBy(sql`to_char(${orders.paidAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${orders.paidAt}, 'YYYY-MM-DD')`),

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
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(25),

      db.select({ n: sql<number>`count(*)::int` }).from(signups),

      db
        .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
        .from(orderItems)
        .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
        .where(sql`${SOLD} and ${orders.paidAt} > now() - interval '7 days'`),

      db
        .select({
          n: sql<number>`count(*) filter (where ${tickets.checkedInAt} is not null)::int`,
        })
        .from(tickets),

      db
        .select({
          today: sql<number>`coalesce(sum(${orderItems.quantity}) filter (where (${orders.paidAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date), 0)::int`,
          yesterday: sql<number>`coalesce(sum(${orderItems.quantity}) filter (where (${orders.paidAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date - 1), 0)::int`,
        })
        .from(orderItems)
        .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
        .where(SOLD),

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
          items: sql<number>`(select coalesce(sum(i.quantity), 0) from order_items i where i.order_id = ${orders.id})::int`,
          tickets: sql<number>`(select count(*) from tickets t where t.order_id = ${orders.id})::int`,
          hasStripe: sql<boolean>`${orders.stripePaymentIntentId} is not null`,
          refundedCents: orders.refundedCents,
        })
        .from(orders)
        .where(sql`${orders.status} = 'paid' and not ${orders.isTest} and (
          ${orders.stripePaymentIntentId} is null and ${orders.totalCents} > 0
          or not exists (select 1 from tickets t where t.order_id = ${orders.id})
          or not exists (select 1 from order_items i where i.order_id = ${orders.id})
          or coalesce(${orders.refundedCents}, 0) >= ${orders.totalCents}
        )`)
        .orderBy(desc(orders.createdAt))
        .limit(20),
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

  const soldByTier = new Map(perTierRows.map((r) => [r.tierId, r]));

  const perTier: TierSales[] = TIERS.map((tier) => ({
    id: tier.id,
    name: tier.name,
    capacity: tier.capacity,
    sold: soldByTier.get(tier.id)?.sold ?? 0,
    grossCents: soldByTier.get(tier.id)?.gross ?? 0,
  }));

  const grossCents = totals[0]?.gross ?? 0;
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
      ...(o.tickets === 0 ? ["няма издадени билети"] : []),
      ...(!o.hasStripe && o.totalCents > 0 ? ["няма плащане в Stripe"] : []),
      ...((o.refundedCents ?? 0) >= o.totalCents && o.totalCents > 0 ? ["върната изцяло по сума - не се брои"] : []),
    ],
  }));

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
    ticketsSold: perTier.reduce((sum, t) => sum + t.sold, 0),
    capacityTotal: TIERS.reduce((sum, t) => sum + t.capacity, 0),
    soldLast7Days: last7Row[0]?.n ?? 0,
    soldToday: dayRow[0]?.today ?? 0,
    soldYesterday: dayRow[0]?.yesterday ?? 0,
    daysToEvent,
    signupCount: signupRow[0]?.n ?? 0,
    checkedIn: checkedInRow[0]?.n ?? 0,
    perTier,
    daily: dailyRows.map((r) => ({
      day: r.day,
      orders: r.count,
      grossCents: r.gross,
    })),
    week: weekDays.map((day, i) => {
      const row = dailyRows.find((r) => r.day === day);
      const weekday = new Date(`${day}T12:00:00+03:00`).getDay();
      return {
        day,
        label: ["Н", "П", "В", "С", "Ч", "П", "С"][weekday],
        orders: row?.count ?? 0,
        grossCents: row?.gross ?? 0,
        today: i === 6,
      };
    }),
    recent: recentRows.map((o) => ({
      reference: o.reference,
      name: o.name,
      email: o.email,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      company: o.company,
      phone: o.phone,
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
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    company: o.company,
    phone: o.phone,
    isTest: o.isTest,
    items: items.filter((i) => i.orderId === o.id).map((i) => `${i.quantity}× ${i.tierName}`).join(", "),
    tickets: tix
      .filter((t) => t.orderId === o.id)
      .map((t) => ({ code: t.code, tierName: tierName.get(t.tierId) ?? t.tierId, checkedIn: !!t.checkedInAt })),
  }));
}
