import "server-only";

import { asc, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { boothAssignments, deckLinks, offers, partners } from "@/lib/db/schema";

/**
 * Partner profiles: what the app and the hall map show about a partner.
 * The pipeline row (`deck_links`) stays private; a profile may point at
 * one so the stand on the plan can find its logo.
 */

export type PartnerInput = {
  deckLinkId: string | null;
  name: string;
  category: string | null;
  categoryEn: string | null;
  tagline: string | null;
  taglineEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  website: string | null;
  instagram: string | null;
  listed: boolean;
  sort: number;
};

/** Everything the admin list needs, without the logo bytes. */
export type PartnerRow = PartnerInput & {
  id: string;
  hasLogo: boolean;
  logoUrl: string | null;
  deckLabel: string | null;
  booths: string[];
  offerCount: number;
  updatedAt: Date | null;
};

export type PublicPartner = {
  id: string;
  name: string;
  category: string | null;
  tagline: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  logo: string | null;
  booths: string[];
  offers: number;
};

export const logoUrl = (id: string, stamp: Date | null) =>
  stamp ? `/api/partner-logo/${id}/${stamp.getTime().toString(36)}` : null;

/** Booth ids per pipeline row, from the hall plan. */
async function boothsByDeckLink(): Promise<Map<string, string[]>> {
  const rows = await getDb()
    .select({ booth: boothAssignments.booth, deckLinkId: boothAssignments.deckLinkId })
    .from(boothAssignments)
    .where(isNotNull(boothAssignments.deckLinkId));
  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.deckLinkId) continue;
    map.set(r.deckLinkId, [...(map.get(r.deckLinkId) ?? []), r.booth].sort());
  }
  return map;
}

/** Live offers per profile - what a ticket holder could see today. */
async function offerCounts(onlyLive: boolean): Promise<Map<string, number>> {
  const rows = await getDb()
    .select({ partnerId: offers.partnerId, n: sql<number>`count(*)::int` })
    .from(offers)
    .where(
      onlyLive
        ? sql`${offers.partnerId} is not null and ${offers.active} and (${offers.validFrom} is null or ${offers.validFrom} <= now()) and (${offers.validTo} is null or ${offers.validTo} >= now())`
        : isNotNull(offers.partnerId),
    )
    .groupBy(offers.partnerId);
  return new Map(rows.filter((r) => r.partnerId).map((r) => [r.partnerId!, r.n]));
}

const columns = {
  id: partners.id,
  deckLinkId: partners.deckLinkId,
  name: partners.name,
  category: partners.category,
  categoryEn: partners.categoryEn,
  tagline: partners.tagline,
  taglineEn: partners.taglineEn,
  description: partners.description,
  descriptionEn: partners.descriptionEn,
  website: partners.website,
  instagram: partners.instagram,
  listed: partners.listed,
  sort: partners.sort,
  logoUpdatedAt: partners.logoUpdatedAt,
  hasLogo: sql<boolean>`${partners.logo} is not null`,
  updatedAt: partners.updatedAt,
};

export async function listPartners(): Promise<PartnerRow[]> {
  const db = getDb();
  const [rows, labels, booths, counts] = await Promise.all([
    db.select(columns).from(partners).orderBy(asc(partners.sort), sql`lower(${partners.name})`),
    db.select({ id: deckLinks.id, label: deckLinks.label }).from(deckLinks),
    boothsByDeckLink(),
    offerCounts(false),
  ]);
  const labelById = new Map(labels.map((l) => [l.id, l.label]));
  return rows.map(({ logoUpdatedAt, ...r }) => ({
    ...r,
    logoUrl: r.hasLogo ? logoUrl(r.id, logoUpdatedAt) : null,
    deckLabel: r.deckLinkId ? (labelById.get(r.deckLinkId) ?? null) : null,
    booths: r.deckLinkId ? (booths.get(r.deckLinkId) ?? []) : [],
    offerCount: counts.get(r.id) ?? 0,
  }));
}

/** Profiles the public may see, in the language asked for. */
export async function listPublicPartners(lang: "bg" | "en"): Promise<PublicPartner[]> {
  const db = getDb();
  const [rows, booths, counts] = await Promise.all([
    db.select(columns).from(partners).where(eq(partners.listed, true)).orderBy(asc(partners.sort), sql`lower(${partners.name})`),
    boothsByDeckLink(),
    offerCounts(true),
  ]);
  const en = lang === "en";
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: (en && r.categoryEn) || r.category,
    tagline: (en && r.taglineEn) || r.tagline,
    description: (en && r.descriptionEn) || r.description,
    website: r.website,
    instagram: r.instagram,
    logo: r.hasLogo ? logoUrl(r.id, r.logoUpdatedAt) : null,
    booths: r.deckLinkId ? (booths.get(r.deckLinkId) ?? []) : [],
    offers: counts.get(r.id) ?? 0,
  }));
}

