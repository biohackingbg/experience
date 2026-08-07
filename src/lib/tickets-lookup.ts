import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import { getTier } from "@/lib/tickets";

export type TicketView = {
  code: string;
  tierId: string;
  tierName: string;
  attendeeName: string | null;
  buyerName: string;
  reference: string;
  checkedInAt: Date | null;
};

/**
 * Looks up a ticket by its code.
 *
 * Only tickets belonging to a paid order resolve — a ticket row cannot exist
 * without one, but checking the status here means a refunded order stops
 * admitting people without needing the rows deleted.
 */
export async function findTicket(code: string): Promise<TicketView | null> {
  const normalised = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalised)) return null;

  const db = getDb();
  const [row] = await db
    .select({
      code: tickets.code,
      tierId: tickets.tierId,
      attendeeName: tickets.attendeeName,
      checkedInAt: tickets.checkedInAt,
      buyerName: orders.name,
      reference: orders.reference,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${normalised} and ${orders.status} = 'paid'`)
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    tierName: getTier(row.tierId)?.name ?? row.tierId,
  };
}

/**
 * Marks a ticket as used at the door.
 *
 * Returns what happened rather than a boolean, so the scanner can tell "valid,
 * admitted" from "already used" — the second is the case staff actually need
 * to see, and it needs the original time to be useful.
 */
export type CheckInResult =
  | { status: "admitted"; ticket: TicketView }
  | { status: "already_used"; ticket: TicketView }
  | { status: "not_found" };

export async function checkInTicket(code: string): Promise<CheckInResult> {
  const ticket = await findTicket(code);
  if (!ticket) return { status: "not_found" };

  if (ticket.checkedInAt) {
    return { status: "already_used", ticket };
  }

  const db = getDb();
  const updated = await db
    .update(tickets)
    .set({ checkedInAt: new Date() })
    // Only claims a ticket that is still unused, so two scanners at the same
    // door cannot both report a first admission.
    .where(sql`${tickets.code} = ${ticket.code} and ${tickets.checkedInAt} is null`)
    .returning({ code: tickets.code });

  if (updated.length === 0) {
    const fresh = await findTicket(code);
    return { status: "already_used", ticket: fresh ?? ticket };
  }

  return { status: "admitted", ticket };
}

/** All tickets on an order — used by the confirmation email. */
export async function getTicketsForOrder(orderId: string) {
  const db = getDb();
  return db
    .select({
      code: tickets.code,
      tierId: tickets.tierId,
    })
    .from(tickets)
    .where(sql`${tickets.orderId} = ${orderId}`);
}

export { orderItems };
