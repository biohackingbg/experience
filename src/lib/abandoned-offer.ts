import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailSends, orderItems, orders, promoCodes } from "@/lib/db/schema";
import { sendSequenceMail } from "@/lib/email";
import { createPromo } from "@/lib/promo";
import { abandonedOfferLetter } from "@/lib/sequence-letters";
import { deliver } from "@/lib/sequences";
import { unsubscribePostUrl, unsubscribeUrl } from "@/lib/unsubscribe";

/**
 * The last-week offer: everyone who opened a checkout and never paid gets
 * one letter with a discount code, sent by hand from the admin. One letter
 * per address, whatever the number of unfinished orders; nobody who has a
 * paid order or has unsubscribed is on the list.
 */
export const OFFER = {
  kind: "abandoned-offer",
  code: "SLS40",
  percent: 40,
  until: new Date("2026-11-05T00:00:00+02:00"),
} as const;

export type OfferRecipient = { reference: string; name: string; email: string; items: string; tierId: string; sent: boolean };

export async function listOfferRecipients(): Promise<OfferRecipient[]> {
  const db = getDb();
  // The latest unfinished order per address carries the name and the tier the letter speaks about.
  const rows = await db
    .select({ id: orders.id, reference: orders.reference, name: orders.name, email: orders.email })
    .from(orders)
    .where(
      sql`${orders.id} in (
        select distinct on (lower(o.email)) o.id from ${orders} o
        where o.status = 'pending' and not o.is_test and o.payment_method = 'card'
          and not exists (select 1 from ${orders} p where lower(p.email) = lower(o.email) and p.status = 'paid')
          and not exists (select 1 from signups s where lower(s.email) = lower(o.email) and s.unsubscribed_at is not null)
        order by lower(o.email), o.created_at desc
      )`,
    )
    .orderBy(sql`lower(${orders.email})`);
  if (rows.length === 0) return [];

  const items = await db
    .select({ orderId: orderItems.orderId, tierId: orderItems.tierId, tierName: orderItems.tierName, quantity: orderItems.quantity })
    .from(orderItems)
    .where(sql`${orderItems.orderId} in (${sql.join(rows.map((r) => sql`${r.id}`), sql`, `)})`);
  const done = await db
    .select({ target: emailSends.target })
    .from(emailSends)
    .where(sql`${emailSends.kind} = ${OFFER.kind}`);
  const sent = new Set(done.map((d) => d.target));

  return rows.map((o) => {
    const mine = items.filter((i) => i.orderId === o.id);
    return {
      reference: o.reference,
      name: o.name,
      email: o.email.toLowerCase(),
      items: mine.map((i) => `${i.quantity}× ${i.tierName}`).join(", ") || "билет",
      tierId: mine[0]?.tierId ?? "plus",
      sent: sent.has(o.email.toLowerCase()),
    };
  });
}

/** The code the letter promises, made once; a second press finds it there and keeps its deadline current. */
export async function ensureOfferCode(): Promise<void> {
  const r = await createPromo({
    code: OFFER.code,
    kind: "percent",
    value: OFFER.percent,
    maxUses: null,
    validUntil: OFFER.until,
    note: "Писмото до недовършените поръчки, 4 ноември",
    tiers: null,
  });
  if (r === "exists") await getDb().update(promoCodes).set({ validUntil: OFFER.until, active: true }).where(sql`${promoCodes.code} = ${OFFER.code}`);
}

const letterFor = (r: Pick<OfferRecipient, "name" | "items" | "tierId" | "email">) =>
  abandonedOfferLetter({ name: r.name, items: r.items, tierId: r.tierId, code: OFFER.code, percent: OFFER.percent, unsubUrl: unsubscribeUrl(r.email) });

/** The letter as a reader sees it, to one's own address; the code is made so the button works. */
export async function sendOfferTest(to: string): Promise<boolean> {
  await ensureOfferCode();
  const letter = letterFor({ name: "Мария", items: "1× PLUS", tierId: "plus", email: to });
  const id = await sendSequenceMail({ to, ...letter, unsubscribe: { url: unsubscribeUrl(to), postUrl: unsubscribePostUrl(to) } });
  return id !== null;
}

export async function sendOfferAll(): Promise<{ sent: number; failed: string[] }> {
  await ensureOfferCode();
  const waiting = (await listOfferRecipients()).filter((r) => !r.sent);
  let sent = 0;
  const failed: string[] = [];
  for (const r of waiting) {
    const ok = await deliver(OFFER.kind, r.email, r.email, letterFor(r), false);
    if (ok) sent += 1;
    else failed.push(r.email);
  }
  return { sent, failed };
}
