import "server-only";

import { cache } from "react";

import { getSetting, setSetting } from "@/lib/settings";
import { EARLY_ACCESS, SALES_OPEN, TIERS, type Tier, type TierId } from "@/lib/tickets";

/**
 * Which price stage the site is on, and what each tier costs on it.
 *
 * Three stages, flipped by hand from the dashboard: launch (the first 200
 * tickets, prices in code), mid (an optional second step, prices and label
 * set in the dashboard), regular (the list prices in code). One cached read
 * per render answers every page, the checkout, the metadata and the
 * structured data together, so no page can show two prices.
 */

export type PriceStage = "launch" | "mid" | "regular";
export const isStage = (v: unknown): v is PriceStage => v === "launch" || v === "mid" || v === "regular";

export const STAGE_LABEL: Record<PriceStage, string> = { launch: "Стартови", mid: "Междинни", regular: "Редовни" };

export type MidConfig = { prices: Record<TierId, number>; label: string; regularAfter: string };

const DEFAULT_MID: MidConfig = {
  prices: { core: 4200, plus: 10900, peak: 29900 },
  label: "до 15 октомври",
  regularAfter: "след 15 октомври",
};

export type Pricing = {
  stage: PriceStage;
  /** A discounted stage is on: prices are struck against the list price. */
  discounted: boolean;
  /** How the offer is described: "първите 200 билета", "до 15 октомври". */
  label: string;
  /** Under the struck price: "след първите 200 билета". */
  regularAfter: string;
  prices: Record<TierId, number>;
  changedAt: Date | null;
  mid: MidConfig;
};

function parseMid(raw: string | null): MidConfig {
  if (!raw) return DEFAULT_MID;
  try {
    const v = JSON.parse(raw) as Partial<MidConfig>;
    const prices = { ...DEFAULT_MID.prices, ...(v.prices ?? {}) };
    for (const t of TIERS) if (!Number.isInteger(prices[t.id]) || prices[t.id] <= 0) prices[t.id] = DEFAULT_MID.prices[t.id];
    return { prices, label: v.label?.trim() || DEFAULT_MID.label, regularAfter: v.regularAfter?.trim() || DEFAULT_MID.regularAfter };
  } catch {
    return DEFAULT_MID;
  }
}

export const getPricing = cache(async (): Promise<Pricing> => {
  const listPrices = Object.fromEntries(TIERS.map((t) => [t.id, t.listPriceCents])) as Record<TierId, number>;
  const launchPrices = Object.fromEntries(TIERS.map((t) => [t.id, t.earlyPriceCents])) as Record<TierId, number>;
  const off = (mid: MidConfig): Pricing => ({ stage: "regular", discounted: false, label: "", regularAfter: "", prices: listPrices, changedAt: null, mid });
  if (!SALES_OPEN) return off(DEFAULT_MID);

  let stage: PriceStage = EARLY_ACCESS.open ? "launch" : "regular";
  let changedAt: Date | null = null;
  let mid = DEFAULT_MID;
  try {
    const [s, legacy, m] = await Promise.all([getSetting("price_stage"), getSetting("early_access"), getSetting("mid_prices")]);
    mid = parseMid(m?.value ?? null);
    if (s && isStage(s.value)) {
      stage = s.value;
      changedAt = s.updatedAt;
    } else if (legacy) {
      // The switch from before there were stages: on = launch, off = regular.
      stage = legacy.value === "on" ? "launch" : "regular";
      changedAt = legacy.updatedAt;
    }
  } catch (error) {
    console.error("[pricing] settings read failed, using code default:", error);
  }

  if (stage === "launch") {
    return { stage, discounted: true, label: EARLY_ACCESS.label, regularAfter: EARLY_ACCESS.regularAfter, prices: launchPrices, changedAt, mid };
  }
  if (stage === "mid") {
    return { stage, discounted: true, label: mid.label, regularAfter: mid.regularAfter, prices: mid.prices, changedAt, mid };
  }
  return { ...off(mid), changedAt };
});

export const priceOf = (p: Pricing, tier: Tier): number => p.prices[tier.id];

/** "-29%" against the list price; empty when nothing is struck. */
export function discountLabelOf(p: Pricing, tier: Tier): string {
  if (!p.discounted) return "";
  return `-${Math.round((1 - priceOf(p, tier) / tier.listPriceCents) * 100)}%`;
}

export const cheapestOf = (p: Pricing): Tier => TIERS.reduce((a, b) => (priceOf(p, b) < priceOf(p, a) ? b : a));

export async function setPriceStage(stage: PriceStage): Promise<void> {
  await setSetting("price_stage", stage);
}

export async function saveMidConfig(cfg: MidConfig): Promise<void> {
  await setSetting("mid_prices", JSON.stringify(cfg));
}
