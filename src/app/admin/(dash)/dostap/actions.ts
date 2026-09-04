"use server";

import { revalidatePath } from "next/cache";

import { createGrant, revokeGrant, updateGrant } from "@/lib/access";
import { isPageId } from "@/lib/access-options";
import { isAdmin } from "@/lib/admin-auth";

export type GrantState = { status: "idle" | "ok" | "error"; message?: string; link?: string };
const UUID = /^[0-9a-f-]{36}$/;
const SITE = "https://thelongevitysummit.eu";

function parseGrant(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const scopes = formData.getAll("scopes").filter(isPageId);
  const until = String(formData.get("until") ?? "").trim();
  const expiresAt = until ? new Date(`${until}T23:59:59+03:00`) : null;
  return { label, scopes, expiresAt };
}

/** Only the team hands out access; a grant cannot make grants. */
export async function addGrant(_prev: GrantState, formData: FormData): Promise<GrantState> {
  if (!(await isAdmin())) return { status: "error", message: "Само екипът може да дава достъп." };
  const { label, scopes, expiresAt } = parseGrant(formData);
  if (label.length < 2) return { status: "error", message: "Напиши за кого е." };
  if (scopes.length === 0) return { status: "error", message: "Избери поне една страница." };
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { status: "error", message: "Датата не е валидна." };
  const token = await createGrant(label, scopes, expiresAt);
  revalidatePath("/admin/dostap");
  return { status: "ok", message: `Линкът за ${label} е готов. Показва се само сега - копирай го.`, link: `${SITE}/dostap/${token}` };
}

export async function editGrant(_prev: GrantState, formData: FormData): Promise<GrantState> {
  if (!(await isAdmin())) return { status: "error", message: "Само екипът може да променя достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const { scopes, expiresAt } = parseGrant(formData);
  if (scopes.length === 0) return { status: "error", message: "Избери поне една страница." };
  await updateGrant(id, scopes, expiresAt);
  revalidatePath("/admin/dostap");
  return { status: "ok", message: "Записано." };
}

export async function stopGrant(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await revokeGrant(id);
  revalidatePath("/admin/dostap");
}
