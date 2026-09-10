import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";

/**
 * The sale, told to Google Analytics from the server.
 *
 * Not from the thank-you page: that page can be opened without paying and a
 * buyer may close the tab before it loads, so a browser-side purchase both
 * invents revenue and loses it. Stripe's signed call is the fact, and this
 * is sent from there - with the order reference as the transaction id, which
 * makes a repeat delivery harmless.
 *
 * Inert until both settings exist, so the site sends nothing until an
 * account is actually connected.
 */
const measurementId = () => process.env.GA_MEASUREMENT_ID?.trim() || null;
const apiSecret = () => process.env.GA_API_SECRET?.trim() || null;

/**
 * A sale with no GA identifier still has to count as revenue - it just
 * cannot be attributed to a campaign, which is what the visitor declining
 * measurement means.
 */
const fallbackClientId = (reference: string) =>
  `${[...reference].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1_000_000_007, 7)}.${Math.floor(Date.now() / 1000)}`;

export async function sendGaPurchase(orderId: string): Promise<void> {
  const id = measurementId();
  const secret = apiSecret();
  if (!id || !secret) return;

  try {
    const db = getDb();
    const [order] = await db
      .select({
        reference: orders.reference,
        totalCents: orders.totalCents,
        currency: orders.currency,
        isTest: orders.isTest,
        gaClientId: orders.gaClientId,
        gaSessionId: orders.gaSessionId,
        promoCode: orders.promoCode,
        utmSource: orders.utmSource,
        utmCampaign: orders.utmCampaign,
      })
      .from(orders)
      .where(sql`${orders.id} = ${orderId}`)
      .limit(1);
    // The team's own test purchases are marked, and marked revenue is not
    // revenue - it would sit in the agency's reports forever.
    if (!order || order.isTest) return;

    const items = await db
      .select({
        tierId: orderItems.tierId,
        tierName: orderItems.tierName,
        unitPriceCents: orderItems.unitPriceCents,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(sql`${orderItems.orderId} = ${orderId}`);

    const body = {
      client_id: order.gaClientId ?? fallbackClientId(order.reference),
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: order.reference,
            value: order.totalCents / 100,
            currency: (order.currency || "EUR").toUpperCase(),
            ...(order.promoCode ? { coupon: order.promoCode } : {}),
            ...(order.gaSessionId ? { session_id: order.gaSessionId } : {}),
            // Without this GA counts the event but leaves it out of the
            // realtime and session-scoped reports.
            engagement_time_msec: 1,
            items: items.map((i) => ({
              item_id: i.tierId,
              item_name: i.tierName,
              item_category: "Ticket",
              price: i.unitPriceCents / 100,
              quantity: i.quantity,
            })),
          },
        },
      ],
    };

    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    );
    if (!res.ok) console.error("[ga] purchase rejected:", res.status, (await res.text()).slice(0, 300));
  } catch (error) {
    // An analytics event must never fail the call that hands someone a ticket.
    console.error("[ga] purchase threw:", error);
  }
}
