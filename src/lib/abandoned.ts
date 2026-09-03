import "server-only";

import { desc, inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { sendReminderEmail } from "@/lib/email";
import { PENDING_HOLD_MINUTES } from "@/lib/orders";
import { getEarlyAccess } from "@/lib/settings";

/**
 * Checkouts that were opened and never paid.
 *
 * A pending order past its seat hold is an abandoned checkout. The list
 * leaves out anyone who has a paid order on the same address - they came
 * back on their own, and a reminder to them would be an insult - and stops
 * at two weeks, after which a nudge is spam rather than help.
 */

const DAYS_KEPT = 14;
/** The nudge waits a day: an hour after closing the tab it reads as pressure. */
const REMIND_AFTER_HOURS = 24;

export type AbandonedOrder = {
  reference: string;
  name: string;
  email: string;
  totalCents: number;
  createdAt: Date;
  items: string;
  reminderSentAt: Date | null;
  /** What Resend saw afterwards. A click is a person; an open is a maybe. */
  reminderOpenedAt: Date | null;
  reminderClickedAt: Date | null;
  /** Old enough for the nudge, and not nudged before. */
  canRemind: boolean;
  /** "преди 3 ч" - worded here, on the server, where reading the clock is allowed. */
  ago: string;
  remindedAgo: string | null;
};

function ago(t: Date, now: number): string {
  const h = Math.floor((now - t.getTime()) / 3_600_000);
  return h < 1 ? "преди по-малко от час" : h < 24 ? `преди ${h} ч` : `преди ${Math.floor(h / 24)} д`;
}

/** Pending, past the hold, no paid order on the same address. */
function abandonedWhere() {
  return sql`${orders.status} = 'pending'
    and ${orders.createdAt} <= now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes'
    and ${orders.createdAt} > now() - interval '${sql.raw(String(DAYS_KEPT))} days'
    and not exists (
      select 1 from ${orders} p
      where p.email = ${orders.email} and p.status = 'paid'
    )`;
}

export async function getAbandonedOrders(limit = 30): Promise<AbandonedOrder[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      name: orders.name,
      email: orders.email,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
      reminderSentAt: orders.reminderSentAt,
      reminderOpenedAt: orders.reminderOpenedAt,
      reminderClickedAt: orders.reminderClickedAt,
    })
    .from(orders)
    .where(abandonedWhere())
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const items = await db
    .select({ orderId: orderItems.orderId, tierName: orderItems.tierName, quantity: orderItems.quantity })
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));

  const now = Date.now();
  const cutoff = now - REMIND_AFTER_HOURS * 3_600_000;
  return rows.map((o) => ({
    ago: ago(o.createdAt, now),
    remindedAgo: o.reminderSentAt ? ago(o.reminderSentAt, now) : null,
    reference: o.reference,
    name: o.name,
    email: o.email,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    items: items.filter((i) => i.orderId === o.id).map((i) => `${i.quantity}× ${i.tierName}`).join(", "),
    reminderSentAt: o.reminderSentAt,
    reminderOpenedAt: o.reminderOpenedAt,
    reminderClickedAt: o.reminderClickedAt,
    canRemind: !o.reminderSentAt && o.createdAt.getTime() <= cutoff,
  }));
}

export type RemindResult =
  | { ok: true; to: string }
  | { ok: false; reason: "not_found" | "already_sent" | "bought" | "too_soon" | "send_failed" };

/**
 * Sends the one reminder for an abandoned order and records that it went.
 *
 * Every guard is re-checked here against the database, not trusted from the
 * page: the button may have been rendered an hour ago, and in that hour the
 * buyer may have paid.
 */
export async function remindAbandonedOrder(reference: string): Promise<RemindResult> {
  const db = getDb();
  const [order] = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      name: orders.name,
      email: orders.email,
      status: orders.status,
      createdAt: orders.createdAt,
      reminderSentAt: orders.reminderSentAt,
      bought: sql<boolean>`exists (select 1 from ${orders} p where p.email = ${orders.email} and p.status = 'paid')`,
    })
    .from(orders)
    .where(sql`${orders.reference} = ${reference}`)
    .limit(1);

  if (!order || order.status !== "pending") return { ok: false, reason: "not_found" };
  if (order.reminderSentAt) return { ok: false, reason: "already_sent" };
  if (order.bought) return { ok: false, reason: "bought" };
  if (order.createdAt.getTime() > Date.now() - REMIND_AFTER_HOURS * 3_600_000) {
    return { ok: false, reason: "too_soon" };
  }

  const items = await db
    .select({ tierId: orderItems.tierId, tierName: orderItems.tierName, quantity: orderItems.quantity })
    .from(orderItems)
    .where(sql`${orderItems.orderId} = ${order.id}`);

  const emailId = await sendReminderEmail({
    to: order.email,
    buyerName: order.name,
    reference: order.reference,
    items: items.map((i) => `${i.quantity}× ${i.tierName}`).join(", ") || "билет",
    resumePath: items[0] ? `/bilet?nivo=${items[0].tierId}` : "/bilet",
    early: await getEarlyAccess(),
  });
  if (emailId === null) return { ok: false, reason: "send_failed" };

  await db
    .update(orders)
    .set({ reminderSentAt: new Date(), reminderEmailId: emailId || null })
    .where(sql`${orders.id} = ${order.id}`);
  return { ok: true, to: order.email };
}
