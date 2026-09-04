"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { addExpense, isCategory, isExpenseStatus, removeBudget, setBudget, setExpenseStatus, updateExpense } from "@/lib/finances";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };

/** Euros as typed - "1 250", "1250,50" - to net cents, or null when not a number. */
function cents(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const n = Math.round(Number(raw) * 100);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function createExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  // Checked here, not only in the layout: a server action is its own entry point.
  if (!(await canAccess("finansi"))) return { status: "error", message: "Няма достъп." };

  const category = formData.get("category");
  const status = formData.get("status");
  const amountCents = cents(formData.get("amount"));
  const supplier = String(formData.get("supplier") ?? "").trim().slice(0, 120);
  const dateRaw = String(formData.get("date") ?? "");
  const date = dateRaw ? new Date(`${dateRaw}T12:00:00+03:00`) : new Date();

  if (!isCategory(category)) return { status: "error", message: "Избери категория." };
  if (!supplier) return { status: "error", message: "Напиши доставчик." };
  if (amountCents === null) return { status: "error", message: "Сумата не е число." };
  if (Number.isNaN(date.getTime())) return { status: "error", message: "Датата не е валидна." };

  await addExpense({
    date,
    category,
    supplier,
    description: String(formData.get("description") ?? "").trim().slice(0, 300) || null,
    amountCents,
    status: isExpenseStatus(status) ? status : "planned",
    invoiceNo: String(formData.get("invoiceNo") ?? "").trim().slice(0, 40) || null,
  });
  revalidatePath("/admin/finansi");
  revalidatePath("/admin");
  return { status: "ok", message: "Записано." };
}

export async function editExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("finansi"))) return { status: "error", message: "Няма достъп." };

  const id = String(formData.get("id") ?? "");
  const category = formData.get("category");
  const status = formData.get("status");
  const amountCents = cents(formData.get("amount"));
  const supplier = String(formData.get("supplier") ?? "").trim().slice(0, 120);
  const dateRaw = String(formData.get("date") ?? "");
  const date = dateRaw ? new Date(`${dateRaw}T12:00:00+03:00`) : new Date();

  if (!/^[0-9a-f-]{36}$/.test(id)) return { status: "error", message: "Невалиден ред." };
  if (!isCategory(category)) return { status: "error", message: "Избери категория." };
  if (!supplier) return { status: "error", message: "Напиши доставчик." };
  if (amountCents === null) return { status: "error", message: "Сумата не е число." };
  if (Number.isNaN(date.getTime())) return { status: "error", message: "Датата не е валидна." };

  await updateExpense(id, {
    date,
    category,
    supplier,
    description: String(formData.get("description") ?? "").trim().slice(0, 300) || null,
    amountCents,
    status: isExpenseStatus(status) ? status : "planned",
    invoiceNo: String(formData.get("invoiceNo") ?? "").trim().slice(0, 40) || null,
  });
  revalidatePath("/admin/finansi");
  revalidatePath("/admin");
  return { status: "ok", message: "Записано." };
}

export async function changeExpenseStatus(formData: FormData): Promise<void> {
  if (!(await canAccess("finansi"))) return;
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!/^[0-9a-f-]{36}$/.test(id) || !isExpenseStatus(status)) return;
  await setExpenseStatus(id, status);
  revalidatePath("/admin/finansi");
  revalidatePath("/admin");
}

export async function saveBudget(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("finansi"))) return { status: "error", message: "Няма достъп." };
  const category = formData.get("category");
  if (!isCategory(category)) return { status: "error", message: "Невалидна категория." };

  // An emptied field means "no budget for this category", not a typo.
  const raw = String(formData.get("amount") ?? "").trim();
  if (!raw) {
    await removeBudget(category);
    revalidatePath("/admin/finansi");
    return { status: "ok", message: "Махнат" };
  }

  const amountCents = cents(formData.get("amount"));
  if (amountCents === null) return { status: "error", message: "Не е число" };
  await setBudget(category, amountCents);
  revalidatePath("/admin/finansi");
  return { status: "ok", message: "Записан" };
}
