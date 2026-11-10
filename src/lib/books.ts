import "server-only";

import { and, asc, isNotNull, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { documentLines, documents } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";

/**
 * The books sold at the summit. The table sold by card: Stripe Payment Links
 * (made in the Stripe dashboard, books tax category, 9% VAT included, 1-10
 * copies, name and email asked). A company that wants an invoice pays by bank
 * on a document from Админ → Документи; its lines are matched here by title.
 */
export const BOOKS = [
  {
    id: "beztegovnost",
    title: "Безтегловност",
    author: "д-р Росио Салас-Уейлън",
    price: 18,
    cover: "/knigi/beztegovnost.jpg",
    url: "https://buy.stripe.com/5kQ00l1tDbsvdOpbjy18c00",
    link: "plink_1UYvnqPQhzRmdtRLjM1ocRZo",
  },
  {
    id: "protokolite",
    title: "Протоколите на Хюберман",
    author: "д-р Андрю Хюберман",
    price: 30,
    cover: "/knigi/protokolite.jpg",
    url: "https://buy.stripe.com/7sY9AVb4ddADeSt73i18c01",
    link: "plink_1UYvpyPQhzRmdtRLW774nS60",
  },
  {
    id: "zhivei-do-100",
    title: "Живей до 100",
    author: "Румен Георгиев",
    price: 15,
    cover: "/knigi/zhivei-do-100.jpg",
    url: "https://buy.stripe.com/dRm8wRc8haor11D2N218c02",
    link: "plink_1UZ6C5PQhzRmdtRLHz4wskfp",
  },
  {
    id: "teatrite-na-tyaloto",
    title: "Театрите на тялото",
    author: "Джойс Макдугъл, превод Виолета Азис",
    price: 13,
    cover: "/knigi/teatrite-na-tyaloto.jpg",
    url: "https://buy.stripe.com/3cIaEZ0pz9kn39L1IY18c03",
    link: "plink_1UZ6EAPQhzRmdtRLHUvo8T75",
  },
] as const;

export type BookSale = {
  id: string;
  at: Date;
  bookId: string;
  book: string;
  qty: number;
  /** What was paid, with VAT, in euros. */
  gross: number;
  /** Given back since (a price cut refunded by hand), in euros. */
  refunded: number;
  /** Kept: gross less refunded. */
  amount: number;
  name: string;
  email: string;
  /** "карта" (Stripe, at the table) or "фактура" (bank, on a document). */
  channel: "карта" | "фактура";
  /** The Stripe session, or the document reference and invoice number. */
  ref: string;
};

/** What Stripe has given back on the session's payment, in euros. */
function refundedOf(r: { payment_intent?: unknown }): number {
  const pi = r.payment_intent;
  if (!pi || typeof pi === "string") return 0;
  const ch = (pi as { latest_charge?: unknown }).latest_charge;
  if (!ch || typeof ch === "string") return 0;
  return ((ch as { amount_refunded?: number }).amount_refunded ?? 0) / 100;
}

/** Every paid card sale, from Stripe itself - all pages, not only the latest. */
export async function cardSales(limitPerBook?: number): Promise<BookSale[]> {
  const stripe = getStripe();
  const lists = await Promise.all(
    BOOKS.map(async (b) => {
      const params = { payment_link: b.link, status: "complete" as const, limit: limitPerBook ? Math.min(limitPerBook, 100) : 100, expand: ["data.line_items", "data.payment_intent.latest_charge"] };
      const rows = limitPerBook
        ? (await stripe.checkout.sessions.list(params)).data
        : await stripe.checkout.sessions.list(params).autoPagingToArray({ limit: 5000 });
      return { b, rows };
    }),
  );
  return lists.flatMap(({ b, rows }) =>
    rows
      .filter((r) => r.payment_status === "paid")
      .map((r) => {
        const gross = (r.amount_total ?? 0) / 100;
        const refunded = refundedOf(r);
        return {
          id: r.id,
          at: new Date(r.created * 1000),
          bookId: b.id,
          book: b.title,
          qty: r.line_items?.data[0]?.quantity ?? Math.max(1, Math.round(gross / b.price)),
          gross,
          refunded,
          amount: gross - refunded,
          name: r.customer_details?.name ?? "",
          email: r.customer_details?.email ?? "",
          channel: "карта" as const,
          ref: r.id,
        };
      }),
  );
}

/** Book lines on issued invoices that were not credited back. */
async function invoiceSales(): Promise<BookSale[]> {
  const rows = await getDb()
    .select({
      lineId: documentLines.id,
      description: documentLines.description,
      unit: documentLines.unitPriceCents,
      qty: documentLines.quantity,
      vatBp: documents.vatRateBp,
      reference: documents.reference,
      invoiceNumber: documents.invoiceNumber,
      invoicedAt: documents.invoicedAt,
      createdAt: documents.createdAt,
      company: documents.company,
      buyerName: documents.buyerName,
      email: documents.buyerEmail,
    })
    .from(documentLines)
    .innerJoin(documents, sql`${documents.id} = ${documentLines.documentId}`)
    .where(and(isNotNull(documents.invoiceNumber), isNull(documents.creditNoteNumber)))
    .orderBy(asc(documents.createdAt), asc(documentLines.position));
  const out: BookSale[] = [];
  for (const r of rows) {
    const b = BOOKS.find((x) => r.description.toLowerCase().includes(x.title.toLowerCase().split(" ")[0]));
    if (!b || !/книг/i.test(r.description)) continue;
    // Lines are net; the buyer paid them with the document's VAT on top.
    const gross = Math.round(r.unit * r.qty * (1 + r.vatBp / 10_000)) / 100;
    out.push({
      id: r.lineId,
      at: r.invoicedAt ?? r.createdAt,
      bookId: b.id,
      book: b.title,
      qty: r.qty,
      gross,
      refunded: 0,
      amount: gross,
      name: r.company || r.buyerName || "",
      email: r.email ?? "",
      channel: "фактура",
      ref: `${r.reference}${r.invoiceNumber ? ` / № ${String(r.invoiceNumber).padStart(10, "0")}` : ""}`,
    });
  }
  return out;
}

/** Everything sold, card and invoice, newest first. */
export async function allBookSales(): Promise<BookSale[]> {
  const [card, invoice] = await Promise.all([cardSales(), invoiceSales()]);
  return [...card, ...invoice].sort((x, y) => y.at.getTime() - x.at.getTime());
}

export type BookTotal = { id: string; title: string; copies: number; copiesCard: number; copiesInvoice: number; gross: number; refunded: number; amount: number; sales: number };

/** Per book: copies, money in, money given back, money kept. A sale refunded in full is a sale undone: its copies are left out. */
export function bookTotals(sales: BookSale[]): BookTotal[] {
  return BOOKS.map((b) => {
    const mine = sales.filter((s) => s.bookId === b.id);
    const sum = (f: (s: BookSale) => number) => Math.round(mine.reduce((a, s) => a + f(s), 0) * 100) / 100;
    const kept = (s: BookSale) => s.amount > 0;
    return {
      id: b.id,
      title: b.title,
      copies: sum((s) => (kept(s) ? s.qty : 0)),
      copiesCard: sum((s) => (kept(s) && s.channel === "карта" ? s.qty : 0)),
      copiesInvoice: sum((s) => (kept(s) && s.channel === "фактура" ? s.qty : 0)),
      gross: sum((s) => s.gross),
      refunded: sum((s) => s.refunded),
      amount: sum((s) => s.amount),
      sales: mine.filter(kept).length,
    };
  });
}
