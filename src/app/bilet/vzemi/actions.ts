"use server";

import { headers } from "next/headers";

import { requestLoginCode, verifyEmailCode } from "@/lib/app-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendClaimedEmail } from "@/lib/email";
import { getTier } from "@/lib/tickets";
import { claimTicket, findTicket } from "@/lib/tickets-lookup";

export type ClaimState =
  | { step: "details"; error?: string; code?: string; name?: string; email?: string }
  | { step: "verify"; code: string; name: string; email: string; error?: string }
  | { step: "done"; email: string; name: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TICKET = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const W = {
  bg: {
    slow: "Твърде много опити. Опитай след малко.",
    ticket: "Номерът на билета е като ABCD-EFGH: 8 знака с тире по средата.",
    name: "Напиши името си.",
    email: "Имейлът не изглежда верен.",
    notFound: "Няма билет с този номер. Провери го в писмото, което ти пратиха.",
    used: "Този билет вече е използван на входа.",
    taken: "Този билет вече е даден на друг човек. Ако е грешка, помоли купувача да го смени от страницата на билета.",
    sendFailed: "Не успяхме да пратим кода. Опитай пак след малко.",
    tooMany: "Твърде много кодове за час. Опитай след малко.",
    badCode: "Кодът не е верен.",
    expired: "Кодът е изтекъл. Поискай нов.",
    codeTries: "Твърде много грешни опита. Поискай нов код.",
  },
  en: {
    slow: "Too many tries. Try again in a moment.",
    ticket: "A ticket number looks like ABCD-EFGH: 8 characters with a dash in the middle.",
    name: "Write your name.",
    email: "That email address does not look right.",
    notFound: "There is no ticket with that number. Check it in the message you were sent.",
    used: "This ticket was already used at the door.",
    taken: "This ticket was already given to someone else. If that is a mistake, ask the buyer to change it from the ticket page.",
    sendFailed: "We could not send the code. Try again in a moment.",
    tooMany: "Too many codes in an hour. Try again later.",
    badCode: "That code is not right.",
    expired: "The code has expired. Ask for a new one.",
    codeTries: "Too many wrong tries. Ask for a new code.",
  },
} as const;

async function slow(key: string): Promise<boolean> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return !checkRateLimit(`${key}:${ip}`).allowed;
}

/**
 * The ticket is taken in two steps: the number, a name and an address, then
 * the six digits sent to that address. Nothing is written until the address
 * is proven, so a number seen over someone's shoulder cannot be taken under
 * an address the taker does not own.
 */
export async function claimStep(prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const lang = formData.get("lang") === "en" ? "en" : "bg";
  const w = W[lang];

  if (prev.step === "verify" && formData.get("intent") !== "restart") {
    if (await slow("claim-verify")) return { ...prev, error: w.slow };
    const r = await verifyEmailCode(prev.email, String(formData.get("pin") ?? ""));
    if (r !== "ok") return { ...prev, error: r === "expired" ? w.expired : r === "too_many" ? w.codeTries : w.badCode };
    const c = await claimTicket(prev.code, prev.name, prev.email);
    if (c === "ok") {
      // The way into the app, in writing: the page is closed sooner than the mail.
      const t = await findTicket(prev.code);
      await sendClaimedEmail({ to: prev.email, name: prev.name, code: prev.code, tierName: getTier(t?.tierId ?? "")?.name ?? t?.tierName ?? "", lang });
      return { step: "done", email: prev.email, name: prev.name };
    }
    return { step: "details", code: prev.code, name: prev.name, email: prev.email, error: c === "used" ? w.used : c === "taken" ? w.taken : w.notFound };
  }

  if (await slow("claim")) return { step: "details", error: w.slow };
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const back = { step: "details" as const, code, name, email };
  if (!TICKET.test(code)) return { ...back, error: w.ticket };
  if (!name) return { ...back, error: w.name };
  if (!EMAIL.test(email)) return { ...back, error: w.email };

  // Checked before the code goes out, so nobody waits for a mail that leads nowhere.
  const t = await findTicket(code);
  if (!t) return { ...back, error: w.notFound };
  if (t.checkedInAt) return { ...back, error: w.used };
  if (t.attendeeEmail && t.attendeeEmail.toLowerCase() !== email) return { ...back, error: w.taken };

  const sent = await requestLoginCode(email, lang, "ticket");
  if (!sent.ok) return { ...back, error: sent.reason === "too_many" ? w.tooMany : sent.reason === "invalid" ? w.email : w.sendFailed };
  return { step: "verify", code, name, email };
}
