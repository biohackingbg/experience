"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { sendInfoMail, sendInfoMailTest } from "@/lib/event-mail";
import { MAIL_SLOTS, saveMailTexts } from "@/lib/mail-texts";

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

export type TextState = { status: "idle" | "ok" | "error"; message?: string };

/**
 * The wording of one letter.
 *
 * Saving revalidates the page, so the preview above the form re-renders with
 * the new words - the change is read where it was made, rather than trusted.
 * "Върни по подразбиране" writes the code's wording back into every slot of
 * that letter, which `saveMailTexts` then stops storing at all.
 */
export async function saveTexts(_prev: TextState, formData: FormData): Promise<TextState> {
  if (!(await canAccess("pisma"))) return { status: "error", message: "Няма достъп." };
  const letter = String(formData.get("letter") ?? "");
  const slots = MAIL_SLOTS.filter((s) => s.letter === letter);
  if (slots.length === 0) return { status: "error", message: "Това писмо няма текстове за промяна." };

  const reset = formData.get("reset") === "1";
  const patch: Record<string, string> = {};
  for (const slot of slots) {
    if (reset) {
      patch[slot.id] = slot.fallback;
      continue;
    }
    const value = String(formData.get(slot.id) ?? "").trim();
    // An empty box would leave a hole in the letter; the default goes back in
    // instead, and the form redraws with it.
    patch[slot.id] = value || slot.fallback;
  }

  await saveMailTexts(patch);
  revalidatePath("/admin/pisma");
  return { status: "ok", message: reset ? "Върнати по подразбиране." : "Записано - превюто отгоре е новото." };
}
