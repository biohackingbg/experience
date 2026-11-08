import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, tickets, workshopBookings, workshops } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { getTier } from "@/lib/tickets";
import { type WorkshopKind, allowanceForTicket, standOpensAt } from "@/lib/workshop-options";

/**
 * Workshops and experiences, and who has a place in them.
 *
 * Every rule is checked in one transaction behind two advisory locks, the
 * ticket's and the workshop's: two people taking the last place at the same
 * moment are serialised rather than both let in, and so are two taps of the
 * same ticket on two sessions. What a ticket may book comes from its tier - the
 * ticket cards promise it, so the code reads the promise from one table
 * (workshop-options.ts) instead of repeating it.
 */

/**
 * Booking opens on the Friday morning before the summit (08:30, the day
 * before it starts), so the places go to people who are coming,
 * not to whoever got in first on the day the tickets were bought. Cancelling
 * is never closed, and a place booked before this stays booked.
 */
export const BOOKING_OPENS_AT = new Date("2026-11-06T08:30:00+02:00");
export const bookingOpen = () => Date.now() >= BOOKING_OPENS_AT.getTime();

/** When it opens, in words, in Sofia time: "6 ноември в 08:30". */
export function bookingOpensLabel(lang: "bg" | "en"): string {
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "bg-BG", { timeZone: "Europe/Sofia", ...o }).format(BOOKING_OPENS_AT);
  const date = fmt({ day: "numeric", month: "long" });
  const time = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
  return lang === "en" ? `${date} at ${time}` : `${date} в ${time}`;
}

