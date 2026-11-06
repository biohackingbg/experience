/** Client-safe constants for workshops: the kinds and what each tier may book. */

export const KINDS = [
  { id: "workshop", label: "Workshop", labelEn: "Workshop", plural: "workshops" },
  { id: "experience", label: "Experience", labelEn: "Experience", plural: "experiences" },
  // A partner's extra, open to every ticket and outside the tier's count
  // (the VW + MOON test drive). The app built before it existed knows only the
  // first two, so the app API reports it as an experience.
  { id: "bonus", label: "Бонус", labelEn: "Bonus", plural: "bonus" },
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
 * own capacity - the bonus kind for every tier, CORE included.
 */
export const ALLOWANCE: Record<string, Record<WorkshopKind, number | null>> = {
  core: { workshop: 0, experience: 0, bonus: null },
  plus: { workshop: 1, experience: 1, bonus: null },
  peak: { workshop: 3, experience: 3, bonus: null },
};

export const allowanceFor = (tierId: string, kind: WorkshopKind): number | null =>
  (ALLOWANCE[tierId] ?? ALLOWANCE.core)[kind];
