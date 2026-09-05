import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { listMailings, orders, signups } from "@/lib/db/schema";
import { sendListMailBatch } from "@/lib/email";
import { type Audience } from "@/lib/newsletter-options";
import { SOLD } from "@/lib/sold";

/**
 * Letters to a list, as opposed to the transactional mail that answers a
 * purchase. The three lists live in newsletter-options, which the compose
 * form in the browser can import; everything here touches the database.
 */
export type { Audience };

export type Recipient = { email: string; name: string | null };

/** Who would get a letter to this list right now. Unsubscribed are never included. */
export async function audienceOf(audience: Audience): Promise<Recipient[]> {
  const db = getDb();
  if (audience === "buyers") {
    const rows = await db
      .selectDistinctOn([orders.email], { email: orders.email, name: orders.name })
      .from(orders)
      .where(SOLD)
      .orderBy(orders.email);
    // A buyer who asked to be left alone is left alone, even here.
    const off = await db
      .select({ email: signups.email })
      .from(signups)
      .where(sql`${signups.unsubscribedAt} is not null`);
    const blocked = new Set(off.map((o) => o.email.toLowerCase()));
    return rows.filter((r) => !blocked.has(r.email.toLowerCase()));
  }

  const rows = await db
    .select({ email: signups.email, name: signups.name, tier: signups.interestedTier, source: signups.source })
    .from(signups)
    .where(isNull(signups.unsubscribedAt))
    .orderBy(desc(signups.createdAt));

  // The waiting list is written into the same table by the sold-out form,
  // marked by its source; everyone else is the news list.
  const isWait = (r: { source: string | null }) => (r.source ?? "").startsWith("waitlist");
  return rows.filter((r) => (audience === "waitlist" ? isWait(r) : !isWait(r))).map((r) => ({ email: r.email, name: r.name }));
}

export async function audienceCounts(): Promise<Record<Audience, number>> {
  const [s, b, w] = await Promise.all([audienceOf("signups"), audienceOf("buyers"), audienceOf("waitlist")]);
  return { signups: s.length, buyers: b.length, waitlist: w.length };
}

export type MailingInput = {
  audience: Audience;
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

/**
 * Sends to everyone on the list in batches of a hundred - Resend's limit -
 * and records what went out. A batch that fails stops the run rather than
 * carrying on: half a list mailed twice is worse than half a list mailed once.
 */
export async function sendMailing(input: MailingInput, sentBy: string): Promise<{ ok: boolean; sent: number; error?: string }> {
  const people = await audienceOf(input.audience);
  if (people.length === 0) return { ok: false, sent: 0, error: "Няма на кого да се изпрати." };

  let sent = 0;
  for (let i = 0; i < people.length; i += 100) {
    const slice = people.slice(i, i + 100);
    const res = await sendListMailBatch(
      slice.map((p) => ({
        to: p.email,
        name: p.name,
        subject: input.subject,
        body: input.body,
        ctaLabel: input.ctaLabel ?? null,
        ctaUrl: input.ctaUrl ?? null,
      })),
    );
    if (!res.ok) return { ok: false, sent, error: res.error ?? "Изпращането се провали." };
    sent += slice.length;
  }

  await getDb().insert(listMailings).values({
    audience: input.audience,
    subject: input.subject,
    body: input.body,
    ctaLabel: input.ctaLabel ?? null,
    ctaUrl: input.ctaUrl ?? null,
    recipients: sent,
    sentBy,
  });

  return { ok: true, sent };
}

/** Sends the same letter to one address, to see it before the list does. */
export async function sendTestMailing(input: MailingInput, to: string): Promise<{ ok: boolean; error?: string }> {
  const res = await sendListMailBatch([
    { to, name: null, subject: `[проба] ${input.subject}`, body: input.body, ctaLabel: input.ctaLabel ?? null, ctaUrl: input.ctaUrl ?? null },
  ]);
  return { ok: res.ok, error: res.error };
}

export async function recentMailings(limit = 20) {
  return getDb()
    .select({
      id: listMailings.id,
      audience: listMailings.audience,
      subject: listMailings.subject,
      recipients: listMailings.recipients,
      sentAt: listMailings.sentAt,
      sentBy: listMailings.sentBy,
    })
    .from(listMailings)
    .orderBy(desc(listMailings.sentAt))
    .limit(limit);
}

/** Marks an address as unsubscribed; used by the one-click link in every letter. */
export async function unsubscribe(email: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .update(signups)
    .set({ unsubscribedAt: new Date() })
    .where(and(eq(signups.email, email.toLowerCase().trim()), isNull(signups.unsubscribedAt)))
    .returning({ email: signups.email });
  if (rows.length > 0) return true;
  // A buyer who never joined the list still gets a row, so the suppression
  // list holds for them too.
  const [existing] = await db.select({ email: signups.email }).from(signups).where(eq(signups.email, email.toLowerCase().trim())).limit(1);
  if (existing) return true;
  await db.insert(signups).values({
    email: email.toLowerCase().trim(),
    consented: false,
    consentAt: new Date(),
    consentText: "Отписан по своя молба - адресът се пази само за да не бъде добавен отново.",
    source: "unsubscribe",
    unsubscribedAt: new Date(),
  });
  return true;
}
