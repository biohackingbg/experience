import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { challengeCheckins, challengeParticipants, challenges } from "@/lib/db/schema";

/**
 * "30 дни ритъм": one morning anchor a day for thirty days, in cohorts of
 * twenty. The server knows who is in, which clock time they chose, and
 * four yes/no flags per day. Every measurement stays on the phone, so the
 * promise in the community consent ("results are not used for offers or
 * advertising") holds by construction.
 */

export type Challenge = typeof challenges.$inferSelect;
export type Participant = typeof challengeParticipants.$inferSelect;
export type Checkin = typeof challengeCheckins.$inferSelect;

/** The four weekly phases. Week 1 asks for one thing; each week adds one. */
export const PHASES = [
  { week: 1, title: "Закотви ставането", asks: ["wake", "light"] as const },
  { week: 2, title: "Светлина и движение", asks: ["wake", "light", "walk"] as const },
  { week: 3, title: "Прозорец за лягане", asks: ["wake", "light", "walk", "bed"] as const },
  { week: 4, title: "Дръж ритъма и в уикенда", asks: ["wake", "light", "walk", "bed"] as const },
  { week: 5, title: "Финал", asks: ["wake", "light", "walk", "bed"] as const },
] as const;

export type Ask = "wake" | "light" | "walk" | "bed";
export const WEEK_TARGET = 5;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isClock = (v: unknown): v is string => typeof v === "string" && TIME.test(v);

/** Today as YYYY-MM-DD in Sofia, whatever the server's clock zone. */
export function sofiaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(now);
}

/** The hour of day in Sofia, 0-23. */
export function sofiaHour(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", hour12: false }).format(now));
}

/** ISO weekday in Sofia: 1 = Monday … 7 = Sunday. */
export function sofiaWeekday(now = new Date()): number {
  const d = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Sofia", weekday: "short" }).format(now);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(d) + 1;
}

/** Whole days from the first day to `date`, plus one: 1 on the first day, 0 the day before. */
export function dayNumber(startsOn: string, date = sofiaToday()): number {
  const a = Date.UTC(Number(startsOn.slice(0, 4)), Number(startsOn.slice(5, 7)) - 1, Number(startsOn.slice(8, 10)));
  const b = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
  return Math.round((b - a) / 86_400_000) + 1;
}

/** YYYY-MM-DD of a challenge day. */
export function dateOfDay(startsOn: string, day: number): string {
  const a = Date.UTC(Number(startsOn.slice(0, 4)), Number(startsOn.slice(5, 7)) - 1, Number(startsOn.slice(8, 10)));
  return new Date(a + (day - 1) * 86_400_000).toISOString().slice(0, 10);
}

export const weekOf = (day: number) => Math.max(1, Math.ceil(day / 7));
export const phaseOf = (day: number) => PHASES[Math.min(PHASES.length, weekOf(day)) - 1];

/** The edition the app shows: the active one, or the newest if none is live. */
export async function currentChallenge(): Promise<Challenge | null> {
  const db = getDb();
  const [active] = await db.select().from(challenges).where(eq(challenges.active, true)).orderBy(desc(challenges.startsOn)).limit(1);
  if (active) return active;
  const [latest] = await db.select().from(challenges).orderBy(desc(challenges.startsOn)).limit(1);
  return latest ?? null;
}

export async function getParticipant(challengeId: string, email: string): Promise<Participant | null> {
  const [p] = await getDb()
    .select()
    .from(challengeParticipants)
    .where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.email, email)))
    .limit(1);
  return p ?? null;
}

/**
 * Joins, or re-joins after leaving. The cohort is the next one with room,
 * counted over people still in, so a cohort figure means twenty-odd real
 * neighbours rather than a number on a form.
 */
