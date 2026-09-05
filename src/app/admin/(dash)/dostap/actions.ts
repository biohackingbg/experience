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
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 160) || null;
  return { label, scopes, expiresAt, email };
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Only the team hands out access; a grant cannot make grants. */
export async function addGrant(_prev: GrantState, formData: FormData): Promise<GrantState> {
  if (!(await isAdmin())) return { status: "error", message: "Само екипът може да дава достъп." };
  const { label, scopes, expiresAt, email } = parseGrant(formData);
  if (label.length < 2) return { status: "error", message: "Напиши за кого е." };
  if (scopes.length === 0) return { status: "error", message: "Избери поне една страница." };
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { status: "error", message: "Датата не е валидна." };
  if (email && !EMAIL.test(email)) return { status: "error", message: "Имейлът не изглежда валиден." };
  const token = await createGrant(label, scopes, expiresAt, email);
  revalidatePath("/admin/dostap");
  // With an address there is no link to hand over: the person signs in with
  // their own address and the letter does the rest.
  if (email) {
    return {
      status: "ok",
      message: `Готово. Кажи на ${label} да отвори ${SITE}/dostap и да въведе ${email} - линкът за вход отива на този адрес.`,
    };
  }
  return { status: "ok", message: `Линкът за ${label} е готов. Показва се само сега - копирай го.`, link: `${SITE}/dostap/${token}` };
}

export async function editGrant(_prev: GrantState, formData: FormData): Promise<GrantState> {
  if (!(await isAdmin())) return { status: "error", message: "Само екипът може да променя достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const { scopes, expiresAt, email } = parseGrant(formData);
  if (scopes.length === 0) return { status: "error", message: "Избери поне една страница." };
  if (email && !EMAIL.test(email)) return { status: "error", message: "Имейлът не изглежда валиден." };
  await updateGrant(id, scopes, expiresAt, email);
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
