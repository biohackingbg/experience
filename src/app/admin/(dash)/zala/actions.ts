"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { admitWalkIn, checkInBooking, undoRoomCheckIn } from "@/lib/workshops";

import type { RoomState } from "./room-state";

/**
 * The room's door. Same shape as the main entrance (vhod/actions.ts): a
 * Server Action is a public POST, so the session is checked on every call,
 * not only by the page that shows the button.
 */

const UUID = /^[0-9a-f-]{36}$/;

/** A scan, a typed code, or the "Пусни без запис" button (walkin=1) - one check. */
export async function scanRoom(_prev: RoomState, formData: FormData): Promise<RoomState> {
  if (!(await canAccess("zala"))) return { status: "error", message: "Сесията изтече. Влез отново." };
  const workshopId = String(formData.get("workshopId") ?? "");
  const raw = String(formData.get("code") ?? "").trim();
  if (!UUID.test(workshopId)) return { status: "error", message: "Няма избрана сесия." };
  if (!raw) return { status: "idle" };

  const scannedAt = Date.now();
  const r = formData.get("walkin") === "1" ? await admitWalkIn(workshopId, raw) : await checkInBooking(workshopId, raw);
  revalidatePath("/admin/zala");
  revalidatePath("/admin/rabotilnici");

  if (r.status === "full") return { status: "full", code: raw.toUpperCase(), scannedAt };
  if (r.status === "clash") return { status: "clash", code: raw.toUpperCase(), scannedAt };
  if (r.status === "no_ticket") return { status: "no_ticket", code: r.code, scannedAt };
  if (r.status === "already") return { status: "already", code: r.code, name: r.name, tierName: r.tierName, at: r.at.toISOString(), scannedAt };
  if (r.status === "not_booked") {
    return { status: "not_booked", code: r.code, name: r.name, tierName: r.tierName, elsewhere: r.elsewhere, left: r.left, scannedAt };
  }
  return { status: "ok", code: r.code, name: r.name, tierName: r.tierName, scannedAt };
}

/** The "Дойде" button beside a name in the list - same as a scan of that code. */
export async function markArrived(formData: FormData): Promise<void> {
  if (!(await canAccess("zala"))) return;
  const workshopId = String(formData.get("workshopId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (UUID.test(workshopId) && code) await checkInBooking(workshopId, code);
  revalidatePath("/admin/zala");
}

/** The tap that landed on the wrong name. */
export async function unmarkArrived(formData: FormData): Promise<void> {
  if (!(await canAccess("zala"))) return;
  const workshopId = String(formData.get("workshopId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (UUID.test(workshopId) && code) await undoRoomCheckIn(workshopId, code);
  revalidatePath("/admin/zala");
}
