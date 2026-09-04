import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import type { Lang } from "@/lib/i18n";
import { latin } from "@/lib/latin";
import { PROGRAM_EN, type Day, PROGRAM, type Slot } from "@/lib/program";
import { PROGRAM_SECTION } from "@/lib/site-copy";

/**
 * The programme the site shows. Until the team imports it into the database
 * the version in code is the source; after that, the database is, and the
 * code copy is only the seed it came from.
 */

/**
 * The day headings never left the code; the rows only carry the slots. In
 * English the heading words come from site-copy - the date is a number in
 * both languages, so only the day, the theme and the intro are translated.
 */
function dayMeta(lang: Lang) {
  return PROGRAM.map(({ day, date, theme, intro }, i) => {
    if (lang === "bg") return { day, date, theme, intro };
    const en = PROGRAM_SECTION.en.days[i];
    return { day: en?.day || day, date, theme: en?.theme || theme, intro: en?.intro || intro };
  });
}

export type SessionRow = {
  id: string;
  day: number;
  sort: number;
  time: string;
  title: string;
  note: string | null;
  role: string | null;
  people: string | null;
  pause: boolean;
  titleEn: string | null;
  noteEn: string | null;
  roleEn: string | null;
};

export async function listSessions(): Promise<SessionRow[]> {
  return getDb().select().from(sessions).orderBy(asc(sessions.day), asc(sessions.sort));
}

export const peopleList = (v: string | null) => (v ?? "").split(/\r?\n|;/).map((s) => s.trim()).filter(Boolean);

export async function getProgram(lang: Lang = "bg"): Promise<Day[]> {
  let rows: SessionRow[] = [];
  try {
    rows = await listSessions();
  } catch (error) {
    console.error("[program] read failed, showing the code copy:", error);
  }
  const meta0 = dayMeta(lang);
  const en = lang === "en";
  // Names are transliterated rather than translated: a name is the same name
  // in both languages, only written in the reader's alphabet.
  const people = (list?: string[]) => (en ? list?.map(latin) : list);
  if (rows.length === 0) {
    return PROGRAM.map((d, i) => ({
      ...d,
      ...meta0[i],
      slots: d.slots.map((s, j) => {
        const t = en ? PROGRAM_EN[i]?.[j] : undefined;
        return { ...s, title: t?.title || s.title, note: t?.note || s.note, role: t?.role || s.role, people: people(s.people) };
      }),
    }));
  }
  return meta0.map((meta, i) => ({
    ...meta,
    slots: rows
      .filter((r) => r.day === i + 1)
      .map<Slot>((r) => ({
        time: r.time,
        // English where it exists, the Bulgarian original where it does not:
        // a half-translated programme should read as a programme, not as gaps.
        title: (lang === "en" ? r.titleEn : null) || r.title,
        note: (lang === "en" ? r.noteEn : null) || r.note || undefined,
        role: (lang === "en" ? r.roleEn : null) || r.role || undefined,
        people: peopleList(r.people).length ? people(peopleList(r.people)) : undefined,
        pause: r.pause || undefined,
      })),
  }));
}

/** Copies the code programme into the table, once; a second call does nothing. */
export async function importProgram(): Promise<number> {
  const db = getDb();
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(sessions);
  if ((c?.n ?? 0) > 0) return 0;
  const rows = PROGRAM.flatMap((d, di) =>
    d.slots.map((s, si) => ({
      day: di + 1,
      sort: (si + 1) * 10,
      time: s.time,
      title: s.title,
      note: s.note ?? null,
      role: s.role ?? null,
      people: s.people?.join("\n") ?? null,
      pause: !!s.pause,
      titleEn: PROGRAM_EN[di]?.[si]?.title ?? null,
      noteEn: PROGRAM_EN[di]?.[si]?.note ?? null,
      roleEn: PROGRAM_EN[di]?.[si]?.role ?? null,
    })),
  );
  if (rows.length) await db.insert(sessions).values(rows);
  return rows.length;
}

export type SessionInput = Omit<SessionRow, "id" | "sort">;

/**
 * Fills the English half of sessions imported before the translations
 * existed. Matches a row to the code programme by day and time, and only
 * ever writes into an empty field - anything typed by hand stays.
 */
export async function fillProgramEnglish(): Promise<number> {
  const db = getDb();
  const rows = await listSessions();
  let n = 0;
  for (const r of rows) {
    const di = r.day - 1;
    const si = PROGRAM[di]?.slots.findIndex((s) => s.time === r.time && s.title === r.title);
    const t = si !== undefined && si >= 0 ? PROGRAM_EN[di]?.[si] : undefined;
    if (!t) continue;
    const patch: Partial<SessionRow> = {};
    if (!r.titleEn && t.title) patch.titleEn = t.title;
    if (!r.noteEn && t.note) patch.noteEn = t.note;
    if (!r.roleEn && t.role) patch.roleEn = t.role;
    if (Object.keys(patch).length === 0) continue;
    await db.update(sessions).set(patch).where(eq(sessions.id, r.id));
    n++;
  }
  return n;
}

export async function addSession(input: SessionInput): Promise<void> {
  const db = getDb();
  const [m] = await db.select({ max: sql<number>`coalesce(max(${sessions.sort}), 0)::int` }).from(sessions).where(eq(sessions.day, input.day));
  await db.insert(sessions).values({ ...input, sort: (m?.max ?? 0) + 10 });
}

export async function updateSession(id: string, input: SessionInput): Promise<void> {
  await getDb().update(sessions).set({ ...input, updatedAt: new Date() }).where(eq(sessions.id, id));
}

export async function deleteSession(id: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.id, id));
}

/** Swaps the row with its neighbour in the same day. */
export async function moveSession(id: string, dir: "up" | "down"): Promise<void> {
  const db = getDb();
  const [me] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!me) return;
  const siblings = await db.select().from(sessions).where(eq(sessions.day, me.day)).orderBy(asc(sessions.sort));
  const i = siblings.findIndex((s) => s.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return;
  const other = siblings[j];
  await db.transaction(async (tx) => {
    await tx.update(sessions).set({ sort: other.sort }).where(eq(sessions.id, me.id));
    await tx.update(sessions).set({ sort: me.sort }).where(eq(sessions.id, other.id));
  });
}
