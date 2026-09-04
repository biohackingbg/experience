import "server-only";

import { randomInt } from "node:crypto";
import { desc, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { sendProformaEmail, sendTicketEmail } from "@/lib/email";
import { PENDING_HOLD_MINUTES } from "@/lib/orders-const";
import { markOrderPaid } from "@/lib/orders";
import { getPricing, priceOf } from "@/lib/pricing";
import { getSetting, setSetting } from "@/lib/settings";
import { CURRENCY, VAT_RATE, getTier, splitVat } from "@/lib/tickets";

/**
 * Orders the team issues by hand.
 *
 * Free: partner and speaker tickets - paid on the spot at zero, tickets
 * mailed, no invoice. Bank: a company buying a batch by transfer - the
 * order holds its seats until a due date, the buyer gets a proforma, and
 * the team marks it paid when the money lands, which issues the invoice
 * and the tickets exactly as a card payment would.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = (n: number) => Array.from({ length: n }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export type BankDetails = { holder: string; iban: string; bic: string; bank: string };

export async function getBankDetails(): Promise<BankDetails> {
  const row = await getSetting("bank_details");
  const empty: BankDetails = { holder: "", iban: "", bic: "", bank: "" };
  if (!row) return empty;
  try {
    return { ...empty, ...(JSON.parse(row.value) as Partial<BankDetails>) };
  } catch {
    return empty;
  }
}

export async function saveBankDetails(d: BankDetails): Promise<void> {
  await setSetting("bank_details", JSON.stringify(d));
}

export type ManualOrderInput = {
  kind: "free" | "bank";
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  vatNumber: string | null;
  address: string | null;
  tierId: string;
  quantity: number;
  note: string | null;
  /** Bank orders: days the seats are held for the transfer. */
  dueDays: number;
  lang: "bg" | "en";
};

export type ManualOrderResult =
  | { ok: true; reference: string; kind: "free" | "bank" }
  | { ok: false; reason: "unknown_tier" | "bad_quantity" | "sold_out"; left?: number };

