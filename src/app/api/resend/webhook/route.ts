import { NextResponse } from "next/server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Resend tells us what happened to a reminder after it left: opened,
 * clicked. Only those two events matter and only for reminders - the
 * email id stored on the order is the join, so a ticket email or a digest
 * arriving here is ignored.
 *
 * Signed the Svix way (Resend's webhook provider): HMAC-SHA256 over
 * "id.timestamp.body" with the base64 secret, timestamp within five
 * minutes. Without the secret the endpoint does nothing at all - a
 * forged "opened" is harmless, but a forged anything is still forged.
 *
 * Reading of the result: a click is a person. An open is a maybe - Apple
 * Mail fetches the pixel for everyone, Gmail through a proxy - so the
 * dashboard words it as "отворено", never as proof.
 */
function verify(secret: string, id: string, ts: string, sig: string, body: string): boolean {
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sig.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const id = request.headers.get("svix-id") ?? "";
  const ts = request.headers.get("svix-timestamp") ?? "";
  const sig = request.headers.get("svix-signature") ?? "";
  const body = await request.text();
  if (!id || !ts || !sig || !verify(secret, id, ts, sig, body)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const emailId = event.data?.email_id;
  const column =
    event.type === "email.opened"
      ? orders.reminderOpenedAt
      : event.type === "email.clicked"
        ? orders.reminderClickedAt
        : null;
  if (!column || !emailId) return NextResponse.json({ ok: true, ignored: true });

  // First time wins: the question is "did they", not "how often".
  await getDb()
    .update(orders)
    .set(
      column === orders.reminderOpenedAt
        ? { reminderOpenedAt: sql`coalesce(${orders.reminderOpenedAt}, now())` }
        : { reminderClickedAt: sql`coalesce(${orders.reminderClickedAt}, now())` },
    )
    .where(sql`${orders.reminderEmailId} = ${emailId}`);

  return NextResponse.json({ ok: true });
}
