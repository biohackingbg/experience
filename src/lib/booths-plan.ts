/**
 * The exhibition plan: 25 modules of 3 × 2 m plus the bar, in the Grand Millennium
 * foyer, as drawn in "Sofia_Life_Summit_2026_Exhibition_booths 2" (October
 * 2026). The second drawing moved the B row and C1, turned B1/B2/C5/D1/D7
 * upright, and gave B6's place to the bar and the hydration station, so B6
 * is gone. Client-safe:
 * no server code, so the board can draw it in the browser.
 *
 * Each box is a position on the plan image, in percent of its width and
 * height, measured from the PDF's own vector rectangles rather than by eye.
 * The image is the plan with the modules already coloured; the board lays
 * its own state over them, so a change of partner never needs a new image.
 */

// Versioned name: the app caches the plan by URL, and a new drawing must not
// be served from an old cache under the old boxes.
export const PLAN_IMAGE = "/plan-shtandove-v2.webp";
/** width / height of the plan image, so the overlay keeps its shape. */
export const PLAN_ASPECT = 1825 / 1680;

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
  { id: "A1", zone: "A", box: [11.02, 43.33, 6.6, 4.79] },
  { id: "A2", zone: "A", box: [18.58, 43.33, 6.6, 4.79] },
  { id: "A3", zone: "A", box: [26.14, 43.41, 6.6, 4.79] },
  { id: "A4", zone: "A", box: [8.09, 48.76, 4.4, 7.17] },
  { id: "A5", zone: "A", box: [8.09, 56.4, 4.4, 7.17] },
  { id: "A6", zone: "A", box: [8.09, 64.06, 4.4, 7.17] },
  { id: "B1", zone: "B", box: [40.27, 50.48, 4.4, 7.17] },
  { id: "B2", zone: "B", box: [34.25, 62.74, 4.4, 7.17] },
  { id: "B3", zone: "B", box: [50.08, 41.01, 4.4, 7.17] },
  { id: "B4", zone: "B", box: [45.04, 50.48, 4.4, 7.17] },
  { id: "B5", zone: "B", box: [50.41, 73.69, 4.4, 7.17] },
  { id: "B7", zone: "B", box: [50.47, 63.81, 4.4, 7.17] },
  { id: "C1", zone: "C", box: [6.25, 76.73, 6.6, 4.78] },
  { id: "C2", zone: "C", box: [15.51, 71.25, 6.6, 4.78] },
  { id: "C3", zone: "C", box: [22.52, 71.25, 6.6, 4.78] },
  { id: "C4", zone: "C", box: [29.7, 71.25, 6.6, 4.78] },
  { id: "C5", zone: "C", box: [41.38, 73.98, 4.4, 7.17] },
  { id: "D1", zone: "D", box: [24.33, 81.96, 4.4, 7.17] },
  { id: "D2", zone: "D", box: [32.27, 83.33, 6.6, 4.78] },
  { id: "D3", zone: "D", box: [24.33, 91.49, 6.6, 4.78] },
  { id: "D4", zone: "D", box: [31.01, 91.43, 6.6, 4.78] },
  { id: "D5", zone: "D", box: [39.07, 83.15, 6.6, 4.78] },
  { id: "D6", zone: "D", box: [37.7, 91.43, 6.6, 4.78] },
  { id: "D7", zone: "D", box: [50.47, 80.89, 4.4, 7.17] },
  { id: "D8", zone: "D", box: [44.33, 91.43, 6.6, 4.78] },
  // The bar by the main flow is let out like a module, so a partner can be
  // put on it from the board. It sits in the B row on the drawing, so it is
  // counted with zone B; the hydration-station bar below it is Health
  // Upgrade's and stays off the list.
  { id: "BAR", zone: "B", box: [41.7, 60.89, 5.21, 4.78] },
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
