"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createUpgradeOrder, upgradeQuote } from "@/lib/upgrades";

/**
 * Pays the difference: a pending upgrade order, then Stripe. The quote is
 * taken again here, not trusted from the page - the price stage or the
 * seats may have moved since it was rendered.
 */
export async function startUpgrade(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const back = (why: string): never => redirect(`/bilet/nadgradi/${encodeURIComponent(code)}?greshka=${why}`);

  const quote = await upgradeQuote(code);
  if (!quote.ok) return back(quote.reason);
  if (!isStripeConfigured()) return back("stripe");

  const order = await createUpgradeOrder(quote);
  if ("error" in order) return back(order.error);

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? "thelongevitysummit.eu"}`;
  const lang = quote.lang;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    locale: lang === "en" ? "en" : "bg",
    customer_email: quote.email,
    client_reference_id: order.reference,
    metadata: { orderId: order.orderId, reference: order.reference },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: order.totalCents,
          product_data: {
            name: `Sofia Life Summit - ${order.productName}`,
            description: `Билет ${quote.code} · 07-08 ноември 2026, Гранд Хотел Милениум, София`,
          },
        },
      },
    ],
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${origin}/bilet/uspeh?ref=${order.reference}&lang=${lang}`,
    cancel_url: `${origin}/bilet/nadgradi/${encodeURIComponent(quote.code)}?otkazano=1`,
  });
  if (!session.url) return back("stripe");
  redirect(session.url);
}
