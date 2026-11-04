import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { emailSends, orders, tickets } from "@/lib/db/schema";
import { pushToEmails } from "@/lib/push";
import { SOLD } from "@/lib/sold";
import { bookingOpen } from "@/lib/workshops";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KIND = "push-booking-open-peak";

/**
 * The moment booking opens (Friday 6 November, 08:30 Sofia, run by Vercel
 * Cron), a push to every phone signed in with a PEAK ticket: the buyer's,
 * and the holder's of a ticket given to someone. Once only - the slot in
 * email_sends stops a second run - and `?dry=1` shows who would get it.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dry = !!new URL(request.url).searchParams.get("dry");
  if (!dry && !bookingOpen()) return NextResponse.json({ ok: true, skipped: "booking not open yet" });

  const db = getDb();
  const rows = await db
    .select({ buyer: sql<string>`lower(${orders.email})`, holder: sql<string | null>`lower(${tickets.attendeeEmail})` })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${SOLD} and not ${orders.isTest} and ${tickets.tierId} = 'peak' and ${tickets.checkedInAt} is null`);
  const to = [...new Set(rows.flatMap((r) => [r.buyer, r.holder]).filter((e): e is string => !!e))];
  if (dry) return NextResponse.json({ ok: true, dry: true, emails: to.length });

  const [slot] = await db.insert(emailSends).values({ kind: KIND, target: "push", email: "push" }).onConflictDoNothing().returning({ id: emailSends.id });
  if (!slot) return NextResponse.json({ ok: true, skipped: "already sent" });

  const r = await pushToEmails(to, {
    title: "Записването е отворено",
    body: "С PEAK записваш 3 workshops и 3 experiences. Отвори „Станции“ и избери, преди местата да свършат.",
    data: { screen: "stations" },
    collapseId: "booking-open",
  });
  return NextResponse.json({ ok: true, emails: to.length, ...r });
}
