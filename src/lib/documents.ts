import "server-only";

import { randomInt } from "node:crypto";

import { asc, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { deckLinks, documentLines, documents } from "@/lib/db/schema";
import { type BankDetails, getBankDetails } from "@/lib/manual-orders";
import { CURRENCY, VAT_RATE } from "@/lib/tickets";

/**
 * Proformas and invoices for what is not a ticket - a sponsorship package, a
 * workshop fee, a service.
 *
 * The lifecycle is the bank-transfer one the ticket side already uses: the
 * proforma goes out and asks for the money, and the invoice is raised only
 * once the money is there. That ordering is what keeps the numbering run
 * whole - a number is drawn on payment, never on a document that may yet be
 * cancelled.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = (n: number) => Array.from({ length: n }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

/** "DOC-" rather than "SLS-": the public pages tell the two apart by prefix. */
export const DOCUMENT_PREFIX = "DOC-";
export const isDocumentReference = (v: string) => /^DOC-[A-Z0-9]{6}$/.test(v);

export type DocumentLineInput = { description: string; unitPriceCents: number; quantity: number };

export type DocumentInput = {
  /** The partner pipeline row this is raised against, when there is one. */
  deckLinkId: string | null;
  buyerName: string;
  buyerEmail: string;
  company: string | null;
  vatNumber: string | null;
  address: string | null;
  lines: DocumentLineInput[];
  /** Days until the proforma is due. */
  dueDays: number;
  note: string | null;
  lang: "bg" | "en";
};

export type DocumentRow = {
  id: string;
  reference: string;
  kind: string;
  status: string;
  deckLinkId: string | null;
  buyerName: string;
  buyerEmail: string;
  company: string | null;
  totalCents: number;
  invoiceNumber: number | null;
  invoicedAt: Date | null;
  dueAt: Date | null;
  note: string | null;
  createdAt: Date;
  /** "2× Платинен пакет, 1× Уъркшоп" - the lines in one line. */
  items: string;
  overdue: boolean;
};

/** Net in, VAT on top: a sponsor deal is agreed net, the way the pipeline stores it. */
function money(lines: DocumentLineInput[]) {
  const subtotalCents = lines.reduce((a, l) => a + l.unitPriceCents * l.quantity, 0);
  const vatCents = Math.round(subtotalCents * VAT_RATE);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}

export async function createDocument(input: DocumentInput): Promise<{ reference: string }> {
  const { subtotalCents, vatCents, totalCents } = money(input.lines);
  const reference = `${DOCUMENT_PREFIX}${randomCode(6)}`;
  const db = getDb();

  await db.transaction(async (tx) => {
    const [doc] = await tx
      .insert(documents)
      .values({
        reference,
        deckLinkId: input.deckLinkId,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail.trim().toLowerCase(),
        company: input.company,
        vatNumber: input.vatNumber,
        address: input.address,
        subtotalCents,
        vatCents,
        totalCents,
        vatRateBp: Math.round(VAT_RATE * 10000),
        currency: CURRENCY,
        dueAt: new Date(Date.now() + input.dueDays * 86_400_000),
        note: input.note,
        lang: input.lang,
      })
      .returning({ id: documents.id });

    await tx.insert(documentLines).values(
      input.lines.map((l, i) => ({
        documentId: doc.id,
        description: l.description,
        unitPriceCents: l.unitPriceCents,
        quantity: l.quantity,
        position: i,
      })),
    );
  });

  return { reference };
}

/** Newest first, for the admin list. */
export async function listDocuments(limit = 200): Promise<DocumentRow[]> {
  const rows = await getDb()
    .select({
      id: documents.id,
      reference: documents.reference,
      kind: documents.kind,
      status: documents.status,
      deckLinkId: documents.deckLinkId,
      buyerName: documents.buyerName,
      buyerEmail: documents.buyerEmail,
      company: documents.company,
      totalCents: documents.totalCents,
      invoiceNumber: documents.invoiceNumber,
      invoicedAt: documents.invoicedAt,
      dueAt: documents.dueAt,
      note: documents.note,
      createdAt: documents.createdAt,
      // "documents.id" spelled out - see the note in admin-stats.ts.
      items: sql<string>`(select string_agg(l.quantity || '× ' || l.description, ', ' order by l.position) from document_lines l where l.document_id = documents.id)`,
    })
    .from(documents)
    .orderBy(desc(documents.createdAt))
    .limit(limit);

  const now = Date.now();
  return rows.map((r) => ({
    ...r,
    items: r.items ?? "",
    overdue: r.status === "open" && !!r.dueAt && r.dueAt.getTime() < now,
  }));
}

type DocumentWithLines = {
  id: string;
  reference: string;
  kind: string;
  status: string;
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
  invoiceNumber: number | null;
  invoicedAt: Date | null;
  dueAt: Date | null;
  lang: string;
  createdAt: Date;
  lines: { description: string; unitPriceCents: number; quantity: number }[];
};

async function loadDocument(reference: string): Promise<DocumentWithLines | null> {
  const db = getDb();
  const [row] = await db.select().from(documents).where(eq(documents.reference, reference)).limit(1);
  if (!row) return null;
  const lines = await db
    .select({ description: documentLines.description, unitPriceCents: documentLines.unitPriceCents, quantity: documentLines.quantity })
    .from(documentLines)
    .where(eq(documentLines.documentId, row.id))
    .orderBy(asc(documentLines.position));
  return { ...row, lines };
}

/**
 * The proforma, in the shape ProformaDocument already draws - so a sponsor's
 * sheet and a ticket buyer's are the same document with different lines.
 */
export async function getDocumentProforma(reference: string) {
  const d = await loadDocument(reference);
  if (!d || d.status === "cancelled") return null;
  const bank: BankDetails = await getBankDetails();
  return {
    reference: d.reference,
    createdAt: d.createdAt,
    dueAt: d.dueAt,
    buyerName: d.buyerName,
    buyerEmail: d.buyerEmail,
    company: d.company,
    vatNumber: d.vatNumber,
    address: d.address,
    subtotalCents: d.subtotalCents,
    vatCents: d.vatCents,
    totalCents: d.totalCents,
    vatRateBp: d.vatRateBp,
    currency: d.currency,
    items: d.lines.map((l) => ({ tierName: l.description, description: l.description, unitPriceCents: l.unitPriceCents, quantity: l.quantity })),
    paid: d.status === "paid",
    bank,
  };
}

/** The invoice, in the shape InvoiceDocument draws. Null until one is raised. */
export async function getDocumentInvoice(reference: string) {
  const d = await loadDocument(reference);
  if (!d?.invoiceNumber || !d.invoicedAt) return null;
  return {
    number: d.invoiceNumber,
    issuedAt: d.invoicedAt,
    reference: d.reference,
    buyerName: d.buyerName,
    buyerEmail: d.buyerEmail,
    company: d.company,
    vatNumber: d.vatNumber,
    address: d.address,
    subtotalCents: d.subtotalCents,
    vatCents: d.vatCents,
    totalCents: d.totalCents,
    vatRateBp: d.vatRateBp,
    currency: d.currency,
    items: d.lines.map((l) => ({ tierName: l.description, description: l.description, unitPriceCents: l.unitPriceCents, quantity: l.quantity })),
    discountCents: 0,
    promoCode: null,
    creditNoteNumber: null,
    creditNotedAt: null,
    lang: d.lang,
    paymentMethod: "bank",
  };
}

/**
 * The money arrived: the invoice number is drawn here and nowhere else, from
 * the same sequence the ticket invoices use. Guarded on `invoice_number is
 * null`, so a double click cannot take a second number and leave a hole.
 */
export async function markDocumentPaid(reference: string): Promise<number | null> {
  const db = getDb();
  const [row] = await db.execute<{ invoice_number: string }>(
    sql`update ${documents}
        set invoice_number = nextval('invoice_number_seq'),
            invoiced_at = now(),
            kind = 'invoice',
            status = 'paid',
            updated_at = now()
        where ${documents.reference} = ${reference}
          and ${documents.status} = 'open'
          and ${documents.invoiceNumber} is null
        returning invoice_number`,
  );
  if (!row) return null;

  // The pipeline is where the team reads the money from; leaving it on
  // "договорено" after the cash is in makes Финанси understate the bank.
  const [doc] = await db.select({ deckLinkId: documents.deckLinkId }).from(documents).where(eq(documents.reference, reference)).limit(1);
  if (doc?.deckLinkId) {
    await db.update(deckLinks).set({ money: "paid", updatedAt: new Date() }).where(eq(deckLinks.id, doc.deckLinkId));
  }
  return Number(row.invoice_number);
}

/** Nothing came of it. The document keeps its history; it just stops counting. */
export async function cancelDocument(reference: string): Promise<boolean> {
  const [row] = await getDb()
    .update(documents)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(sql`${documents.reference} = ${reference} and ${documents.status} = 'open'`)
    .returning({ id: documents.id });
  return !!row;
}

/** A date window, as the accountant asks for it: two days, inclusive. */
export type DateRange = { from?: string; to?: string };

/**
 * The window, compared in Sofia time rather than UTC. An invoice raised at
 * 01:00 on the first belongs to that month here, and would fall into the
 * previous one if the comparison were made in UTC.
 */
export function inRange(column: string, range?: DateRange) {
  const clauses = [];
  if (range?.from) clauses.push(sql`(${sql.raw(column)} at time zone 'Europe/Sofia')::date >= ${range.from}::date`);
  if (range?.to) clauses.push(sql`(${sql.raw(column)} at time zone 'Europe/Sofia')::date <= ${range.to}::date`);
  return clauses;
}

/**
 * Every numbered document with its lines, in the shape the invoice list, the
 * print sheet and the accountant's CSV already expect from a ticket invoice.
 */
export async function listDocumentInvoices(range?: DateRange) {
  const db = getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(sql.join([sql`${documents.invoiceNumber} is not null`, sql`${documents.invoicedAt} is not null`, ...inRange("invoiced_at", range)], sql` and `))
    .orderBy(asc(documents.invoiceNumber));
  if (rows.length === 0) return [];

  const lines = await db
    .select({ documentId: documentLines.documentId, description: documentLines.description, unitPriceCents: documentLines.unitPriceCents, quantity: documentLines.quantity })
    .from(documentLines)
    .orderBy(asc(documentLines.position));

  return rows.map((d) => ({
    number: d.invoiceNumber as number,
    issuedAt: d.invoicedAt as Date,
    reference: d.reference,
    buyerName: d.buyerName,
    buyerEmail: d.buyerEmail,
    company: d.company,
    vatNumber: d.vatNumber,
    address: d.address,
    subtotalCents: d.subtotalCents,
    vatCents: d.vatCents,
    totalCents: d.totalCents,
    vatRateBp: d.vatRateBp,
    currency: d.currency,
    items: lines
      .filter((l) => l.documentId === d.id)
      .map((l) => ({ tierName: l.description, description: l.description, unitPriceCents: l.unitPriceCents, quantity: l.quantity })),
    discountCents: 0,
    promoCode: null as string | null,
    creditNoteNumber: null as number | null,
    creditNotedAt: null as Date | null,
    lang: d.lang,
    paymentMethod: "bank" as string | null,
    status: "paid",
    refundedCents: null as number | null,
    refundedAt: null as Date | null,
    /** Tells the list a row is not a ticket order - no ticket mail to resend. */
    isDocument: true as const,
  }));
}

/** Confirmed partners with a deal, for the "raise a document for" picker. */
export async function listPartnersForDocuments() {
  return getDb()
    .select({
      id: deckLinks.id,
      label: deckLinks.label,
      tier: deckLinks.tier,
      amountCents: deckLinks.amountCents,
      money: deckLinks.money,
      contactName: deckLinks.contactName,
      contactEmail: deckLinks.contactEmail,
    })
    .from(deckLinks)
    .where(sql`${deckLinks.stage} = 'confirmed' and ${deckLinks.amountCents} is not null`)
    .orderBy(desc(deckLinks.amountCents));
}
