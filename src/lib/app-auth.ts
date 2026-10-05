import "server-only";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { appSessions, deviceTokens, loginCodes, members } from "@/lib/db/schema";
import { forgetChallengeData } from "@/lib/challenge";

/**
 * Who is holding the phone.
 *
 * The app has no passwords: a six-digit code goes to the address, the
 * address becomes the account. That is the same key the tickets hang off
 * (`orders.email`), so a buyer sees their tickets the moment they are in,
 * and a person without a ticket can still be a member. Codes and session
 * tokens are stored hashed; the only copy of a token lives on the device.
 */

const CODE_TTL_MS = 10 * 60_000;
const CODE_MAX_ATTEMPTS = 5;
/** Codes one address may ask for in an hour - a stranger typing someone else's address stops here. */
const CODES_PER_HOUR = 5;
const SESSION_DAYS = 180;

export const normaliseEmail = (raw: string) => raw.trim().toLowerCase();
export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;

const hash = (v: string) => createHash("sha256").update(v).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const l = Buffer.from(a);
  const r = Buffer.from(b);
  return l.length === r.length && timingSafeEqual(l, r);
}

/**
 * The reviewer's way in. Apple tests with an account that must work without
 * a mailbox, so one address accepts one fixed code, both from the
 * environment and both absent in production unless set on purpose.
 */
function demo(): { email: string; code: string } | null {
  const email = process.env.APP_DEMO_EMAIL?.trim().toLowerCase();
  const code = process.env.APP_DEMO_CODE?.trim();
  return email && code ? { email, code } : null;
}

export type RequestCodeResult = { ok: true } | { ok: false; reason: "invalid" | "too_many" | "send_failed" };

export async function requestLoginCode(rawEmail: string, lang: "bg" | "en"): Promise<RequestCodeResult> {
  const email = normaliseEmail(rawEmail);
  if (!isEmail(email)) return { ok: false, reason: "invalid" };
  const d = demo();
  if (d && email === d.email) return { ok: true };

  const db = getDb();
  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginCodes)
    .where(and(eq(loginCodes.email, email), gt(loginCodes.createdAt, new Date(Date.now() - 3_600_000))));
  if ((recent?.n ?? 0) >= CODES_PER_HOUR) return { ok: false, reason: "too_many" };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(loginCodes).values({ email, codeHash: hash(`${email}:${code}`), expiresAt: new Date(Date.now() + CODE_TTL_MS) });

  const { sendLoginCodeEmail } = await import("@/lib/email");
  const sent = await sendLoginCodeEmail({ to: email, code, lang });
  return sent ? { ok: true } : { ok: false, reason: "send_failed" };
}

export type VerifyResult = { ok: true; token: string; email: string } | { ok: false; reason: "invalid" | "expired" | "too_many" };

export async function verifyLoginCode(
  rawEmail: string,
  rawCode: string,
  device: string | null,
  lang: "bg" | "en",
): Promise<VerifyResult> {
  const email = normaliseEmail(rawEmail);
  const code = rawCode.replace(/\D/g, "");
  if (!isEmail(email) || code.length !== 6) return { ok: false, reason: "invalid" };

  const d = demo();
  if (d && email === d.email) {
    if (!safeEqual(code, d.code)) return { ok: false, reason: "invalid" };
    return { ok: true, token: await openSession(email, device, lang), email };
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(loginCodes)
    .where(and(eq(loginCodes.email, email), isNull(loginCodes.usedAt)))
    .orderBy(desc(loginCodes.createdAt))
    .limit(1);
  if (!row) return { ok: false, reason: "invalid" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.attempts >= CODE_MAX_ATTEMPTS) return { ok: false, reason: "too_many" };

  if (!safeEqual(row.codeHash, hash(`${email}:${code}`))) {
    await db.update(loginCodes).set({ attempts: row.attempts + 1 }).where(eq(loginCodes.id, row.id));
    return { ok: false, reason: row.attempts + 1 >= CODE_MAX_ATTEMPTS ? "too_many" : "invalid" };
  }
  await db.update(loginCodes).set({ usedAt: new Date() }).where(eq(loginCodes.id, row.id));
  return { ok: true, token: await openSession(email, device, lang), email };
}

async function openSession(email: string, device: string | null, lang: "bg" | "en"): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await getDb().insert(appSessions).values({
    email,
    tokenHash: hash(token),
    device: device?.slice(0, 120) ?? null,
    lang,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });
  return token;
}

export type AppUser = { email: string; sessionId: string; lang: "bg" | "en" };

/** The bearer token on a request, resolved to the address it was issued to. */
export async function authFromRequest(request: Request): Promise<AppUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || token.length > 200) return null;
  const db = getDb();
  const [s] = await db.select().from(appSessions).where(eq(appSessions.tokenHash, hash(token))).limit(1);
  if (!s || s.revokedAt || s.expiresAt.getTime() < Date.now()) return null;
  // One write per hour per device is enough to know a phone is still alive.
  if (Date.now() - s.lastSeenAt.getTime() > 3_600_000) {
    await db.update(appSessions).set({ lastSeenAt: new Date() }).where(eq(appSessions.id, s.id));
  }
  return { email: s.email, sessionId: s.id, lang: s.lang === "en" ? "en" : "bg" };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await getDb().update(appSessions).set({ revokedAt: new Date() }).where(eq(appSessions.id, sessionId));
}

/**
 * "Delete my account" from the app. Everything the app itself created for
 * this address goes: every session on every phone, pending sign-in codes,
 * push tokens and the community opt-in. Orders, tickets and invoices stay -
 * they were bought on the website and the law requires keeping them - so
 * signing in again later shows the same tickets on a fresh, empty profile.
 */
export async function deleteAppAccount(email: string): Promise<void> {
  const db = getDb();
  await db.delete(appSessions).where(eq(appSessions.email, email));
  await db.delete(loginCodes).where(eq(loginCodes.email, email));
  await db.delete(deviceTokens).where(eq(deviceTokens.email, email));
  await db.delete(members).where(eq(members.email, email));
  await forgetChallengeData(email);
}
