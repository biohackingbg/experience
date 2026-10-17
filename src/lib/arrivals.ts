import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { getSetting, setSetting } from "@/lib/settings";
import { SOLD } from "@/lib/sold";
import { picksDay } from "@/lib/tickets";

/**
 * Arrival windows: the web check-in.
 *
 * A thousand people at one door at 09:00 is a queue down the street. Every
 * ticket holder picks a window to arrive in, per day, and the door fills in
 * waves. The window is a promise about when to come, not a gate: a ticket
 * admits at any time, the window only spreads the morning.
 *
 * The plan - which windows, how many places each - is set from the
 * dashboard once the programme is final (docs/vhod-na-vulni.md), and the
 * whole feature stays invisible until it is switched on there. Capacity is
 * checked against the database inside a lock, so two people cannot take the
 * last place of a window at once. A window ending in "+" is open-ended.
 */

export type ArrivalPlan = {
  /** Off: nothing shows on tickets, in letters or in the app. */
  on: boolean;
  /** "09:00", "09:20", … "11:00+" - the last one may be open-ended. */
  slots: string[];
  /** Places per window, per day. */
  capacity: number;
};

export const DEFAULT_PLAN: ArrivalPlan = {
  on: false,
  slots: ["09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00+"],
  capacity: 120,
};

const SLOT_RE = /^([01]\d|2[0-3]):[0-5]\d\+?$/;
export const isSlotId = (v: string) => SLOT_RE.test(v);
export const isOpenSlot = (v: string) => v.endsWith("+");

/** "09:20" → "09:20 – 09:40"; "11:00+" → "след 11:00" / "after 11:00". */
export function slotLabel(plan: ArrivalPlan, slot: string, lang: "bg" | "en" = "bg"): string {
  if (isOpenSlot(slot)) return `${lang === "en" ? "after" : "след"} ${slot.slice(0, -1)}`;
  const i = plan.slots.indexOf(slot);
  const next = plan.slots[i + 1];
  return next ? `${slot} – ${next.replace("+", "")}` : slot;
}

export async function getArrivalPlan(): Promise<ArrivalPlan> {
  const raw = (await getSetting("arrival_plan"))?.value;
  if (!raw) return DEFAULT_PLAN;
  try {
    const v = JSON.parse(raw) as Partial<ArrivalPlan>;
    const slots = Array.isArray(v.slots) ? v.slots.map(String).filter(isSlotId) : DEFAULT_PLAN.slots;
    return {
      on: v.on === true,
      slots: slots.length ? slots : DEFAULT_PLAN.slots,
      capacity: Number.isInteger(v.capacity) && (v.capacity as number) > 0 ? (v.capacity as number) : DEFAULT_PLAN.capacity,
    };
  } catch {
    return DEFAULT_PLAN;
  }
}

export async function saveArrivalPlan(plan: ArrivalPlan): Promise<void> {
  await setSetting("arrival_plan", JSON.stringify(plan));
}

export type ArrivalDay = 1 | 2;

/** Which days this ticket may pick a window for: its own day, or both. */
export function arrivalDaysFor(tierId: string, day: number | null): ArrivalDay[] {
  if (picksDay(tierId) && (day === 1 || day === 2)) return [day];
  return [1, 2];
}

export type Arrival = Record<ArrivalDay, string | null>;

const col = (day: ArrivalDay) => (day === 1 ? tickets.arrivalSlot1 : tickets.arrivalSlot2);

