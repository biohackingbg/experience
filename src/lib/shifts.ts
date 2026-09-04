import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { shifts } from "@/lib/db/schema";

export type Shift = {
  id: string;
  day: number;
  zone: string;
  startsAt: string;
  endsAt: string;
  person: string;
  phone: string | null;
  note: string | null;
};

export type ShiftInput = Omit<Shift, "id">;

export async function listShifts(): Promise<Shift[]> {
  return getDb()
    .select({
      id: shifts.id,
      day: shifts.day,
      zone: shifts.zone,
      startsAt: shifts.startsAt,
      endsAt: shifts.endsAt,
      person: shifts.person,
      phone: shifts.phone,
      note: shifts.note,
    })
    .from(shifts)
    .orderBy(asc(shifts.day), asc(shifts.zone), asc(shifts.startsAt), asc(shifts.person));
}

export async function addShift(input: ShiftInput): Promise<void> {
  await getDb().insert(shifts).values(input);
}

export async function updateShift(id: string, input: ShiftInput): Promise<void> {
  await getDb().update(shifts).set(input).where(eq(shifts.id, id));
}

export async function deleteShift(id: string): Promise<void> {
  await getDb().delete(shifts).where(eq(shifts.id, id));
}

/** Saturday's rota copied onto Sunday, for a team that works both days the same way. */
export async function copyDay(from: number, to: number): Promise<number> {
  const db = getDb();
  const rows = await db.select().from(shifts).where(eq(shifts.day, from));
  if (rows.length === 0) return 0;
  await db.delete(shifts).where(and(eq(shifts.day, to)));
  await db.insert(shifts).values(rows.map(({ id: _id, createdAt: _c, ...r }) => ({ ...r, day: to })));
  return rows.length;
}

/**
 * The same person in two places at once on the same day. Times are "HH:MM"
 * strings, which compare correctly as text.
 */
export function clashes(list: Shift[]): Set<string> {
  const bad = new Set<string>();
  const byPerson = new Map<string, Shift[]>();
  for (const s of list) {
    const k = `${s.day}|${s.person.trim().toLowerCase()}`;
    byPerson.set(k, [...(byPerson.get(k) ?? []), s]);
  }
  for (const group of byPerson.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (a.startsAt < b.endsAt && b.startsAt < a.endsAt) {
          bad.add(a.id);
          bad.add(b.id);
        }
      }
    }
  }
  return bad;
}

/** Everyone on the rota, with their shifts, for the per-person list. */
export function byPerson(list: Shift[]): { person: string; phone: string | null; shifts: Shift[] }[] {
  const map = new Map<string, { person: string; phone: string | null; shifts: Shift[] }>();
  for (const s of list) {
    const k = s.person.trim().toLowerCase();
    const e = map.get(k) ?? { person: s.person.trim(), phone: null, shifts: [] };
    e.shifts.push(s);
    if (!e.phone && s.phone) e.phone = s.phone;
    map.set(k, e);
  }
  return [...map.values()].sort((a, b) => a.person.localeCompare(b.person, "bg"));
}
