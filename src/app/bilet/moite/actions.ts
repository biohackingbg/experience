"use server";

import { headers } from "next/headers";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import { sendTicketEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { SOLD } from "@/lib/sold";
import { getTier } from "@/lib/tickets";

export type ResendState = { status: "idle" | "ok" | "error"; message?: string };

/**
 * "I lost my ticket": the buyer types the address they bought with and the
 * tickets go out again, to that address only.
 *
 * The answer is the same whether or not an order exists - otherwise the
 * form would tell anyone whether a given person bought a ticket - and it is
 * throttled, since it sends mail on request.
 */
export async function resendMyTickets(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const lang = formData.get("lang") === "en" ? "en" : "bg";
  const same = lang === "en"
    ? "If there is an order with that address, the tickets are already on their way. Check your spam folder too."
    : "Ако има поръчка с този адрес, билетите вече пътуват към него. Провери и папката със спам.";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return { status: "error", message: lang === "en" ? "Check the email address." : "Провери имейл адреса." };
  }
  if (!checkRateLimit(`myTickets:${ip}`, 5).allowed) {
    return { status: "error", message: lang === "en" ? "Too many attempts. Try again in a few minutes." : "Твърде много опити. Опитай след няколко минути." };
  }

  const db = getDb();
  const rows = await db
    .select({
      reference: orders.reference,
      name: orders.name,
      email: orders.email,
      totalCents: orders.totalCents,
      invoiceNumber: orders.invoiceNumber,
      lang: orders.lang,
      code: tickets.code,
      tierId: tickets.tierId,
    })
    .from(orders)
    .innerJoin(tickets, sql`${tickets.orderId} = ${orders.id}`)
    .where(sql`${orders.email} = ${email} and ${SOLD}`);

  const byOrder = new Map<string, typeof rows>();
  for (const r of rows) byOrder.set(r.reference, [...(byOrder.get(r.reference) ?? []), r]);

  for (const [, group] of byOrder) {
    const first = group[0];
    await sendTicketEmail({
      to: first.email,
      buyerName: first.name,
      reference: first.reference,
      totalCents: first.totalCents,
      invoiceNumber: first.invoiceNumber,
      lang: first.lang === "en" ? "en" : "bg",
      tickets: group.map((g) => ({ code: g.code, tierName: getTier(g.tierId)?.name ?? g.tierId })),
    });
  }
  // Nothing about how many orders were found leaves this function.
  void orderItems;
  return { status: "ok", message: same };
}
