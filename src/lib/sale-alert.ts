import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { sendSaleAlert } from "@/lib/email";
import { SOLD } from "@/lib/sold";
import { TIERS } from "@/lib/tickets";

/**
 * Tells the team a sale happened, without ever failing the thing that
 * caused it: a broken mailbox must not turn a paid order into an error, so
 * everything here is caught and logged.
 */
export async function alertSale(reference: string): Promise<void> {
  try {
    const db = getDb();
    const [o] = await db
      .select({
        reference: orders.reference,
        name: orders.name,
        totalCents: orders.totalCents,
        method: orders.paymentMethod,
        isTest: orders.isTest,
        items: sql<string>`(select string_agg(i.quantity || '× ' || i.tier_name, ', ') from order_items i where i.order_id = orders.id)`,
      })
      .from(orders)
      .where(sql`${orders.reference} = ${reference}`)
      .limit(1);
    if (!o || o.isTest) return;
    const [sold] = await db
      .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
      .from(orderItems)
      .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
      .where(SOLD);
    await sendSaleAlert({
      reference: o.reference,
      buyerName: o.name,
      items: o.items ?? "билет",
      totalCents: o.totalCents,
      method: o.method === "bank" ? "bank" : o.method === "admin" ? "admin" : "card",
      soldTotal: sold?.n ?? 0,
      capacity: TIERS.reduce((a, t) => a + t.capacity, 0),
    });
  } catch (error) {
    console.error("[sale-alert] failed:", error);
  }
}
