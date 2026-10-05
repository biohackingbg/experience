"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { updateChallenge } from "@/lib/challenge";
import { pushToEmails } from "@/lib/push";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const UUID = /^[0-9a-f-]{36}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveChallenge(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("ritam"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const startsOn = String(formData.get("startsOn") ?? "").trim();
  const days = Number.parseInt(String(formData.get("days") ?? ""), 10);
  const cohortSize = Number.parseInt(String(formData.get("cohortSize") ?? ""), 10);
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  if (!title) return { status: "error", message: "Напиши заглавие." };
  if (!DATE.test(startsOn)) return { status: "error", message: "Датата не е разпозната." };
  if (!Number.isInteger(days) || days < 7 || days > 90) return { status: "error", message: "Дните трябва да са между 7 и 90." };
  if (!Number.isInteger(cohortSize) || cohortSize < 5 || cohortSize > 100) return { status: "error", message: "Групата трябва да е между 5 и 100 души." };
  await updateChallenge(id, { title, startsOn, days, cohortSize, active: formData.get("active") !== null });
  revalidatePath("/admin/ritam");
  return { status: "ok", message: "Записано." };
}

/** A push to one address - the way to see on your own phone what a day's note looks like. */
export async function sendTestPush(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("ritam"))) return { status: "error", message: "Няма достъп." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const body = String(formData.get("body") ?? "").trim().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { status: "error", message: "Невалиден имейл." };
  if (!title || !body) return { status: "error", message: "Заглавие и текст." };
  const r = await pushToEmails([email], { title, body, data: { screen: "ritam" }, collapseId: "ritam-test" });
  if (r.sent === 0) return { status: "error", message: r.failed > 0 ? "Apple отказа изпращането." : "Този имейл няма устройство с включени известия." };
  return { status: "ok", message: `Изпратено на ${r.sent} устройство.` };
}
