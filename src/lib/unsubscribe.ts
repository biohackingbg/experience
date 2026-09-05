import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * One-click unsubscribe, without a table of tokens.
 *
 * The link carries the address and a signature over it, so any letter can
 * carry a working link with no state kept anywhere - and nobody can craft a
 * link that unsubscribes someone else. The secret is the admin session one,
 * which already exists in every environment this runs in.
 */
function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

const sign = (email: string) =>
  createHmac("sha256", secret()).update(`unsub:${email.toLowerCase().trim()}`).digest("hex").slice(0, 32);

export function unsubscribeToken(email: string): string {
  const e = email.toLowerCase().trim();
  return `${Buffer.from(e, "utf8").toString("base64url")}.${sign(e)}`;
}

export function readUnsubscribeToken(token: string): string | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(email);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return email;
}

export const unsubscribeUrl = (email: string) =>
  `https://thelongevitysummit.eu/otpisvane/${unsubscribeToken(email)}`;

/** The address a mail client posts to for its own one-click button. */
export const unsubscribePostUrl = (email: string) =>
  `https://thelongevitysummit.eu/api/otpisvane/${unsubscribeToken(email)}`;