export async function createManualOrder(input: ManualOrderInput): Promise<ManualOrderResult> {
  const tier = getTier(input.tierId);
  if (!tier) return { ok: false, reason: "unknown_tier" };
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 200) return { ok: false, reason: "bad_quantity" };

  const db = getDb();
  const unitPriceCents = priceOf(await getPricing(), tier);
  const grossCents = unitPriceCents * input.quantity;
  const free = input.kind === "free";
  const totalCents = free ? 0 : grossCents;
  const { netCents, vatCents } = splitVat(totalCents);
  const dueAt = free ? null : new Date(Date.now() + input.dueDays * 86_400_000);

  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"tier:" + tier.id}))`);
    const [taken] = await tx
      .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
      .from(orderItems)
      .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
      .where(
        sql`${orderItems.tierId} = ${tier.id} and (
          ${orders.status} = 'paid'
          or (${orders.status} = 'pending' and ${orders.paymentMethod} = 'bank' and ${orders.bankDueAt} > now())
          or (${orders.status} = 'pending' and ${orders.paymentMethod} = 'card' and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')
        )`,
      );
    const left = tier.capacity - (taken?.n ?? 0);
    if (left < input.quantity) return { ok: false as const, reason: "sold_out" as const, left: Math.max(left, 0) };

    const reference = `SLS-${randomCode(6)}`;
    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        status: "pending",
        email: input.email.trim().toLowerCase(),
        name: input.name.trim(),
        phone: input.phone,
        subtotalCents: netCents,
        vatCents,
        totalCents,
        currency: CURRENCY,
        vatRateBp: Math.round(VAT_RATE * 10000),
        invoiceCompany: input.company,
        invoiceVatNumber: input.vatNumber,
        invoiceAddress: input.address,
        termsAcceptedAt: new Date(),
        termsText: free ? "issued by the team: complimentary" : "issued by the team: bank transfer",
        discountCents: free ? grossCents : 0,
        paymentMethod: free ? "admin" : "bank",
        bankDueAt: dueAt,
        note: input.note,
        lang: input.lang,
      })
      .returning({ id: orders.id });
    await tx.insert(orderItems).values({ orderId: order.id, tierId: tier.id, tierName: tier.name, unitPriceCents, quantity: input.quantity });
    return { ok: true as const, id: order.id, reference };
  });
  if (!created.ok) return created;

  if (free) {
    const paid = await markOrderPaid(created.id, null);
    if (paid.order) {
      await sendTicketEmail({
        to: paid.order.email,
        buyerName: paid.order.name,
        reference: paid.order.reference,
        totalCents: 0,
        invoiceNumber: null,
        tickets: paid.order.tickets,
        lang: input.lang,
      });
    }
  } else {
    await sendProformaEmail({
      to: input.email,
      buyerName: input.name,
      reference: created.reference,
      totalCents,
      items: `${input.quantity}× ${tier.name}`,
      dueAt: dueAt!,
      bank: await getBankDetails(),
      lang: input.lang,
    });
  }
  return { ok: true, reference: created.reference, kind: input.kind };
}

export type BankOrder = {
  id: string;
  reference: string;
  name: string;
  email: string;
  company: string | null;
  totalCents: number;
  items: string;
  createdAt: Date;
  bankDueAt: Date | null;
  note: string | null;
  overdue: boolean;
};

/** Bank orders still waiting for the transfer, soonest due first. */
export async function listBankOrders(): Promise<BankOrder[]> {
  const rows = await getDb()
    .select({
      id: orders.id,
      reference: orders.reference,
      name: orders.name,
      email: orders.email,
      company: orders.invoiceCompany,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
      bankDueAt: orders.bankDueAt,
      note: orders.note,
      items: sql<string>`(select string_agg(i.quantity || '× ' || i.tier_name, ', ') from order_items i where i.order_id = ${orders.id})`,
    })
    .from(orders)
    .where(sql`${orders.status} = 'pending' and ${orders.paymentMethod} = 'bank'`)
    .orderBy(orders.bankDueAt, desc(orders.createdAt));
  const now = Date.now();
  return rows.map((r) => ({ ...r, items: r.items ?? "", overdue: !!r.bankDueAt && r.bankDueAt.getTime() < now }));
}

/** The money arrived: the invoice number is drawn and the tickets go out, as after a card payment. */
export async function markBankOrderPaid(reference: string): Promise<"ok" | "not_found"> {
  const db = getDb();
  const [o] = await db.select({ id: orders.id, lang: orders.lang }).from(orders).where(sql`${orders.reference} = ${reference} and ${orders.status} = 'pending' and ${orders.paymentMethod} = 'bank'`).limit(1);
  if (!o) return "not_found";
  const paid = await markOrderPaid(o.id, null);
  if (paid.order) {
    await sendTicketEmail({
      to: paid.order.email,
      buyerName: paid.order.name,
      reference: paid.order.reference,
      totalCents: paid.order.totalCents,
      invoiceNumber: paid.order.invoiceNumber,
      tickets: paid.order.tickets,
      lang: o.lang === "en" ? "en" : "bg",
    });
  }
  return "ok";
}

/** No transfer came: the order is closed and its seats are free again. */
export async function cancelBankOrder(reference: string): Promise<string | null> {
  const db = getDb();
  const [o] = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(sql`${orders.reference} = ${reference} and ${orders.status} = 'pending' and ${orders.paymentMethod} = 'bank'`)
    .returning({ id: orders.id });
  if (!o) return null;
  const [item] = await db.select({ tierId: orderItems.tierId }).from(orderItems).where(sql`${orderItems.orderId} = ${o.id}`).limit(1);
  return item?.tierId ?? null;
}

export type Proforma = {
  reference: string;
  createdAt: Date;
  dueAt: Date | null;
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
  paid: boolean;
  bank: BankDetails;
};

export async function getProforma(reference: string): Promise<Proforma | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      createdAt: orders.createdAt,
      dueAt: orders.bankDueAt,
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
    })
    .from(orders)
    .where(sql`${orders.reference} = ${reference} and ${orders.paymentMethod} = 'bank' and ${orders.status} in ('pending', 'paid')`)
    .limit(1);
  if (!row) return null;
  const items = await db
    .select({ tierName: orderItems.tierName, unitPriceCents: orderItems.unitPriceCents, quantity: orderItems.quantity })
    .from(orderItems)
    .where(sql`${orderItems.orderId} = ${row.id}`);
  return { ...row, items, paid: row.status === "paid", bank: await getBankDetails() };
}
