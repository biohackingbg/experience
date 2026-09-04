import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, tickets, workshopBookings, workshops } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { getTier } from "@/lib/tickets";
import { type WorkshopKind, allowanceFor } from "@/lib/workshop-options";

/**
 * Workshops and experiences, and who has a place in them.
 *
 * Every rule is checked in one transaction behind a per-workshop advisory
 * lock: two people taking the last place at the same moment are serialised
 * rather than both let in. What a ticket may book comes from its tier - the
 * ticket cards promise it, so the code reads the promise from one table
 * (workshop-options.ts) instead of repeating it.
 */

export type Workshop = {
  id: string;
  kind: WorkshopKind;
  title: string;
  description: string | null;
  host: string | null;
  location: string | null;
  day: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  active: boolean;
  booked: number;
  left: number;
};

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

export async function listWorkshops(includeInactive = false): Promise<Workshop[]> {
  const rows = await getDb()
    .select({
      id: workshops.id,
      kind: workshops.kind,
      title: workshops.title,
      description: workshops.description,
      host: workshops.host,
      location: workshops.location,
      day: workshops.day,
      startsAt: workshops.startsAt,
      endsAt: workshops.endsAt,
      capacity: workshops.capacity,
      active: workshops.active,
      booked: sql<number>`(select count(*) from ${workshopBookings} b where b.workshop_id = ${workshops.id})::int`,
    })
    .from(workshops)
    .where(includeInactive ? sql`true` : eq(workshops.active, true))
    .orderBy(asc(workshops.day), asc(workshops.startsAt), asc(workshops.title));
  return rows.map((r) => ({
    ...r,
    kind: r.kind as WorkshopKind,
    left: Math.max(0, r.capacity - r.booked),
  }));
}

export type TicketBooking = { workshopId: string; bookedAt: Date };

/** What this ticket holds, and what it is still entitled to. */
export type TicketPlaces = {
  tierId: string;
  bookings: TicketBooking[];
  /** Per kind: how many more may be booked; null = as many as fit. */
  remaining: Record<WorkshopKind, number | null>;
};

export async function getTicketPlaces(code: string): Promise<TicketPlaces | null> {
  const db = getDb();
  const [t] = await db
    .select({ id: tickets.id, tierId: tickets.tierId })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return null;
  const rows = await db
    .select({ workshopId: workshopBookings.workshopId, kind: workshops.kind, bookedAt: workshopBookings.createdAt })
    .from(workshopBookings)
    .innerJoin(workshops, eq(workshops.id, workshopBookings.workshopId))
    .where(eq(workshopBookings.ticketId, t.id));
  const used = (kind: WorkshopKind) => rows.filter((r) => r.kind === kind).length;
  const left = (kind: WorkshopKind) => {
    const allowed = allowanceFor(t.tierId, kind);
    return allowed === null ? null : Math.max(0, allowed - used(kind));
  };
  return {
    tierId: t.tierId,
    bookings: rows.map((r) => ({ workshopId: r.workshopId, bookedAt: r.bookedAt })),
    remaining: { workshop: left("workshop"), experience: left("experience") },
  };
}

export type BookResult =
  | { ok: true }
  | { ok: false; reason: "no_ticket" | "not_found" | "not_allowed" | "full" | "clash" | "already" | "closed" };

export async function bookPlace(code: string, workshopId: string): Promise<BookResult> {
  const db = getDb();
  const [t] = await db
    .select({ id: tickets.id, tierId: tickets.tierId })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return { ok: false, reason: "no_ticket" };

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"workshop:" + workshopId}))`);
    const [w] = await tx.select().from(workshops).where(eq(workshops.id, workshopId)).limit(1);
    if (!w) return { ok: false as const, reason: "not_found" as const };
    if (!w.active) return { ok: false as const, reason: "closed" as const };

    const kind = w.kind as WorkshopKind;
    const mine = await tx
      .select({ id: workshopBookings.id, workshopId: workshopBookings.workshopId, kind: workshops.kind, day: workshops.day, startsAt: workshops.startsAt, endsAt: workshops.endsAt })
      .from(workshopBookings)
      .innerJoin(workshops, eq(workshops.id, workshopBookings.workshopId))
      .where(eq(workshopBookings.ticketId, t.id));

    if (mine.some((m) => m.workshopId === w.id)) return { ok: false as const, reason: "already" as const };

    const allowed = allowanceFor(t.tierId, kind);
    if (allowed === 0) return { ok: false as const, reason: "not_allowed" as const };
    if (allowed !== null && mine.filter((m) => m.kind === kind).length >= allowed) {
      return { ok: false as const, reason: "not_allowed" as const };
    }
    // Nobody can be in two rooms at once, whatever the tier allows.
    if (mine.some((m) => m.day === w.day && overlaps(m.startsAt, m.endsAt, w.startsAt, w.endsAt))) {
      return { ok: false as const, reason: "clash" as const };
    }

    const [c] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(workshopBookings)
      .where(eq(workshopBookings.workshopId, w.id));
    if ((c?.n ?? 0) >= w.capacity) return { ok: false as const, reason: "full" as const };

    await tx.insert(workshopBookings).values({ workshopId: w.id, ticketId: t.id });
    return { ok: true as const };
  });
}

export async function cancelPlace(code: string, workshopId: string): Promise<boolean> {
  const db = getDb();
  const [t] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.code, code)).limit(1);
  if (!t) return false;
  const rows = await db
    .delete(workshopBookings)
    .where(and(eq(workshopBookings.ticketId, t.id), eq(workshopBookings.workshopId, workshopId)))
    .returning({ id: workshopBookings.id });
  return rows.length > 0;
}

export type WorkshopAttendee = { name: string; code: string; tierName: string; email: string; checkedIn: boolean };

/** The list for the workshop's own door, alphabetical. */
export async function listWorkshopAttendees(workshopId: string): Promise<WorkshopAttendee[]> {
  const rows = await getDb()
    .select({
      code: tickets.code,
      tierId: tickets.tierId,
      attendeeName: tickets.attendeeName,
      buyerName: orders.name,
      email: orders.email,
      checkedInAt: workshopBookings.checkedInAt,
    })
    .from(workshopBookings)
    .innerJoin(tickets, eq(tickets.id, workshopBookings.ticketId))
    .innerJoin(orders, eq(orders.id, tickets.orderId))
    .where(eq(workshopBookings.workshopId, workshopId));
  return rows
    .map((r) => ({
      name: r.attendeeName ?? r.buyerName,
      code: r.code,
      tierName: getTier(r.tierId)?.name ?? r.tierId,
      email: r.email,
      checkedIn: !!r.checkedInAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "bg"));
}

export type WorkshopInput = {
  kind: WorkshopKind;
  title: string;
  description: string | null;
  host: string | null;
  location: string | null;
  day: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  active: boolean;
};

export async function addWorkshop(input: WorkshopInput): Promise<void> {
  await getDb().insert(workshops).values(input);
}

export async function updateWorkshop(id: string, input: WorkshopInput): Promise<void> {
  await getDb().update(workshops).set({ ...input, updatedAt: new Date() }).where(eq(workshops.id, id));
}

/** Only an empty one may be deleted; a booked one is switched off instead. */
export async function deleteWorkshop(id: string): Promise<boolean> {
  const db = getDb();
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(workshopBookings).where(eq(workshopBookings.workshopId, id));
  if ((c?.n ?? 0) > 0) return false;
  await db.delete(workshops).where(eq(workshops.id, id));
  return true;
}
