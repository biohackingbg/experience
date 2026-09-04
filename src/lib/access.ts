import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";

import { PAGES, type PageId, isPageId } from "@/lib/access-options";
import { isAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { accessGrants } from "@/lib/db/schema";

/**
 * Who is looking, and at what.
 *
 * Two kinds of session: the team's (the password, everything) and a scoped
 * one (a grant link, listed pages). The scoped cookie names the grant and
 * is signed; the grant itself is read from the database on every check, so
 * revoking it or letting it expire takes effect on the next request, not
 * when a cookie happens to run out.
 */

export const SCOPE_COOKIE = "bh_scope";
const SCOPE_MAX_DAYS = 30;

export type Access =
  | { kind: "admin"; label: string; scopes: PageId[] }
  | { kind: "scoped"; label: string; scopes: PageId[]; grantId: string };

const ALL: PageId[] = PAGES.map((p) => p.id);

function sign(payload: string): string | null {
  const key = process.env.ADMIN_SESSION_SECRET;
  return key ? createHmac("sha256", key).update(`scope:${payload}`).digest("hex") : null;
}
const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");
const parseScopes = (v: string): PageId[] => v.split(",").map((s) => s.trim()).filter(isPageId);

function safeEqual(a: string, b: string): boolean {
  const l = Buffer.from(a);
  const r = Buffer.from(b);
  return l.length === r.length && timingSafeEqual(l, r);
}

export const getAccess = cache(async (): Promise<Access | null> => {
  if (await isAdmin()) return { kind: "admin", label: "Екипът", scopes: ALL };
  const store = await cookies();
  const raw = store.get(SCOPE_COOKIE)?.value;
  if (!raw) return null;
  const [grantId, exp, sig] = raw.split(".");
  if (!grantId || !exp || !sig) return null;
  const expected = sign(`${grantId}.${exp}`);
  if (!expected || !safeEqual(sig, expected) || Number(exp) < Date.now()) return null;
  const [g] = await getDb().select().from(accessGrants).where(eq(accessGrants.id, grantId)).limit(1);
  if (!g || g.revokedAt || (g.expiresAt && g.expiresAt.getTime() < Date.now())) return null;
  return { kind: "scoped", label: g.label, scopes: parseScopes(g.scopes), grantId: g.id };
});

export async function canAccess(page: PageId): Promise<boolean> {
  const a = await getAccess();
  return !!a && (a.kind === "admin" || a.scopes.includes(page));
}

/** Where a session lands when it may not see the page it asked for. */
export function homeFor(a: Access | null): string {
  if (!a) return "/admin/login";
  if (a.kind === "admin") return "/admin";
  const first = PAGES.find((p) => a.scopes.includes(p.id));
  return first?.href ?? "/admin/login";
}

/** Page gate: no session goes to the login, a scoped one goes to its own first page. */
export async function requireAccess(page: PageId): Promise<Access> {
  const a = await getAccess();
  if (!a || (a.kind !== "admin" && !a.scopes.includes(page))) redirect(homeFor(a));
  return a;
}

// ── Grants ────────────────────────────────────────────────────────────────

export type Grant = {
  id: string;
  label: string;
  scopes: PageId[];
  expiresAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  /** Revoked or past its date - the link no longer opens anything. */
  dead: boolean;
};

export async function listGrants(): Promise<Grant[]> {
  const rows = await getDb().select().from(accessGrants).orderBy(desc(accessGrants.createdAt));
  const now = Date.now();
  return rows.map((g) => ({
    ...g,
    scopes: parseScopes(g.scopes),
    dead: !!g.revokedAt || (!!g.expiresAt && g.expiresAt.getTime() < now),
  }));
}

/** Creates a grant and returns the one-time link token; only its hash is stored. */
export async function createGrant(label: string, scopes: PageId[], expiresAt: Date | null): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await getDb().insert(accessGrants).values({ label, scopes: scopes.join(","), tokenHash: hashToken(token), expiresAt });
  return token;
}

export async function updateGrant(id: string, scopes: PageId[], expiresAt: Date | null): Promise<void> {
  await getDb().update(accessGrants).set({ scopes: scopes.join(","), expiresAt }).where(eq(accessGrants.id, id));
}

export async function revokeGrant(id: string): Promise<void> {
  await getDb().update(accessGrants).set({ revokedAt: new Date() }).where(eq(accessGrants.id, id));
}

/** Turns a link token into a session cookie value, or null if the link is dead. */
export async function redeemToken(raw: string): Promise<{ cookie: string; maxAge: number; home: string } | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(raw)) return null;
  const db = getDb();
  const [g] = await db.select().from(accessGrants).where(eq(accessGrants.tokenHash, hashToken(raw))).limit(1);
  if (!g || g.revokedAt || (g.expiresAt && g.expiresAt.getTime() < Date.now())) return null;
  const cap = Date.now() + SCOPE_MAX_DAYS * 86_400_000;
  const exp = g.expiresAt ? Math.min(g.expiresAt.getTime(), cap) : cap;
  const sig = sign(`${g.id}.${exp}`);
  if (!sig) return null;
  await db.update(accessGrants).set({ lastUsedAt: new Date() }).where(eq(accessGrants.id, g.id));
  const scopes = parseScopes(g.scopes);
  const home = PAGES.find((p) => scopes.includes(p.id))?.href ?? "/admin/login";
  return { cookie: `${g.id}.${exp}.${sig}`, maxAge: Math.floor((exp - Date.now()) / 1000), home };
}
