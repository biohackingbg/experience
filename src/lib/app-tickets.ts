import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { getTier } from "@/lib/tickets";
import { type TicketPlaces, getTicketPlaces } from "@/lib/workshops";

/** A ticket as the app shows it: the code, what it admits, and what it has booked. */
export type AppTicket = {
  code: string;
  tierId: string;
  tierName: string;
  day: number | null;
  attendeeName: string | null;
  checkedInAt: string | null;
  reference: string;
  walletUrl: string;
  places: TicketPlaces | null;
};

/** Every sold ticket on an address, newest order first. */
export async function listTicketsForEmail(email: string): Promise<AppTicket[]> {
  const rows = await getDb()
    .select({
      code: tickets.code,
      tierId: tickets.tierId,
      day: tickets.day,
      attendeeName: tickets.attendeeName,
      checkedInAt: tickets.checkedInAt,
      reference: orders.reference,
      paidAt: orders.paidAt,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${orders.email} = ${email} and ${SOLD}`)
    .orderBy(sql`${orders.paidAt} desc nulls last, ${tickets.code}`);

  return Promise.all(
    rows.map(async (r) => ({
      code: r.code,
      tierId: r.tierId,
      tierName: getTier(r.tierId)?.name ?? r.tierId,
      day: r.day,
      attendeeName: r.attendeeName,
      checkedInAt: r.checkedInAt?.toISOString() ?? null,
      reference: r.reference,
      walletUrl: `/api/wallet/${encodeURIComponent(r.code)}`,
      places: await getTicketPlaces(r.code),
    })),
  );
}

/** True when this code is one of the address's own sold tickets. */
export async function ownsTicket(email: string, code: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ code: tickets.code })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${orders.email} = ${email} and ${SOLD}`)
    .limit(1);
  return !!row;
}