export async function joinChallenge(
  c: Challenge,
  email: string,
  input: { wakeTarget: string; bedTarget: string | null },
): Promise<Participant> {
  const db = getDb();
  const existing = await getParticipant(c.id, email);
  if (existing && !existing.leftAt) {
    const [p] = await db
      .update(challengeParticipants)
      .set({ wakeTarget: input.wakeTarget, bedTarget: input.bedTarget })
      .where(eq(challengeParticipants.id, existing.id))
      .returning();
    return p;
  }
  const [n] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(challengeParticipants)
    .where(and(eq(challengeParticipants.challengeId, c.id), isNull(challengeParticipants.leftAt)));
  const cohort = Math.floor((n?.n ?? 0) / Math.max(1, c.cohortSize)) + 1;
  const [p] = await db
    .insert(challengeParticipants)
    .values({ challengeId: c.id, email, wakeTarget: input.wakeTarget, bedTarget: input.bedTarget, cohort, consentVersion: c.consentVersion })
    .onConflictDoUpdate({
      target: [challengeParticipants.challengeId, challengeParticipants.email],
      set: { wakeTarget: input.wakeTarget, bedTarget: input.bedTarget, cohort, consentVersion: c.consentVersion, joinedAt: new Date(), leftAt: null },
    })
    .returning();
  return p;
}

export async function leaveChallenge(challengeId: string, email: string): Promise<void> {
  await getDb()
    .update(challengeParticipants)
    .set({ leftAt: new Date() })
    .where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.email, email)));
}

/** Everything the app drew for this person was done with the account; the rows go with it. */
export async function forgetChallengeData(email: string): Promise<void> {
  const db = getDb();
  await db.delete(challengeCheckins).where(eq(challengeCheckins.email, email));
  await db.delete(challengeParticipants).where(eq(challengeParticipants.email, email));
}

export async function listCheckins(challengeId: string, email: string): Promise<Checkin[]> {
  return getDb()
    .select()
    .from(challengeCheckins)
    .where(and(eq(challengeCheckins.challengeId, challengeId), eq(challengeCheckins.email, email)))
    .orderBy(asc(challengeCheckins.day));
}

export type CheckinInput = { day: number; wake: boolean; light: boolean; walk: boolean; bed: boolean };

/**
 * Records a day. Today and yesterday may be written - yesterday is the
 * one "repair" a week allows - and nothing in the future. The app sends
 * only the flags; whatever number led to a flag never leaves the phone.
 */
export async function saveCheckin(c: Challenge, email: string, input: CheckinInput): Promise<"ok" | "future" | "too_old" | "out_of_range"> {
  const today = dayNumber(c.startsOn);
  if (input.day < 1 || input.day > c.days) return "out_of_range";
  if (input.day > today) return "future";
  if (input.day < today - 1) return "too_old";
  await getDb()
    .insert(challengeCheckins)
    .values({ challengeId: c.id, email, day: input.day, wake: input.wake, light: input.light, walk: input.walk, bed: input.bed })
    .onConflictDoUpdate({
      target: [challengeCheckins.challengeId, challengeCheckins.email, challengeCheckins.day],
      set: { wake: input.wake, light: input.light, walk: input.walk, bed: input.bed, updatedAt: new Date() },
    });
  return "ok";
}

/** A day counts as "in rhythm" when the wake anchor held. */
export const inRhythm = (r: { wake: boolean }) => r.wake;

/**
 * Days in rhythm this week per cohort member, for the "x% of your cohort"
 * figure. A person is on track when they have at least as many rhythm days
 * as the week has had so far, capped at the weekly target of five.
 */
