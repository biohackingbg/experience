import "server-only";

import { inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";

/** Everything an invoice has to print, in one read. */
export type InvoiceData = {
  number: number;
  issuedAt: Date;
  reference: string;
  buyerName: string;
  buyerEmail: string;
  company: string | null;
  vatNumber: string | null;
  address: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  vatRateBp: number;
  currency: string;
  items: { tierName: string; unitPriceCents: number; quantity: number }[];
  /** Present once the refund's credit note is issued. */
  creditNoteNumber: number | null;
  creditNotedAt: Date | null;
};

/**
 * Only paid, numbered orders have an invoice. A pending one has no number by
 * design, so there is nothing to show and nothing to leak.
 */
export async function getInvoice(reference: string): Promise<InvoiceData | null> {
  const db = getDb();

  const [row] = await db
    .select({
      number: orders.invoiceNumber,
      issuedAt: orders.invoicedAt,
      reference: orders.reference,
      buyerName: orders.name,
      buyerEmail: orders.email,
      company: orders.invoiceCompany,
      vatNumber: orders.invoiceVatNumber,
      address: orders.invoiceAddress,
      subtotalCents: orders.subtotalCents,
      vatCents: orders.vatCents,
      totalCents: orders.totalCents,
      vatRateBp: orders.vatRateBp,
      currency: orders.currency,
      creditNoteNumber: orders.creditNoteNumber,
      creditNotedAt: orders.creditNotedAt,
    })
    .from(orders)
    .where(
      // A refunded order keeps its invoice - the refund is answered with a
      // credit note, not by making the invoice disappear.
      sql`${orders.reference} = ${reference}
          and ${orders.status} in ('paid', 'refunded')
          and ${orders.invoiceNumber} is not null`,
    )
    .limit(1);

  if (!row?.number || !row.issuedAt) return null;

  const items = await db
    .select({
      tierName: orderItems.tierName,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(sql`${orders.reference} = ${reference}`);

  return { ...row, number: row.number, issuedAt: row.issuedAt, items };
}

/** Newest first, for the admin list. */
export async function listInvoices(limit = 200) {
  const db = getDb();
  return db
    .select({
      number: orders.invoiceNumber,
      issuedAt: orders.invoicedAt,
      reference: orders.reference,
      name: orders.name,
      email: orders.email,
      company: orders.invoiceCompany,
      totalCents: orders.totalCents,
      refundedCents: orders.refundedCents,
      status: orders.status,
      creditNoteNumber: orders.creditNoteNumber,
    })
    .from(orders)
    .where(sql`${orders.invoiceNumber} is not null`)
    .orderBy(sql`${orders.invoiceNumber} desc`)
    .limit(limit);
}

/**
 * Every issued invoice with its lines, oldest first - the run the accountant
 * gets after the event. Refunded orders are included (their invoice stands)
 * and marked, so the credit notes can be raised against them.
 */
export type InvoiceExportRow = InvoiceData & {
  status: string;
  refundedCents: number | null;
  refundedAt: Date | null;
};

export async function getAllInvoices(): Promise<InvoiceExportRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: orders.id,
      number: orders.invoiceNumber,
      issuedAt: orders.invoicedAt,
      reference: orders.reference,
      buyerName: orders.name,
      buyerEmail: orders.email,
      company: orders.invoiceCompany,
      vatNumber: orders.invoiceVatNumber,
      address: orders.invoiceAddress,
      subtotalCents: orders.subtotalCents,
      vatCents: orders.vatCents,
      totalCents: orders.totalCents,
      vatRateBp: orders.vatRateBp,
      currency: orders.currency,
      status: orders.status,
      refundedCents: orders.refundedCents,
      refundedAt: orders.refundedAt,
      creditNoteNumber: orders.creditNoteNumber,
      creditNotedAt: orders.creditNotedAt,
    })
    .from(orders)
    .where(sql`${orders.invoiceNumber} is not null and ${orders.invoicedAt} is not null`)
    .orderBy(sql`${orders.invoiceNumber} asc`);

  if (rows.length === 0) return [];

  const items = await db
    .select({
      orderId: orderItems.orderId,
      tierName: orderItems.tierName,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));

  const byOrder = new Map<string, InvoiceData["items"]>();
  for (const it of items) {
    const arr = byOrder.get(it.orderId) ?? [];
    arr.push({ tierName: it.tierName, unitPriceCents: it.unitPriceCents, quantity: it.quantity });
    byOrder.set(it.orderId, arr);
  }

  return rows.map(({ id, ...r }) => ({
    ...r,
    number: r.number as number,
    issuedAt: r.issuedAt as Date,
    items: byOrder.get(id) ?? [],
  }));
}
