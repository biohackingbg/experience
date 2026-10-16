import "server-only";

import { randomInt } from "node:crypto";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import { PENDING_HOLD_MINUTES } from "@/lib/orders-const";
import { getPricing, priceOf } from "@/lib/pricing";
import { SOLD } from "@/lib/sold";
import { CURRENCY, TIERS, VAT_RATE, type Tier, type TierId, getTier, splitVat } from "@/lib/tickets";

/**
 * Moving a ticket one tier up for the difference in price.
 *
 * CORE goes to PLUS, PLUS goes to PEAK. The holder pays what the higher
 * tier costs today minus what their ticket cost them, through the same
 * Stripe checkout as a purchase; the webhook then changes the ticket's tier
 * in place (orders.upgradesTicketCode, see markOrderPaid). The ticket code
 * is the only credential: whoever has the code has the ticket.
 */

const NEXT: Partial<Record<TierId, TierId>> = { core: "plus", plus: "peak" };

export type UpgradeQuote =
  | { ok: true; code: string; email: string; name: string; lang: "bg" | "en"; from: Tier; to: Tier; paidCents: number; targetCents: number; diffCents: number; left: number }
  | { ok: false; reason: "not_found" | "top_tier" | "used" | "sold_out" | "nothing_to_pay"; from?: Tier };

/** What it would cost to move this ticket up, if it can move at all. */
export async function upgradeQuote(rawCode: string): Promise<UpgradeQuote> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return { ok: false, reason: "not_found" };
  const db = getDb();
  const [row] = await db
    .select({
      tierId: tickets.tierId,
      checkedInAt: tickets.checkedInAt,
      orderId: orders.id,
      email: orders.email,
      name: orders.name,
      lang: orders.lang,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!row) return { ok: false, reason: "not_found" };
  const from = getTier(row.tierId);
  const toId = from ? NEXT[from.id] : undefined;
  const to = toId ? getTier(toId) : undefined;
  if (!from || !to) return { ok: false, reason: "top_tier", from };
  if (row.checkedInAt) return { ok: false, reason: "used", from };

  const paidCents = await paidForTicket(row.orderId, code, from);
  const targetCents = priceOf(await getPricing(), to) ?? to.listPriceCents;
  const diffCents = targetCents - paidCents;
  if (diffCents < 100) return { ok: false, reason: "nothing_to_pay", from };

  const left = await remaining(to);
  if (left < 1) return { ok: false, reason: "sold_out", from };

  return { ok: true, code, email: row.email, name: row.name, lang: row.lang === "en" ? "en" : "bg", from, to, paidCents, targetCents, diffCents, left };
}

/**
 * What the holder has paid for this ticket so far: the unit price on its
 * order's line (an order has one line, so that is the ticket's price; a
 * hand-made order with several lines falls back to the line of its tier),
 * plus every upgrade already paid for the same code. A promo discount on
 * the original order is not clawed back: the difference is against the
 * ticket's own price, which is what the holder remembers paying.
 */
export async function paidForTicket(orderId: string, code: string, tier: Tier): Promise<number> {
  const db = getDb();
  const items = await db
    .select({ tierId: orderItems.tierId, unitPriceCents: orderItems.unitPriceCents })
    .from(orderItems)
    .where(sql`${orderItems.orderId} = ${orderId}`);
  const line = items.find((i) => i.tierId === tier.id) ?? items[0];
  const [ups] = await db
    .select({ cents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int` })
    .from(orders)
    .where(sql`${orders.upgradesTicketCode} = ${code} and ${orders.status} = 'paid'`);
  return (line?.unitPriceCents ?? tier.listPriceCents) + (ups?.cents ?? 0);
}

/** Seats left in a tier, counted the way the checkout counts them. */
async function remaining(tier: Tier): Promise<number> {
  const [taken] = await getDb()
    .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(takenWhere(tier.id));
  return tier.capacity - (taken?.n ?? 0);
}

const takenWhere = (tierId: string) => sql`${orderItems.tierId} = ${tierId} and (
  ${orders.status} = 'paid'
  or (${orders.status} = 'pending' and ${orders.paymentMethod} = 'bank' and ${orders.bankDueAt} > now())
  or (${orders.status} = 'pending' and ${orders.paymentMethod} = 'card'
      and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')
)`;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

export type UpgradeOrder = { orderId: string; reference: string; totalCents: number; productName: string };

/**
 * The pending order that pays the difference. A seat in the higher tier is
 * held for it the way a purchase holds one; the original CORE seat stays
 * counted until the event, which errs on the side of not overselling.
 *
 * A second click within the hold finds the first order and reuses it, so
 * an impatient holder cannot pile up seat holds on one ticket.
 */
export async function createUpgradeOrder(quote: Extract<UpgradeQuote, { ok: true }>): Promise<UpgradeOrder | { error: "sold_out" }> {
  const db = getDb();
  const productName = `Надграждане ${quote.from.name} → ${quote.to.name}`;

  const [open] = await db
    .select({ id: orders.id, reference: orders.reference, totalCents: orders.totalCents })
    .from(orders)
    .where(
      sql`${orders.upgradesTicketCode} = ${quote.code} and ${orders.status} = 'pending' and ${orders.paymentMethod} = 'card'
        and ${orders.totalCents} = ${quote.diffCents}
        and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES - 5))} minutes'`,
    )
    .limit(1);
  if (open) return { orderId: open.id, reference: open.reference, totalCents: open.totalCents, productName };

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"tier:" + quote.to.id}))`);
    const [taken] = await tx
      .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
      .from(orderItems)
      .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
      .where(takenWhere(quote.to.id));
    if (quote.to.capacity - (taken?.n ?? 0) < 1) return { error: "sold_out" as const };

    const { netCents, vatCents } = splitVat(quote.diffCents);
    const reference = `SLS-${randomCode(6)}`;
    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        status: "pending",
        email: quote.email,
        name: quote.name,
        subtotalCents: netCents,
        vatCents,
        totalCents: quote.diffCents,
        currency: CURRENCY,
        vatRateBp: Math.round(VAT_RATE * 10000),
        termsAcceptedAt: new Date(),
        termsText: `upgrade: условията на първоначалната поръчка важат; билет ${quote.code}`,
        lang: quote.lang,
        upgradesTicketCode: quote.code,
        utmSource: "email",
        utmCampaign: `upgrade-${quote.to.id}`,
      })
      .returning({ id: orders.id });
    await tx.insert(orderItems).values({
      orderId: order.id,
      tierId: quote.to.id,
      tierName: productName,
      unitPriceCents: quote.diffCents,
      quantity: 1,
    });
    return { orderId: order.id, reference, totalCents: quote.diffCents, productName };
  });
}

/** Everything a letter about upgrading needs, for every ticket of an order that can still move up. */
export async function upgradableTickets(orderId: string, from: Tier, targetCents: number): Promise<{ code: string; attendeeName: string | null; diffCents: number }[]> {
  const rows = await getDb()
    .select({ code: tickets.code, attendeeName: tickets.attendeeName })
    .from(tickets)
    .where(sql`${tickets.orderId} = ${orderId} and ${tickets.tierId} = ${from.id} and ${tickets.checkedInAt} is null`);
  const out: { code: string; attendeeName: string | null; diffCents: number }[] = [];
  for (const r of rows) {
    const diffCents = targetCents - (await paidForTicket(orderId, r.code, from));
    if (diffCents >= 100) out.push({ ...r, diffCents });
  }
  return out;
}

export const UPGRADE_TARGETS = TIERS.filter((t) => NEXT[t.id]).map((t) => ({ from: t, to: getTier(NEXT[t.id]!)! }));
