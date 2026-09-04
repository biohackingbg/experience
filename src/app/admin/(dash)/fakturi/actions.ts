"use server";

import { sql } from "drizzle-orm";

import { canAccess } from "@/lib/access";
import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import { sendTicketEmail } from "@/lib/email";

export type ResendState = { status: "idle" | "ok" | "error"; message?: string };

/**
 * Sends the ticket email again, optionally to a different address.
 *
 * For the case this exists to solve: someone cannot open their inbox, or gave
 * a typo'd address at checkout. The order is not modified - only the delivery
 * is repeated, so the record of what was sold stays exactly as it was.
 */
export async function resendTicketEmail(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  // Checked here, not only in the layout: a server action is its own entry
  // point and is reachable without ever rendering the page that offers it.
  if (!(await canAccess("fakturi"))) return { status: "error", message: "Няма достъп." };

  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const override = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!reference) return { status: "error", message: "Липсва номер на поръчка." };
  if (override && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(override)) {
    return { status: "error", message: "Невалиден имейл адрес." };
  }

  const db = getDb();

  const [order] = await db
    .select({
      reference: orders.reference,
      name: orders.name,
      email: orders.email,
      totalCents: orders.totalCents,
      invoiceNumber: orders.invoiceNumber,
    })
    .from(orders)
    .where(sql`${orders.reference} = ${reference} and ${orders.status} = 'paid'`)
    .limit(1);

  if (!order) return { status: "error", message: "Няма платена поръчка с този номер." };

  const rows = await db
    .select({ code: tickets.code, tierName: orderItems.tierName })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .innerJoin(
      orderItems,
      sql`${orderItems.orderId} = ${orders.id} and ${orderItems.tierId} = ${tickets.tierId}`,
    )
    .where(sql`${orders.reference} = ${reference}`);

  const to = override || order.email;

  const sent = await sendTicketEmail({
    to,
    buyerName: order.name,
    reference: order.reference,
    totalCents: order.totalCents,
    invoiceNumber: order.invoiceNumber,
    tickets: rows,
  });

  return sent
    ? { status: "ok", message: `Изпратено до ${to}.` }
    : { status: "error", message: "Изпращането не мина. Провери дневника." };
}
