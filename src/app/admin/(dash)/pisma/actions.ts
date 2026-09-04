"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { sendInfoMail, sendInfoMailTest } from "@/lib/event-mail";

export type MailState = { status: "idle" | "ok" | "error"; message?: string };

export async function sendTest(_prev: MailState, formData: FormData): Promise<MailState> {
  if (!(await canAccess("pisma"))) return { status: "error", message: "Няма достъп." };
  const to = String(formData.get("to") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { status: "error", message: "Невалиден имейл." };
  const ok = await sendInfoMailTest(to);
  return ok ? { status: "ok", message: `Тестът е изпратен до ${to}.` } : { status: "error", message: "Изпращането не мина. Провери дневника." };
}

export async function sendAll(): Promise<MailState> {
  if (!(await canAccess("pisma"))) return { status: "error", message: "Няма достъп." };
  const r = await sendInfoMail();
  revalidatePath("/admin/pisma");
  if (r.error) {
    return { status: "error", message: `Изпратени ${r.sent}, спря с грешка: ${r.error}. Остават ${r.remaining}. Натисни пак, за да продължи.` };
  }
  return {
    status: "ok",
    message: r.remaining
      ? `Изпратени ${r.sent}. Остават ${r.remaining} - натисни пак, за да продължи.`
      : `Изпратени ${r.sent}. Всички купили имат писмото.`,
  };
}
