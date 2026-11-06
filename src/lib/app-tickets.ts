import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { arrivalDaysFor } from "@/lib/arrivals";
import { latin } from "@/lib/latin";
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
  /** Arrival windows (lib/arrivals.ts): which days this ticket may pick for, and what it picked. */
  arrival: { days: (1 | 2)[]; chosen: Record<1 | 2, string | null> };
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
      arrivalSlot1: tickets.arrivalSlot1,
      arrivalSlot2: tickets.arrivalSlot2,
      reference: orders.reference,
      paidAt: orders.paidAt,
      buyerName: orders.name,
      holderEmail: tickets.attendeeEmail,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    // The buyer's own tickets, and any ticket given to this address by its
    // buyer. A ticket the buyer gave to another address is that person's
    // now and is left out: the app books on the first ticket of the best tier
    // it lists, and with two PEAK tickets its sort can land on the friend's
    // (6 Nov: a buyer's experiences went onto her friend's ticket).
    .where(sql`((${orders.email} = ${email} and (${tickets.attendeeEmail} is null or lower(${tickets.attendeeEmail}) = ${email})) or lower(${tickets.attendeeEmail}) = ${email}) and ${SOLD}`)
    // The person's own tickets first, then the buyer's unnamed ones, then the
    // ones given to someone else: the app books on the first ticket of the
    // best tier it finds, and that should be the person's own, not a
    // friend's who will book from their own phone.
    .orderBy(
      sql`case when lower(${tickets.attendeeEmail}) = ${email} then 0 when ${tickets.attendeeEmail} is null then 1 else 2 end`,
      sql`${orders.paidAt} desc nulls last, ${tickets.code}`,
    );

  // Among the buyer's own tickets with no address of their own, the one in
  // the buyer's name goes first. The app greets the person by the first
  // ticket's name and books on the first ticket of the best tier, so a ticket
  // named for a friend must not lead (6 Nov: a buyer saw "Здравей, Иво" and
  // her places went onto Ivo's ticket). Names compare by first name in Latin
  // letters, so "Aleksandra Pavlov" matches "Александра Павлова".
  const first = (n: string | null) => (n ? latin(n).trim().split(/\s+/)[0]?.toLowerCase() ?? "" : "");
  const rank = (r: (typeof rows)[number]) => {
    if (r.holderEmail && r.holderEmail.toLowerCase() === email) return 0;
    if (r.holderEmail) return 4;
    if (r.attendeeName && first(r.attendeeName) === first(r.buyerName)) return 1;
    return r.attendeeName ? 3 : 2;
  };
  const ordered = rows.map((r, i) => ({ r, i })).sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i).map((x) => x.r);

  return Promise.all(
    ordered.map(async (r) => ({
      code: r.code,
      tierId: r.tierId,
      tierName: getTier(r.tierId)?.name ?? r.tierId,
      day: r.day,
      attendeeName: r.attendeeName,
      checkedInAt: r.checkedInAt?.toISOString() ?? null,
      reference: r.reference,
      walletUrl: `/api/wallet/${encodeURIComponent(r.code)}`,
      places: await getTicketPlaces(r.code),
      arrival: { days: arrivalDaysFor(r.tierId, r.day), chosen: { 1: r.arrivalSlot1, 2: r.arrivalSlot2 } },
    })),
  );
}

/** True when this code is one of the address's own sold tickets. */
export async function ownsTicket(email: string, code: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ code: tickets.code })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and (${orders.email} = ${email} or lower(${tickets.attendeeEmail}) = ${email}) and ${SOLD}`)
    .limit(1);
  return !!row;
}
