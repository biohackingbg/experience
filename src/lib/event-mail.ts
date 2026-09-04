import "server-only";

import { inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { type EventInfoInput, sendEventInfoBatch } from "@/lib/email";
import { getTier } from "@/lib/tickets";

/**
 * The one mail to every buyer before the event. Sent from the admin, in
 * batches, each order marked the moment its batch is accepted - so a second
 * click continues where the first stopped and nobody gets it twice.
 */

const EVENT_DAY = new Date("2026-11-07T09:00:00+02:00");
export const daysToEvent = () => Math.max(0, Math.ceil((EVENT_DAY.getTime() - Date.now()) / 86_400_000));

/** Paid, real orders: who still waits for the mail and who has it. */
export async function getInfoMailAudience(): Promise<{ pending: number; sent: number }> {
  const [row] = await getDb()
    .select({
      pending: sql<number>`count(*) filter (where ${orders.infoSentAt} is null)::int`,
      sent: sql<number>`count(*) filter (where ${orders.infoSentAt} is not null)::int`,
    })
    .from(orders)
    .where(sql`${orders.status} = 'paid' and not ${orders.isTest}`);
  return { pending: row?.pending ?? 0, sent: row?.sent ?? 0 };
}

async function buildInputs(orderRows: { id: string; email: string; name: string; reference: string; lang: string }[]): Promise<EventInfoInput[]> {
  if (orderRows.length === 0) return [];
  const tix = await getDb()
    .select({ orderId: tickets.orderId, code: tickets.code, tierId: tickets.tierId, attendeeName: tickets.attendeeName })
    .from(tickets)
    .where(inArray(tickets.orderId, orderRows.map((o) => o.id)));
  const daysLeft = daysToEvent();
  return orderRows.map((o) => ({
    to: o.email,
    buyerName: o.name,
    reference: o.reference,
    daysLeft,
    lang: o.lang === "en" ? "en" : "bg",
    tickets: tix
      .filter((t) => t.orderId === o.id)
      .map((t) => ({ code: t.code, tierName: getTier(t.tierId)?.name ?? t.tierId, attendeeName: t.attendeeName })),
  }));
}

/** Sends to everyone still waiting, up to `limit` orders per call. */
export async function sendInfoMail(limit = 300): Promise<{ sent: number; remaining: number; error?: string }> {
  const db = getDb();
  const waiting = await db
    .select({ id: orders.id, email: orders.email, name: orders.name, reference: orders.reference, lang: orders.lang })
    .from(orders)
    .where(sql`${orders.status} = 'paid' and not ${orders.isTest} and ${orders.infoSentAt} is null`)
    .orderBy(orders.createdAt)
    .limit(limit);

  let sent = 0;
  for (let i = 0; i < waiting.length; i += 50) {
    const chunk = waiting.slice(i, i + 50);
    const inputs = await buildInputs(chunk);
    const r = await sendEventInfoBatch(inputs);
    if (!r.ok) {
      const { pending } = await getInfoMailAudience();
      return { sent, remaining: pending, error: r.error };
    }
    await db
      .update(orders)
      .set({ infoSentAt: new Date() })
      .where(inArray(orders.id, chunk.map((o) => o.id)));
    sent += chunk.length;
  }
  const { pending } = await getInfoMailAudience();
  return { sent, remaining: pending };
}

/** The same mail, with sample tickets, to one address - for reading it before anyone else does. */
export async function sendInfoMailTest(to: string): Promise<boolean> {
  const r = await sendEventInfoBatch([
    {
      to,
      buyerName: "Иван",
      reference: "SLS-ПРИМЕР",
      daysLeft: daysToEvent(),
      tickets: [
        { code: "ABCD-EFGH", tierName: "PLUS", attendeeName: null },
        { code: "JKLM-NPQR", tierName: "PLUS", attendeeName: "Мария Иванова" },
      ],
    },
  ]);
  return r.ok;
}

/** What the mail says, for the preview on the admin page. */
export function sampleInput(): EventInfoInput {
  return {
    to: "",
    buyerName: "Иван",
    reference: "SLS-ПРИМЕР",
    daysLeft: daysToEvent(),
    tickets: [
      { code: "ABCD-EFGH", tierName: "PLUS", attendeeName: null },
      { code: "JKLM-NPQR", tierName: "PLUS", attendeeName: "Мария Иванова" },
    ],
  };
}
