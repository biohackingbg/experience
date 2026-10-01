/**
 * The exhibition plan: 24 modules of 3 × 2 m in the Grand Millennium
 * foyer, as drawn in "Sofia_Life_Summit_2026_Exhibition_booths". Client-safe:
 * no server code, so the board can draw it in the browser.
 *
 * Each box is a position on the plan image, in percent of its width and
 * height, measured from the PDF's own vector rectangles rather than by eye.
 * The image is the plan with the modules already coloured; the board lays
 * its own state over them, so a change of partner never needs a new image.
 */

export const PLAN_IMAGE = "/plan-shtandove.webp";
/** width / height of the plan image, so the overlay keeps its shape. */
export const PLAN_ASPECT = 1320 / 1870;

export const ZONES = [
  { id: "A", label: "Premium", hint: "до входа на залата, най-видими", colour: "#0acbb5" },
  { id: "B", label: "Strong", hint: "по главния поток", colour: "#2e70e6" },
  { id: "C", label: "Standard", hint: "срещу залата", colour: "#735ccc" },
  { id: "D", label: "Destination", hint: "в дъното, за демонстрации", colour: "#d9912e" },
] as const;
export type ZoneId = (typeof ZONES)[number]["id"];
export const zoneOf = (id: string) => ZONES.find((z) => z.id === id[0]);

/** [left, top, width, height] in percent of the plan image. */
export type Box = [number, number, number, number];

export const BOOTHS: { id: string; zone: ZoneId; box: Box }[] = [
  { id: "A1", zone: "A", box: [9.75, 43.82, 10.08, 4.71] },
  { id: "A2", zone: "A", box: [21.25, 43.82, 10.08, 4.71] },
  { id: "A3", zone: "A", box: [32.75, 43.88, 10.08, 4.76] },
  { id: "A4", zone: "A", box: [5.33, 49.18, 6.67, 7.12] },
  { id: "A5", zone: "A", box: [5.33, 56.76, 6.67, 7.06] },
  { id: "A6", zone: "A", box: [5.33, 64.29, 6.67, 7.12] },
  { id: "B1", zone: "B", box: [56.08, 50.41, 6.67, 7.12] },
  { id: "B2", zone: "B", box: [56.08, 62.59, 6.67, 7.06] },
  { id: "B3", zone: "B", box: [67.42, 42.12, 6.75, 7.06] },
  { id: "B4", zone: "B", box: [67.58, 49.94, 6.67, 7.12] },
  { id: "B5", zone: "B", box: [67.58, 73.47, 6.67, 7.06] },
  { id: "B6", zone: "B", box: [67.58, 57.71, 6.67, 7.06] },
  { id: "B7", zone: "B", box: [67.58, 65.59, 6.67, 7.06] },
  { id: "C1", zone: "C", box: [4.75, 75.82, 10.0, 4.71] },
  { id: "C2", zone: "C", box: [15.92, 75.82, 10.0, 4.71] },
  { id: "C3", zone: "C", box: [27.42, 75.82, 10.0, 4.71] },
  { id: "C4", zone: "C", box: [42.08, 75.88, 10.08, 4.71] },
  { id: "C5", zone: "C", box: [53.75, 75.88, 10.0, 4.71] },
  { id: "D1", zone: "D", box: [30.42, 84.24, 10.0, 4.71] },
  { id: "D2", zone: "D", box: [42.08, 84.24, 10.08, 4.71] },
  { id: "D3", zone: "D", box: [30.42, 90.53, 10.0, 4.71] },
  { id: "D4", zone: "D", box: [42.08, 90.53, 10.08, 4.71] },
  { id: "D5", zone: "D", box: [53.75, 84.24, 10.0, 4.71] },
  { id: "D6", zone: "D", box: [53.75, 90.53, 10.0, 4.71] },
  { id: "D7", zone: "D", box: [65.75, 84.24, 10.08, 4.71] },
  { id: "D8", zone: "D", box: [65.75, 90.53, 10.08, 4.71] },
];
export const isBooth = (v: unknown): v is string => BOOTHS.some((b) => b.id === v);

/**
 * What a module is right now. Never stored: "paid" is the deal's money
 * state, so marking a stand paid by hand could only drift from the invoice.
 */
export type BoothStatus = "free" | "held" | "reserved" | "paid";
export const STATUS = {
  free: { label: "свободен", colour: "transparent" },
  held: { label: "запазен (не партньор)", colour: "#6b7280" },
  reserved: { label: "договорен, не е платен", colour: "#d97706" },
  paid: { label: "платен", colour: "#146455" },
} as const;

export type BoardBooth = {
  id: string;
  zone: ZoneId;
  box: Box;
  status: BoothStatus;
  /** The partner on it, when the module is a partner's. */
  partner: { id: string; label: string; tier: string | null; money: string | null; stage: string } | null;
  holdLabel: string | null;
  note: string | null;
};

export type BoardPartner = { id: string; label: string; tier: string | null; money: string | null; stage: string; booths: string[] };
