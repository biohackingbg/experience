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

/** Server-side check for layouts and actions - the real gate. */
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

/*
 * ── Second factor: TOTP (RFC 6238) ──────────────────────────────────────
 *
 * Implemented directly on node:crypto rather than pulling a dependency -
 * the whole algorithm is an HMAC and a modulo, and an auth path is the last
 * place to add third-party code.
 *
 * Deliberately optional: with no ADMIN_TOTP_SECRET set, login behaves as
 * before. That makes the rollout safe - deploy the code, enrol the phone,
 * verify a login, and only then set the secret in production. Recovery from
 * a lost phone is removing the variable.
 */

function base32Decode(encoded: string): Buffer {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of encoded.toUpperCase().replace(/=+$/, "")) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totpAt(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secret).update(msg).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

export function isTotpConfigured(): boolean {
  return Boolean(process.env.ADMIN_TOTP_SECRET);
}

/**
 * Accepts the previous, current and next 30-second step, so a code typed
 * just as it rolls over still works and modest clock drift is tolerated.
 */
export function checkTotp(code: string): boolean {
  const raw = process.env.ADMIN_TOTP_SECRET;
  if (!raw) return true;

  const digits = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(digits)) return false;

  const secret = base32Decode(raw);
  if (secret.length === 0) return false;

  const step = Math.floor(Date.now() / 30_000);
  return [step - 1, step, step + 1].some((s) =>
    safeEqual(totpAt(secret, s), digits),
  );
}
