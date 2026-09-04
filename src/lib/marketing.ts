import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { campaigns, orderItems, orders, siteViews } from "@/lib/db/schema";
import { PLATFORMS } from "@/lib/marketing-options";

/**
 * What marketing did and what it brought.
 *
 * Two kinds of number, kept apart on the page because they mean different
 * things. Attributed: a visit or a sale that arrived through this campaign's
 * tagged link - certain, and an undercount, since a person who saw the post
 * and typed the address later is not in it. Around the post: everything the
 * site saw from that platform in the 48 hours after posting, tagged or not -
 * a signal, not a proof.
 */

const WINDOW = "48 hours";

export type CampaignRow = {
  id: string;
  postedAt: Date;
  platform: string;
  kind: string;
  title: string;
  url: string | null;
  utmCampaign: string | null;
  spendCents: number;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  clicks: number | null;
  note: string | null;
  /** Distinct people who opened a link tagged with this campaign, ever. */
  taggedVisitors: number;
  taggedTickets: number;
  taggedGrossCents: number;
  /** Distinct people arriving from this platform in the 48h after posting. */
  windowVisitors: number;
  /** Tickets paid in the same 48h, from anywhere. */
  windowTickets: number;
};

export type PlatformSummary = {
  platform: string;
  label: string;
  items: number;
  spendCents: number;
  /** Distinct visitors from this platform's referrers, last 30 days. */
  visitors30: number;
  taggedTickets: number;
  taggedGrossCents: number;
};

export type Marketing = {
  campaigns: CampaignRow[];
  platforms: PlatformSummary[];
  spendCents: number;
  taggedTickets: number;
  taggedGrossCents: number;
  /** Spend per attributed ticket, or null with nothing to divide by. */
  costPerTicketCents: number | null;
  socialVisitors30: number;
  /** Tickets sold in the last 30 days, all channels - the denominator that says how much is untracked. */
  tickets30: number;
};

/** SQL: this view came from one of the platform's referrer hosts. */
function fromPlatform(platform: string) {
  const hosts = PLATFORMS.find((p) => p.id === platform)?.hosts ?? [];
  if (hosts.length === 0) return sql`false`;
  return sql`(${siteViews.referrerHost} in (${sql.join(hosts.map((h) => sql`${h}`), sql`, `)}) or ${siteViews.utmSource} = ${platform})`;
}