/** Listed profiles keyed by their pipeline row, for the stands on the plan. */
export async function listedByDeckLink(): Promise<Map<string, { id: string; name: string; logo: string | null; category: string | null }>> {
  const rows = await getDb()
    .select({ id: partners.id, deckLinkId: partners.deckLinkId, name: partners.name, category: partners.category, logoUpdatedAt: partners.logoUpdatedAt, hasLogo: columns.hasLogo })
    .from(partners)
    .where(sql`${partners.listed} and ${partners.deckLinkId} is not null`);
  return new Map(
    rows.map((r) => [r.deckLinkId!, { id: r.id, name: r.name, category: r.category, logo: r.hasLogo ? logoUrl(r.id, r.logoUpdatedAt) : null }]),
  );
}

/** Name and logo per profile, for the offers that point at one. */
export async function partnerCards(): Promise<Map<string, { name: string; logo: string | null; listed: boolean }>> {
  const rows = await getDb()
    .select({ id: partners.id, name: partners.name, listed: partners.listed, logoUpdatedAt: partners.logoUpdatedAt, hasLogo: columns.hasLogo })
    .from(partners);
  return new Map(rows.map((r) => [r.id, { name: r.name, listed: r.listed, logo: r.hasLogo ? logoUrl(r.id, r.logoUpdatedAt) : null }]));
}

export async function getPartnerName(id: string): Promise<string | null> {
  const [r] = await getDb().select({ name: partners.name }).from(partners).where(eq(partners.id, id)).limit(1);
  return r?.name ?? null;
}

export async function addPartner(input: PartnerInput): Promise<string> {
  const [r] = await getDb().insert(partners).values(input).returning({ id: partners.id });
  return r.id;
}

export async function updatePartner(id: string, input: PartnerInput): Promise<void> {
  const db = getDb();
  await db.update(partners).set({ ...input, updatedAt: new Date() }).where(eq(partners.id, id));
  // The offers keep the name as typed; follow a rename so the wall agrees.
  await db.update(offers).set({ partner: input.name, updatedAt: new Date() }).where(eq(offers.partnerId, id));
}

export async function deletePartner(id: string): Promise<void> {
  await getDb().delete(partners).where(eq(partners.id, id));
}

export async function setPartnerListed(id: string, listed: boolean): Promise<void> {
  await getDb().update(partners).set({ listed, updatedAt: new Date() }).where(eq(partners.id, id));
}

export async function setLogo(id: string, bytes: Buffer, mime: string): Promise<void> {
  await getDb().update(partners).set({ logo: bytes, logoMime: mime, logoUpdatedAt: new Date(), updatedAt: new Date() }).where(eq(partners.id, id));
}

export async function clearLogo(id: string): Promise<void> {
  await getDb().update(partners).set({ logo: null, logoMime: null, logoUpdatedAt: null, updatedAt: new Date() }).where(eq(partners.id, id));
}

export async function getLogo(id: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const [r] = await getDb().select({ logo: partners.logo, mime: partners.logoMime }).from(partners).where(eq(partners.id, id)).limit(1);
  if (!r?.logo) return null;
  return { bytes: r.logo, mime: r.mime ?? "image/png" };
}

/** Pipeline rows that could become a profile: not declined, not revoked, not taken yet. */
export async function deckLinksWithoutProfile(): Promise<{ id: string; label: string; stage: string }[]> {
  return getDb()
    .select({ id: deckLinks.id, label: deckLinks.label, stage: deckLinks.stage })
    .from(deckLinks)
    .where(
      sql`${deckLinks.stage} <> 'declined' and ${deckLinks.revokedAt} is null and not exists (select 1 from ${partners} where ${partners.deckLinkId} = ${deckLinks.id})`,
    )
    .orderBy(sql`lower(${deckLinks.label})`);
}

/** All pipeline rows by id, for the profile form's dropdown when editing. */
export async function deckLinkOptions(): Promise<{ id: string; label: string; stage: string }[]> {
  return getDb()
    .select({ id: deckLinks.id, label: deckLinks.label, stage: deckLinks.stage })
    .from(deckLinks)
    .where(sql`${deckLinks.revokedAt} is null`)
    .orderBy(sql`lower(${deckLinks.label})`);
}
