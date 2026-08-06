import "server-only";

import { desc, inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, signups, tickets } from "@/lib/db/schema";
import { TIERS, VAT_RATE, type TierId } from "@/lib/tickets";

/**
 * Everything the dashboard shows, in one round of queries.
 *
 * Only `paid` orders count towards revenue and sold seats — a pending order is
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
  items: string;
};

export type DashboardData = {
  grossCents: number;
  netCents: number;
  vatCents: number;
  paidOrders: number;
  pendingOrders: number;
  ticketsSold: number;
  capacityTotal: number;
  signupCount: number;
  checkedIn: number;
  perTier: TierSales[];
  daily: DailySales[];
  recent: RecentOrder[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const db = getDb();

  const [totals, perTierRows, dailyRows, recentRows, signupRow, checkedInRow] =
    await Promise.all([
      db
        .select({
          gross: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} = 'paid'), 0)::int`,
          vat: sql<number>`coalesce(sum(${orders.vatCents}) filter (where ${orders.status} = 'paid'), 0)::int`,
          paid: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
          pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
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
        .where(sql`${orders.status} = 'paid'`)
        .groupBy(orderItems.tierId),

      db
        .select({
          day: sql<string>`to_char(${orders.paidAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
          gross: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
        })
        .from(orders)
        .where(sql`${orders.status} = 'paid' and ${orders.paidAt} is not null`)
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
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(25),

      db.select({ n: sql<number>`count(*)::int` }).from(signups),

      db
        .select({
          n: sql<number>`count(*) filter (where ${tickets.checkedInAt} is not null)::int`,
        })
        .from(tickets),
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

  return {
    grossCents,
    vatCents,
    netCents: grossCents - vatCents,
    paidOrders: totals[0]?.paid ?? 0,
    pendingOrders: totals[0]?.pending ?? 0,
    ticketsSold: perTier.reduce((sum, t) => sum + t.sold, 0),
    capacityTotal: TIERS.reduce((sum, t) => sum + t.capacity, 0),
    signupCount: signupRow[0]?.n ?? 0,
    checkedIn: checkedInRow[0]?.n ?? 0,
    perTier,
    daily: dailyRows.map((r) => ({
      day: r.day,
      orders: r.count,
      grossCents: r.gross,
    })),
    recent: recentRows.map((o) => ({
      reference: o.reference,
      name: o.name,
      email: o.email,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      items: (itemsByOrder.get(o.id) ?? []).join(", "),
    })),
  };
}

export { VAT_RATE };
