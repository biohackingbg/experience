import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session: a single shared password, exchanged for an HMAC-signed cookie.
 *
 * The dashboard shows buyers' names, emails and orders, so the gate is not
 * optional. The signature means the cookie cannot be forged without the server
 * secret, and it carries its own expiry so an old cookie stops working on its
 * own.
 */

export const ADMIN_COOKIE = "bh_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null;
}

/** Constant-time compare, so a wrong password cannot be found byte by byte. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

function sign(payload: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(payload).digest("hex");
}

/** True only when the server has both settings it needs to run the gate. */
export function isConfigured(): boolean {
  return Boolean(secret() && process.env.ADMIN_PASSWORD);
}

export function createSessionToken(): string | null {
  const expiresAt = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const signature = sign(expiresAt);
  return signature ? `${expiresAt}.${signature}` : null;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;

  // Fail closed: a missing secret denies access rather than throwing, which
  // otherwise turned any malformed cookie into a 500 instead of a redirect.
  const expected = sign(expiresAt);
  if (!expected) return false;

  if (!safeEqual(signature, expected)) return false;

  return Number(expiresAt) > Date.now();
}

/** Server-side check for layouts and actions — the real gate. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
