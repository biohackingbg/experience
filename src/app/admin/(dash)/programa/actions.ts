"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { type SessionInput, addSession, deleteSession, importProgram, moveSession, updateSession } from "@/lib/program-data";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const UUID = /^[0-9a-f-]{36}$/;

function done() {
  revalidatePath("/admin/programa");
  revalidatePath("/");
  revalidatePath("/programa");
}

function parse(formData: FormData): { ok: true; input: SessionInput } | { ok: false; message: string } {
  const day = Number(formData.get("day"));
  const time = String(formData.get("time") ?? "").trim().slice(0, 30);
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (day !== 1 && day !== 2) return { ok: false, message: "Избери ден." };
  if (!time) return { ok: false, message: "Напиши час, напр. 10:25-11:20." };
  if (!title) return { ok: false, message: "Напиши заглавие." };
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  return {
    ok: true,
    input: { day, time, title, note: s("note", 600), role: s("role", 160), people: s("people", 600), pause: formData.get("pause") === "on" },
  };
}

export async function createSession(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("programa"))) return { status: "error", message: "Няма достъп." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await addSession(p.input);
  done();
  return { status: "ok", message: "Добавено." };
}

export async function editSession(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("programa"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await updateSession(id, p.input);
  done();
  return { status: "ok", message: "Записано." };
}

export async function removeSession(formData: FormData): Promise<void> {
  if (!(await canAccess("programa"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await deleteSession(id);
  done();
}

export async function shiftSession(formData: FormData): Promise<void> {
  if (!(await canAccess("programa"))) return;
  const id = String(formData.get("id") ?? "");
  const dir = formData.get("dir");
  if (!UUID.test(id) || (dir !== "up" && dir !== "down")) return;
  await moveSession(id, dir);
  done();
}

export async function seedProgram(): Promise<void> {
  if (!(await canAccess("programa"))) return;
  await importProgram();
  done();
}
