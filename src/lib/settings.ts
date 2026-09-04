import "server-only";

import { cache } from "react";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { SALES_OPEN } from "@/lib/tickets";

/**
 * Organiser-controlled switches, read from the database with a default in
 * code. See the `settings` table note in the schema.
 */

export type SettingKey = "early_access" | "price_stage" | "mid_prices";

export async function getSetting(key: SettingKey): Promise<{ value: string; updatedAt: Date } | null> {
  const [row] = await getDb()
    .select({ value: settings.value, updatedAt: settings.updatedAt })
    .from(settings)
    .where(sql`${settings.key} = ${key}`)
    .limit(1);
  return row ?? null;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await getDb()
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export type EarlyAccessState = {
  open: boolean;
  /** When someone last flipped it, or null while the code default applies. */
  changedAt: Date | null;
};

/**
 * Whether the launch prices are on. The one answer every price on the site,
 * the checkout, the metadata and the structured data must agree on, so it is
 * read here and nowhere else.
 *
 * Wrapped in React's `cache`: the home page asks four times in one render
 * (nav, tickets, closing call, schema) and that must be one query - and one
 * answer, so a flip mid-render cannot show two prices on one page.
 *
 * A database failure falls back to the code default rather than throwing:
 * the home page has no other reason to touch the database, and a pricing
 * flag must not be what takes the site down.
 */
export const getEarlyAccessState = cache(async (): Promise<EarlyAccessState> => {
  if (!SALES_OPEN) return { open: false, changedAt: null };
  // Stages superseded the on/off switch; "early" now means the launch stage.
  const { getPricing } = await import("@/lib/pricing");
  const p = await getPricing();
  return { open: p.stage === "launch", changedAt: p.changedAt };
});

export async function getEarlyAccess(): Promise<boolean> {
  return (await getEarlyAccessState()).open;
}
