"use server";

import { revalidatePath } from "next/cache";

import { sql } from "drizzle-orm";

import { remindAbandonedOrder } from "@/lib/abandoned";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { isStage, saveMidConfig, setPriceStage } from "@/lib/pricing";
import { TIERS, type TierId } from "@/lib/tickets";

export type ActionState = { status: "idle" | "ok" | "error"; message?: string };

/** Which pages quote a price: all of them, so all are revalidated together. */
function revalidatePrices() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/bilet");
  revalidatePath("/admin");
}

/** Moves the site to a price stage. Every page that quotes a price follows at once. */
export async function setStage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { status: "error", message: "Няма достъп." };
  const stage = formData.get("stage");
  if (!isStage(stage)) return { status: "error", message: "Невалиден етап." };
  await setPriceStage(stage);
  revalidatePrices();
  const word = { launch: "стартови", mid: "междинни", regular: "редовни" }[stage];
  return { status: "ok", message: `Сайтът е на ${word} цени.` };
}

/** The mid stage's prices and wording, in euros as typed. */
export async function saveMidPrices(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { status: "error", message: "Няма достъп." };
  const prices = {} as Record<TierId, number>;
  for (const t of TIERS) {
    const raw = String(formData.get(`price_${t.id}`) ?? "").replace(/\s/g, "").replace(",", ".");
    const cents = Math.round(Number(raw) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return { status: "error", message: `Цената за ${t.name} не е число.` };
    if (cents > t.listPriceCents) return { status: "error", message: `${t.name}: междинната цена не може да е над редовната (${t.listPriceCents / 100} €).` };
    prices[t.id] = cents;
  }
  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const regularAfter = String(formData.get("after") ?? "").trim().slice(0, 60);
  if (!label || !regularAfter) return { status: "error", message: "Напиши и двата надписа." };
  await saveMidConfig({ prices, label, regularAfter });
  revalidatePrices();
  return { status: "ok", message: "Записано." };
}

/**
 * Marks an order as a test purchase, or un-marks it. Nothing is deleted:
 * the statistics skip it, the invoice keeps its number.
 */
export async function setTestOrder(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const to = formData.get("to") === "1";
  if (!/^SLS-[A-Z0-9]{6}$/.test(reference)) return;
  await getDb().update(orders).set({ isTest: to }).where(sql`${orders.reference} = ${reference}`);
  revalidatePath("/admin");
  revalidatePath("/admin/vhod");
  revalidatePath("/admin/finansi");
  revalidatePath("/admin/poseshteniya");
}

export async function remindOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { status: "error", message: "Няма достъп." };

  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  if (!reference) return { status: "error", message: "Липсва номер." };

  const r = await remindAbandonedOrder(reference);
  revalidatePath("/admin");
  if (r.ok) return { status: "ok", message: `Изпратено до ${r.to}.` };
  const why = {
    not_found: "Няма такава незавършена поръчка.",
    already_sent: "Вече е напомнено.",
    bought: "Този човек вече е купил.",
    too_soon: "Изчакай да мине денонощие.",
    send_failed: "Изпращането не мина. Провери дневника.",
  }[r.reason];
  return { status: "error", message: why };
}
