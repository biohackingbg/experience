import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { speakers } from "@/lib/db/schema";
import type { Lang } from "@/lib/i18n";
import { SPEAKERS, type Speaker } from "@/lib/speakers";

/**
 * The speakers the site shows. The list in code is the seed; once imported,
 * the database is the source and the code copy is history. Portraits are
 * served from /api/lektor/<id>?v=<stamp>, so replacing one moves the URL
 * and no cache keeps the old face.
 */

export type SpeakerRow = {
  id: string;
  sort: number;
  announced: boolean;
  pending: boolean;
  title: string | null;
  name: string;
  specialty: string | null;
  country: string | null;
  affiliation: string | null;
  role: string | null;
  topic: string | null;
  titleEn: string | null;
  specialtyEn: string | null;
  roleEn: string | null;
  topicEn: string | null;
  hasPhoto: boolean;
  photoUpdatedAt: Date | null;
  updatedAt: Date | null;
};

const cols = {
  id: speakers.id,
  sort: speakers.sort,
  announced: speakers.announced,
  pending: speakers.pending,
  title: speakers.title,
  name: speakers.name,
  specialty: speakers.specialty,
  country: speakers.country,
  affiliation: speakers.affiliation,
  role: speakers.role,
  topic: speakers.topic,
  titleEn: speakers.titleEn,
  specialtyEn: speakers.specialtyEn,
  roleEn: speakers.roleEn,
  topicEn: speakers.topicEn,
  hasPhoto: sql<boolean>`${speakers.photo} is not null`,
  photoUpdatedAt: speakers.photoUpdatedAt,
  updatedAt: speakers.updatedAt,
};

export async function listSpeakers(): Promise<SpeakerRow[]> {
  return getDb().select(cols).from(speakers).orderBy(asc(speakers.sort), asc(speakers.name));
}

export const photoUrl = (r: { id: string; hasPhoto: boolean; photoUpdatedAt: Date | null }) =>
  r.hasPhoto ? `/api/lektor/${r.id}?v=${r.photoUpdatedAt?.getTime() ?? 0}` : undefined;

function toSpeaker(r: SpeakerRow, lang: Lang = "bg"): Speaker {
  // English where it has been filled in, the Bulgarian original otherwise.
  const en = lang === "en";
  return {
    id: r.id,
    name: r.name,
    title: (en ? r.titleEn : null) || r.title || undefined,
    specialty: (en ? r.specialtyEn : null) || r.specialty || undefined,
    country: r.country ?? undefined,
    affiliation: r.affiliation ?? undefined,
    role: (en ? r.roleEn : null) || r.role || undefined,
    topic: (en ? r.topicEn : null) || r.topic || undefined,
    photo: photoUrl(r),
    pending: r.pending || undefined,
    announced: r.announced,
  };
}

/** What the page and the structured data show. */
export async function getAnnouncedSpeakers(lang: Lang = "bg"): Promise<Speaker[]> {
  let rows: SpeakerRow[] = [];
  try {
    rows = await listSpeakers();
  } catch (error) {
    console.error("[speakers] read failed, showing the code copy:", error);
  }
  if (rows.length === 0) {
    // Same rule the code list applies, including the local preview switch.
    const all = process.env.PREVIEW_ALL_SPEAKERS === "1";
    return SPEAKERS.filter((s) => !s.pending && (all || s.announced));
  }
  return rows.filter((r) => !r.pending && r.announced).map((r) => toSpeaker(r, lang));
}

async function readPublicPhoto(p: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const mime = p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : "image/jpeg";
  try {
    return { bytes: await readFile(path.join(process.cwd(), "public", p)), mime };
  } catch {
    // Not on disk in this runtime: the deployed site still serves it.
    try {
      const res = await fetch(`https://thelongevitysummit.eu${p}`);
      if (!res.ok) return null;
      return { bytes: Buffer.from(await res.arrayBuffer()), mime: res.headers.get("content-type") ?? mime };
    } catch {
      return null;
    }
  }
}

