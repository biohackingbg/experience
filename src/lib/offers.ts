import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { partnerCards } from "@/lib/partner-profiles";

export type Offer = typeof offers.$inferSelect;
export type OfferInput = Omit<Offer, "id" | "createdAt" | "updatedAt">;

const tiersOf = (o: Offer) => (o.tiers ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** What one ticket holder may see now: live, in date, and for their tier. */
export async function listOffersFor(tierIds: string[], lang: "bg" | "en") {
  const now = Date.now();
  const [rows, cards] = await Promise.all([
    getDb().select().from(offers).where(eq(offers.active, true)).orderBy(asc(offers.sort), desc(offers.createdAt)),
    partnerCards(),
  ]);
  return rows
    .filter((o) => (!o.validFrom || o.validFrom.getTime() <= now) && (!o.validTo || o.validTo.getTime() >= now))
    .filter((o) => {
      const only = tiersOf(o);
      return only.length === 0 || only.some((t) => tierIds.includes(t));
    })
    .map((o) => {
      const card = o.partnerId ? cards.get(o.partnerId) : undefined;
      return {
        id: o.id,
        partner: card?.name ?? o.partner,
        // Only a listed profile can be opened; an unlisted one still lends its logo.
        partnerId: card?.listed ? o.partnerId : null,
        logo: card?.logo ?? null,
        title: (lang === "en" && o.titleEn) || o.title,
        body: (lang === "en" && o.bodyEn) || o.body,
        how: (lang === "en" && o.howEn) || o.how,
        code: o.code,
        url: o.url,
        place: o.place,
        tiers: tiersOf(o),
        validTo: o.validTo?.toISOString() ?? null,
      };
    });
}

export async function listOffers(): Promise<Offer[]> {
  return getDb().select().from(offers).orderBy(asc(offers.sort), desc(offers.createdAt));
}

/** Every offer for the admin, with where it stands in time right now. */
export async function listOffersWithState(): Promise<(Offer & { notYet: boolean; over: boolean })[]> {
  const now = Date.now();
  const rows = await listOffers();
  return rows.map((o) => ({
    ...o,
    notYet: !!o.validFrom && o.validFrom.getTime() > now,
    over: !!o.validTo && o.validTo.getTime() < now,
  }));
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
