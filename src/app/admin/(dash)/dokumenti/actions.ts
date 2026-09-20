"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { cancelDocument, createDocument, isDocumentReference, markDocumentPaid, resendDocument } from "@/lib/documents";

export type DocState = { status: "idle" | "ok" | "error"; message?: string; reference?: string };

function done() {
  revalidatePath("/admin/dokumenti");
  // The number lands in the invoice run and the money in the pipeline totals.
  revalidatePath("/admin/fakturi");
  revalidatePath("/admin/finansi");
}

/** "1 200,50" and "1200.50" both mean the same thing to whoever types it. */
function toCents(raw: string): number | null {
  const clean = raw.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

export async function createDoc(_prev: DocState, formData: FormData): Promise<DocState> {
  if (!(await canAccess("dokumenti"))) return { status: "error", message: "Няма достъп." };

  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  const buyerName = s("buyerName", 120);
  const buyerEmail = String(formData.get("buyerEmail") ?? "").trim().toLowerCase();
  const dueDays = Number.parseInt(String(formData.get("dueDays") ?? "7"), 10);
  const lang = formData.get("lang") === "en" ? "en" : "bg";
  const deckLinkId = s("deckLinkId", 64);

  if (!buyerName || buyerName.length < 2) return { status: "error", message: "Напиши име на лицето за контакт." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail)) return { status: "error", message: "Провери имейла." };
  if (!Number.isInteger(dueDays) || dueDays < 1 || dueDays > 90) return { status: "error", message: "Срокът за плащане: 1 до 90 дни." };

  const descriptions = formData.getAll("lineDescription").map((v) => String(v).trim());
  const prices = formData.getAll("linePrice").map((v) => String(v));
  const quantities = formData.getAll("lineQty").map((v) => String(v));

  const lines = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i].slice(0, 200);
    // A row left completely blank is the empty one at the bottom, not an error.
    if (!description && !prices[i]?.trim()) continue;
    if (!description) return { status: "error", message: `Ред ${i + 1}: напиши какво се фактурира.` };
    const unitPriceCents = toCents(prices[i] ?? "");
    if (unitPriceCents === null || unitPriceCents <= 0) return { status: "error", message: `Ред ${i + 1}: провери цената.` };
    const quantity = Number.parseInt(quantities[i] ?? "1", 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return { status: "error", message: `Ред ${i + 1}: количеството трябва да е между 1 и 1000.` };
    lines.push({ description, unitPriceCents, quantity });
  }
  if (lines.length === 0) return { status: "error", message: "Добави поне един ред." };

  const { reference } = await createDocument({
    deckLinkId,
    buyerName,
    buyerEmail,
    company: s("company", 160),
    vatNumber: s("vatNumber", 40),
    address: s("address", 300),
    lines,
    dueDays,
    note: s("note", 300),
    lang,
  });
  done();
  return { status: "ok", reference, message: `Проформата е готова (${reference}) и вече е изпратена на ${buyerEmail}.` };
}

export type SendState = { status: "idle" | "ok" | "error"; message?: string };

/** Sends the proforma or the invoice again, by hand. */
export async function sendDoc(_prev: SendState, formData: FormData): Promise<SendState> {
  if (!(await canAccess("dokumenti"))) return { status: "error", message: "Няма достъп." };
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const kind = formData.get("kind") === "invoice" ? "invoice" : "proforma";
  if (!isDocumentReference(reference)) return { status: "error", message: "Невалиден номер." };

  const r = await resendDocument(reference, kind);
  done();
  if (r === "sent") return { status: "ok", message: `${kind === "invoice" ? "Фактурата" : "Проформата"} е изпратена.` };
  return {
    status: "error",
    message: {
      not_found: "Документът не е намерен или е отказан.",
      no_invoice: "Още няма фактура - маркирай документа като платен.",
      failed: "Изпращането не мина. Провери дневника.",
    }[r],
  };
}

export async function payDoc(formData: FormData): Promise<void> {
  if (!(await canAccess("dokumenti"))) return;
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  if (!isDocumentReference(reference)) return;
  await markDocumentPaid(reference);
  done();
}

export async function cancelDoc(formData: FormData): Promise<void> {
  if (!(await canAccess("dokumenti"))) return;
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  if (!isDocumentReference(reference)) return;
  await cancelDocument(reference);
  done();
}
