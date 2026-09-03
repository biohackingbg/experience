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
 * Only tickets belonging to a paid order resolve - a ticket row cannot exist
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
 * admitted" from "already used" - the second is the case staff actually need
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

/** All tickets on an order - used by the confirmation email. */
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

export type DoorRecent = { code: string; name: string; tierName: string; at: Date };

/** Counters for the door screen, plus who came in last - across every device. */
export async function getDoorStats(): Promise<{
  total: number;
  checkedIn: number;
  /** Sofia's today: the event has two days and each morning starts at zero. */
  today: number;
  recent: DoorRecent[];
}> {
  const db = getDb();
  const [[row], recentRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        checkedIn: sql<number>`count(*) filter (where ${tickets.checkedInAt} is not null)::int`,
        today: sql<number>`count(*) filter (where (${tickets.checkedInAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date)::int`,
      })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      // A refunded or test order's tickets are not expected at the door.
      .where(sql`${orders.status} = 'paid' and not ${orders.isTest}`),
    db
      .select({
        code: tickets.code,
        tierId: tickets.tierId,
        attendeeName: tickets.attendeeName,
        buyerName: orders.name,
        at: tickets.checkedInAt,
      })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      .where(sql`${tickets.checkedInAt} is not null`)
      .orderBy(sql`${tickets.checkedInAt} desc`)
      .limit(12),
  ]);

  return {
    total: row?.total ?? 0,
    checkedIn: row?.checkedIn ?? 0,
    today: row?.today ?? 0,
    recent: recentRows.flatMap((r) =>
      r.at ? [{ code: r.code, name: r.attendeeName ?? r.buyerName, tierName: getTier(r.tierId)?.name ?? r.tierId, at: r.at }] : [],
    ),
  };
}

/**
 * The door's name lookup, for the person whose phone is dead. Matches the
 * buyer, the attendee, the email, the order number or the ticket code, and
 * only over paid orders - the same rule the scanner applies.
 */
export async function searchTickets(q: string): Promise<(TicketView & { email: string })[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const like = `%${term.replace(/[%_]/g, "")}%`;
  const rows = await getDb()
    .select({
      code: tickets.code,
      tierId: tickets.tierId,
      attendeeName: tickets.attendeeName,
      checkedInAt: tickets.checkedInAt,
      buyerName: orders.name,
      reference: orders.reference,
      email: orders.email,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(
      sql`${orders.status} = 'paid' and (
        ${orders.name} ilike ${like} or ${orders.email} ilike ${like}
        or ${orders.reference} ilike ${like} or ${tickets.code} ilike ${like}
        or coalesce(${tickets.attendeeName}, '') ilike ${like}
      )`,
    )
    .orderBy(orders.name, tickets.code)
    .limit(30);
  return rows.map((r) => ({ ...r, tierName: getTier(r.tierId)?.name ?? r.tierId }));
}
