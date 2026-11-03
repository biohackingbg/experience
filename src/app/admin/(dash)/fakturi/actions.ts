"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import { CREDIT_ERROR, issuePartialCreditNote } from "@/lib/credit-notes";
import { sendTicketEmail } from "@/lib/email";
import { setAttendeeName } from "@/lib/tickets-lookup";

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
  // Optional: send only the Nth ticket of the order (1, 2, ...) so each of several
  // recipients gets their own. Empty = every ticket, as before.
  const onlyRaw = String(formData.get("only") ?? "").trim();
  const only = onlyRaw ? Number.parseInt(onlyRaw, 10) : null;
  if (onlyRaw && (!Number.isInteger(only) || (only as number) < 1)) {
    return { status: "error", message: "Номерът на билета е 1, 2, 3…" };
  }

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
    .where(sql`${orders.reference} = ${reference}`)
    .orderBy(tickets.code);

  const chosen = only === null ? rows : rows.slice(only - 1, only);
  if (chosen.length === 0) {
    return { status: "error", message: `Поръчката има ${rows.length} ${rows.length === 1 ? "билет" : "билета"}.` };
  }

  const to = override || order.email;
  if (!to) return { status: "error", message: "Поръчката няма имейл - напиши друг имейл." };

  const sent = await sendTicketEmail({
    to,
    buyerName: order.name,
    reference: order.reference,
    totalCents: order.totalCents,
    invoiceNumber: order.invoiceNumber,
    tickets: chosen,
  });

  return sent
    ? { status: "ok", message: `Изпратено до ${to}.` }
    : { status: "error", message: "Изпращането не мина. Провери дневника." };
}

/**
 * One ticket to each person: the team types the recipients, one per line -
 * "email" or "email, Име Фамилия" - and line N gets the order's Nth ticket.
 * A name, when given, becomes the ticket holder's name too, so nobody has to
 * set it from the ticket page. Several lines may be sent at once; a bad line
 * stops the whole batch before anything goes out.
 */
export async function sendTicketsToPeople(_prev: ResendState, formData: FormData): Promise<ResendState> {
  if (!(await canAccess("fakturi"))) return { status: "error", message: "Няма достъп." };

  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  if (!reference) return { status: "error", message: "Липсва номер на поръчка." };

  const lines = String(formData.get("people") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { status: "error", message: "Напиши поне един имейл." };

  const people = lines.map((l) => {
    const [email, ...rest] = l.split(/[,;\t]/);
    return { email: email.trim().toLowerCase(), name: rest.join(" ").trim() };
  });
  const bad = people.find((p) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email));
  if (bad) return { status: "error", message: `Невалиден имейл: ${bad.email || "(празен ред)"}.` };

  const db = getDb();
  const [order] = await db
    .select({ reference: orders.reference, name: orders.name, totalCents: orders.totalCents, invoiceNumber: orders.invoiceNumber, lang: orders.lang })
    .from(orders)
    .where(sql`${orders.reference} = ${reference} and ${orders.status} = 'paid'`)
    .limit(1);
  if (!order) return { status: "error", message: "Няма платена поръчка с този номер. Първо натисни „Платена“." };

  const rows = await db
    .select({ code: tickets.code, tierName: orderItems.tierName })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .innerJoin(orderItems, sql`${orderItems.orderId} = ${orders.id} and ${orderItems.tierId} = ${tickets.tierId}`)
    .where(sql`${orders.reference} = ${reference}`)
    .orderBy(tickets.code);

  if (people.length > rows.length) {
    return { status: "error", message: `Поръчката има ${rows.length} ${rows.length === 1 ? "билет" : "билета"}, а си написала ${people.length} имейла.` };
  }

  let sent = 0;
  const failed: string[] = [];
  for (const [i, p] of people.entries()) {
    const ticket = rows[i];
    if (p.name) await setAttendeeName(ticket.code, p.name);
    const ok = await sendTicketEmail({
      to: p.email,
      buyerName: p.name || order.name,
      reference: order.reference,
      totalCents: order.totalCents,
      invoiceNumber: order.invoiceNumber,
      tickets: [ticket],
      lang: order.lang === "en" ? "en" : "bg",
    });
    if (ok) sent += 1;
    else failed.push(p.email);
  }

  return failed.length === 0
    ? { status: "ok", message: `Изпратени ${sent} от ${people.length}.` }
    : { status: "error", message: `Изпратени ${sent} от ${people.length}. Не минаха: ${failed.join(", ")}.` };
}

/**
 * Issues a credit note for some of the tickets of an order - the answer to a
 * partial refund. The refund itself is made in Stripe by hand; this only
 * writes the document, numbers it, and takes the seats back out of the sold
 * counts. Tickets named by code are cancelled in the same step.
 */
export async function issueCreditNote(_prev: ResendState, formData: FormData): Promise<ResendState> {
  if (!(await canAccess("fakturi"))) return { status: "error", message: "Няма достъп." };

  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const tierId = String(formData.get("tier") ?? "").trim();
  const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10);
  const ticketCodes = String(formData.get("codes") ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (!reference) return { status: "error", message: "Липсва номер на поръчка." };
  if (!Number.isInteger(quantity) || quantity < 1) return { status: "error", message: "Броят билети е 1, 2, 3…" };

  const r = await issuePartialCreditNote({ reference, tierId: tierId || undefined, quantity, ticketCodes });
  if (!r.ok) return { status: "error", message: CREDIT_ERROR[r.reason] };

  revalidatePath("/admin/fakturi");
  revalidatePath("/admin");
  const no = String(r.number).padStart(10, "0");
  return {
    status: "ok",
    message: `Издадено кредитно известие № ${no} за ${(r.totalCents / 100).toFixed(2)} €.${r.refundCovered ? "" : " Внимание: във Stripe още не е върнато толкова."}`,
  };
}
