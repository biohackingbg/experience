import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, tickets } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { ticketTierLabel } from "@/lib/tickets";

export type TicketView = {
  code: string;
  tierId: string;
  /** 1 = Saturday, 2 = Sunday; null on a ticket that admits both days. */
  day: number | null;
  tierName: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  buyerName: string;
  reference: string;
  checkedInAt: Date | null;
  lang: "bg" | "en";
  /** The arrival windows picked for each day (lib/arrivals.ts), or null. */
  arrivalSlot1: string | null;
  arrivalSlot2: string | null;
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
      day: tickets.day,
      attendeeName: tickets.attendeeName,
      attendeeEmail: tickets.attendeeEmail,
      checkedInAt: tickets.checkedInAt,
      arrivalSlot1: tickets.arrivalSlot1,
      arrivalSlot2: tickets.arrivalSlot2,
      buyerName: orders.name,
      reference: orders.reference,
      lang: orders.lang,
      totalCents: orders.totalCents,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${normalised} and ${SOLD}`)
    .limit(1);

  if (!row) return null;

  const { totalCents, ...rest } = row;
  const lang = row.lang === "en" ? "en" : "bg";
  return { ...rest, lang, tierName: ticketTierLabel(row.tierId, totalCents, lang, row.day) };
}

/**
 * Marks a ticket as used at the door.
 *
 * Returns what happened rather than a boolean, so the scanner can tell "valid,
 * admitted" from "already used" - the second is the case staff actually need
 * to see, and it needs the original time to be useful.
 */
export type CheckInResult =
  | { status: "admitted"; ticket: TicketView; /** First entry on an earlier day, for a two-day ticket. */ before?: Date }
  | { status: "already_used"; ticket: TicketView }
  /** A one-day ticket shown on the other day. Not marked. */
  | { status: "wrong_day"; ticket: TicketView }
  | { status: "not_found" };

/** 1 on Saturday 07.11, 2 on Sunday 08.11, null on any other date (tests, the days before). */
function summitDay(d: Date = new Date()): number | null {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(d);
  return s === "2026-11-07" ? 1 : s === "2026-11-08" ? 2 : null;
}

export async function checkInTicket(code: string): Promise<CheckInResult> {
  const ticket = await findTicket(code);
  if (!ticket) return { status: "not_found" };

  const today = summitDay();
  if (ticket.day && today && ticket.day !== today) return { status: "wrong_day", ticket };

  if (ticket.checkedInAt) {
    // A two-day ticket used yesterday is a new entry today: the time moves to
    // now, so a second scan today is caught again and "today" counts it.
    // (Saturday's entries were copied to ticket_checkins_sat before this.)
    const before = ticket.checkedInAt;
    const sameDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(before) === new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
    if (sameDay || !today) return { status: "already_used", ticket };
    const moved = await getDb()
      .update(tickets)
      .set({ checkedInAt: new Date() })
      .where(sql`${tickets.code} = ${ticket.code} and ${tickets.checkedInAt} = ${before}`)
      .returning({ code: tickets.code });
    if (moved.length === 0) {
      const fresh = await findTicket(code);
      return { status: "already_used", ticket: fresh ?? ticket };
    }
    return { status: "admitted", ticket, before };
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

/**
 * The name on a ticket, written by the buyer from the ticket page - so a
 * ticket bought for someone else carries that person's name at the door
 * and on the badge. Locked once the ticket has been used: after that the
 * name is a record, not a setting.
 */
/**
 * Who uses the ticket: a name, and an address when it is someone other than
 * the buyer. Returns what the address was before, so the caller writes to the
 * holder only when it is new.
 */
export async function setAttendee(
  code: string,
  name: string,
  email: string | null,
): Promise<{ r: "ok"; before: string | null; buyerName: string; buyerEmail: string; tierId: string; lang: string } | { r: "not_found" } | { r: "used" }> {
  const [t] = await getDb()
    .select({ code: tickets.code, checkedInAt: tickets.checkedInAt, before: tickets.attendeeEmail, tierId: tickets.tierId, buyerName: orders.name, buyerEmail: orders.email, lang: orders.lang })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return { r: "not_found" };
  if (t.checkedInAt) return { r: "used" };
  // The buyer's own address on their own ticket says nothing new: kept empty.
  const holder = email && email.toLowerCase() !== t.buyerEmail.toLowerCase() ? email.toLowerCase() : null;
  await getDb()
    .update(tickets)
    .set({ attendeeName: name.trim().replace(/\s+/g, " ").slice(0, 80) || null, attendeeEmail: holder })
    .where(sql`${tickets.code} = ${t.code}`);
  return { r: "ok", before: t.before, buyerName: t.buyerName, buyerEmail: t.buyerEmail, tierId: t.tierId, lang: t.lang };
}

export async function setAttendeeName(code: string, name: string): Promise<"ok" | "not_found" | "used"> {
  const ticket = await findTicket(code);
  if (!ticket) return "not_found";
  if (ticket.checkedInAt) return "used";
  await getDb()
    .update(tickets)
    .set({ attendeeName: name.trim().replace(/\s+/g, " ").slice(0, 80) || null })
    .where(sql`${tickets.code} = ${ticket.code}`);
  return "ok";
}

export type AttendeeRow = {
  code: string;
  /** The attendee's name if given, else the buyer's. */
  name: string;
  /** Whether that name was written for this ticket, or is the buyer's by default. */
  named: boolean;
  /** 1 = Saturday, 2 = Sunday; null admits both. */
  day: number | null;
  tierName: string;
  reference: string;
  buyerName: string;
  email: string;
  /** The holder's own address, when the buyer gave the ticket to someone else. */
  holderEmail: string | null;
  company: string | null;
  checkedInAt: Date | null;
};

/** Every expected person, alphabetically - the badge list. */
export async function listAttendees(): Promise<AttendeeRow[]> {
  const rows = await getDb()
    .select({
      code: tickets.code,
      tierId: tickets.tierId,
      day: tickets.day,
      attendeeName: tickets.attendeeName,
      checkedInAt: tickets.checkedInAt,
      buyerName: orders.name,
      reference: orders.reference,
      email: orders.email,
      holderEmail: tickets.attendeeEmail,
      company: orders.invoiceCompany,
      totalCents: orders.totalCents,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(SOLD);
  return rows
    .map((r) => ({
      code: r.code,
      name: r.attendeeName ?? r.buyerName,
      named: !!r.attendeeName,
      day: r.day,
      tierName: ticketTierLabel(r.tierId, r.totalCents, "bg", r.day),
      reference: r.reference,
      buyerName: r.buyerName,
      email: r.email,
      holderEmail: r.holderEmail,
      company: r.company,
      checkedInAt: r.checkedInAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "bg") || a.code.localeCompare(b.code));
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
  /** Expected on each day: a one-day ticket names one, the rest admit both. */
  saturday: number;
  sunday: number;
  /** Per tier: in today, and expected today (a one-day ticket for another day is left out). */
  byTier: { tierId: string; today: number; expected: number }[];
  recent: DoorRecent[];
}> {
  const db = getDb();
  const [[row], recentRows, tierRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        checkedIn: sql<number>`count(*) filter (where ${tickets.checkedInAt} is not null)::int`,
        today: sql<number>`count(*) filter (where (${tickets.checkedInAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date)::int`,
        saturday: sql<number>`count(*) filter (where ${tickets.day} is null or ${tickets.day} = 1)::int`,
        sunday: sql<number>`count(*) filter (where ${tickets.day} is null or ${tickets.day} = 2)::int`,
      })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      // A refunded or test order's tickets are not expected at the door.
      .where(SOLD),
    db
      .select({
        code: tickets.code,
        tierId: tickets.tierId,
        attendeeName: tickets.attendeeName,
        buyerName: orders.name,
        totalCents: orders.totalCents,
        day: tickets.day,
        at: tickets.checkedInAt,
      })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      .where(sql`${tickets.checkedInAt} is not null`)
      .orderBy(sql`${tickets.checkedInAt} desc`)
      .limit(12),
    db
      .select({
        tierId: tickets.tierId,
        today: sql<number>`count(*) filter (where (${tickets.checkedInAt} at time zone 'Europe/Sofia')::date = (now() at time zone 'Europe/Sofia')::date)::int`,
        expected: sql<number>`count(*) filter (where ${tickets.day} is null or ${tickets.day} = case when (now() at time zone 'Europe/Sofia')::date = date '2026-11-08' then 2 else 1 end)::int`,
      })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      .where(SOLD)
      .groupBy(tickets.tierId),
  ]);
  const tierOrder = ["peak", "plus", "core"];

  return {
    total: row?.total ?? 0,
    checkedIn: row?.checkedIn ?? 0,
    today: row?.today ?? 0,
    saturday: row?.saturday ?? 0,
    sunday: row?.sunday ?? 0,
    byTier: tierRows.sort((x, y) => tierOrder.indexOf(x.tierId) - tierOrder.indexOf(y.tierId)),
    recent: recentRows.flatMap((r) =>
      r.at ? [{ code: r.code, name: r.attendeeName ?? r.buyerName, tierName: ticketTierLabel(r.tierId, r.totalCents, "bg", r.day), at: r.at }] : [],
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
      day: tickets.day,
      attendeeName: tickets.attendeeName,
      attendeeEmail: tickets.attendeeEmail,
      checkedInAt: tickets.checkedInAt,
      arrivalSlot1: tickets.arrivalSlot1,
      arrivalSlot2: tickets.arrivalSlot2,
      buyerName: orders.name,
      reference: orders.reference,
      email: orders.email,
      lang: orders.lang,
      totalCents: orders.totalCents,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(
      sql`${SOLD} and (
        ${orders.name} ilike ${like} or ${orders.email} ilike ${like}
        or ${orders.reference} ilike ${like} or ${tickets.code} ilike ${like}
        or coalesce(${tickets.attendeeName}, '') ilike ${like}
      )`,
    )
    .orderBy(orders.name, tickets.code)
    .limit(30);
  return rows.map(({ totalCents, ...r }) => {
    const lang = r.lang === "en" ? ("en" as const) : ("bg" as const);
    return { ...r, lang, tierName: ticketTierLabel(r.tierId, totalCents, lang, r.day) };
  });
}

export type ClaimResult = "ok" | "not_found" | "used" | "taken";

/**
 * A person takes a ticket they were given, by its number, under their own
 * name and the address they just proved. A ticket already given to someone
 * else stays theirs: only the buyer, from the ticket page, can move it.
 */
export async function claimTicket(rawCode: string, name: string, email: string): Promise<ClaimResult> {
  const code = rawCode.trim().toUpperCase();
  const [t] = await getDb()
    .select({ code: tickets.code, checkedInAt: tickets.checkedInAt, holder: tickets.attendeeEmail, buyerEmail: orders.email })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return "not_found";
  if (t.checkedInAt) return "used";
  const me = email.toLowerCase();
  if (t.holder && t.holder.toLowerCase() !== me) return "taken";
  await getDb()
    .update(tickets)
    .set({
      attendeeName: name.trim().replace(/\s+/g, " ").slice(0, 80) || null,
      // The buyer naming themselves keeps the address empty: the order already has it.
      attendeeEmail: me === t.buyerEmail.toLowerCase() ? null : me,
    })
    .where(sql`${tickets.code} = ${t.code}`);
  return "ok";
}

/**
 * The goody bag table: one bag per ticket, marked when it is handed over, so
 * the same ticket shown twice (or at the other end of the table) is caught.
 * Any sold ticket counts - the table decides by the tier on the screen.
 */
export type GoodyResult =
  | { status: "given"; ticket: TicketView; at: Date }
  | { status: "already"; ticket: TicketView; at: Date }
  | { status: "not_found" };

export async function giveGoodyBag(code: string): Promise<GoodyResult> {
  const ticket = await findTicket(code);
  if (!ticket) return { status: "not_found" };
  const db = getDb();
  const now = new Date();
  const updated = await db
    .update(tickets)
    .set({ goodyBagAt: now })
    .where(sql`${tickets.code} = ${ticket.code} and ${tickets.goodyBagAt} is null`)
    .returning({ code: tickets.code });
  if (updated.length > 0) return { status: "given", ticket, at: now };
  const [row] = await db.select({ at: tickets.goodyBagAt }).from(tickets).where(sql`${tickets.code} = ${ticket.code}`).limit(1);
  return { status: "already", ticket, at: row?.at ?? now };
}

/** The tap on the wrong ticket: the bag goes back to not handed over. */
export async function undoGoodyBag(code: string): Promise<void> {
  const normalised = code.trim().toUpperCase();
  await getDb().update(tickets).set({ goodyBagAt: null }).where(sql`${tickets.code} = ${normalised}`);
}

/** Handed over so far, of all sold tickets, by tier. */
export async function goodyBagCounts(): Promise<{ given: number; total: number; byTier: { tierId: string; given: number; total: number }[] }> {
  const rows = await getDb()
    .select({
      tierId: tickets.tierId,
      given: sql<number>`count(${tickets.goodyBagAt})::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(SOLD)
    .groupBy(tickets.tierId);
  const order = ["peak", "plus", "core"];
  const byTier = rows.sort((a, b) => order.indexOf(a.tierId) - order.indexOf(b.tierId));
  return { given: rows.reduce((n, r) => n + r.given, 0), total: rows.reduce((n, r) => n + r.total, 0), byTier };
}

export type PersonMatch = { code: string; name: string; tierName: string };

/**
 * A person at a stand who has no code at hand: found by phone (any 6+ digits
 * of it, so "+359 88..." and "088..." both match) or by name (holder, else
 * buyer). Valid tickets only; a handful at most, for the stand to pick from.
 */
export async function findTicketsByPerson(query: string): Promise<PersonMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const digits = q.replace(/\D/g, "");
  const phone = digits.length >= 6 && digits.length >= q.replace(/\s/g, "").length - 2;
  const tail = digits.replace(/^(00359|359|0)/, "");
  const rows = await getDb()
    .select({
      code: tickets.code,
      tierId: tickets.tierId,
      day: tickets.day,
      attendeeName: tickets.attendeeName,
      buyerName: orders.name,
      totalCents: orders.totalCents,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(
      phone
        ? sql`${SOLD} and regexp_replace(coalesce(${orders.phone}, ''), '[^0-9]', '', 'g') like ${"%" + tail + "%"}`
        : sql`${SOLD} and coalesce(nullif(${tickets.attendeeName}, ''), ${orders.name}) ilike ${"%" + q.replace(/[%_]/g, "") + "%"}`,
    )
    .orderBy(sql`coalesce(nullif(${tickets.attendeeName}, ''), ${orders.name})`)
    .limit(8);
  return rows.map((r) => ({
    code: r.code,
    name: r.attendeeName || r.buyerName,
    tierName: ticketTierLabel(r.tierId, r.totalCents, "bg", r.day),
  }));
}
