"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { isBooth } from "@/lib/booths-plan";
import { setBooth } from "@/lib/booths";

export type FormState = { status: "idle" | "ok" | "error"; message?: string; booth?: string };
const UUID = /^[0-9a-f-]{36}$/;

export async function saveBooth(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("shtandove"))) return { status: "error", message: "Няма достъп." };
  const booth = String(formData.get("booth") ?? "");
  if (!isBooth(booth)) return { status: "error", message: "Няма такъв щанд." };
  const partner = String(formData.get("partner") ?? "");
  const deckLinkId = UUID.test(partner) ? partner : null;
  const holdLabel = deckLinkId ? null : String(formData.get("hold") ?? "").trim().slice(0, 80) || null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  await setBooth(booth, { deckLinkId, holdLabel, note });
  revalidatePath("/admin/shtandove");
  return { status: "ok", message: "Записано.", booth };
}

export async function freeBooth(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("shtandove"))) return { status: "error", message: "Няма достъп." };
  const booth = String(formData.get("booth") ?? "");
  if (!isBooth(booth)) return { status: "error", message: "Няма такъв щанд." };
  await setBooth(booth, { deckLinkId: null, holdLabel: null, note: null });
  revalidatePath("/admin/shtandove");
  return { status: "ok", message: `${booth} е свободен.`, booth };
}
