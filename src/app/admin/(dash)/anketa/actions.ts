"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { partnerMail, sendMails, speakerMail, visitorMail } from "@/lib/survey-emails";
import { createPartnerInvite, createTestVisitorInvite, ensureVisitorInvites, markSent, visitorLetters } from "@/lib/surveys";

export type SendState = { status: "idle" | "ok" | "error"; message?: string };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const fail = (message: string): SendState => ({ status: "error", message });

/* ---------- Visitors ---------- */

/** A test letter to one address: a letter with two companions, on test links whose answers stay out of the results. */
export async function testVisitors(_prev: SendState, formData: FormData): Promise<SendState> {
  if (!(await canAccess("anketa"))) return fail("Няма достъп.");
  const to = String(formData.get("to") ?? "").trim().toLowerCase();
  if (!EMAIL.test(to)) return fail("Напиши имейл за теста.");
  const own = await createTestVisitorInvite("Мария (тест)", to);
  const a = await createTestVisitorInvite("Иван Петров (PLUS)", null);
  const b = await createTestVisitorInvite("Билет 3 (CORE)", null);
  const r = await sendMails([visitorMail({ to, name: "Мария", token: own.token, others: [{ label: a.label!, token: a.token }, { label: b.label!, token: b.token }] })]);
  return r.error ? fail(r.error) : { status: "ok", message: `Тестовото писмо е пратено на ${to}.` };
}

/** Every visitor letter not sent yet. Run twice, it sends only what the first run missed. */
export async function sendVisitors(_prev: SendState, formData: FormData): Promise<SendState> {
  if (!(await canAccess("anketa"))) return fail("Няма достъп.");
  if (formData.get("confirm") !== "yes") return fail("Отбележи, че потвърждаваш изпращането.");
  const letters = await visitorLetters();
  const invites = await ensureVisitorInvites(letters);
  const due = letters.filter((l) => !invites.get(l.own.ticketId)?.sentAt);
  const limit = Math.min(due.length, Number(formData.get("limit")) || due.length);
  let sent = 0;
  for (let i = 0; i < limit; i += 100) {
    const chunk = due.slice(i, Math.min(i + 100, limit));
    const mails = chunk.map((l) => {
      const own = invites.get(l.own.ticketId)!;
      return visitorMail({ to: l.to, name: l.name, token: own.token, others: l.others.flatMap((o) => (invites.get(o.ticketId) ? [{ label: o.label, token: invites.get(o.ticketId)!.token }] : [])) });
    });
    const r = await sendMails(mails);
    const went = chunk.slice(0, r.sent);
    await markSent(went.flatMap((l) => [invites.get(l.own.ticketId)!.token, ...l.others.flatMap((o) => (invites.get(o.ticketId) ? [invites.get(o.ticketId)!.token] : []))]));
    sent += r.sent;
    if (r.error) {
      revalidatePath("/admin/anketa");
      return fail(`Пратени ${sent}, после грешка: ${r.error}. Натисни пак: ще продължи от там.`);
    }
  }
  revalidatePath("/admin/anketa");
  return { status: "ok", message: `Пратени ${sent} писма.${due.length > limit ? ` Остават ${due.length - limit}.` : ""}` };
}

/* ---------- Partners ---------- */

type PartnerLine = { brand: string; name: string; email: string };

function parsePartners(raw: string): PartnerLine[] | string {
  const out: PartnerLine[] = [];
  for (const [i, line] of raw.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const [brand = "", name = "", email = ""] = line.split(/[;\t]/).map((s) => s.trim());
    if (!brand || !EMAIL.test(email.toLowerCase())) return `Ред ${i + 1}: трябва „Марка; Име; имейл“.`;
    out.push({ brand, name, email: email.toLowerCase() });
  }
  return out.length ? out : "Няма редове.";
}

export async function sendPartners(_prev: SendState, formData: FormData): Promise<SendState> {
  if (!(await canAccess("anketa"))) return fail("Няма достъп.");
  const test = formData.get("intent") === "test";
  const list = parsePartners(String(formData.get("lines") ?? ""));
  if (typeof list === "string") return fail(list);
  if (test) {
    const to = String(formData.get("to") ?? "").trim().toLowerCase();
    if (!EMAIL.test(to)) return fail("Напиши имейл за теста.");
    const first = list[0];
    const inv = await createPartnerInvite(first.brand, first.name, to, true);
    const r = await sendMails([partnerMail({ to, name: first.name, brand: first.brand, token: inv.token })]);
    return r.error ? fail(r.error) : { status: "ok", message: `Тестово писмо (за ${first.brand}) е пратено на ${to}.` };
  }
  if (formData.get("confirm") !== "yes") return fail("Отбележи, че потвърждаваш изпращането.");
  const mails = [];
  const tokens: string[] = [];
  for (const l of list) {
    const inv = await createPartnerInvite(l.brand, l.name, l.email);
    tokens.push(inv.token);
    mails.push(partnerMail({ to: l.email, name: l.name, brand: l.brand, token: inv.token }));
  }
  const r = await sendMails(mails);
  await markSent(tokens.slice(0, r.sent));
  revalidatePath("/admin/anketa");
  return r.error ? fail(`Пратени ${r.sent}, после грешка: ${r.error}`) : { status: "ok", message: `Пратени ${r.sent} писма до партньорите.` };
}

/* ---------- Speakers ---------- */

type SpeakerLine = { email: string; salutation: string; topic: string };

function parseSpeakers(raw: string): SpeakerLine[] | string {
  const out: SpeakerLine[] = [];
  for (const [i, line] of raw.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const [email = "", salutation = "", topic = ""] = line.split(/[;\t]/).map((s) => s.trim());
    if (!email) continue; // a speaker still without an address is skipped, not an error
    if (!EMAIL.test(email.toLowerCase()) || !salutation) return `Ред ${i + 1}: трябва „имейл; обръщение; тема“.`;
    out.push({ email: email.toLowerCase(), salutation, topic });
  }
  return out.length ? out : "Няма редове с имейл.";
}

export async function sendSpeakers(_prev: SendState, formData: FormData): Promise<SendState> {
  if (!(await canAccess("anketa"))) return fail("Няма достъп.");
  const list = parseSpeakers(String(formData.get("lines") ?? ""));
  if (typeof list === "string") return fail(list);
  if (formData.get("intent") === "test") {
    const to = String(formData.get("to") ?? "").trim().toLowerCase();
    if (!EMAIL.test(to)) return fail("Напиши имейл за теста.");
    const r = await sendMails([speakerMail({ ...list[0], to })]);
    return r.error ? fail(r.error) : { status: "ok", message: `Тестово писмо (до ${list[0].salutation}) е пратено на ${to}.` };
  }
  if (formData.get("confirm") !== "yes") return fail("Отбележи, че потвърждаваш изпращането.");
  const r = await sendMails(list.map((l) => speakerMail({ to: l.email, salutation: l.salutation, topic: l.topic })));
  return r.error ? fail(`Пратени ${r.sent}, после грешка: ${r.error}`) : { status: "ok", message: `Пратени ${r.sent} писма до лекторите.` };
}
