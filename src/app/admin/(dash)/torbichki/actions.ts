"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { giveGoodyBag, undoGoodyBag } from "@/lib/tickets-lookup";

export type GoodyState = {
  status: "idle" | "given" | "already" | "invalid" | "error";
  code?: string;
  name?: string;
  tierName?: string;
  at?: string;
  message?: string;
  /** Two identical scans in a row are still two events on the screen. */
  scannedAt?: number;
};

/** A scan or a typed code at the goody bag table. A Server Action is a public POST: the session is checked here. */
export async function scanGoody(_prev: GoodyState, formData: FormData): Promise<GoodyState> {
  if (!(await canAccess("torbichki"))) return { status: "error", message: "Сесията изтече. Влез отново." };
  const raw = String(formData.get("code") ?? "").trim();
  if (!raw) return { status: "idle" };
  const scannedAt = Date.now();
  const r = await giveGoodyBag(raw);
  revalidatePath("/admin/torbichki");
  if (r.status === "not_found") return { status: "invalid", code: raw.toUpperCase(), message: "Невалиден билет.", scannedAt };
  const name = r.ticket.attendeeName || r.ticket.buyerName;
  return { status: r.status, code: r.ticket.code, name, tierName: r.ticket.tierName, at: r.at.toISOString(), scannedAt };
}

/** "Върни": the bag was marked on the wrong ticket. */
export async function undoGoody(formData: FormData): Promise<void> {
  if (!(await canAccess("torbichki"))) return;
  const code = String(formData.get("code") ?? "").trim();
  if (/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(code)) await undoGoodyBag(code);
  revalidatePath("/admin/torbichki");
}
