"use server";

import { revalidatePath } from "next/cache";

import { sql } from "drizzle-orm";

import { remindAbandonedOrder } from "@/lib/abandoned";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { setSetting } from "@/lib/settings";

export type ActionState = { status: "idle" | "ok" | "error"; message?: string };

/**
 * Flips the launch prices. Every page that quotes a price is revalidated at
 * once, so the site, the checkout and the search snippet move together.
 */
export async function setEarlyAccess(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { status: "error", message: "Няма достъп." };

  const to = formData.get("to");
  if (to !== "on" && to !== "off") return { status: "error", message: "Невалидна стойност." };

  await setSetting("early_access", to);
  // The layout carries the meta description with the cheapest price.
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/bilet");
  revalidatePath("/admin");
  return {
    status: "ok",
    message: to === "off" ? "Сайтът е на редовни цени." : "Сайтът е на стартови цени.",
  };
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