/** Places taken per window on one day, for the picker and the door. */
export async function slotCounts(day: ArrivalDay): Promise<Record<string, number>> {
  const c = col(day);
  const rows = await getDb()
    .select({ slot: c, n: sql<number>`count(*)::int` })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${c} is not null and ${SOLD}`)
    .groupBy(c);
  const out: Record<string, number> = {};
  for (const r of rows) if (r.slot) out[r.slot] = r.n;
  return out;
}

export type ChooseResult = { ok: true } | { ok: false; reason: "off" | "not_found" | "used" | "wrong_day" | "bad_slot" | "full" };

/**
 * Picks (or changes) the window of one ticket for one day. Re-checked under
 * a lock per (day, window): the picker may have shown a free place that was
 * taken while the holder was deciding.
 */
export async function chooseArrival(rawCode: string, day: ArrivalDay, slot: string): Promise<ChooseResult> {
  const plan = await getArrivalPlan();
  if (!plan.on) return { ok: false, reason: "off" };
  if (!plan.slots.includes(slot)) return { ok: false, reason: "bad_slot" };
  const code = rawCode.trim().toUpperCase();
  const db = getDb();
  const [t] = await db
    .select({ tierId: tickets.tierId, day: tickets.day, checkedInAt: tickets.checkedInAt })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${tickets.code} = ${code} and ${SOLD}`)
    .limit(1);
  if (!t) return { ok: false, reason: "not_found" };
  if (t.checkedInAt) return { ok: false, reason: "used" };
  if (!arrivalDaysFor(t.tierId, t.day).includes(day)) return { ok: false, reason: "wrong_day" };

  const c = col(day);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`arrival:${day}:${slot}`}))`);
    if (!isOpenSlot(slot)) {
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(tickets)
        .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
        .where(sql`${c} = ${slot} and ${SOLD} and ${tickets.code} <> ${code}`);
      if (n >= plan.capacity) return { ok: false as const, reason: "full" as const };
    }
    await tx
      .update(tickets)
      .set(day === 1 ? { arrivalSlot1: slot } : { arrivalSlot2: slot })
      .where(sql`${tickets.code} = ${code}`);
    return { ok: true as const };
  });
}

/* ------------------------------------------------------------------ *
 * The door's view
 * ------------------------------------------------------------------ */

export type ArrivalStats = {
  days: { day: ArrivalDay; slots: { slot: string; n: number }[]; chosen: number; eligible: number }[];
  /** Unused tickets that could pick a window for at least one day and have not. */
  unchosen: number;
};

type Row = { code: string; tierId: string; day: number | null; s1: string | null; s2: string | null; paidAt: Date | null };

async function liveTickets(): Promise<Row[]> {
  return getDb()
    .select({ code: tickets.code, tierId: tickets.tierId, day: tickets.day, s1: tickets.arrivalSlot1, s2: tickets.arrivalSlot2, paidAt: orders.paidAt })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${SOLD} and ${tickets.checkedInAt} is null`)
    .orderBy(sql`${orders.paidAt} asc nulls last`);
}

const missing = (r: Row) => arrivalDaysFor(r.tierId, r.day).filter((d) => !(d === 1 ? r.s1 : r.s2));

export async function arrivalStats(plan: ArrivalPlan): Promise<ArrivalStats> {
  const rows = await liveTickets();
  const days = ([1, 2] as ArrivalDay[]).map((day) => {
    const eligible = rows.filter((r) => arrivalDaysFor(r.tierId, r.day).includes(day));
    const counts: Record<string, number> = {};
    let chosen = 0;
    for (const r of eligible) {
      const s = day === 1 ? r.s1 : r.s2;
      if (s) {
        counts[s] = (counts[s] ?? 0) + 1;
        chosen++;
      }
    }
    return { day, slots: plan.slots.map((slot) => ({ slot, n: counts[slot] ?? 0 })), chosen, eligible: eligible.length };
  });
  return { days, unchosen: rows.filter((r) => missing(r).length > 0).length };
}

/**
 * Gives a window to everyone who has not chosen one: earliest buyers get the
 * earliest free places, the open-ended window takes the rest. Run from the
 * dashboard the day before, after the reminder has had its chance.
 */
export async function assignRemaining(plan: ArrivalPlan): Promise<number> {
  if (!plan.on) return 0;
  const db = getDb();
  const rows = await liveTickets();
  let assigned = 0;
  for (const day of [1, 2] as ArrivalDay[]) {
    const counts = await slotCounts(day);
    const free = (slot: string) => (isOpenSlot(slot) ? Infinity : plan.capacity - (counts[slot] ?? 0));
    for (const r of rows) {
      if (!missing(r).includes(day)) continue;
      const slot = plan.slots.find((s) => free(s) > 0) ?? plan.slots[plan.slots.length - 1];
      await db
        .update(tickets)
        .set(day === 1 ? { arrivalSlot1: slot } : { arrivalSlot2: slot })
        .where(sql`${tickets.code} = ${r.code}`);
      counts[slot] = (counts[slot] ?? 0) + 1;
      assigned++;
    }
  }
  return assigned;
}

/** Orders with at least one unused ticket that still has no window - for the reminder letter. */
export async function ordersWithoutArrival(): Promise<{ reference: string; name: string; email: string; codes: string[] }[]> {
  const rows = await getDb()
    .select({ reference: orders.reference, name: orders.name, email: orders.email, code: tickets.code, tierId: tickets.tierId, day: tickets.day, s1: tickets.arrivalSlot1, s2: tickets.arrivalSlot2 })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${SOLD} and ${orders.totalCents} >= 0 and ${tickets.checkedInAt} is null`);
  const byRef = new Map<string, { reference: string; name: string; email: string; codes: string[] }>();
  for (const r of rows) {
    if (missing({ ...r, paidAt: null }).length === 0) continue;
    const o = byRef.get(r.reference) ?? { reference: r.reference, name: r.name, email: r.email, codes: [] };
    o.codes.push(r.code);
    byRef.set(r.reference, o);
  }
  return [...byRef.values()];
}
