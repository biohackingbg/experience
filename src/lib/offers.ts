import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { offers } from "@/lib/db/schema";

export type Offer = typeof offers.$inferSelect;
export type OfferInput = Omit<Offer, "id" | "createdAt" | "updatedAt">;

const tiersOf = (o: Offer) => (o.tiers ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** What one ticket holder may see now: live, in date, and for their tier. */
export async function listOffersFor(tierIds: string[], lang: "bg" | "en") {
  const now = Date.now();
  const rows = await getDb().select().from(offers).where(eq(offers.active, true)).orderBy(asc(offers.sort), desc(offers.createdAt));
  return rows
    .filter((o) => (!o.validFrom || o.validFrom.getTime() <= now) && (!o.validTo || o.validTo.getTime() >= now))
    .filter((o) => {
      const only = tiersOf(o);
      return only.length === 0 || only.some((t) => tierIds.includes(t));
    })
    .map((o) => ({
      id: o.id,
      partner: o.partner,
      title: (lang === "en" && o.titleEn) || o.title,
      body: (lang === "en" && o.bodyEn) || o.body,
      how: (lang === "en" && o.howEn) || o.how,
      code: o.code,
      url: o.url,
      place: o.place,
      tiers: tiersOf(o),
      validTo: o.validTo?.toISOString() ?? null,
    }));
}

export async function listOffers(): Promise<Offer[]> {
  return getDb().select().from(offers).orderBy(asc(offers.sort), desc(offers.createdAt));
}

export async function addOffer(input: OfferInput): Promise<void> {
  await getDb().insert(offers).values(input);
}

export async function updateOffer(id: string, input: Partial<OfferInput>): Promise<void> {
  await getDb().update(offers).set({ ...input, updatedAt: new Date() }).where(eq(offers.id, id));
}

export async function deleteOffer(id: string): Promise<void> {
  await getDb().delete(offers).where(eq(offers.id, id));
}
