import "server-only";

import { randomInt } from "node:crypto";

import { asc, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { deckLinks, documentLines, documents } from "@/lib/db/schema";
import { type DocumentEmailInput, documentEmailParts, sendDocumentEmail } from "@/lib/email";
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
  /**
   * Whether the proforma leaves by email the moment it exists. Off while
   * the letters land in spam: a company that finds the proforma in its junk
   * folder and then gets it again by hand has been written to twice, and
   * neither copy reads well.
   */
  send?: boolean;
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
  creditNoteNumber: number | null;
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

  // A proforma against a partner moves that deal from "договорено" to
  // "фактурирано", so Финанси stops counting the money as merely promised.
  // Guarded, so re-invoicing a partner who has already paid cannot walk the
  // row backwards.
  if (input.deckLinkId) {
    await db.execute(
      sql`update ${deckLinks}
          set money = 'invoiced', updated_at = now()
          where ${deckLinks.id} = ${input.deckLinkId}
            and (money is null or money = 'agreed')`,
    );
  }

  // The proforma is of no use sitting in the admin: it goes to the buyer the
  // moment it exists, the same way a bank-transfer ticket order's does -
  // unless the team is sending it by hand for now.
  if (input.send !== false) await sendDocumentEmail("proforma", {
    to: input.buyerEmail,
    buyerName: input.buyerName,
    company: input.company,
    reference,
    totalCents,
    items: input.lines.map((l) => `${l.quantity}× ${l.description}`).join(", "),
    dueAt: new Date(Date.now() + input.dueDays * 86_400_000),
    bank: await getBankDetails(),
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
      creditNoteNumber: documents.creditNoteNumber,
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
  creditNoteNumber: number | null;
  creditNotedAt: Date | null;
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
    paid: d.status === "paid" || d.status === "credited",
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
    creditNoteNumber: d.creditNoteNumber,
    creditNotedAt: d.creditNotedAt,
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
  const [doc] = await db
    .select({
      deckLinkId: documents.deckLinkId,
      buyerEmail: documents.buyerEmail,
      buyerName: documents.buyerName,
      company: documents.company,
      totalCents: documents.totalCents,
    })
    .from(documents)
    .where(eq(documents.reference, reference))
    .limit(1);
  if (doc?.deckLinkId) {
    await db.update(deckLinks).set({ money: "paid", updatedAt: new Date() }).where(eq(deckLinks.id, doc.deckLinkId));
  }

  if (doc) {
    const lines = await db
      .select({ description: documentLines.description, quantity: documentLines.quantity })
      .from(documentLines)
      .innerJoin(documents, eq(documents.id, documentLines.documentId))
      .where(eq(documents.reference, reference))
      .orderBy(asc(documentLines.position));
    await sendDocumentEmail("invoice", {
      to: doc.buyerEmail,
      buyerName: doc.buyerName,
      company: doc.company,
      reference,
      totalCents: doc.totalCents,
      items: lines.map((l) => `${l.quantity}× ${l.description}`).join(", "),
      invoiceNumber: Number(row.invoice_number),
    });
  }

  return Number(row.invoice_number);
}

/**
 * Sends the document again, to the address it was raised for.
 *
 * The letters go out by themselves - the proforma when it is raised, the
 * invoice when the money is marked in - so this is for the times that is not
 * enough: a buyer who deleted it, an address that bounced, a colleague who
 * needs it forwarded.
 */
export async function resendDocument(reference: string, kind: "proforma" | "invoice"): Promise<"sent" | "not_found" | "no_invoice" | "failed"> {
  const d = await loadDocument(reference);
  if (!d || d.status === "cancelled") return "not_found";
  if (kind === "invoice" && !d.invoiceNumber) return "no_invoice";

  const ok = await sendDocumentEmail(kind, {
    to: d.buyerEmail,
    buyerName: d.buyerName,
    company: d.company,
    reference: d.reference,
    totalCents: d.totalCents,
    items: d.lines.map((l) => `${l.quantity}× ${l.description}`).join(", "),
    dueAt: kind === "proforma" ? d.dueAt : null,
    invoiceNumber: d.invoiceNumber,
    bank: kind === "proforma" ? await getBankDetails() : undefined,
  });
  return ok ? "sent" : "failed";
}

/**
 * Undoes an issued invoice with a credit note - the only lawful way back
 * from a number: the invoice stays in the run, and the note takes the next
 * number from the same sequence, the way the ticket refunds do. Guarded in
 * the query, so a double click cannot draw a second number.
 *
 * The document stops counting as income, and the partner's deal falls back
 * to what its other documents say: paid if another one is, invoiced if one
 * is still open, agreed otherwise.
 */
export async function issueDocumentCreditNote(reference: string): Promise<number | null> {
  const db = getDb();
  const [row] = await db.execute<{ credit_note_number: string; deck_link_id: string | null }>(
    sql`update ${documents}
        set credit_note_number = nextval('invoice_number_seq'),
            credit_noted_at = now(),
            status = 'credited',
            updated_at = now()
        where ${documents.reference} = ${reference}
          and ${documents.status} = 'paid'
          and ${documents.invoiceNumber} is not null
          and ${documents.creditNoteNumber} is null
        returning credit_note_number, deck_link_id`,
  );
  if (!row) return null;

  if (row.deck_link_id) {
    const others = await db
      .select({ status: documents.status })
      .from(documents)
      .where(sql`${documents.deckLinkId} = ${row.deck_link_id} and ${documents.status} in ('paid', 'open')`);
    const money = others.some((o) => o.status === "paid") ? "paid" : others.some((o) => o.status === "open") ? "invoiced" : "agreed";
    await db.update(deckLinks).set({ money, updatedAt: new Date() }).where(eq(deckLinks.id, row.deck_link_id));
  }
  return Number(row.credit_note_number);
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

/**
 * Throws a document away for good - for the one typed wrong.
 *
 * Only ever a proforma. A proforma is not a tax document and nothing in the
 * books points at it, so a mistyped one is better gone than left crossed
 * out. An invoice is the opposite: its number comes from a run that has to
 * stay whole, and the way to undo one is a credit note, never a delete. The
 * guard is in the query, not only in the page, because a server action is
 * its own entry point.
 *
 * The lines go with it - the foreign key deletes them - and the partner's
 * deal falls back to "договорено" if this was the only document that made
 * it "фактурирано".
 */
export async function deleteDocument(reference: string): Promise<"deleted" | "has_invoice" | "not_found"> {
  const db = getDb();
  const [doc] = await db
    .select({ id: documents.id, deckLinkId: documents.deckLinkId, invoiceNumber: documents.invoiceNumber })
    .from(documents)
    .where(eq(documents.reference, reference))
    .limit(1);
  if (!doc) return "not_found";
  if (doc.invoiceNumber !== null) return "has_invoice";

  await db.delete(documents).where(sql`${documents.id} = ${doc.id} and ${documents.invoiceNumber} is null`);

  if (doc.deckLinkId) {
    const [left] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(documents)
      .where(sql`${documents.deckLinkId} = ${doc.deckLinkId} and ${documents.status} <> 'cancelled'`);
    if ((left?.n ?? 0) === 0) {
      await db.execute(
        sql`update ${deckLinks}
            set money = 'agreed', updated_at = now()
            where ${deckLinks.id} = ${doc.deckLinkId} and money = 'invoiced'`,
      );
    }
  }
  return "deleted";
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
    creditNoteNumber: d.creditNoteNumber as number | null,
    creditNotedAt: d.creditNotedAt as Date | null,
    lang: d.lang,
    paymentMethod: "bank" as string | null,
    // A credited invoice reads like a fully refunded order everywhere the
    // lists already handle one: the sheet, the print run, the CSV.
    status: d.creditNoteNumber ? "refunded" : "paid",
    refundedCents: d.creditNoteNumber ? d.totalCents : (null as number | null),
    refundedAt: d.creditNoteNumber ? d.creditNotedAt : (null as Date | null),
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

export type SentDocumentMail = {
  kind: "proforma" | "invoice";
  /** Where it went. */
  to: string;
  /** The company, or the contact when there is no company. */
  who: string;
  /** When the letter left. */
  sentAt: Date;
  reference: string;
  input: DocumentEmailInput;
};

/**
 * The last proforma or invoice letter that went to a partner, ready to be
 * rendered again.
 *
 * Inferred rather than archived: nothing keeps a copy of a sent letter, but
 * both of these leave at a moment the row records - the proforma when the
 * document is raised, the invoice when it is marked paid. Re-rendering from
 * the row is therefore the same letter, unless the wording was edited in
 * between, which is why the page says when it went.
 */
export async function latestDocumentMail(kind: "proforma" | "invoice"): Promise<SentDocumentMail | null> {
  const db = getDb();
  const where =
    kind === "invoice"
      ? sql`${documents.invoiceNumber} is not null and ${documents.invoicedAt} is not null`
      : sql`${documents.status} <> 'cancelled'`;
  const [row] = await db
    .select({
      reference: documents.reference,
      buyerName: documents.buyerName,
      buyerEmail: documents.buyerEmail,
      company: documents.company,
      totalCents: documents.totalCents,
      dueAt: documents.dueAt,
      invoiceNumber: documents.invoiceNumber,
      createdAt: documents.createdAt,
      invoicedAt: documents.invoicedAt,
    })
    .from(documents)
    .where(where)
    .orderBy(desc(kind === "invoice" ? documents.invoicedAt : documents.createdAt))
    .limit(1);
  if (!row) return null;

  const lines = await db
    .select({ description: documentLines.description, quantity: documentLines.quantity })
    .from(documentLines)
    .innerJoin(documents, eq(documents.id, documentLines.documentId))
    .where(eq(documents.reference, row.reference))
    .orderBy(asc(documentLines.position));

  return {
    kind,
    to: row.buyerEmail,
    who: row.company ?? row.buyerName,
    sentAt: (kind === "invoice" ? row.invoicedAt : row.createdAt) ?? row.createdAt,
    reference: row.reference,
    input: {
      to: row.buyerEmail,
      buyerName: row.buyerName,
      company: row.company,
      reference: row.reference,
      totalCents: row.totalCents,
      items: lines.map((l) => `${l.quantity}× ${l.description}`).join(", "),
      ...(kind === "proforma" ? { dueAt: row.dueAt, bank: await getBankDetails() } : { invoiceNumber: row.invoiceNumber }),
    },
  };
}

/**
 * The proforma or invoice letter as text, for sending by hand.
 *
 * While the automatic letters land in spam, the team sends the document
 * from their own mailbox instead - one that has years of reputation and a
 * person behind it. This is the same wording the automatic letter would
 * carry, so the two never drift apart.
 */
export async function documentLetterText(reference: string, kind: "proforma" | "invoice"): Promise<{ subject: string; text: string } | null> {
  const d = await loadDocument(reference);
  if (!d || d.status === "cancelled") return null;
  if (kind === "invoice" && !d.invoiceNumber) return null;
  const items = d.lines.map((l) => `${l.quantity}× ${l.description}`).join(", ");
  const parts = documentEmailParts(kind, {
    to: d.buyerEmail,
    buyerName: d.buyerName,
    company: d.company,
    reference: d.reference,
    totalCents: d.totalCents,
    items,
    ...(kind === "proforma" ? { dueAt: d.dueAt, bank: await getBankDetails() } : { invoiceNumber: d.invoiceNumber }),
  });
  return { subject: parts.subject, text: parts.text };
}
