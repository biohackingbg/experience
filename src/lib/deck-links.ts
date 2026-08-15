import "server-only";

import { randomBytes } from "node:crypto";

import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { type DeckLink, deckLinks, deckViews } from "@/lib/db/schema";

/**
 * The partner deck is reachable only through share links, one per recipient.
 * That is what makes an opening attributable ("Alma Lasers opened it twice,
 * last on Tuesday") without an email gate — the link itself says who.
 *
 * Tokens are 16 random bytes, base64url: 128 bits, unguessable, and short
 * enough to paste into a chat.
 */

export const DECK_BASE = "/za-partniori";

export function deckUrl(token: string, origin = "https://thelongevitysummit.eu"): string {
  return `${origin}${DECK_BASE}/${token}`;
}

function newToken(): string {
  return randomBytes(16).toString("base64url");
}

/** Bare hostname of a referrer, or null when there was none / it was ours. */
export function referrerHost(referrer: string | null | undefined, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const h = new URL(referrer).hostname.toLowerCase();
    return h === ownHost || h.endsWith(`.${ownHost}`) ? null : h.slice(0, 120);
  } catch {
    return null;
  }
}

/** Live link for a token, or null when unknown or revoked. */
export async function findActiveLink(token: string): Promise<DeckLink | null> {
  // Tokens are 22 base64url chars; anything else is not worth a query.
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const [row] = await getDb()
    .select()
    .from(deckLinks)
    .where(and(eq(deckLinks.token, token), isNull(deckLinks.revokedAt)))
    .limit(1);
  return row ?? null;
}

export async function createLink(label: string): Promise<DeckLink> {
  const [row] = await getDb()
    .insert(deckLinks)
    .values({ label: label.trim().slice(0, 80), token: newToken() })
    .returning();
  return row;
}

export async function revokeLink(id: string): Promise<void> {
  await getDb()
    .update(deckLinks)
    .set({ revokedAt: new Date() })
    .where(and(eq(deckLinks.id, id), isNull(deckLinks.revokedAt)));
}

/** Reopens a stopped link — same token, so an already-sent URL works again. */
export async function reactivateLink(id: string): Promise<void> {
  await getDb().update(deckLinks).set({ revokedAt: null }).where(eq(deckLinks.id, id));
}

export async function recordView(input: {
  linkId: string;
  referrerHost: string | null;
  device: "mobile" | "desktop" | null;
}): Promise<void> {
  await getDb().insert(deckViews).values(input);
}

export type LinkStats = DeckLink & {
  views: number;
  lastViewedAt: Date | null;
};

export type DeckStats = {
  links: LinkStats[];
  total: number;
  last7Days: number;
  today: number;
  /** Top referrer hosts, most frequent first. Direct opens excluded. */
  referrers: { host: string; n: number }[];
};

export async function getDeckStats(): Promise<DeckStats> {
  const db = getDb();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  // "Today" in the event's own timezone, not the server's.
  const todayStart = new Date(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(now) + "T00:00:00+03:00",
  );

  const [links, [totals], [week], [today], refs] = await Promise.all([
    db
      .select({
        id: deckLinks.id,
        label: deckLinks.label,
        token: deckLinks.token,
        createdAt: deckLinks.createdAt,
        revokedAt: deckLinks.revokedAt,
        views: count(deckViews.id),
        lastViewedAt: sql<Date | null>`max(${deckViews.createdAt})`,
      })
      .from(deckLinks)
      .leftJoin(deckViews, eq(deckViews.linkId, deckLinks.id))
      .groupBy(deckLinks.id)
      .orderBy(desc(deckLinks.createdAt)),
    db.select({ n: count() }).from(deckViews),
    db.select({ n: count() }).from(deckViews).where(gte(deckViews.createdAt, weekAgo)),
    db.select({ n: count() }).from(deckViews).where(gte(deckViews.createdAt, todayStart)),
    db
      .select({ host: deckViews.referrerHost, n: count() })
      .from(deckViews)
      .where(sql`${deckViews.referrerHost} is not null`)
      .groupBy(deckViews.referrerHost)
      .orderBy(sql`count(*) desc`)
      .limit(5),
  ]);

  return {
    links: links.map((l) => ({
      ...l,
      lastViewedAt: l.lastViewedAt ? new Date(l.lastViewedAt) : null,
    })),
    total: totals?.n ?? 0,
    last7Days: week?.n ?? 0,
    today: today?.n ?? 0,
    referrers: refs.filter((r): r is { host: string; n: number } => !!r.host),
  };
}
