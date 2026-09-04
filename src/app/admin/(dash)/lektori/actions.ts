"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { type SpeakerInput, addSpeaker, deleteSpeaker, importSpeakers, moveSpeaker, setAnnounced, setPhoto, updateSpeaker } from "@/lib/speakers-data";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const ID = /^[a-z0-9-]{1,80}$/;

function done() {
  revalidatePath("/admin/lektori");
  revalidatePath("/");
  revalidatePath("/programa");
}

function parse(formData: FormData): { ok: true; input: SpeakerInput } | { ok: false; message: string } {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (name.length < 2) return { ok: false, message: "Напиши име." };
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  return {
    ok: true,
    input: {
      name,
      title: s("title", 40),
      specialty: s("specialty", 120),
      country: s("country", 60),
      affiliation: s("affiliation", 160),
      role: s("role", 120),
      topic: s("topic", 200),
      announced: formData.get("announced") === "on",
      pending: formData.get("pending") === "on",
    },
  };
}

export async function createSpeaker(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("lektori"))) return { status: "error", message: "Няма достъп." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await addSpeaker(p.input);
  done();
  return { status: "ok", message: "Добавен. Качи снимка от реда му." };
}

export async function editSpeaker(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("lektori"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  if (!ID.test(id)) return { status: "error", message: "Невалиден ред." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await updateSpeaker(id, p.input);
  done();
  return { status: "ok", message: "Записано." };
}

export async function toggleAnnounced(formData: FormData): Promise<void> {
  if (!(await canAccess("lektori"))) return;
  const id = String(formData.get("id") ?? "");
  if (!ID.test(id)) return;
  await setAnnounced(id, formData.get("to") === "1");
  done();
}

export async function removeSpeaker(formData: FormData): Promise<void> {
  if (!(await canAccess("lektori"))) return;
  const id = String(formData.get("id") ?? "");
  if (!ID.test(id)) return;
  await deleteSpeaker(id);
  done();
}

export async function shiftSpeaker(formData: FormData): Promise<void> {
  if (!(await canAccess("lektori"))) return;
  const id = String(formData.get("id") ?? "");
  const dir = formData.get("dir");
  if (!ID.test(id) || (dir !== "up" && dir !== "down")) return;
  await moveSpeaker(id, dir);
  done();
}

export async function seedSpeakers(): Promise<void> {
  if (!(await canAccess("lektori"))) return;
  await importSpeakers();
  done();
}

/** The portrait, already resized in the browser to about a thousand pixels. */
export async function uploadPhoto(formData: FormData): Promise<FormState> {
  if (!(await canAccess("lektori"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  const file = formData.get("photo");
  if (!ID.test(id) || !(file instanceof File)) return { status: "error", message: "Липсва файл." };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { status: "error", message: "Само JPG, PNG или WebP." };
  if (file.size > 2_500_000) return { status: "error", message: "Файлът е над 2,5 MB." };
  await setPhoto(id, Buffer.from(await file.arrayBuffer()), file.type);
  done();
  return { status: "ok", message: "Снимката е качена." };
}
