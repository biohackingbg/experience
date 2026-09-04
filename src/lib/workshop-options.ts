/** Client-safe constants for workshops: the two kinds and what each tier may book. */

export const KINDS = [
  { id: "workshop", label: "Работилница", labelEn: "Workshop", plural: "работилници" },
  { id: "experience", label: "Специално преживяване", labelEn: "Special experience", plural: "преживявания" },
] as const;
export type WorkshopKind = (typeof KINDS)[number]["id"];
export const isKind = (v: unknown): v is WorkshopKind => KINDS.some((k) => k.id === v);
export const kindLabel = (id: string, en = false) => {
  const k = KINDS.find((x) => x.id === id);
  return k ? (en ? k.labelEn : k.label) : id;
};

/**
 * What each tier includes, worded exactly as the ticket cards promise:
 * CORE neither, PLUS the workshops and one experience of choice, PEAK
 * everything. `null` means no limit beyond the room's own capacity.
 */
export const ALLOWANCE: Record<string, { workshop: number | null; experience: number | null }> = {
  core: { workshop: 0, experience: 0 },
  plus: { workshop: null, experience: 1 },
  peak: { workshop: null, experience: null },
};

export const allowanceFor = (tierId: string, kind: WorkshopKind): number | null =>
  (ALLOWANCE[tierId] ?? ALLOWANCE.core)[kind];
