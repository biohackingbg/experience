"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { assignRemaining, getArrivalPlan, isSlotId, saveArrivalPlan } from "@/lib/arrivals";
import type { ScanState } from "@/lib/scan-state";
import { checkInTicket } from "@/lib/tickets-lookup";

/**
 * Door scan.
 *
 * Re-checks the session on every call: a Server Action is a public POST
 * endpoint, and the layout that guards the page does not guard the action.
 */
/** The "Пусни" button beside a name found by search - same check as a scan. */
export async function admitTicket(formData: FormData): Promise<void> {
  if (!(await canAccess("vhod"))) return;
  const code = String(formData.get("code") ?? "").trim();
  if (code) await checkInTicket(code);
  revalidatePath("/admin/vhod");
}

export async function scanTicket(
  _prev: ScanState,
  formData: FormData,
): Promise<ScanState> {
  if (!(await canAccess("vhod"))) {
    return { status: "error", message: "Сесията изтече. Влез отново." };
  }

  const raw = String(formData.get("code") ?? "").trim();
  if (!raw) return { status: "idle" };

  const result = await checkInTicket(raw);
  const scannedAt = Date.now();

  if (result.status === "not_found") {
    return {
      status: "invalid",
      code: raw.toUpperCase(),
      message: "Невалиден код.",
      scannedAt,
    };
  }

  if (result.status === "already_used") {
    return {
      status: "used",
      code: result.ticket.code,
      name: result.ticket.buyerName,
      tierName: result.ticket.tierName,
      day: result.ticket.day,
      usedAt: result.ticket.checkedInAt?.toISOString(),
      scannedAt,
    };
  }

  return {
    status: "ok",
    code: result.ticket.code,
    name: result.ticket.buyerName,
    tierName: result.ticket.tierName,
    day: result.ticket.day,
    scannedAt,
  };
}

export type PlanState = { status: "idle" | "ok" | "error"; message?: string };

/** The arrival plan: on/off, the windows and the places per window. */
export async function saveArrivalPlanAction(_prev: PlanState, formData: FormData): Promise<PlanState> {
  if (!(await canAccess("vhod"))) return { status: "error", message: "Няма достъп." };
  const slots = String(formData.get("slots") ?? "")
    .split(/[\s,;]+/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (slots.length === 0 || !slots.every(isSlotId)) return { status: "error", message: "Прозорците са във вид 09:00, 09:20 … и последният може да е 11:00+." };
  const capacity = Number(formData.get("capacity"));
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 2000) return { status: "error", message: "Местата на прозорец са число между 1 и 2000." };
  await saveArrivalPlan({ on: formData.get("on") === "1", slots, capacity });
  revalidatePath("/admin/vhod");
  revalidatePath("/admin/pisma");
  return { status: "ok", message: "Запазено." };
}

/** Gives a window to everyone who has not chosen one - earliest buyers earliest. */
export async function assignRemainingAction(_prev: PlanState): Promise<PlanState> {
  if (!(await canAccess("vhod"))) return { status: "error", message: "Няма достъп." };
  const n = await assignRemaining(await getArrivalPlan());
  revalidatePath("/admin/vhod");
  return { status: "ok", message: `Разпределени ${n} билета.` };
}
