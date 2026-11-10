"use server";

import { cookies, headers } from "next/headers";

import { requestLoginCode, revokeSession, userFromToken, verifyLoginCode } from "@/lib/app-auth";
import { checkRateLimit } from "@/lib/rate-limit";

import { OFFERS_COOKIE } from "./cookie";
const SESSION_DAYS = 180;

export type LoginState =
  | { step: "email"; email?: string; error?: string }
  | { step: "code"; email: string; error?: string };

const W = {
  bg: {
    slow: "Твърде много опити. Опитай след малко.",
    email: "Имейлът не изглежда верен.",
    sendFailed: "Не успяхме да пратим кода. Опитай пак след малко.",
    tooMany: "Твърде много кодове за час. Опитай след малко.",
    badCode: "Кодът не е верен.",
    expired: "Кодът е изтекъл. Поискай нов.",
    codeTries: "Твърде много грешни опита. Поискай нов код.",
  },
  en: {
    slow: "Too many tries. Try again in a moment.",
    email: "That email address does not look right.",
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
  return !checkRateLimit(`${key}:${ip}`, 40).allowed;
}

/**
 * Two steps, as in the app: the address, then the six digits sent to it.
 * The code proves the address; the tickets hang off the address, so whoever
 * holds it sees the offers their tickets open. Whether there is a ticket at
 * all is decided on the page, not here - asking for a code tells a stranger
 * nothing about who bought one.
 */
export async function loginStep(prev: LoginState, formData: FormData): Promise<LoginState> {
  const lang = formData.get("lang") === "en" ? "en" : "bg";
  const w = W[lang];

  if (prev.step === "code" && formData.get("intent") !== "restart") {
    if (await slow("oferti-verify")) return { ...prev, error: w.slow };
    const r = await verifyLoginCode(prev.email, String(formData.get("pin") ?? ""), "web: oferti", lang);
    if (!r.ok) return { ...prev, error: r.reason === "expired" ? w.expired : r.reason === "too_many" ? w.codeTries : w.badCode };
    (await cookies()).set(OFFERS_COOKIE, r.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/oferti",
      maxAge: SESSION_DAYS * 86_400,
    });
    // The page renders again with the cookie and shows the offers.
    return { step: "email" };
  }

  if (prev.step === "code") return { step: "email", email: prev.email };

  if (await slow("oferti")) return { step: "email", error: w.slow };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const sent = await requestLoginCode(email, lang, "offers");
  if (!sent.ok) return { step: "email", email, error: sent.reason === "too_many" ? w.tooMany : sent.reason === "invalid" ? w.email : w.sendFailed };
  return { step: "code", email };
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const user = await userFromToken(jar.get(OFFERS_COOKIE)?.value);
  if (user) await revokeSession(user.sessionId);
  jar.delete({ name: OFFERS_COOKIE, path: "/oferti" });
}
