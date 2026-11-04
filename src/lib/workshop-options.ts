/** Client-safe constants for workshops: the two kinds and what each tier may book. */

export const KINDS = [
  { id: "workshop", label: "Workshop", labelEn: "Workshop", plural: "workshops" },
  { id: "experience", label: "Experience", labelEn: "Experience", plural: "experiences" },
] as const;
export type WorkshopKind = (typeof KINDS)[number]["id"];
export const isKind = (v: unknown): v is WorkshopKind => KINDS.some((k) => k.id === v);
export const kindLabel = (id: string, en = false) => {
  const k = KINDS.find((x) => x.id === id);
  return k ? (en ? k.labelEn : k.label) : id;
};

/**
 * What each tier includes, worded exactly as the ticket cards promise:
 * CORE neither, PLUS one workshop and one experience of choice, PEAK three
 * of each. `null` means no limit beyond the room's
 * own capacity.
 */
export const ALLOWANCE: Record<string, { workshop: number | null; experience: number | null }> = {
  core: { workshop: 0, experience: 0 },
  plus: { workshop: 1, experience: 1 },
  peak: { workshop: 3, experience: 3 },
};

export const allowanceFor = (tierId: string, kind: WorkshopKind): number | null =>
  (ALLOWANCE[tierId] ?? ALLOWANCE.core)[kind];
