import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { emailSends, orders, tickets } from "@/lib/db/schema";
import { sendListMailBatch } from "@/lib/email";
import { pushToEmails } from "@/lib/push";
import { bookingOpenLetter } from "@/lib/sequence-letters";
import { SOLD } from "@/lib/sold";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { bookingOpen } from "@/lib/workshops";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PUSH_KIND = "push-booking-open-peak";
const MAIL_KIND = "booking-open-peak";

type Holder = { email: string; name: string; lang: "bg" | "en"; codes: string[] };

/**
 * The moment booking opens (Friday 6 November, 08:30 Sofia, run by Vercel
 * Cron), to everyone with a PEAK ticket: a push to every phone signed in
 * with one, and an email - few phones allow pushes, every buyer has an
 * address. A ticket given to someone goes to that person, not the buyer.
 * Each address is written down as its batch goes, so a second run sends
 * nothing twice; `?dry=1` shows who would get it.
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
    .select({
      code: tickets.code,
      buyer: sql<string>`lower(${orders.email})`,
      buyerName: orders.name,
      holder: sql<string | null>`lower(${tickets.attendeeEmail})`,
      holderName: tickets.attendeeName,
      lang: orders.lang,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${SOLD} and not ${orders.isTest} and ${tickets.tierId} = 'peak' and ${tickets.checkedInAt} is null`)
    .orderBy(tickets.code);

  const by = new Map<string, Holder>();
  for (const r of rows) {
    const email = r.holder ?? r.buyer;
    const h = by.get(email) ?? { email, name: (r.holder ? r.holderName : null) ?? r.buyerName, lang: r.lang === "en" ? "en" : "bg", codes: [] };
    h.codes.push(r.code);
    by.set(email, h);
  }
  const people = [...by.values()];
  if (dry) return NextResponse.json({ ok: true, dry: true, people: people.length, tickets: rows.length });

  // The push, once.
  let push = { sent: 0, failed: 0 };
  const [slot] = await db.insert(emailSends).values({ kind: PUSH_KIND, target: "push", email: "push" }).onConflictDoNothing().returning({ id: emailSends.id });
  if (slot) {
    push = await pushToEmails(
      [...new Set(rows.flatMap((r) => [r.buyer, r.holder]).filter((e): e is string => !!e))],
      {
        title: "Записването е отворено",
        body: "С PEAK записваш 3 workshops и 3 experiences. Отвори „Станции“, дръпни надолу да се обнови и избери, преди местата да свършат.",
        data: { screen: "stations" },
        collapseId: "booking-open",
      },
    );
  }

  // The email, once per address.
  const done = new Set((await db.select({ target: emailSends.target }).from(emailSends).where(sql`${emailSends.kind} = ${MAIL_KIND}`)).map((r) => r.target));
  const waiting = people.filter((p) => !done.has(p.email));
  let sent = 0;
  let error: string | undefined;
  for (let i = 0; i < waiting.length; i += 100) {
    const slice = waiting.slice(i, i + 100);
    const letters = slice.map((p) => ({ p, l: bookingOpenLetter({ name: p.name, codes: p.codes, unsubUrl: unsubscribeUrl(p.email), lang: p.lang }) }));
    const res = await sendListMailBatch(letters.map(({ p, l }) => ({ to: p.email, name: null, subject: l.subject, body: "", ctaLabel: null, ctaUrl: null, html: l.html, text: l.text })));
    if (!res.ok) {
      error = res.error;
      break;
    }
    await db
      .insert(emailSends)
      .values(letters.map(({ p }, j) => ({ kind: MAIL_KIND, target: p.email, email: p.email, emailId: res.ids?.[j] ?? null })))
      .onConflictDoNothing();
    sent += slice.length;
  }
  return NextResponse.json({ ok: !error, push, mail: { sent, waiting: waiting.length, error } });
}
