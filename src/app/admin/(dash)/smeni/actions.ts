"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { type ShiftInput, addShift, copyDay, deleteShift, updateShift } from "@/lib/shifts";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const UUID = /^[0-9a-f-]{36}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const done = () => revalidatePath("/admin/smeni");

function parse(formData: FormData): { ok: true; input: ShiftInput } | { ok: false; message: string } {
  const day = Number(formData.get("day"));
  const zone = String(formData.get("zone") ?? "").trim().slice(0, 80);
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const person = String(formData.get("person") ?? "").trim().slice(0, 120);
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  if (day !== 1 && day !== 2) return { ok: false, message: "Избери ден." };
  if (!zone) return { ok: false, message: "Избери зона." };
  if (!TIME.test(startsAt) || !TIME.test(endsAt)) return { ok: false, message: "Часовете трябва да са във вид 09:00." };
  if (endsAt <= startsAt) return { ok: false, message: "Краят трябва да е след началото." };
  if (!person) return { ok: false, message: "Напиши кой." };
  return { ok: true, input: { day, zone, startsAt, endsAt, person, phone: s("phone", 60), note: s("note", 200) } };
}

export async function createShift(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("smeni"))) return { status: "error", message: "Няма достъп." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await addShift(p.input);
  done();
  return { status: "ok", message: "Добавена." };
}

export async function editShift(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("smeni"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await updateShift(id, p.input);
  done();
  return { status: "ok", message: "Записано." };
}

export async function removeShift(formData: FormData): Promise<void> {
  if (!(await canAccess("smeni"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await deleteShift(id);
  done();
}

export async function copySaturday(): Promise<void> {
  if (!(await canAccess("smeni"))) return;
  await copyDay(1, 2);
  done();
}