export type Workshop = {
  id: string;
  kind: WorkshopKind;
  title: string;
  description: string | null;
  titleEn: string | null;
  descriptionEn: string | null;
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

// Correlated subqueries are written with the outer table spelled out:
// in a SELECT field Drizzle renders a column reference unqualified, and a
// bare "id" inside the subquery binds to the subquery's own table, which
// silently matches nothing. In a WHERE clause it qualifies, so those are
// left as they are.
export async function listWorkshops(includeInactive = false): Promise<Workshop[]> {
  const rows = await getDb()
    .select({
      id: workshops.id,
      kind: workshops.kind,
      title: workshops.title,
      description: workshops.description,
      titleEn: workshops.titleEn,
      descriptionEn: workshops.descriptionEn,
      host: workshops.host,
      location: workshops.location,
      day: workshops.day,
      startsAt: workshops.startsAt,
      endsAt: workshops.endsAt,
      capacity: workshops.capacity,
      active: workshops.active,
      // See the note above listWorkshops: the outer column is spelled out.
      booked: sql<number>`(select count(*) from workshop_bookings b where b.workshop_id = workshops.id)::int`,
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
    const allowed = allowanceForTicket(code, t.tierId, kind);
    return allowed === null ? null : Math.max(0, allowed - used(kind));
  };
  return {
    tierId: t.tierId,
    bookings: rows.map((r) => ({ workshopId: r.workshopId, bookedAt: r.bookedAt })),
    remaining: { workshop: left("workshop"), experience: left("experience"), bonus: null },
  };
}

/**
 * When this ticket has used up its allowance of the session's kind (PEAK with
 * 3 of 3 experiences, PLUS with its 1 workshop): the kind and how many the
 * tier allows. Null when there is room left, no limit, or none at all (CORE).
 */
export async function allowanceUsedUp(code: string, workshopId: string): Promise<{ kind: WorkshopKind; allowed: number; tierId: string } | null> {
  const [w] = await getDb().select({ kind: workshops.kind }).from(workshops).where(eq(workshops.id, workshopId)).limit(1);
  const places = w ? await getTicketPlaces(code) : null;
  if (!w || !places) return null;
  const kind = w.kind as WorkshopKind;
  const allowed = allowanceForTicket(code, places.tierId, kind);
  return allowed && places.remaining[kind] === 0 ? { kind, allowed, tierId: places.tierId } : null;
}

export type BookResult =
  | { ok: true }
  | { ok: false; reason: "no_ticket" | "not_found" | "not_allowed" | "full" | "clash" | "already" | "closed" | "not_open" | "stand_not_open" };

export async function bookPlace(code: string, workshopId: string): Promise<BookResult> {
  if (!bookingOpen()) return { ok: false, reason: "not_open" };
  const db = getDb();
  const [t] = await db
    .select({ id: tickets.id, tierId: tickets.tierId })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return { ok: false, reason: "no_ticket" };

  return db.transaction(async (tx) => {
    // Two locks, always in this order: the ticket first, so the same person
    // tapping two sessions at once is served one after the other (otherwise
    // both see "nothing booked yet" and a PLUS ends up with two); then the
    // room, so two people taking its last place are served in turn.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"ticket:" + t.id}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"workshop:" + workshopId}))`);
    const [w] = await tx.select().from(workshops).where(eq(workshops.id, workshopId)).limit(1);
    if (!w) return { ok: false as const, reason: "not_found" as const };
    if (!w.active) return { ok: false as const, reason: "closed" as const };
    const opens = standOpensAt(w.location, w.day);
    if (opens && Date.now() < opens.getTime()) return { ok: false as const, reason: "stand_not_open" as const };

    const kind = w.kind as WorkshopKind;
    const mine = await tx
      .select({ id: workshopBookings.id, workshopId: workshopBookings.workshopId, kind: workshops.kind, day: workshops.day, startsAt: workshops.startsAt, endsAt: workshops.endsAt })
      .from(workshopBookings)
      .innerJoin(workshops, eq(workshops.id, workshopBookings.workshopId))
      .where(eq(workshopBookings.ticketId, t.id));

    if (mine.some((m) => m.workshopId === w.id)) return { ok: false as const, reason: "already" as const };

    const allowed = allowanceForTicket(code, t.tierId, kind);
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

export type WorkshopAttendee = { name: string; code: string; tierName: string; email: string; checkedIn: boolean; checkedInAt: Date | null };

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
      checkedInAt: r.checkedInAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "bg"));
}

// ── The room's own door ───────────────────────────────────────────────────

export type RoomScan =
  /** Booked here and not yet in: marked as arrived. */
  | { status: "ok"; name: string; tierName: string; code: string }
  /** Booked here, already marked. */
  | { status: "already"; name: string; tierName: string; code: string; at: Date }
  /** A real ticket, but no place in this session. Says where they are booked at this hour instead. */
  | { status: "not_booked"; name: string; tierName: string; code: string; elsewhere: string | null; left: number }
  | { status: "no_ticket"; code: string };

/**
 * Scan at the room's door: marks the booking as used, or says why not. A
 * ticket with no place here is told apart from a bad code, because the
 * answer at the door differs: "you are booked in the other room" versus
 * "this is not a ticket".
 */
export async function checkInBooking(workshopId: string, rawCode: string): Promise<RoomScan> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return { status: "no_ticket", code };
  const db = getDb();
  const [t] = await db
    .select({ id: tickets.id, tierId: tickets.tierId, attendeeName: tickets.attendeeName, buyerName: orders.name })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return { status: "no_ticket", code };
  const who = { name: t.attendeeName ?? t.buyerName, tierName: getTier(t.tierId)?.name ?? t.tierId, code };

  const [b] = await db
    .select({ id: workshopBookings.id, checkedInAt: workshopBookings.checkedInAt })
    .from(workshopBookings)
    .where(and(eq(workshopBookings.workshopId, workshopId), eq(workshopBookings.ticketId, t.id)))
    .limit(1);
  if (!b) {
    const [w] = await db.select().from(workshops).where(eq(workshops.id, workshopId)).limit(1);
    if (!w) return { status: "no_ticket", code };
    const others = await db
      .select({ title: workshops.title, startsAt: workshops.startsAt, endsAt: workshops.endsAt, day: workshops.day })
      .from(workshopBookings)
      .innerJoin(workshops, eq(workshops.id, workshopBookings.workshopId))
      .where(eq(workshopBookings.ticketId, t.id));
    const clash = others.find((o) => o.day === w.day && overlaps(o.startsAt, o.endsAt, w.startsAt, w.endsAt));
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(workshopBookings).where(eq(workshopBookings.workshopId, w.id));
    return { ...who, status: "not_booked", elsewhere: clash ? `${clash.title} (${clash.startsAt})` : null, left: Math.max(0, w.capacity - (c?.n ?? 0)) };
  }
  if (b.checkedInAt) return { ...who, status: "already", at: b.checkedInAt };
  const updated = await db
    .update(workshopBookings)
    .set({ checkedInAt: new Date() })
    .where(and(eq(workshopBookings.id, b.id), sql`${workshopBookings.checkedInAt} is null`))
    .returning({ at: workshopBookings.checkedInAt });
  if (updated.length === 0) return { ...who, status: "already", at: new Date() };
  return { ...who, status: "ok" };
}

/** Un-marks an arrival: for the tap that landed on the wrong name. */
export async function undoRoomCheckIn(workshopId: string, code: string): Promise<void> {
  const db = getDb();
  const [t] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.code, code.trim().toUpperCase())).limit(1);
  if (!t) return;
  await db
    .update(workshopBookings)
    .set({ checkedInAt: null })
    .where(and(eq(workshopBookings.workshopId, workshopId), eq(workshopBookings.ticketId, t.id)));
}

/**
 * Lets in someone who has no place here but the room has one. The team's
 * call at the door, so the tier's allowance is not asked - only the room's
 * capacity and the clock (not two rooms at once). Books and marks in one go.
 */
