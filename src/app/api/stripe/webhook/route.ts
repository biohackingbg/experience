import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook — the only place an order becomes `paid`.
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

        const { issued } = await markOrderPaid(orderId, paymentIntent);
        console.info(
          `[stripe] order ${orderId} paid, ${issued} ticket(s) issued`,
        );
      }
    }
  } catch (error) {
    // 500 asks Stripe to retry; markOrderPaid is idempotent, so a retry is safe.
    console.error("[stripe] handler failed:", error);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
