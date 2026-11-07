"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { STAND_SCOPES } from "@/lib/access-options";
import { admitWalkIn, checkInAtStand, checkInBooking, listWorkshops, undoRoomCheckIn } from "@/lib/workshops";

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

/** A scan at a partner stand's page: the ticket's own slot at that stand is found and marked. */
export async function scanStand(_prev: RoomState, formData: FormData): Promise<RoomState> {
  const stand = String(formData.get("stand") ?? "");
  const title = String(formData.get("title") ?? "") || undefined;
  const raw = String(formData.get("code") ?? "").trim();
  const scopes = STAND_SCOPES.filter((x) => x.location === stand && x.title === title);
  // The door team ("zala") scans at any room or stand; a partner only at its own.
  let allowed = !!stand && (await canAccess("zala"));
  for (const x of scopes) allowed ||= await canAccess(x.page);
  if (!allowed) return { status: "error", message: "Сесията изтече. Влез отново." };
  if (!raw) return { status: "idle" };
  const scannedAt = Date.now();
  const r = await checkInAtStand(stand, raw, title);
  revalidatePath("/admin/zala");
  for (const x of STAND_SCOPES) revalidatePath(`/admin/${x.page}`);
  if (r.status === "no_ticket") return { status: "no_ticket", code: r.code, scannedAt };
  if (r.status === "not_booked") return { status: "not_booked", code: r.code, name: r.name, tierName: r.tierName, scannedAt };
  if (r.status === "already") return { status: "already", code: r.code, name: r.name, tierName: r.tierName, at: r.at.toISOString(), slot: r.slot, scannedAt };
  return { status: "ok", code: r.code, name: r.name, tierName: r.tierName, slot: r.slot, scannedAt };
}

/**
 * The door, or a partner stand's own page: a stand grant (masazhi, therabody)
 * may mark people only at its own stand's slots, never at the rooms' doors.
 */
async function mayMark(workshopId: string): Promise<boolean> {
  if (await canAccess("zala")) return true;
  const mine = [];
  for (const x of STAND_SCOPES) if (await canAccess(x.page)) mine.push(x);
  if (mine.length === 0) return false;
  const w = (await listWorkshops(true)).find((x) => x.id === workshopId);
  return !!w && mine.some((x) => x.location === w.location && (!x.title || x.title === w.title));
}

/** The "Дойде" button beside a name in the list - same as a scan of that code. */
export async function markArrived(formData: FormData): Promise<void> {
  const workshopId = String(formData.get("workshopId") ?? "");
  if (!(await mayMark(workshopId))) return;
  const code = String(formData.get("code") ?? "").trim();
  if (UUID.test(workshopId) && code) await checkInBooking(workshopId, code);
  revalidatePath("/admin/zala");
  for (const x of STAND_SCOPES) revalidatePath(`/admin/${x.page}`);
}

/** The tap that landed on the wrong name. */
export async function unmarkArrived(formData: FormData): Promise<void> {
  const workshopId = String(formData.get("workshopId") ?? "");
  if (!(await mayMark(workshopId))) return;
  const code = String(formData.get("code") ?? "").trim();
  if (UUID.test(workshopId) && code) await undoRoomCheckIn(workshopId, code);
  revalidatePath("/admin/zala");
  for (const x of STAND_SCOPES) revalidatePath(`/admin/${x.page}`);
}
