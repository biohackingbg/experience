"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { isKind } from "@/lib/workshop-options";
import { type WorkshopInput, addWorkshop, deleteWorkshop, updateWorkshop } from "@/lib/workshops";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const UUID = /^[0-9a-f-]{36}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function done() {
  revalidatePath("/admin/rabotilnici");
  revalidatePath("/bilet", "layout");
}

function parse(formData: FormData): { ok: true; input: WorkshopInput } | { ok: false; message: string } {
  const kind = formData.get("kind");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const day = Number(formData.get("day"));
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const capacity = Number.parseInt(String(formData.get("capacity") ?? ""), 10);
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;

  if (!isKind(kind)) return { ok: false, message: "Избери вид." };
  if (!title) return { ok: false, message: "Напиши заглавие." };
  if (day !== 1 && day !== 2) return { ok: false, message: "Избери ден." };
  if (!TIME.test(startsAt) || !TIME.test(endsAt)) return { ok: false, message: "Часовете трябва да са във вид 11:00." };
  if (endsAt <= startsAt) return { ok: false, message: "Краят трябва да е след началото." };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 2000) return { ok: false, message: "Местата трябва да са между 1 и 2000." };

  return {
    ok: true,
    input: {
      kind,
      title,
      description: s("description", 600),
      titleEn: s("titleEn", 200),
      descriptionEn: s("descriptionEn", 600),
      host: s("host", 160),
      location: s("location", 120),
      day,
      startsAt,
      endsAt,
      capacity,
      active: formData.get("active") !== null,
    },
  };
}

export async function createWorkshop(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("rabotilnici"))) return { status: "error", message: "Няма достъп." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await addWorkshop(p.input);
  done();
  return { status: "ok", message: "Добавена." };
}

export async function editWorkshop(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("rabotilnici"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await updateWorkshop(id, p.input);
  done();
  return { status: "ok", message: "Записано." };
}

export async function removeWorkshop(formData: FormData): Promise<void> {
  if (!(await canAccess("rabotilnici"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await deleteWorkshop(id);
  done();
}