export async function admitWalkIn(workshopId: string, rawCode: string, arrivedNow = true): Promise<RoomScan | { status: "full" } | { status: "clash" }> {
  const code = rawCode.trim().toUpperCase();
  const db = getDb();
  const [t] = await db
    .select({ id: tickets.id, tierId: tickets.tierId, attendeeName: tickets.attendeeName, buyerName: orders.name })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return { status: "no_ticket", code };
  const who = { name: t.attendeeName ?? t.buyerName, tierName: getTier(t.tierId)?.name ?? t.tierId, code };
  const r = await db.transaction(async (tx) => {
    // Two locks, always in this order: the ticket first, so the same person
    // tapping two sessions at once is served one after the other (otherwise
    // both see "nothing booked yet" and a PLUS ends up with two); then the
    // room, so two people taking its last place are served in turn.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"ticket:" + t.id}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"workshop:" + workshopId}))`);
    const [w] = await tx.select().from(workshops).where(eq(workshops.id, workshopId)).limit(1);
    if (!w) return { status: "no_ticket" as const, code };
    const mine = await tx
      .select({ workshopId: workshopBookings.workshopId, day: workshops.day, startsAt: workshops.startsAt, endsAt: workshops.endsAt })
      .from(workshopBookings)
      .innerJoin(workshops, eq(workshops.id, workshopBookings.workshopId))
      .where(eq(workshopBookings.ticketId, t.id));
    // Already has a place here: marked below, after the transaction - the
    // pool has one connection, so a query from outside it would wait forever.
    if (mine.some((m) => m.workshopId === w.id)) return { status: "booked_here" as const };
    if (mine.some((m) => m.day === w.day && overlaps(m.startsAt, m.endsAt, w.startsAt, w.endsAt))) return { status: "clash" as const };
    const [c] = await tx.select({ n: sql<number>`count(*)::int` }).from(workshopBookings).where(eq(workshopBookings.workshopId, w.id));
    if ((c?.n ?? 0) >= w.capacity) return { status: "full" as const };
    // A slot later in the day is booked, not yet marked as arrived.
    await tx.insert(workshopBookings).values({ workshopId: w.id, ticketId: t.id, checkedInAt: arrivedNow ? new Date() : null });
    return { ...who, status: "ok" as const };
  });
  if (r.status === "booked_here") return arrivedNow ? checkInBooking(workshopId, code) : { ...who, status: "already" as const, at: new Date() };
  return r;
}

export type WorkshopInput = {
  kind: WorkshopKind;
  title: string;
  description: string | null;
  titleEn: string | null;
  descriptionEn: string | null;
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

/** What a ticket has booked, one line each, for the door's second-scan card: "Сб 14:00-15:00 Title, Newton". */
export async function ticketBookingLines(code: string): Promise<string[]> {
  const rows = await getDb()
    .select({ title: workshops.title, day: workshops.day, startsAt: workshops.startsAt, endsAt: workshops.endsAt, location: workshops.location })
    .from(workshopBookings)
    .innerJoin(workshops, eq(workshops.id, workshopBookings.workshopId))
    .innerJoin(tickets, eq(tickets.id, workshopBookings.ticketId))
    .where(eq(tickets.code, code.trim().toUpperCase()))
    .orderBy(asc(workshops.day), asc(workshops.startsAt));
  return rows.map((r) => {
    const when = r.startsAt ? `${r.day === 2 ? "Нд" : "Сб"} ${r.startsAt}-${r.endsAt} ` : "";
    const where = r.location && r.location.length <= 20 ? `, ${r.location}` : "";
    return `${when}${r.title}${where}`;
  });
}

/**
 * A scan at a partner stand (a slot every 15-20 minutes): the stand does not
 * pick the slot first, the ticket says which of its slots it holds here -
 * today's first, the one running or next - and that booking is marked.
 */
export async function checkInAtStand(location: string, rawCode: string, title?: string): Promise<RoomScan & { slot?: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return { status: "no_ticket", code };
  const db = getDb();
  const [t] = await db
    .select({ id: tickets.id, tierId: tickets.tierId, attendeeName: tickets.attendeeName, buyerName: orders.name })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return { status: "no_ticket", code };
  const mine = await db
    .select({ id: workshops.id, title: workshops.title, day: workshops.day, startsAt: workshops.startsAt, endsAt: workshops.endsAt })
    .from(workshopBookings)
    .innerJoin(workshops, eq(workshops.id, workshopBookings.workshopId))
    .where(and(eq(workshopBookings.ticketId, t.id), eq(workshops.location, location), title ? eq(workshops.title, title) : undefined))
    .orderBy(asc(workshops.day), asc(workshops.startsAt));
  if (mine.length === 0) {
    return { status: "not_booked", name: t.attendeeName ?? t.buyerName, tierName: getTier(t.tierId)?.name ?? t.tierId, code, elsewhere: null, left: 0 };
  }
  const sofia = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date(Date.now()));
  const today = sofia === "2026-11-08" ? 2 : 1;
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(Date.now()));
  const pick = mine.find((m) => m.day === today && m.endsAt > now) ?? mine.find((m) => m.day === today) ?? mine[0];
  const r = await checkInBooking(pick.id, code);
  const slot = `${pick.title}, ${pick.day === 2 ? "неделя" : "събота"} ${pick.startsAt}-${pick.endsAt}${mine.length > 1 ? ` (има ${mine.length} часа тук)` : ""}`;
  return { ...r, slot };
}
