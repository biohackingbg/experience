import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendTicketEmail } from "@/lib/email";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { issueCreditNote, markOrderPaid, markOrderRefunded } from "@/lib/orders";
import { orderItems } from "@/lib/db/schema";
import { notifyWaitlist } from "@/lib/waitlist";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook - the only place an order becomes `paid`.
 *
 * Never trust the browser's return from Checkout: a buyer can close the tab
 * before it loads, and the URL can be visited without paying. Stripe's signed
 * server-to-server call is the fact.
 *
 * The raw body is required for signature verification, so it is read with
 * `request.text()` before any parsing.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    // A bad signature means the call did not come from Stripe.
    console.error("[stripe] signature verification failed:", error);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.error("[stripe] session without orderId:", session.id);
      } else if (session.payment_status === "paid") {
        const paymentIntent =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        // Defence in depth: sessions are only created server-side with the
        // order's own price, but if a future change ever let an amount drift,
        // a mismatch must not mint tickets quietly.
        const db = getDb();
        const [expected] = await db
          .select({ totalCents: orders.totalCents })
          .from(orders)
          .where(sql`${orders.id} = ${orderId}`);
        if (
          expected &&
          typeof session.amount_total === "number" &&
          session.amount_total !== expected.totalCents
        ) {
          console.error(
            `[stripe] amount mismatch for ${orderId}: session ${session.amount_total} vs order ${expected.totalCents} - not issuing tickets`,
          );
          return NextResponse.json({ received: true });
        }

        const { issued, order } = await markOrderPaid(orderId, paymentIntent);
        console.info(
          `[stripe] order ${orderId} paid, ${issued} ticket(s) issued`,
        );
        // The home page is static between sales; a sale may have just sold
        // out a tier, and "изчерпано" must not wait for the next revalidation.
        revalidatePath("/");

        // Only the delivery that actually flipped the order returns `order`,
        // so a Stripe retry cannot send the buyer a second copy. A failed send
        // must not fail the webhook - the money is taken and the tickets exist
        // either way, and a 500 here would have Stripe retry a paid order.
        if (order) {
          const sent = await sendTicketEmail({
            to: order.email,
            buyerName: order.name,
            reference: order.reference,
            totalCents: order.totalCents,
            invoiceNumber: order.invoiceNumber,
            tickets: order.tickets,
          });
          if (!sent) {
            console.error(
              `[stripe] ticket email NOT sent for ${order.reference} - deliver it manually`,
            );
          }
        }
      }
    }

    // A refund made in the Stripe dashboard (or via API) - the only way one
    // happens; the site itself never refunds. Full refunds close the order
    // and its tickets; partial ones are recorded. The invoice is untouched:
    // the accountant answers it with a credit note against the same number.
    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntent =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null);

      if (!paymentIntent) {
        console.error("[stripe] refunded charge without payment intent:", charge.id);
      } else {
        const outcome = await markOrderRefunded(paymentIntent, charge.amount_refunded);
        if (outcome.status === "not_found") {
          console.error(`[stripe] refund for unknown payment intent ${paymentIntent}`);
        } else if (outcome.status === "refunded") {
          // The credit note answers the invoice; drawn here, in the same
          // event that recorded the refund, so it cannot be forgotten.
          const creditNote = await issueCreditNote(outcome.orderId);
          console.info(
            `[stripe] order ${outcome.reference} fully refunded: ${outcome.refundedCents}/${outcome.totalCents} - invoice ${outcome.invoiceNumber ?? "-"}, credit note ${creditNote ?? "already issued"}`,
          );
          // The seat is free again; the waiting list for that tier hears first.
          revalidatePath("/");
          const [item] = await getDb().select({ tierId: orderItems.tierId }).from(orderItems).where(sql`${orderItems.orderId} = ${outcome.orderId}`).limit(1);
          if (item) await notifyWaitlist(item.tierId);
        } else {
          console.info(
            `[stripe] order ${outcome.reference} partially refunded: ${outcome.refundedCents}/${outcome.totalCents} - credit note is the accountant's call`,
          );
        }
      }
    }
  } catch (error) {
    // 500 asks Stripe to retry; both handlers are idempotent, so a retry is safe.
    console.error("[stripe] handler failed:", error);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
