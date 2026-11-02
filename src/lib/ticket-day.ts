import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { picksDay } from "@/lib/tickets";

/** Until the morning of the first day a one-day ticket may still change its day. */
export const DAY_CHANGE_UNTIL = new Date("2026-11-07T07:00:00+02:00");
export const dayChangeOpen = () => Date.now() < DAY_CHANGE_UNTIL.getTime();

export type ChangeDayResult =
  | { ok: true; droppedBookings: number }
  | { ok: false; reason: "not_found" | "used" | "not_pickable" | "closed" };

/**
 * Sets the day of a one-day (CORE) ticket: the first choice for a ticket that
 * has none, or a change of mind. The other day's arrival window and any
 * workshop booked on the other day go with it - they were promises about a day
 * the holder is no longer coming. The code, and so the QR, stays the same.
 */
export async function changeTicketDay(rawCode: string, day: 1 | 2): Promise<ChangeDayResult> {
  if (!dayChangeOpen()) return { ok: false, reason: "closed" };
  const code = rawCode.trim().toUpperCase();
  return getDb().transaction(async (tx) => {
    const [t] = await tx
      .select({ id: tickets.id, tierId: tickets.tierId, day: tickets.day, checkedInAt: tickets.checkedInAt })
      .from(tickets)
      .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
      .where(sql`${tickets.code} = ${code} and ${SOLD}`)
      .for("update", { of: tickets })
      .limit(1);
    if (!t) return { ok: false as const, reason: "not_found" as const };
    if (!picksDay(t.tierId)) return { ok: false as const, reason: "not_pickable" as const };
    if (t.checkedInAt) return { ok: false as const, reason: "used" as const };
    if (t.day === day) return { ok: true as const, droppedBookings: 0 };

    await tx
      .update(tickets)
      .set(day === 1 ? { day, arrivalSlot2: null } : { day, arrivalSlot1: null })
      .where(sql`${tickets.id} = ${t.id}`);
    const dropped = await tx.execute(
      sql`delete from workshop_bookings wb using workshops w
          where w.id = wb.workshop_id and wb.ticket_id = ${t.id} and w.day <> ${day}
          returning wb.id`,
    );
    return { ok: true as const, droppedBookings: dropped.length };
  });
}
