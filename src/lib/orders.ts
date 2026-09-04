import "server-only";

import { randomInt } from "node:crypto";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import { PENDING_HOLD_MINUTES } from "@/lib/orders-const";
import { resolvePromo } from "@/lib/promo";
import { getPricing, priceOf } from "@/lib/pricing";
import { CURRENCY, TIERS, VAT_RATE, getTier, splitVat } from "@/lib/tickets";

export { PENDING_HOLD_MINUTES };

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
  utmSource?: string;
  utmCampaign?: string;
  /** A discount code as typed; resolved here, against the real gross. */
  promoCode?: string;
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      reference: string;
      /** What is charged: gross less the discount. Zero means a free order. */
      totalCents: number;
      /** Charged per ticket. Stripe bills this, so it cannot diverge. */
      unitPriceCents: number;
      discountCents: number;
      promoCode: string | null;
    }
  | { ok: false; reason: "sold_out" | "unknown_tier" | "bad_quantity" | "bad_promo"; left?: number; message?: string };

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
  // Resolved once, before the lock is taken. Everything downstream - the row,
  // the total and the Stripe line item - uses this answer, so the launch
  // prices being closed mid-request cannot record one price and charge another.
  const unitPriceCents = priceOf(await getPricing(), tier);
  const grossCents = unitPriceCents * input.quantity;

  // The code is resolved before the seat is taken: a refused code must not
  // burn a hold, and the discount must be settled before any number is
  // written down.
  let discountCents = 0;
  let promoCode: string | null = null;
  if (input.promoCode?.trim()) {
    const promo = await resolvePromo(input.promoCode, grossCents);
    if (!promo.ok) return { ok: false, reason: "bad_promo", message: promo.reason };
    discountCents = promo.discountCents;
    promoCode = promo.code;
  }

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

    const totalCents = grossCents - discountCents;
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
        utmSource: input.utmSource?.replace(/[^a-z0-9_.-]/g, "") || null,
        utmCampaign: input.utmCampaign?.replace(/[^a-z0-9_.-]/g, "") || null,
        promoCode,
        discountCents,
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
      discountCents,
      promoCode,
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
    /** Null only if the column was somehow already filled. */
    invoiceNumber: number | null;
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

    // The invoice number is drawn here and nowhere else: inside the same
    // transaction that flipped the order to paid, and only on the delivery
    // that won that flip. A sequence rather than max()+1, so two webhooks
    // arriving together cannot take the same number - and an abandoned
    // checkout never burns one, which would leave a hole in the run.
    const [invoiced] = await tx.execute<{ invoice_number: string }>(
      sql`update ${orders}
          set invoice_number = nextval('invoice_number_seq'), invoiced_at = now()
          where ${orders.id} = ${orderId} and ${orders.invoiceNumber} is null
            and ${orders.totalCents} > 0
          returning invoice_number`,
    );

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
        invoiceNumber: invoiced ? Number(invoiced.invoice_number) : null,
        tickets: rows.map((row) => ({
          code: row.code,
          tierName: getTier(row.tierId)?.name ?? row.tierId,
        })),
      },
    };
  });
}

/**
 * Seats left per tier, counted the way the checkout counts them: paid, plus
 * pending inside the hold. This is what "изчерпано" on the page means.
 */
export async function getRemainingAll(): Promise<Record<string, number>> {
  const rows = await getDb()
    .select({ tierId: orderItems.tierId, n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(
      sql`${orders.status} = 'paid'
        or (${orders.status} = 'pending' and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')`,
    )
    .groupBy(orderItems.tierId);
  const out: Record<string, number> = {};
  for (const t of TIERS) out[t.id] = Math.max(0, t.capacity - (rows.find((r) => r.tierId === t.id)?.n ?? 0));
  return out;
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

/**
 * Records a refund reported by Stripe (`charge.refunded`).
 *
 * Keyed on the payment intent, which is the only identifier the charge event
 * carries that we also hold. A full refund flips the order to `refunded` -
 * `findTicket` only resolves tickets of paid orders, so the door stops
 * admitting them without any row being touched. A partial refund records the
 * amount and leaves the order paid: which of three seats was given back is
 * not something the site can know.
 *
 * Idempotent: Stripe sends the event once per refund and retries it; the
 * amount written is Stripe's running total, so a repeat is a no-op.
 */
export type RefundOutcome =
  | { status: "not_found" }
  | {
      status: "refunded" | "partial";
      orderId: string;
      reference: string;
      totalCents: number;
      refundedCents: number;
      invoiceNumber: number | null;
    };

export async function markOrderRefunded(
  paymentIntentId: string,
  amountRefundedCents: number,
): Promise<RefundOutcome> {
  const db = getDb();
  const [order] = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      totalCents: orders.totalCents,
      invoiceNumber: orders.invoiceNumber,
    })
    .from(orders)
    .where(
      sql`${orders.stripePaymentIntentId} = ${paymentIntentId} and ${orders.status} in ('paid', 'refunded')`,
    )
    .limit(1);

  if (!order) return { status: "not_found" };

  const full = amountRefundedCents >= order.totalCents;
  await db
    .update(orders)
    .set({
      refundedCents: amountRefundedCents,
      refundedAt: new Date(),
      ...(full ? { status: "refunded" } : {}),
    })
    .where(sql`${orders.id} = ${order.id}`);

  return {
    status: full ? "refunded" : "partial",
    orderId: order.id,
    reference: order.reference,
    totalCents: order.totalCents,
    refundedCents: amountRefundedCents,
    invoiceNumber: order.invoiceNumber,
  };
}

/**
 * Issues the credit note for a fully refunded, invoiced order.
 *
 * The number comes from the SAME sequence as invoices - Bulgarian VAT
 * practice keeps фактури and известия in one ascending run. Guarded so a
 * Stripe retry (or a second full-refund event) cannot draw a second number:
 * the update only matches an order that has none yet.
 */
export async function issueCreditNote(orderId: string): Promise<number | null> {
  const db = getDb();
  const [row] = await db.execute<{ credit_note_number: string }>(
    sql`update ${orders}
        set credit_note_number = nextval('invoice_number_seq'), credit_noted_at = now()
        where ${orders.id} = ${orderId}
          and ${orders.status} = 'refunded'
          and ${orders.invoiceNumber} is not null
          and ${orders.creditNoteNumber} is null
        returning credit_note_number`,
  );
  return row ? Number(row.credit_note_number) : null;
}
