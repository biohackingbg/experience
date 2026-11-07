/**
 * The exhibition plan: 25 modules of 3 × 2 m, the 1 × 2 m B0 and the bar, in the
 * Grand Millennium foyer, as drawn in "Sofia_Life_Summit_2026_Exhibition_booths 2" (October
 * 2026). The second drawing moved the B row and C1, turned B1/B2/C5/D1/D7
 * upright, and gave B6's place to the bar and the hydration station, so B6
 * is gone. B0, the small module by the lifts above B3, is on the same drawing
 * but was not in the first image, so v3 of the image has it painted in. B8, the
 * same size, faces it across the corridor by the other lift bank (v4). Client-safe:
 * no server code, so the board can draw it in the browser.
 *
 * Each box is a position on the plan image, in percent of its width and
 * height, measured from the PDF's own vector rectangles rather than by eye.
 * v5 (7 Nov) puts the same modules on the hotel's own floor-2 plan: every box
 * was carried over from v4 through the atrium, which is on both drawings
 * (scale 0.283), and checked against the lift banks; the image is lightly
 * cropped, marks the Premium Lounge in Ballroom 3, and carries each module's
 * partner on it and in a legend underneath (as of 7 Nov - a change on the
 * board does not redraw the image). The source and the
 * script are in "Sofia Life Summit - визуали/83 План на щандовете v5".
 * The image is the plan with the modules already coloured; the board lays
 * its own state over them, so a change of partner never needs a new image.
 */

// Versioned name: the app caches the plan by URL, and a new drawing must not
// be served from an old cache under the old boxes.
export const PLAN_IMAGE = "/plan-shtandove-v5.webp";
/** width / height of the plan image, so the overlay keeps its shape. */
export const PLAN_ASPECT = 1097 / 815;

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
  { id: "A1", zone: "A", box: [30.09, 33.01, 4.66, 4.19] },
  { id: "A2", zone: "A", box: [35.43, 33.01, 4.66, 4.19] },
  { id: "A3", zone: "A", box: [40.77, 33.08, 4.66, 4.19] },
  { id: "A4", zone: "A", box: [28.02, 37.77, 3.11, 6.28] },
  { id: "A5", zone: "A", box: [28.02, 44.45, 3.11, 6.28] },
  { id: "A6", zone: "A", box: [28.02, 51.16, 3.11, 6.28] },
  { id: "B0", zone: "B", box: [58.91, 23.79, 1.73, 4.2] },
  { id: "B8", zone: "B", box: [54.59, 23.79, 1.73, 4.2] },
  { id: "B1", zone: "B", box: [50.76, 39.27, 3.11, 6.28] },
  { id: "B2", zone: "B", box: [46.5, 50.0, 3.11, 6.28] },
  { id: "B3", zone: "B", box: [57.69, 30.98, 3.11, 6.28] },
  { id: "B4", zone: "B", box: [54.13, 39.27, 3.11, 6.28] },
  { id: "B5", zone: "B", box: [57.92, 59.59, 3.11, 6.28] },
  { id: "B7", zone: "B", box: [57.97, 50.94, 3.11, 6.28] },
  { id: "C1", zone: "C", box: [26.72, 62.25, 4.66, 4.18] },
  { id: "C2", zone: "C", box: [33.26, 57.45, 4.66, 4.18] },
  { id: "C3", zone: "C", box: [38.21, 57.45, 4.66, 4.18] },
  { id: "C4", zone: "C", box: [43.29, 57.45, 4.66, 4.18] },
  { id: "C5", zone: "C", box: [51.54, 59.84, 3.11, 6.28] },
  { id: "D1", zone: "D", box: [39.49, 66.83, 3.11, 6.28] },
  { id: "D2", zone: "D", box: [45.1, 68.03, 4.66, 4.18] },
  { id: "D3", zone: "D", box: [39.49, 75.17, 4.66, 4.18] },
  { id: "D4", zone: "D", box: [44.21, 75.12, 4.66, 4.18] },
  { id: "D5", zone: "D", box: [49.91, 67.87, 4.66, 4.18] },
  { id: "D6", zone: "D", box: [48.94, 75.12, 4.66, 4.18] },
  { id: "D7", zone: "D", box: [57.97, 65.89, 3.11, 6.28] },
  { id: "D8", zone: "D", box: [53.63, 75.12, 4.66, 4.18] },
  // The bar by the main flow is let out like a module, so a partner can be
  // put on it from the board. It sits in the B row on the drawing, so it is
  // counted with zone B; the hydration-station bar below it is Health
  // Upgrade's and stays off the list.
  { id: "BAR", zone: "B", box: [51.77, 48.39, 3.68, 4.18] },
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
