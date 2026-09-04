"use server";

import { headers } from "next/headers";
import { z } from "zod";

import type { CheckoutState } from "@/lib/checkout-state";
import { sendTicketEmail } from "@/lib/email";
import { createPendingOrder, markOrderPaid } from "@/lib/orders";
import { createWaitlistSignup } from "@/lib/signups";
import { discountFor, promoReasonText, resolvePromo } from "@/lib/promo";
import { PURCHASE_TERMS_TEXT, PURCHASE_TERMS_VERSION } from "@/lib/purchase-terms";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { SALES_OPEN, TIERS, getTier } from "@/lib/tickets";

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
  // Campaign tags, if the buyer came through a tagged link. Labels we chose,
  // so anything but plain characters is dropped rather than refused.
  utmSource: z.string().trim().toLowerCase().max(60).optional(),
  utmCampaign: z.string().trim().toLowerCase().max(60).optional(),
  promo: z.string().trim().max(32).optional(),
});

export type WaitlistState = { status: "idle" | "ok" | "error"; message?: string };

/** "Tell me if a seat frees up" under a sold-out tier. */
export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`waitlist:${ip}`, 10).allowed) return { status: "error", message: "Твърде много опити." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const tierId = String(formData.get("tierId") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return { status: "error", message: "Провери имейл адреса." };
  if (!getTier(tierId)) return { status: "error", message: "Непознато ниво." };
  await createWaitlistSignup(email, tierId);
  return { status: "ok", message: "Записахме те. Ще ти пишем само ако се освободи място." };
}

export type PromoPreview =
  | { ok: true; code: string; kind: "percent" | "fixed"; value: number; label: string }
  | { ok: false; message: string };

/**
 * What a code is worth, for the summary on the page. The order creation
 * resolves it again against the real gross, so this can only inform, never
 * decide.
 */
export async function checkPromo(raw: string): Promise<PromoPreview> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`promo:${ip}`, 30).allowed) return { ok: false, message: "Твърде много опити." };
  const r = await resolvePromo(raw, 100_00);
  if (!r.ok) return { ok: false, message: promoReasonText[r.reason] };
  void discountFor; // the client computes the amount from kind + value
  return { ok: true, code: r.code, kind: r.kind, value: r.value, label: r.label };
}

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
  // The switch is checked here, not only in the UI: a bookmarked /bilet or a
  // cached page must not be able to buy at a price that may still change.
  if (!SALES_OPEN) {
    return fail("Билетите още не са в продажба. Отваряме съвсем скоро.");
  }

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
    promoCode: input.promo,
    termsText: `${PURCHASE_TERMS_VERSION}: ${PURCHASE_TERMS_TEXT}`,
  });

  if (!order.ok) {
    if (order.reason === "bad_promo") {
      const why = promoReasonText[(order.message as keyof typeof promoReasonText) ?? "unknown"] ?? "Кодът не важи.";
      return fail(why, { promo: why });
    }
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

  // A 100 % code: nothing to charge, so no Stripe. The order is paid on the
  // spot, tickets issued, the mail sent - the same path the webhook takes.
  if (order.totalCents === 0) {
    const paid = await markOrderPaid(order.orderId, null);
    if (paid.order) {
      await sendTicketEmail({
        to: paid.order.email,
        buyerName: paid.order.name,
        reference: paid.order.reference,
        totalCents: paid.order.totalCents,
        invoiceNumber: paid.order.invoiceNumber,
        tickets: paid.order.tickets,
      });
    }
    return { status: "redirect", redirectUrl: `${origin}/bilet/uspeh?ref=${order.reference}` };
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    client_reference_id: order.reference,
    // The webhook needs this to find the order it must mark paid.
    metadata: { orderId: order.orderId, reference: order.reference },
    line_items: [
      order.discountCents > 0
        ? {
            // With a discount the tickets are billed as one line at the
            // order's total: a percentage split per ticket need not land on
            // whole cents, and the charge must equal the record exactly.
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: order.totalCents,
              product_data: {
                name: `Sofia Life Summit - ${tier.name} × ${input.quantity}`,
                description: `07-08 ноември 2026, Гранд Хотел Милениум, София · код ${order.promoCode}`,
              },
            },
          }
        : {
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
