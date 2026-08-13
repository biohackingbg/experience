import "server-only";

import { randomInt } from "node:crypto";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import {
  CURRENCY,
  VAT_RATE,
  getTier,
  isEarlyAccess,
  priceCents,
  splitVat,
} from "@/lib/tickets";

/**
 * How long an unpaid order keeps holding a seat. Long enough to finish a card
 * payment, short enough that abandoned checkouts do not lock up the room.
 */
const PENDING_HOLD_MINUTES = 30;

/** Ambiguous characters left out so codes survive being read aloud. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

export type CreateOrderInput = {
  tierId: string;
  quantity: number;
  name: string;
  email: string;
  phone?: string;
  invoiceCompany?: string;
  invoiceVatNumber?: string;
  invoiceAddress?: string;
  termsText: string;
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      reference: string;
      totalCents: number;
      /** Charged per ticket. Stripe bills this, so it cannot diverge. */
      unitPriceCents: number;
    }
  | { ok: false; reason: "sold_out" | "unknown_tier" | "bad_quantity"; left?: number };

/**
 * Creates a pending order, refusing to oversell.
 *
 * The count and the insert run inside one transaction behind a per-tier
 * advisory lock, so two people buying the last seat at the same moment are
 * serialised rather than both succeeding. Counting only recent pending orders
 * means an abandoned checkout releases its hold on its own.
 */
export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const tier = getTier(input.tierId);
  if (!tier) return { ok: false, reason: "unknown_tier" };
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 10) {
    return { ok: false, reason: "bad_quantity" };
  }

  const db = getDb();

  return db.transaction(async (tx) => {
    // Serialise everyone buying this tier for the rest of the transaction.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${"tier:" + tier.id}))`,
    );

    const [taken] = await tx
      .select({
        n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
      .where(
        sql`${orderItems.tierId} = ${tier.id} and (
          ${orders.status} = 'paid'
          or (${orders.status} = 'pending'
              and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')
        )`,
      );

    const left = tier.capacity - (taken?.n ?? 0);
    if (left < input.quantity) {
      return { ok: false as const, reason: "sold_out" as const, left: Math.max(left, 0) };
    }

    // Resolved once. Everything downstream — the row, the total and the
    // Stripe line item — uses this number, so the window closing mid-request
    // cannot record one price and charge another.
    const unitPriceCents = priceCents(tier, isEarlyAccess());
    const totalCents = unitPriceCents * input.quantity;
    const { netCents, vatCents } = splitVat(totalCents);
    const reference = `SLS-${randomCode(6)}`;

    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        status: "pending",
        email: input.email.trim().toLowerCase(),
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        subtotalCents: netCents,
        vatCents,
        totalCents,
        currency: CURRENCY,
        vatRateBp: Math.round(VAT_RATE * 10000),
        invoiceCompany: input.invoiceCompany?.trim() || null,
        invoiceVatNumber: input.invoiceVatNumber?.trim() || null,
        invoiceAddress: input.invoiceAddress?.trim() || null,
        termsAcceptedAt: new Date(),
        termsText: input.termsText,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values({
      orderId: order.id,
      tierId: tier.id,
      tierName: tier.name,
      unitPriceCents,
      quantity: input.quantity,
    });

    return {
      ok: true as const,
      orderId: order.id,
      reference,
      totalCents,
      unitPriceCents,
    };
  });
}

/**
 * Marks an order paid and issues its tickets.
 *
 * Idempotent: Stripe retries webhooks, and a duplicate delivery must not
 * produce a second set of tickets. The update only matches a still-pending
 * order, so a repeat call finds nothing and does no work.
 */
export type PaidOrderSummary = {
  issued: number;
  /** Present only on the delivery that actually flipped the order. */
  order?: {
    reference: string;
    name: string;
    email: string;
    totalCents: number;
    tickets: { code: string; tierName: string }[];
  };
};

export async function markOrderPaid(
  orderId: string,
  paymentIntentId: string | null,
): Promise<PaidOrderSummary> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({
        status: "paid",
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      })
      .where(sql`${orders.id} = ${orderId} and ${orders.status} = 'pending'`)
      .returning({
        id: orders.id,
        reference: orders.reference,
        name: orders.name,
        email: orders.email,
        totalCents: orders.totalCents,
      });

    if (updated.length === 0) return { issued: 0 };

    const items = await tx
      .select({
        tierId: orderItems.tierId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(sql`${orderItems.orderId} = ${orderId}`);

    const rows = items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        orderId,
        tierId: item.tierId,
        code: `${randomCode(4)}-${randomCode(4)}`,
      })),
    );

    if (rows.length) await tx.insert(tickets).values(rows);

    const [order] = updated;
    return {
      issued: rows.length,
      order: {
        reference: order.reference,
        name: order.name,
        email: order.email,
        totalCents: order.totalCents,
        tickets: rows.map((row) => ({
          code: row.code,
          tierName: getTier(row.tierId)?.name ?? row.tierId,
        })),
      },
    };
  });
}

/** Seats still available per tier, for the checkout UI. */
export async function getRemaining(tierId: string): Promise<number> {
  const tier = getTier(tierId);
  if (!tier) return 0;

  const db = getDb();
  const [taken] = await db
    .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(sql`${orderItems.tierId} = ${tier.id} and ${orders.status} = 'paid'`);

  return Math.max(tier.capacity - (taken?.n ?? 0), 0);
}