/** Copies the code list, portraits included, into the table - once. */
export async function importSpeakers(): Promise<number> {
  const db = getDb();
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(speakers);
  if ((c?.n ?? 0) > 0) return 0;
  let n = 0;
  for (const [i, s] of SPEAKERS.entries()) {
    const photo = s.photo ? await readPublicPhoto(s.photo) : null;
    await db.insert(speakers).values({
      id: s.id,
      sort: (i + 1) * 10,
      announced: !!s.announced,
      pending: !!s.pending,
      title: s.title ?? null,
      name: s.name,
      specialty: s.specialty ?? null,
      country: s.country ?? null,
      affiliation: s.affiliation ?? null,
      role: s.role ?? null,
      topic: s.topic ?? null,
      photo: photo?.bytes ?? null,
      photoMime: photo?.mime ?? null,
      photoUpdatedAt: photo ? new Date() : null,
    });
    n++;
  }
  return n;
}

export type SpeakerInput = Pick<
  SpeakerRow,
  "name" | "title" | "specialty" | "country" | "affiliation" | "role" | "topic" | "titleEn" | "specialtyEn" | "roleEn" | "topicEn" | "announced" | "pending"
>;

/** "Д-р Мария Иванова" -> "mariya-ivanova"; unique by suffix if taken. */
export async function slugFor(name: string): Promise<string> {
  const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sht",ъ:"a",ь:"y",ю:"yu",я:"ya" };
  const base = name.toLowerCase().split("").map((ch) => map[ch] ?? ch).join("")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "lektor";
  const db = getDb();
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const [hit] = await db.select({ id: speakers.id }).from(speakers).where(eq(speakers.id, slug)).limit(1);
    if (!hit) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function addSpeaker(input: SpeakerInput): Promise<string> {
  const db = getDb();
  const id = await slugFor(input.name);
  const [m] = await db.select({ max: sql<number>`coalesce(max(${speakers.sort}), 0)::int` }).from(speakers);
  await db.insert(speakers).values({ id, sort: (m?.max ?? 0) + 10, ...input });
  return id;
}

export async function updateSpeaker(id: string, input: SpeakerInput): Promise<void> {
  await getDb().update(speakers).set({ ...input, updatedAt: new Date() }).where(eq(speakers.id, id));
}

export async function setAnnounced(id: string, announced: boolean): Promise<void> {
  await getDb().update(speakers).set({ announced, updatedAt: new Date() }).where(eq(speakers.id, id));
}

export async function deleteSpeaker(id: string): Promise<void> {
  await getDb().delete(speakers).where(eq(speakers.id, id));
}

export async function setPhoto(id: string, bytes: Buffer, mime: string): Promise<void> {
  await getDb().update(speakers).set({ photo: bytes, photoMime: mime, photoUpdatedAt: new Date(), updatedAt: new Date() }).where(eq(speakers.id, id));
}

export async function getPhoto(id: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const [r] = await getDb().select({ photo: speakers.photo, mime: speakers.photoMime }).from(speakers).where(eq(speakers.id, id)).limit(1);
  if (!r?.photo) return null;
  return { bytes: r.photo, mime: r.mime ?? "image/jpeg" };
}

export async function moveSpeaker(id: string, dir: "up" | "down"): Promise<void> {
  const db = getDb();
  const all = await db.select({ id: speakers.id, sort: speakers.sort }).from(speakers).orderBy(asc(speakers.sort), asc(speakers.name));
  const i = all.findIndex((s) => s.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return;
  await db.transaction(async (tx) => {
    await tx.update(speakers).set({ sort: all[j].sort }).where(eq(speakers.id, all[i].id));
    await tx.update(speakers).set({ sort: all[i].sort }).where(eq(speakers.id, all[j].id));
  });
}
