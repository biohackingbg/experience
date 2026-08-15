/**
 * The deck's sections in reading order, shared by the page (which marks them)
 * and the admin (which shows how far a reader got). "packages" is the one
 * that matters commercially: reaching it means the prices were seen.
 */
export const DECK_SECTIONS = [
  { id: "cover", label: "корица" },
  { id: "market", label: "пазарът" },
  { id: "concept", label: "концепцията" },
  { id: "speakers", label: "лекторите" },
  { id: "scale", label: "мащабът" },
  { id: "audience", label: "публиката" },
  { id: "reasons", label: "причините" },
  { id: "territories", label: "териториите" },
  { id: "packages", label: "пакетите" },
  { id: "extras", label: "допълненията" },
  { id: "next", label: "следваща стъпка" },
] as const;

export type DeckSectionId = (typeof DECK_SECTIONS)[number]["id"];

export function sectionIndex(id: string | null | undefined): number {
  return DECK_SECTIONS.findIndex((s) => s.id === id);
}

export function sectionLabel(id: string | null | undefined): string {
  return DECK_SECTIONS.find((s) => s.id === id)?.label ?? "—";
}
