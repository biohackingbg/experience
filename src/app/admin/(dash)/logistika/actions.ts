"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { saveLogistics } from "@/lib/speaker-logistics";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };

export async function saveRow(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("logistika"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("speakerId") ?? "");
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return { status: "error", message: "Невалиден ред." };
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  const on = (k: string) => formData.get(k) === "on";
  await saveLogistics(id, {
    confirmed: on("confirmed"),
    email: s("email", 160),
    phone: s("phone", 60),
    arrives: s("arrives", 200),
    departs: s("departs", 200),
    hotel: s("hotel", 160),
    hotelBooked: on("hotelBooked"),
    tech: s("tech", 300),
    presentationReceived: on("presentation"),
    dietary: s("dietary", 200),
    host: s("host", 120),
    notes: s("notes", 1000),
  });
  revalidatePath("/admin/logistika");
  return { status: "ok", message: "Записано." };
}
