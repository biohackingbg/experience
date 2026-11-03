import "server-only";

import { inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { creditNotes, orderItems, orders, tickets } from "@/lib/db/schema";
import { type InvoiceData, getInvoice } from "@/lib/invoices";
import { splitVat } from "@/lib/tickets";

/**
 * Credit notes for part of an order.
 *
 * When some of the tickets on an order are given back, the invoice is not
 * touched: it is a document, and Bulgarian practice answers it with a credit
 * note against the same number, drawn from the same run. The full refund keeps
 * its own note (orders.credit_note_number, issued by the Stripe webhook); this
 * is the other case, and it can happen more than once on one order.
 *
 * Alongside the note, `credited_quantity` on the order line records how many
 * seats were taken back, so the dashboard counts what is still sold while the
 * invoice keeps printing what was sold.
 */
export type IssueCreditNoteResult =
  | {
      ok: true;
      number: number;
      totalCents: number;
      reference: string;
      /** False while Stripe has not yet returned at least what the notes add up to. */
      refundCovered: boolean;
    }
  | { ok: false; reason: "no_order" | "not_paid" | "no_invoice" | "fully_credited" | "tier_required" | "no_such_line" | "too_many" | "bad_ticket" };

export const CREDIT_ERROR: Record<Exclude<IssueCreditNoteResult, { ok: true }>["reason"], string> = {
  no_order: "Няма поръчка с този номер.",
  not_paid: "Само платена поръчка може да има кредитно. При пълно връщане кредитното се издава само.",
  no_invoice: "Поръчката няма фактура, към която да се издаде кредитно.",
  fully_credited: "Поръчката вече е върната изцяло с кредитно известие.",
  tier_required: "Поръчката има няколко вида билети - избери кой се връща.",
  no_such_line: "В поръчката няма такъв вид билет.",
  too_many: "Толкова билета не остават за връщане в тази поръчка.",
  bad_ticket: "Някой от кодовете не е на този вид билет в тази поръчка, или билетът вече е използван.",
};

export async function issuePartialCreditNote(input: {
  reference: string;
  /** Which line of the order; may be left out when the order has a single one. */
  tierId?: string;
  quantity: number;
  /** Tickets to cancel in the same step; leave empty when they are already gone. */
  ticketCodes?: string[];
}): Promise<IssueCreditNoteResult> {
  const reference = input.reference.trim().toUpperCase();
  const codes = (input.ticketCodes ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean);

  return getDb().transaction(async (tx): Promise<IssueCreditNoteResult> => {
    const [order] = await tx
      .select({
        id: orders.id,
        status: orders.status,
        totalCents: orders.totalCents,
        vatRateBp: orders.vatRateBp,
        invoiceNumber: orders.invoiceNumber,
        creditNoteNumber: orders.creditNoteNumber,
        refundedCents: orders.refundedCents,
      })
      .from(orders)
      .where(sql`${orders.reference} = ${reference}`)
      .for("update")
      .limit(1);
    if (!order) return { ok: false, reason: "no_order" };
    if (order.creditNoteNumber) return { ok: false, reason: "fully_credited" };
    if (order.status !== "paid") return { ok: false, reason: "not_paid" };
    if (!order.invoiceNumber) return { ok: false, reason: "no_invoice" };

    const lines = await tx.select().from(orderItems).where(sql`${orderItems.orderId} = ${order.id}`);
    const line = input.tierId ? lines.find((l) => l.tierId === input.tierId) : lines.length === 1 ? lines[0] : undefined;
    if (!line) return { ok: false, reason: input.tierId ? "no_such_line" : "tier_required" };
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > line.quantity - line.creditedQuantity) {
      return { ok: false, reason: "too_many" };
    }

    // Any tickets named are cancelled in the same transaction, or none of it happens.
    if (codes.length > 0) {
      const found = await tx
        .select({ id: tickets.id, code: tickets.code })
        .from(tickets)
        .where(sql`${tickets.orderId} = ${order.id} and ${tickets.tierId} = ${line.tierId} and ${tickets.checkedInAt} is null and ${inArray(tickets.code, codes)}`);
      if (found.length !== codes.length || codes.length > input.quantity) return { ok: false, reason: "bad_ticket" };
      await tx.delete(tickets).where(inArray(tickets.id, found.map((f) => f.id)));
    }

    // What the buyer actually paid for these seats: a promo code took part of
    // the price off the whole order, so the share is taken in proportion.
    const itemsSum = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
    const lineSum = line.unitPriceCents * input.quantity;
    const totalCents = itemsSum > 0 ? Math.round((lineSum * order.totalCents) / itemsSum) : 0;
    const { netCents, vatCents } = splitVat(totalCents, order.vatRateBp / 10000);

    const [{ n }] = (await tx.execute(sql`select nextval('invoice_number_seq') as n`)) as unknown as { n: string }[];
    const number = Number(n);
    await tx.insert(creditNotes).values({
      orderId: order.id,
      number,
      items: [{ tierId: line.tierId, tierName: line.tierName, unitPriceCents: line.unitPriceCents, quantity: input.quantity }],
      subtotalCents: netCents,
      vatCents,
      totalCents,
      discountCents: lineSum - totalCents,
      ticketCodes: codes.length > 0 ? codes : null,
    });
    await tx
      .update(orderItems)
      .set({ creditedQuantity: sql`${orderItems.creditedQuantity} + ${input.quantity}` })
      .where(sql`${orderItems.id} = ${line.id}`);

    const [{ credited }] = (await tx.execute(
      sql`select coalesce(sum(total_cents), 0)::int as credited from credit_notes where order_id = ${order.id}`,
    )) as unknown as { credited: number }[];
    return { ok: true, number, totalCents, reference, refundCovered: (order.refundedCents ?? 0) >= credited };
  });
}

