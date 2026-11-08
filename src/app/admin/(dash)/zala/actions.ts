"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { STAND_SCOPES } from "@/lib/access-options";
import { findTicketsByPerson } from "@/lib/tickets-lookup";
import { admitWalkIn, cancelPlace, checkInAtStand, checkInBooking, listWorkshops, undoRoomCheckIn } from "@/lib/workshops";

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
 * "Запиши" beside a free slot, after a scan said the ticket has no place at
 * this stand: the stand books the person itself (the tier's allowance is not
 * asked - the stand decides, as at a room's door). A slot running now also
 * marks the person as arrived; a later one only holds the place.
 */
export async function bookAtStand(_prev: RoomState, formData: FormData): Promise<RoomState> {
  const stand = String(formData.get("stand") ?? "");
  const title = String(formData.get("title") ?? "") || undefined;
  // "pick" is a button from a list of matches; "code" is what was typed or scanned.
  let code = String(formData.get("pick") || formData.get("code") || "").trim();
  const workshopId = String(formData.get("workshopId") ?? "");
  const scopes = STAND_SCOPES.filter((x) => x.location === stand && x.title === title);
  let allowed = !!stand && (await canAccess("zala"));
  for (const x of scopes) allowed ||= await canAccess(x.page);
  if (!allowed) return { status: "error", message: "Сесията изтече. Влез отново." };
  if (!UUID.test(workshopId) || !code) return { status: "error", message: "Няма избран час." };
  // Not a ticket code: a phone or a name, looked up among the valid tickets.
  if (!/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(code)) {
    const found = await findTicketsByPerson(code);
    if (found.length === 0) return { status: "error", message: `Няма билет с „${code}“. Пробвай с фамилия или с телефона от поръчката.`, scannedAt: Date.now() };
    if (found.length > 1) return { status: "pick", candidates: found, scannedAt: Date.now() };
    code = found[0].code;
  }
  const w = (await listWorkshops(true)).find((x) => x.id === workshopId);
  if (!w || w.location !== stand || (title && w.title !== title)) return { status: "error", message: "Този час не е на щанда." };
  const sofiaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date()) === "2026-11-08" ? 2 : 1;
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  const runningNow = w.day === sofiaDay && w.startsAt <= now && now < w.endsAt;
  const scannedAt = Date.now();
  const r = await admitWalkIn(workshopId, code, runningNow);
  revalidatePath("/admin/zala");
  for (const x of STAND_SCOPES) revalidatePath(`/admin/${x.page}`);
  const slot = `${w.title}, ${w.day === 2 ? "неделя" : "събота"} ${w.startsAt}-${w.endsAt}`;
  if (r.status === "full") return { status: "error", message: `${slot}: вече е пълно.`, scannedAt };
  if (r.status === "clash") return { status: "error", message: `${slot}: по това време има друг запис.`, scannedAt };
  if (r.status === "no_ticket") return { status: "no_ticket", code: r.code, scannedAt };
  if (r.status === "ok" || r.status === "already") return { status: "ok", code: r.code, name: r.name, tierName: r.tierName, slot: `Записан: ${slot}`, scannedAt };
  return { status: "error", message: "Не успяхме да запишем.", scannedAt };
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

/** "Отпиши": the stand frees the place, for someone who will not come or asked to change. */
export async function cancelAtStand(formData: FormData): Promise<void> {
  const workshopId = String(formData.get("workshopId") ?? "");
  if (!(await mayMark(workshopId))) return;
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (UUID.test(workshopId) && code) await cancelPlace(code, workshopId);
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
