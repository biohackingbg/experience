import "server-only";

import { randomBytes } from "node:crypto";

import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { type DeckLink, deckLinks, deckViews } from "@/lib/db/schema";
import { DECK_SECTIONS, sectionIndex } from "@/lib/deck-sections";

/**
 * The partner deck is reachable only through share links, one per recipient.
 * That is what makes an opening attributable ("Alma Lasers opened it twice,
 * last on Tuesday") without an email gate - the link itself says who.
 *
 * Tokens are 16 random bytes, base64url: 128 bits, unguessable, and short
 * enough to paste into a chat.
 */

export const DECK_BASE = "/za-partniori";

/** The partner pipeline, in the order a conversation moves. */
export const STAGES = [
  { id: "new", label: "нов", hint: "още не сме се свързали" },
  { id: "contacted", label: "свързахме се", hint: "изпратен е линкът / първи разговор" },
  { id: "waiting", label: "чакаме потвърждение", hint: "топката е при тях" },
  { id: "confirmed", label: "потвърдил", hint: "договорено, предстои договор / плащане" },
  { id: "declined", label: "отказал", hint: "не тази година" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

export function isStage(v: unknown): v is StageId {
  return typeof v === "string" && STAGES.some((s) => s.id === v);
}

export function stageLabel(id: string): string {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}

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

/**
 * Creates one link per pasted line, all assigned to whoever is doing the
 * pasting.
 *
 * Names that already have a link are skipped rather than duplicated - the
 * list gets pasted again as it grows, and a second link for the same company
 * would split its opening history in two. Matching ignores case and spacing,
 * so "alma lasers" does not sneak past "Alma Lasers".
 */
export async function createLinks(
  labels: string[],
  owner: string | null,
): Promise<{ created: string[]; skipped: string[] }> {
  const db = getDb();
  const existing = await db.select({ label: deckLinks.label }).from(deckLinks);
  const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");
  const taken = new Set(existing.map((r) => norm(r.label)));

  const created: string[] = [];
  const skipped: string[] = [];
  const values: { label: string; token: string; owner: string | null }[] = [];

  for (const raw of labels) {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!label) continue;
    if (taken.has(norm(label))) {
      skipped.push(label);
      continue;
    }
    taken.add(norm(label));
    created.push(label);
    values.push({ label, token: newToken(), owner });
  }

  if (values.length) await db.insert(deckLinks).values(values);
  return { created, skipped };
}

export async function revokeLink(id: string): Promise<void> {
  await getDb()
    .update(deckLinks)
    .set({ revokedAt: new Date() })
    .where(and(eq(deckLinks.id, id), isNull(deckLinks.revokedAt)));
}

/** Pipeline fields - the notes a sales conversation leaves behind. */
export async function updateLinkPipeline(
  id: string,
  input: { stage: StageId; note: string | null; nextStep: string | null; owner: string | null },
): Promise<void> {
  await getDb()
    .update(deckLinks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(deckLinks.id, id));
}

/** Reopens a stopped link - same token, so an already-sent URL works again. */
export async function reactivateLink(id: string): Promise<void> {
  await getDb().update(deckLinks).set({ revokedAt: null }).where(eq(deckLinks.id, id));
}

export async function recordView(input: {
  linkId: string;
  viewId: string | null;
  visitor: string | null;
  referrerHost: string | null;
  device: "mobile" | "desktop" | null;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
}): Promise<void> {
  // A repeated "open" beacon for the same viewId (retry, storage race) must
  // not become a second opening.
  await getDb().insert(deckViews).values(input).onConflictDoNothing({ target: deckViews.viewId });
}

/** SQL expression ranking the stored section by reading order (-1 if none). */
const SECTION_RANK_SQL = `case section ${DECK_SECTIONS.map((s, i) => `when '${s.id}' then ${i}`).join(" ")} else -1 end`;

/** Progress for one opening; the maximum of what was seen wins. */
export async function recordProgress(input: {
  linkId: string;
  viewId: string;
  seconds: number;
  scrollPct: number;
  section: string | null;
}): Promise<void> {
  const idx = sectionIndex(input.section);
  await getDb().execute(sql`
    update ${deckViews}
    set seconds = greatest(coalesce(seconds, 0), ${input.seconds}),
        scroll_pct = greatest(coalesce(scroll_pct, 0), ${input.scrollPct}),
        section = case
          when ${idx} > ${sql.raw(SECTION_RANK_SQL)} then ${input.section}
          else section
        end
    where view_id = ${input.viewId} and link_id = ${input.linkId}
  `);
}

export type ViewRow = {
  id: string;
  linkId: string;
  createdAt: Date;
  visitor: string | null;
  referrerHost: string | null;
  device: string | null;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  seconds: number | null;
  scrollPct: number | null;
  section: string | null;
};

/** Recent openings across all links, newest first - grouped by the admin. */
export async function listViews(limit = 1000): Promise<ViewRow[]> {
  return getDb()
    .select({
      id: deckViews.id,
      linkId: deckViews.linkId,
      createdAt: deckViews.createdAt,
      visitor: deckViews.visitor,
      referrerHost: deckViews.referrerHost,
      device: deckViews.device,
      country: deckViews.country,
      city: deckViews.city,
      browser: deckViews.browser,
      os: deckViews.os,
      seconds: deckViews.seconds,
      scrollPct: deckViews.scrollPct,
      section: deckViews.section,
    })
    .from(deckViews)
    .orderBy(desc(deckViews.createdAt))
    .limit(limit);
}

export type LinkStats = DeckLink & {
  views: number;
  /** Distinct visitor ids; opens without one count as one each. */
  people: number;
  lastViewedAt: Date | null;
  /** Average seconds over openings that reported progress. */
  avgSeconds: number | null;
  /** Openings that reached the packages section (saw the prices). */
  reachedPackages: number;
};

export type DeckStats = {
  links: LinkStats[];
  /** Active links per pipeline stage, in STAGES order. */
  byStage: { id: StageId; label: string; n: number }[];
  /** Names already used in "owner", for the editor's suggestions. */
  owners: string[];
  total: number;
  last7Days: number;
  today: number;
  /** Top referrer hosts, most frequent first. Direct opens excluded. */
  referrers: { host: string; n: number }[];
  /** Over all openings that reported progress. */
  avgSeconds: number | null;
  reachedPackagesPct: number | null;
  topPlaces: { place: string; n: number }[];
};

export async function getDeckStats(): Promise<DeckStats> {
  const db = getDb();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  // "Today" in the event's own timezone, not the server's.
  const todayStart = new Date(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(now) + "T00:00:00+03:00",
  );

  const [links, [totals], [week], [today], refs, [engagement], places] = await Promise.all([
    db
      .select({
        id: deckLinks.id,
        label: deckLinks.label,
        token: deckLinks.token,
        createdAt: deckLinks.createdAt,
        revokedAt: deckLinks.revokedAt,
        stage: deckLinks.stage,
        note: deckLinks.note,
        nextStep: deckLinks.nextStep,
        owner: deckLinks.owner,
        updatedAt: deckLinks.updatedAt,
        views: count(deckViews.id),
        people: sql<number>`(count(distinct ${deckViews.visitor}) + count(*) filter (where ${deckViews.visitor} is null))::int`,
        lastViewedAt: sql<Date | null>`max(${deckViews.createdAt})`,
        avgSeconds: sql<number | null>`round(avg(${deckViews.seconds}))::int`,
        reachedPackages: sql<number>`count(*) filter (where ${sql.raw(SECTION_RANK_SQL)} >= ${sectionIndex("packages")})::int`,
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
    db
      .select({
        avgSeconds: sql<number | null>`round(avg(${deckViews.seconds}))::int`,
        withProgress: sql<number>`count(${deckViews.seconds})::int`,
        reached: sql<number>`count(*) filter (where ${sql.raw(SECTION_RANK_SQL)} >= ${sectionIndex("packages")})::int`,
      })
      .from(deckViews),
    db
      .select({
        place: sql<string>`coalesce(nullif(concat_ws(', ', ${deckViews.city}, ${deckViews.country}), ''), '-')`,
        n: count(),
      })
      .from(deckViews)
      .where(sql`${deckViews.country} is not null`)
      .groupBy(sql`1`)
      .orderBy(sql`count(*) desc`)
      .limit(4),
  ]);

  const activeLinks = links.filter((l) => !l.revokedAt);
  return {
    links: links.map((l) => ({
      ...l,
      lastViewedAt: l.lastViewedAt ? new Date(l.lastViewedAt) : null,
    })),
    owners: [...new Set(links.map((l) => l.owner).filter((o): o is string => !!o))].sort(),
    byStage: STAGES.map((s) => ({
      id: s.id,
      label: s.label,
      n: activeLinks.filter((l) => l.stage === s.id).length,
    })),
    total: totals?.n ?? 0,
    last7Days: week?.n ?? 0,
    today: today?.n ?? 0,
    referrers: refs.filter((r): r is { host: string; n: number } => !!r.host),
    avgSeconds: engagement?.avgSeconds ?? null,
    reachedPackagesPct: engagement?.withProgress
      ? Math.round((engagement.reached / engagement.withProgress) * 100)
      : null,
    topPlaces: places,
  };
}
