import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { members } from "@/lib/db/schema";

/** The community opt-in, kept apart from the ticket on purpose. */
export const COMMUNITY_CONSENT_VERSION = "community-v1-2026-10-04";

export async function isMember(email: string): Promise<boolean> {
  const [m] = await getDb().select({ leftAt: members.leftAt }).from(members).where(eq(members.email, email)).limit(1);
  return !!m && !m.leftAt;
}

export async function joinCommunity(email: string, name: string | null, source: string): Promise<void> {
  await getDb()
    .insert(members)
    .values({ email, name, source, consentVersion: COMMUNITY_CONSENT_VERSION })
    .onConflictDoUpdate({
      target: members.email,
      set: { name: name ?? undefined, leftAt: null, joinedAt: new Date(), consentVersion: COMMUNITY_CONSENT_VERSION, source },
    });
}

export async function leaveCommunity(email: string): Promise<void> {
  await getDb().update(members).set({ leftAt: new Date() }).where(eq(members.email, email));
}
