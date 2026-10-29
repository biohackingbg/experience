import { TIERS } from "@/lib/tickets";

/**
 * What the "which tickets" dropdown offers: every tier alone, every pair, or
 * all of them (empty value). The value is the tier ids joined by commas, the
 * same form the database keeps.
 */
export const TIER_CHOICES: { value: string; label: string }[] = [
  { value: "", label: "Всички билети" },
  ...TIERS.map((t) => ({ value: t.id, label: `Само ${t.name}` })),
  ...TIERS.flatMap((a, i) => TIERS.slice(i + 1).map((b) => ({ value: `${a.id},${b.id}`, label: `${a.name} и ${b.name}` }))),
];

/** The dropdown value for a code's stored tiers; every tier or none stored = "all". */
export const tierValue = (tiers: string[] | null | undefined): string => {
  const picked = TIERS.filter((t) => tiers?.includes(t.id)).map((t) => t.id);
  return picked.length === TIERS.length ? "" : picked.join(",");
};
