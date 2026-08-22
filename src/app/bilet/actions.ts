"use server";

import { headers } from "next/headers";
import { z } from "zod";

import type { CheckoutState } from "@/lib/checkout-state";
import { createPendingOrder } from "@/lib/orders";
import { PURCHASE_TERMS_TEXT, PURCHASE_TERMS_VERSION } from "@/lib/purchase-terms";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { TIERS, getTier } from "@/lib/tickets";

const schema = z.object({
  tierId: z.enum(TIERS.map((t) => t.id) as [string, ...string[]]),
  quantity: z.coerce.number().int().min(1).max(10),
  name: z.string().trim().min(2, "Въведи име и фамилия.").max(120),
  email: z.string().trim().toLowerCase().email("Провери имейл адреса."),
  phone: z.string().trim().max(40).optional(),
  invoiceCompany: z.string().trim().max(160).optional(),
  invoiceVatNumber: z.string().trim().max(40).optional(),
  invoiceAddress: z.string().trim().max(300).optional(),
  terms: z.literal("on", { message: "Трябва да приемеш условията." }),
});

function fail(
  message: string,
  fieldErrors?: CheckoutState["fieldErrors"],
): CheckoutState {
  return { status: "error", message, fieldErrors };
}

export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (!isStripeConfigured()) {
    return fail("Плащанията още не са настроени. Опитай отново по-късно.");
  }

  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`checkout:${ip}`).allowed) {
    return fail("Твърде много опити. Изчакай минута и опитай пак.");
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: CheckoutState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        fieldErrors[field as keyof typeof fieldErrors] ??= issue.message;
      }
    }
    return fail("Провери отбелязаните полета.", fieldErrors);
  }

  const input = parsed.data;
  const tier = getTier(input.tierId);
  if (!tier) return fail("Непознато ниво билет.");

  const order = await createPendingOrder({
    ...input,
    termsText: `${PURCHASE_TERMS_VERSION}: ${PURCHASE_TERMS_TEXT}`,
  });

  if (!order.ok) {
    if (order.reason === "sold_out") {
      return fail(
        order.left
          ? `Остават само ${order.left} места от това ниво.`
          : "Това ниво е изчерпано.",
        { quantity: "Намали броя или избери друго ниво." },
      );
    }
    return fail("Поръчката не можа да бъде създадена. Опитай отново.");
  }

  // Fixed rather than read from Origin/Host: today the platform pins those
  // headers, but a URL Stripe redirects buyers to should not be one proxy
  // config away from attacker influence.
  const origin = "https://thelongevitysummit.eu";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    client_reference_id: order.reference,
    // The webhook needs this to find the order it must mark paid.
    metadata: { orderId: order.orderId, reference: order.reference },
    line_items: [
      {
        quantity: input.quantity,
        price_data: {
          currency: "eur",
          // The price already written to the order, so the charge and the
          // record cannot disagree. VAT is already inside it.
          unit_amount: order.unitPriceCents,
          product_data: {
            name: `Sofia Life Summit - ${tier.name}`,
            description: "07-08 ноември 2026, Гранд Хотел Милениум, София",
          },
        },
      },
    ],
    // Stripe's minimum session lifetime is 30 minutes - anything shorter is
    // rejected outright (it broke live sales on 22.08). The pending hold is
    // therefore longer (35 min): a payment landing in the session's final
    // seconds must still find its seat held, or we could oversell by one.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${origin}/bilet/uspeh?ref=${order.reference}`,
    cancel_url: `${origin}/bilet?otkazano=1`,
  });

  if (!session.url) return fail("Stripe не върна адрес за плащане.");

  return { status: "redirect", redirectUrl: session.url };
}
