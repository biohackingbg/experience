"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { createPromo, deletePromo, isPromoKind, normaliseCode, setPromoActive } from "@/lib/promo";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const UUID = /^[0-9a-f-]{36}$/;

export async function addPromo(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("promo"))) return { status: "error", message: "Няма достъп." };
  const code = normaliseCode(String(formData.get("code") ?? ""));
  const kind = formData.get("kind");
  const valueRaw = String(formData.get("value") ?? "").replace(/\s/g, "").replace(",", ".");
  const maxRaw = String(formData.get("maxUses") ?? "").trim();
  const untilRaw = String(formData.get("validUntil") ?? "").trim();

  if (code.length < 3) return { status: "error", message: "Кодът трябва да е поне 3 знака (букви и цифри)." };
  if (!isPromoKind(kind)) return { status: "error", message: "Избери вид отстъпка." };
  const n = Number(valueRaw);
  if (!Number.isFinite(n) || n <= 0) return { status: "error", message: "Стойността не е число." };
  const value = kind === "percent" ? Math.round(n) : Math.round(n * 100);
  if (kind === "percent" && value > 100) return { status: "error", message: "Процентът не може да е над 100." };
  const maxUses = maxRaw ? Number.parseInt(maxRaw, 10) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return { status: "error", message: "Броят ползвания не е валиден." };
  const validUntil = untilRaw ? new Date(`${untilRaw}T23:59:59+03:00`) : null;
  if (validUntil && Number.isNaN(validUntil.getTime())) return { status: "error", message: "Датата не е валидна." };

  const r = await createPromo({ code, kind, value, maxUses, validUntil, note: String(formData.get("note") ?? "").trim().slice(0, 200) || null });
  revalidatePath("/admin/promo");
  return r === "ok" ? { status: "ok", message: `Кодът ${code} е готов.` } : { status: "error", message: `Кодът ${code} вече съществува.` };
}

export async function togglePromo(formData: FormData): Promise<void> {
  if (!(await canAccess("promo"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await setPromoActive(id, formData.get("to") === "1");
  revalidatePath("/admin/promo");
}

export async function removePromo(formData: FormData): Promise<void> {
  if (!(await canAccess("promo"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await deletePromo(id);
  revalidatePath("/admin/promo");
}
