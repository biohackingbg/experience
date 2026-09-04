"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { cancelBankOrder, createManualOrder, markBankOrderPaid, saveBankDetails } from "@/lib/manual-orders";
import { getTier } from "@/lib/tickets";
import { notifyWaitlist } from "@/lib/waitlist";

export type IssueState = { status: "idle" | "ok" | "error"; message?: string; reference?: string };

function done() {
  revalidatePath("/admin/izdai");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function issueOrder(_prev: IssueState, formData: FormData): Promise<IssueState> {
  if (!(await canAccess("izdai"))) return { status: "error", message: "Няма достъп." };
  const kind = formData.get("kind") === "bank" ? "bank" : "free";
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  const name = s("name", 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const tierId = String(formData.get("tierId") ?? "");
  const quantity = Number.parseInt(String(formData.get("quantity") ?? ""), 10);
  const dueDays = Number.parseInt(String(formData.get("dueDays") ?? "7"), 10);
  const lang = formData.get("lang") === "en" ? "en" : "bg";

  if (!name || name.length < 2) return { status: "error", message: "Напиши име." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { status: "error", message: "Провери имейла." };
  if (!getTier(tierId)) return { status: "error", message: "Избери ниво." };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 200) return { status: "error", message: "Броят трябва да е между 1 и 200." };
  if (kind === "bank" && (!Number.isInteger(dueDays) || dueDays < 1 || dueDays > 60)) return { status: "error", message: "Срокът за превод: 1 до 60 дни." };

  const r = await createManualOrder({
    kind,
    name,
    email,
    phone: s("phone", 40),
    company: s("company", 160),
    vatNumber: s("vatNumber", 40),
    address: s("address", 300),
    tierId,
    quantity,
    note: s("note", 300),
    dueDays,
    lang,
  });
  done();
  if (!r.ok) {
    return {
      status: "error",
      message: r.reason === "sold_out" ? `Няма толкова места: остават ${r.left ?? 0}.` : "Поръчката не можа да се създаде.",
    };
  }
  return {
    status: "ok",
    reference: r.reference,
    message: kind === "free" ? `Билетите са издадени и изпратени на ${email} (поръчка ${r.reference}).` : `Проформата е изпратена на ${email} (поръчка ${r.reference}). Местата са запазени ${dueDays} дни.`,
  };
}

export async function bankPaid(formData: FormData): Promise<void> {
  if (!(await canAccess("izdai"))) return;
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  if (!/^SLS-[A-Z0-9]{6}$/.test(reference)) return;
  await markBankOrderPaid(reference);
  done();
}

export async function bankCancel(formData: FormData): Promise<void> {
  if (!(await canAccess("izdai"))) return;
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  if (!/^SLS-[A-Z0-9]{6}$/.test(reference)) return;
  const tierId = await cancelBankOrder(reference);
  if (tierId) await notifyWaitlist(tierId);
  done();
}

export async function saveBank(_prev: IssueState, formData: FormData): Promise<IssueState> {
  if (!(await canAccess("izdai"))) return { status: "error", message: "Няма достъп." };
  const s = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 120);
  await saveBankDetails({ holder: s("holder"), iban: s("iban").replace(/\s+/g, "").toUpperCase(), bic: s("bic").toUpperCase(), bank: s("bank") });
  done();
  return { status: "ok", message: "Записано." };
}
