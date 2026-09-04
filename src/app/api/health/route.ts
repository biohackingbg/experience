import { NextResponse } from "next/server";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { sendAlertEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
// The Stripe round trip can be slow on a cold start.
export const maxDuration = 60;

/**
 * The daily self-test, run by Vercel Cron (the free plan caps crons at once
 * a day; hourly needs Pro or an external pinger hitting this endpoint).
 *
 * Checks the three things a buyer's money passes through:
 *
 * 1. Stripe - creates a real (live-mode) Checkout session with the same
 *    critical parameters the buy flow uses, then expires it at once. This is
 *    the check that would have caught the 25-minute expires_at outage before
 *    a customer did. No payment can result; the session dies immediately.
 * 2. The database - a trivial read.
 * 3. Silent failures - paid orders from the last 24h that somehow have no
 *    tickets or no invoice number, and full refunds without a credit note.
 *
 * Any failure emails the operators. The endpoint answers 500 on failure so
 *  an external monitor can watch it too.
 */
export async function GET(request: Request) {
  // Vercel Cron authenticates with the CRON_SECRET env var; nobody else
  // gets to trigger Stripe traffic or read counts.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const failures: string[] = [];

  // 1. Stripe checkout dry run
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      metadata: { healthcheck: "1" },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: 3500,
            product_data: { name: "Health check - not a real ticket" },
          },
        },
      ],
      // Mirrors the buy flow's session lifetime, so a rule change on
      // Stripe's side fails here first.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: "https://thelongevitysummit.eu/bilet",
      cancel_url: "https://thelongevitysummit.eu/bilet",
    });
    await stripe.checkout.sessions.expire(session.id);
  } catch (error) {
    failures.push(`Stripe checkout: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 2 + 3. Database and silent post-payment failures
  try {
    const db = getDb();
    const [row] = await db.execute<{
      paid_no_tickets: string;
      paid_no_invoice: string;
      refunded_no_note: string;
      paid_no_payment: string;
    }>(sql`
      select
        count(*) filter (
          where o.status = 'paid' and o.paid_at > now() - interval '24 hours'
            and not exists (select 1 from tickets t where t.order_id = o.id)
        ) as paid_no_tickets,
        count(*) filter (
          where o.status = 'paid' and o.paid_at > now() - interval '24 hours'
            and o.invoice_number is null
        ) as paid_no_invoice,
        count(*) filter (
          where o.status = 'paid' and not o.is_test and o.total_cents > 0
            and o.stripe_payment_intent_id is null
        ) as paid_no_payment,
        count(*) filter (
          where o.status = 'refunded' and o.refunded_at > now() - interval '24 hours'
            and o.invoice_number is not null and o.credit_note_number is null
            and o.refunded_at < now() - interval '15 minutes'
        ) as refunded_no_note
      from orders o
    `);
    if (Number(row.paid_no_tickets)) failures.push(`${row.paid_no_tickets} платени поръчки от 24ч БЕЗ билети`);
    if (Number(row.paid_no_invoice)) failures.push(`${row.paid_no_invoice} платени поръчки от 24ч БЕЗ фактура`);
    if (Number(row.refunded_no_note)) failures.push(`${row.refunded_no_note} върнати поръчки БЕЗ кредитно известие`);
    if (Number(row.paid_no_payment)) failures.push(`${row.paid_no_payment} платени поръчки БЕЗ плащане в Stripe (виж „Проверка“ в таблото)`);
  } catch (error) {
    failures.push(`База данни: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (failures.length > 0) {
    console.error("[health] FAILING:", failures.join(" | "));
    await sendAlertEmail(
      `⚠ Sofia Life Summit: ${failures.length} проблем(а) на сайта`,
      [
        "Часовата проверка на thelongevitysummit.eu откри:",
        "",
        ...failures.map((f) => `- ${f}`),
        "",
        `Проверено: ${new Date().toISOString()}`,
        "Дневник: vercel.com -> experience -> Logs",
      ].join("\n"),
    );
    return NextResponse.json({ ok: false, failures }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
