/**
 * The deck's sections in reading order, shared by the page (which marks them)
 * and the admin (which shows how far a reader got). "packages" is the one
 * that matters commercially: reaching it means the prices were seen.
 */
export const DECK_SECTIONS = [
  { id: "cover", label: "корица" },
  { id: "format", label: "форматът" },
  { id: "scale", label: "мащабът" },
  { id: "organizers", label: "организаторите" },
  { id: "speakers", label: "лекторите" },
  { id: "concept", label: "концепцията" },
  { id: "zones", label: "зоните" },
  { id: "brandzone", label: "брандираната зона" },
  { id: "audience", label: "публиката" },
  { id: "journey", label: "пътуването" },
  { id: "value", label: "стойността" },
  { id: "packages", label: "пакетите" },
  { id: "village", label: "Village щанд" },
  { id: "compare", label: "сравнението" },
  { id: "extras", label: "по избор" },
  { id: "after", label: "след събитието" },
  { id: "support", label: "подкрепата" },
  { id: "founding", label: "founding partners" },
  { id: "next", label: "следваща стъпка" },
] as const;

export type DeckSectionId = (typeof DECK_SECTIONS)[number]["id"];

export function sectionIndex(id: string | null | undefined): number {
  return DECK_SECTIONS.findIndex((s) => s.id === id);
}

export function sectionLabel(id: string | null | undefined): string {
  return DECK_SECTIONS.find((s) => s.id === id)?.label ?? "—";
}
