import "server-only";

import { sql } from "drizzle-orm";

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
    })
    .from(orders)
    .where(
      sql`${orders.reference} = ${reference}
          and ${orders.status} = 'paid'
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
    })
    .from(orders)
    .where(sql`${orders.invoiceNumber} is not null`)
    .orderBy(sql`${orders.invoiceNumber} desc`)
    .limit(limit);
}
