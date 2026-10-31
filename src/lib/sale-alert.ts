import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { sendSaleAlert } from "@/lib/email";
import { SALE } from "@/lib/sold";
import { TIERS } from "@/lib/tickets";

/**
 * Tells the team a PEAK sale happened - the rarest, dearest ticket, worth a
 * message of its own. Every other sale waits for the 18:30 digest: a mail per
 * sale filled the inbox and, on Resend's free plan, ate the daily quota the
 * tickets themselves needed. Never fails the thing that caused it: a broken mailbox must not turn a paid order into an error, so
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
        hasPeak: sql<boolean>`exists (select 1 from order_items i where i.order_id = orders.id and i.tier_id = 'peak')`,
        items: sql<string>`(select string_agg(i.quantity || '× ' || i.tier_name, ', ') from order_items i where i.order_id = orders.id)`,
      })
      .from(orders)
      .where(sql`${orders.reference} = ${reference}`)
      .limit(1);
    // A ticket issued at no charge is the team's own doing; nobody needs
    // waking for it.
    if (!o || o.isTest || o.totalCents === 0 || !o.hasPeak) return;
    const [sold] = await db
      .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
      .from(orderItems)
      .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
      .where(SALE);
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
