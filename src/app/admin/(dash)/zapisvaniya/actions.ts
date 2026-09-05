"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { sendMailing, sendTestMailing } from "@/lib/newsletter";
import { isAudience } from "@/lib/newsletter-options";

export type MailState = { status: "idle" | "ok" | "error"; message?: string };

function parse(formData: FormData) {
  const audience = formData.get("audience");
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 160);
  const body = String(formData.get("body") ?? "").trim().slice(0, 8000);
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim().slice(0, 60) || null;
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim().slice(0, 300) || null;
  if (!isAudience(audience)) return { ok: false as const, message: "Избери до кого." };
  if (subject.length < 3) return { ok: false as const, message: "Напиши заглавие." };
  if (body.length < 10) return { ok: false as const, message: "Напиши текста на писмото." };
  // A button with no address, or an address that is not ours, is a mistake
  // worth catching before a thousand people see it.
  if (ctaLabel && !ctaUrl) return { ok: false as const, message: "Бутонът има надпис, но няма адрес." };
  if (ctaUrl && !/^https:\/\//.test(ctaUrl)) return { ok: false as const, message: "Адресът трябва да започва с https://" };
  return { ok: true as const, input: { audience, subject, body, ctaLabel, ctaUrl } };
}

export async function sendTest(_prev: MailState, formData: FormData): Promise<MailState> {
  if (!(await canAccess("zapisvaniya"))) return { status: "error", message: "Няма достъп." };
  const to = String(formData.get("testTo") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { status: "error", message: "Напиши имейл за пробата." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  const res = await sendTestMailing(p.input, to);
  return res.ok
    ? { status: "ok", message: `Пробното писмо замина към ${to}.` }
    : { status: "error", message: res.error ?? "Изпращането се провали." };
}

export async function sendToList(_prev: MailState, formData: FormData): Promise<MailState> {
  if (!(await canAccess("zapisvaniya"))) return { status: "error", message: "Няма достъп." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  const res = await sendMailing(p.input, "админ");
  revalidatePath("/admin/zapisvaniya");
  return res.ok
    ? { status: "ok", message: `Изпратено до ${res.sent} души.` }
    : { status: "error", message: `${res.error ?? "Провали се"}${res.sent ? ` (стигна до ${res.sent})` : ""}.` };
}
