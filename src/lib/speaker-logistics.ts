import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { speakerLogistics, speakers } from "@/lib/db/schema";
import { kitUrl } from "@/lib/speaker-kit";

/**
 * The logistics sheet: every speaker with what is known about their two
 * days. A speaker without a row is simply one nobody has written about yet,
 * so the sheet lists all of them and shows the gaps.
 */
export type LogisticsRow = {
  speakerId: string;
  /** Their private materials page - one tap to copy and send. */
  kitUrl: string;
  name: string;
  title: string | null;
  country: string | null;
  announced: boolean;
  pending: boolean;
  confirmed: boolean;
  email: string | null;
  phone: string | null;
  arrives: string | null;
  departs: string | null;
  hotel: string | null;
  hotelBooked: boolean;
  tech: string | null;
  presentationAt: Date | null;
  dietary: string | null;
  host: string | null;
  notes: string | null;
  updatedAt: Date | null;
};

export type LogisticsInput = Omit<LogisticsRow, "speakerId" | "name" | "title" | "country" | "announced" | "pending" | "updatedAt" | "presentationAt" | "kitUrl"> & {
  presentationReceived: boolean;
};

export async function listLogistics(): Promise<LogisticsRow[]> {
  const rows = await getDb()
    .select({
      speakerId: speakers.id,
      name: speakers.name,
      title: speakers.title,
      country: speakers.country,
      announced: speakers.announced,
      pending: speakers.pending,
      confirmed: sql<boolean>`coalesce(${speakerLogistics.confirmed}, false)`,
      email: speakerLogistics.email,
      phone: speakerLogistics.phone,
      arrives: speakerLogistics.arrives,
      departs: speakerLogistics.departs,
      hotel: speakerLogistics.hotel,
      hotelBooked: sql<boolean>`coalesce(${speakerLogistics.hotelBooked}, false)`,
      tech: speakerLogistics.tech,
      presentationAt: speakerLogistics.presentationAt,
      dietary: speakerLogistics.dietary,
      host: speakerLogistics.host,
      notes: speakerLogistics.notes,
      updatedAt: speakerLogistics.updatedAt,
    })
    .from(speakers)
    .leftJoin(speakerLogistics, eq(speakerLogistics.speakerId, speakers.id))
    .where(eq(speakers.pending, false))
    .orderBy(asc(speakers.sort), asc(speakers.name));
  return rows.map((r) => ({ ...r, kitUrl: kitUrl(r.speakerId) }));
}

export async function saveLogistics(speakerId: string, input: LogisticsInput): Promise<void> {
  const db = getDb();
  const [current] = await db
    .select({ presentationAt: speakerLogistics.presentationAt })
    .from(speakerLogistics)
    .where(eq(speakerLogistics.speakerId, speakerId))
    .limit(1);
  // The date the slides arrived is kept from the first tick; unticking
  // clears it, ticking again stamps today.
  const presentationAt = input.presentationReceived ? (current?.presentationAt ?? new Date()) : null;
  const values = {
    speakerId,
    confirmed: input.confirmed,
    email: input.email,
    phone: input.phone,
    arrives: input.arrives,
    departs: input.departs,
    hotel: input.hotel,
    hotelBooked: input.hotelBooked,
    tech: input.tech,
    presentationAt,
    dietary: input.dietary,
    host: input.host,
    notes: input.notes,
    updatedAt: new Date(),
  };
  await db
    .insert(speakerLogistics)
    .values(values)
    .onConflictDoUpdate({ target: speakerLogistics.speakerId, set: values });
}

/** The numbers at the top of the sheet. */
export function summarize(rows: LogisticsRow[]) {
  const total = rows.length;
  return {
    total,
    confirmed: rows.filter((r) => r.confirmed).length,
    presentation: rows.filter((r) => r.presentationAt).length,
    hotel: rows.filter((r) => r.hotelBooked).length,
    arrival: rows.filter((r) => r.arrives).length,
    host: rows.filter((r) => r.host).length,
    abroad: rows.filter((r) => r.country && r.country !== "България").length,
  };
}

export type LogisticsFilter = "vsichki" | "nepotvardeni" | "bez-prezentaciya" | "bez-hotel" | "bez-pristigane" | "bez-posreshtach" | "chuzhbina";

export const FILTERS: { id: LogisticsFilter; label: string }[] = [
  { id: "vsichki", label: "Всички" },
  { id: "nepotvardeni", label: "Непотвърдени" },
  { id: "bez-prezentaciya", label: "Без презентация" },
  { id: "bez-hotel", label: "Без хотел" },
  { id: "bez-pristigane", label: "Без час на пристигане" },
  { id: "bez-posreshtach", label: "Без посрещач" },
  { id: "chuzhbina", label: "От чужбина" },
];

export function applyFilter(rows: LogisticsRow[], f: LogisticsFilter): LogisticsRow[] {
  switch (f) {
    case "nepotvardeni":
      return rows.filter((r) => !r.confirmed);
    case "bez-prezentaciya":
      return rows.filter((r) => !r.presentationAt);
    case "bez-hotel":
      // Only people who need one: a Sofia speaker without a hotel is not a gap.
      return rows.filter((r) => !r.hotelBooked && r.country && r.country !== "България");
    case "bez-pristigane":
      return rows.filter((r) => !r.arrives);
    case "bez-posreshtach":
      return rows.filter((r) => !r.host);
    case "chuzhbina":
      return rows.filter((r) => r.country && r.country !== "България");
    default:
      return rows;
  }
}