export async function getMarketing(): Promise<Marketing> {
  const db = getDb();
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.postedAt));

  const [tagged, taggedVisits, perPlatformVisits, [totals30]] = await Promise.all([
    // Sales by campaign tag, paid and real only.
    db
      .select({
        campaign: orders.utmCampaign,
        source: orders.utmSource,
        tickets: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        gross: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)::int`,
      })
      .from(orders)
      .innerJoin(orderItems, sql`${orderItems.orderId} = ${orders.id}`)
      .where(sql`${orders.status} = 'paid' and not ${orders.isTest} and (${orders.utmCampaign} is not null or ${orders.utmSource} is not null)`)
      .groupBy(orders.utmCampaign, orders.utmSource),
    db
      .select({ campaign: siteViews.utmCampaign, n: sql<number>`count(distinct ${siteViews.visitor})::int` })
      .from(siteViews)
      .where(sql`${siteViews.utmCampaign} is not null`)
      .groupBy(siteViews.utmCampaign),
    Promise.all(
      PLATFORMS.map(async (p) => {
        const [r] = await db
          .select({ n: sql<number>`count(distinct ${siteViews.visitor})::int` })
          .from(siteViews)
          .where(sql`${siteViews.createdAt} >= now() - interval '30 days' and ${fromPlatform(p.id)}`);
        return { platform: p.id, n: r?.n ?? 0 };
      }),
    ),
    db
      .select({ tickets: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
      .from(orders)
      .innerJoin(orderItems, sql`${orderItems.orderId} = ${orders.id}`)
      .where(sql`${orders.status} = 'paid' and not ${orders.isTest} and ${orders.paidAt} >= now() - interval '30 days'`),
  ]);

  // Around-the-post numbers, one small pair of queries per campaign. The log
  // is dozens of rows, and each query is bounded by the created_at index.
  const windows = await Promise.all(
    rows.map(async (c) => {
      // As text: the driver will not serialise a Date next to an explicit cast.
      const start = c.postedAt.toISOString();
      const [[v], [t]] = await Promise.all([
        db
          .select({ n: sql<number>`count(distinct ${siteViews.visitor})::int` })
          .from(siteViews)
          .where(
            sql`${siteViews.createdAt} >= ${start}::timestamptz and ${siteViews.createdAt} < ${start}::timestamptz + interval '${sql.raw(WINDOW)}' and ${fromPlatform(c.platform)}`,
          ),
        db
          .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
          .from(orders)
          .innerJoin(orderItems, sql`${orderItems.orderId} = ${orders.id}`)
          .where(
            sql`${orders.status} = 'paid' and not ${orders.isTest} and ${orders.paidAt} >= ${start}::timestamptz and ${orders.paidAt} < ${start}::timestamptz + interval '${sql.raw(WINDOW)}'`,
          ),
      ]);
      return { id: c.id, visitors: v?.n ?? 0, tickets: t?.n ?? 0 };
    }),
  );
  const win = new Map(windows.map((w) => [w.id, w]));
  const visitsByTag = new Map(taggedVisits.map((t) => [t.campaign, t.n]));

  const list: CampaignRow[] = rows.map((c) => {
    const sales = tagged.filter((t) => c.utmCampaign && t.campaign === c.utmCampaign);
    return {
      ...c,
      taggedVisitors: c.utmCampaign ? (visitsByTag.get(c.utmCampaign) ?? 0) : 0,
      taggedTickets: sales.reduce((a, s) => a + s.tickets, 0),
      taggedGrossCents: sales.reduce((a, s) => a + s.gross, 0),
      windowVisitors: win.get(c.id)?.visitors ?? 0,
      windowTickets: win.get(c.id)?.tickets ?? 0,
    };
  });

  const platforms: PlatformSummary[] = PLATFORMS.map((p) => {
    const mine = list.filter((c) => c.platform === p.id);
    // Sales tagged with this platform as source, whether or not the campaign code matched a row.
    const sales = tagged.filter((t) => t.source === p.id);
    return {
      platform: p.id,
      label: p.label,
      items: mine.length,
      spendCents: mine.reduce((a, c) => a + c.spendCents, 0),
      visitors30: perPlatformVisits.find((v) => v.platform === p.id)?.n ?? 0,
      taggedTickets: sales.reduce((a, s) => a + s.tickets, 0),
      taggedGrossCents: sales.reduce((a, s) => a + s.gross, 0),
    };
  }).filter((p) => p.items > 0 || p.visitors30 > 0 || p.taggedTickets > 0);

  const spendCents = list.reduce((a, c) => a + c.spendCents, 0);
  const taggedTickets = tagged.reduce((a, t) => a + t.tickets, 0);
  return {
    campaigns: list,
    platforms,
    spendCents,
    taggedTickets,
    taggedGrossCents: tagged.reduce((a, t) => a + t.gross, 0),
    costPerTicketCents: taggedTickets > 0 && spendCents > 0 ? Math.round(spendCents / taggedTickets) : null,
    socialVisitors30: perPlatformVisits.filter((v) => v.platform !== "google").reduce((a, v) => a + v.n, 0),
    tickets30: totals30?.tickets ?? 0,
  };
}

export type CampaignInput = {
  postedAt: Date;
  platform: string;
  kind: string;
  title: string;
  url: string | null;
  utmCampaign: string | null;
  spendCents: number;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  clicks: number | null;
  note: string | null;
};

/** "instagram-0912-x7k2": readable in a URL, unique enough, no Cyrillic to break it. */
export function suggestCode(platform: string, postedAt: Date): string {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", month: "2-digit", day: "2-digit" })
    .formatToParts(postedAt)
    .filter((p) => p.type === "month" || p.type === "day")
    .map((p) => p.value)
    .join("");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${platform}-${d}-${rand}`;
}

export async function addCampaign(input: CampaignInput): Promise<void> {
  await getDb().insert(campaigns).values(input);
}

export async function updateCampaign(id: string, input: CampaignInput): Promise<void> {
  await getDb().update(campaigns).set({ ...input, updatedAt: new Date() }).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: string): Promise<void> {
  await getDb().delete(campaigns).where(eq(campaigns.id, id));
}