/**
 * One partial credit note, shaped like the invoice it answers so the same
 * sheet can print it: the order's parties and invoice number, with this
 * note's lines, amounts, number and date in place of the order's.
 */
export async function getPartialCreditNote(reference: string, number: number): Promise<InvoiceData | null> {
  const base = await getInvoice(reference);
  if (!base) return null;
  const [note] = await getDb()
    .select({
      number: creditNotes.number,
      issuedAt: creditNotes.issuedAt,
      items: creditNotes.items,
      subtotalCents: creditNotes.subtotalCents,
      vatCents: creditNotes.vatCents,
      totalCents: creditNotes.totalCents,
      discountCents: creditNotes.discountCents,
    })
    .from(creditNotes)
    .innerJoin(orders, sql`${orders.id} = ${creditNotes.orderId}`)
    .where(sql`${orders.reference} = ${reference} and ${creditNotes.number} = ${number}`)
    .limit(1);
  if (!note) return null;
  return {
    ...base,
    items: note.items.map(({ tierName, unitPriceCents, quantity }) => ({ tierName, unitPriceCents, quantity })),
    subtotalCents: note.subtotalCents,
    vatCents: note.vatCents,
    totalCents: note.totalCents,
    discountCents: note.discountCents,
    promoCode: note.discountCents > 0 ? base.promoCode : null,
    creditNoteNumber: note.number,
    creditNotedAt: note.issuedAt,
  };
}

export type PartialCreditNoteRow = {
  number: number;
  issuedAt: Date;
  reference: string;
  /** The invoice it answers. */
  invoiceNumber: number;
  name: string;
  email: string;
  company: string | null;
  totalCents: number;
  quantity: number;
  tierName: string;
};

/** Newest first, for the admin list. */
export async function listPartialCreditNotes(): Promise<PartialCreditNoteRow[]> {
  const rows = await getDb()
    .select({
      number: creditNotes.number,
      issuedAt: creditNotes.issuedAt,
      reference: orders.reference,
      invoiceNumber: orders.invoiceNumber,
      name: orders.name,
      email: orders.email,
      company: orders.invoiceCompany,
      totalCents: creditNotes.totalCents,
      items: creditNotes.items,
    })
    .from(creditNotes)
    .innerJoin(orders, sql`${orders.id} = ${creditNotes.orderId}`)
    .orderBy(sql`${creditNotes.number} desc`);
  return rows.map((r) => ({
    number: r.number,
    issuedAt: r.issuedAt,
    reference: r.reference,
    invoiceNumber: r.invoiceNumber ?? 0,
    name: r.name,
    email: r.email,
    company: r.company,
    totalCents: r.totalCents,
    quantity: r.items.reduce((s, i) => s + i.quantity, 0),
    tierName: r.items.map((i) => i.tierName).join(", "),
  }));
}