export async function cohortOnTrack(c: Challenge, cohort: number, today: number): Promise<{ members: number; onTrack: number }> {
  const db = getDb();
  const week = weekOf(today);
  const first = (week - 1) * 7 + 1;
  const elapsed = Math.min(WEEK_TARGET, today - first + 1);
  const members = await db
    .select({ email: challengeParticipants.email })
    .from(challengeParticipants)
    .where(and(eq(challengeParticipants.challengeId, c.id), eq(challengeParticipants.cohort, cohort), isNull(challengeParticipants.leftAt)));
  if (members.length === 0) return { members: 0, onTrack: 0 };
  const rows = await db
    .select({ email: challengeCheckins.email, n: sql<number>`count(*) filter (where ${challengeCheckins.wake})::int` })
    .from(challengeCheckins)
    .where(
      and(
        eq(challengeCheckins.challengeId, c.id),
        sql`${challengeCheckins.day} between ${first} and ${today}`,
        sql`${challengeCheckins.email} in ${members.map((m) => m.email)}`,
      ),
    )
    .groupBy(challengeCheckins.email);
  // Before the week has a full day behind it everyone is on track.
  const need = Math.max(0, elapsed - 1);
  const onTrack = members.filter((m) => (rows.find((r) => r.email === m.email)?.n ?? 0) >= need).length;
  return { members: members.length, onTrack };
}

/* ── Admin ── */

export type ParticipantRow = {
  email: string;
  cohort: number;
  wakeTarget: string;
  bedTarget: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  checkins: number;
  rhythmDays: number;
  lastDay: number | null;
};

export async function listParticipants(challengeId: string): Promise<ParticipantRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      email: challengeParticipants.email,
      cohort: challengeParticipants.cohort,
      wakeTarget: challengeParticipants.wakeTarget,
      bedTarget: challengeParticipants.bedTarget,
      joinedAt: challengeParticipants.joinedAt,
      leftAt: challengeParticipants.leftAt,
      checkins: sql<number>`(select count(*)::int from challenge_checkins k where k.challenge_id = challenge_participants.challenge_id and k.email = challenge_participants.email)`,
      rhythmDays: sql<number>`(select count(*)::int from challenge_checkins k where k.challenge_id = challenge_participants.challenge_id and k.email = challenge_participants.email and k.wake)`,
      lastDay: sql<number | null>`(select max(k.day) from challenge_checkins k where k.challenge_id = challenge_participants.challenge_id and k.email = challenge_participants.email)`,
    })
    .from(challengeParticipants)
    .where(eq(challengeParticipants.challengeId, challengeId))
    .orderBy(asc(challengeParticipants.cohort), asc(challengeParticipants.joinedAt));
  return rows;
}

/** Check-ins per day, for the admin's bar chart. */
export async function checkinsByDay(challengeId: string): Promise<{ day: number; checkins: number; rhythm: number }[]> {
  return getDb()
    .select({
      day: challengeCheckins.day,
      checkins: sql<number>`count(*)::int`,
      rhythm: sql<number>`count(*) filter (where ${challengeCheckins.wake})::int`,
    })
    .from(challengeCheckins)
    .where(eq(challengeCheckins.challengeId, challengeId))
    .groupBy(challengeCheckins.day)
    .orderBy(asc(challengeCheckins.day));
}

export async function listChallenges(): Promise<Challenge[]> {
  return getDb().select().from(challenges).orderBy(desc(challenges.startsOn));
}

export async function updateChallenge(id: string, input: { title: string; startsOn: string; days: number; cohortSize: number; active: boolean }): Promise<void> {
  const db = getDb();
  if (input.active) await db.update(challenges).set({ active: false }).where(sql`${challenges.id} <> ${id}`);
  await db.update(challenges).set({ ...input, updatedAt: new Date() }).where(eq(challenges.id, id));
}

/** Emails of everyone still in, optionally only those without today's check-in. */
export async function participantEmails(c: Challenge, opts: { missingDay?: number } = {}): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ email: challengeParticipants.email })
    .from(challengeParticipants)
    .where(
      and(
        eq(challengeParticipants.challengeId, c.id),
        isNull(challengeParticipants.leftAt),
        opts.missingDay
          ? sql`not exists (select 1 from challenge_checkins k where k.challenge_id = ${c.id} and k.email = ${challengeParticipants.email} and k.day = ${opts.missingDay})`
          : sql`true`,
      ),
    );
  return rows.map((r) => r.email);
}
