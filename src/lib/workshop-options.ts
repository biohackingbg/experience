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

/**
 * The note for a ticket whose allowance of one kind is used up: sent as a
 * push when the last place is booked or one more is tried, and shown on the
 * ticket page. The app's own alert for "not_allowed" reads as if the kind
 * were not in the ticket at all, which is wrong for a PEAK with 3 of 3 -
 * this says what actually happened, and what to do.
 */
export function limitNote(kind: WorkshopKind, allowed: number, tierId: string, en = false): { title: string; body: string } {
  const tier = tierId.toUpperCase();
  const one = allowed === 1;
  if (en) {
    const noun = kind === "workshop" ? (one ? "workshop" : "workshops") : one ? "experience" : "experiences";
    return {
      title: `All your ${kind === "workshop" ? "workshops" : "experiences"} are booked`,
      body: `You have ${allowed} of ${allowed} ${noun} on your ${tier} ticket. To book another, cancel one of yours first.`,
    };
  }
  const noun = kind === "workshop" ? (one ? "работилница" : "работилници") : one ? "преживяване" : "преживявания";
  return {
    title: `Изчерпа ${kind === "workshop" ? "работилниците" : "преживяванията"} в билета си`,
    body: `Имаш ${allowed} от ${allowed} ${noun} с ${tier} билета. За да запазиш друго, първо откажи някое от записаните.`,
  };
}
