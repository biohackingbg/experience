import "server-only";

import { asc, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { signups } from "@/lib/db/schema";
import { sendWaitlistEmail } from "@/lib/email";
import { getRemainingAll } from "@/lib/orders";
import { TIERS, getTier } from "@/lib/tickets";

/**
 * When a seat frees up - a refund, a cancelled bank order, an expired
 * hold - the people waiting for that tier hear about it, once each. Up to
 * twice as many as there are seats are told, oldest signup first: the
 * promise was "we will write if a seat frees", not "the seat is yours",
 * and telling everyone for one seat would disappoint most of them.
 */
export async function notifyWaitlist(tierId: string): Promise<number> {
  const tier = getTier(tierId);
  if (!tier) return 0;
  const left = (await getRemainingAll())[tierId] ?? 0;
  if (left <= 0) return 0;
  const db = getDb();
  const waiting = await db
    .select({ id: signups.id, email: signups.email })
    .from(signups)
    .where(sql`${signups.source} = ${`waitlist:${tierId}`} and ${signups.notifiedAt} is null and ${signups.unsubscribedAt} is null`)
    .orderBy(asc(signups.createdAt))
    .limit(left * 2);
  let sent = 0;
  for (const w of waiting) {
    const ok = await sendWaitlistEmail({ to: w.email, tierName: tier.name, tierId, left });
    if (ok) {
      await db.update(signups).set({ notifiedAt: new Date() }).where(sql`${signups.id} = ${w.id}`);
      sent++;
    }
  }
  return sent;
}

/** Every tier - for the daily run, which catches seats freed by expired holds. */
export async function notifyWaitlistAll(): Promise<number> {
  let n = 0;
  for (const t of TIERS) n += await notifyWaitlist(t.id);
  return n;
}
