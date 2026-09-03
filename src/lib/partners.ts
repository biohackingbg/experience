/**
 * Confirmed partners - the ones with a signature, shown on the public page.
 *
 * One line per partner. The page decides the layout from how many there are,
 * so adding a name never means touching the design: two partners get a wide
 * statement row, seven get a wall.
 *
 * Never add a name here before the contract is signed. (Placeholder names were
 * once left in `sponsors.ts` from a layout preview and went live.)
 */

export type Partner = {
  name: string;
  /**
   * Path under /public/partners: the white version of the mark, since the row
   * sits on the dark green with no tile behind it. Where a partner did not
   * supply one, it was made from their file - the shape is theirs, only the
   * colour is dropped. Each file is a 600x300 canvas with the mark centred and
   * scaled so its footprint matches the others'. Balancing by ink instead
   * inverted the wall: dense square marks came out small and sparse wide
   * ones came out large.
   * Optional: a deal is often signed before the artwork arrives, and the name
   * set in type carries the slot until it does.
   */
  logo?: string;
  url?: string;
  /** What they are partnering on, one short line: "Партньор на Възстановяване". */
  role?: string;
};

export const PARTNERS: Partner[] = [
  { name: "Health Upgrade", logo: "/partners/health-upgrade-white.png" },
  { name: "Amuse Bouche", logo: "/partners/amuse-bouche-white.png" },
  { name: "Regina Life Clinic", logo: "/partners/regina-life-clinic-white.png" },
  { name: "Alpha Life Sciences", logo: "/partners/alpha-life-sciences-white.png" },
  { name: "AgeHack", logo: "/partners/agehack-white.png" },
  { name: "Therabody", logo: "/partners/therabody-white.png" },
  // Therabody's own studio brand, confirmed separately from Therabody.
  { name: "RE START by Therabody", logo: "/partners/restart-therabody-white.png" },
  { name: "Dupissima Aesthetics", logo: "/partners/dupissima-white.png" },
  { name: "FITBOX", logo: "/partners/fitbox-white.png" },
  { name: "Manchini Coffee", logo: "/partners/manchini-coffee-white.png" },
  { name: "4+", logo: "/partners/four-plus-white.png" },
  { name: "Skabrin property", logo: "/partners/skabrin-white.png" },
  { name: "Pulsetto", logo: "/partners/pulsetto-white.png" },
  { name: "Power Plate", logo: "/partners/power-plate-white.png" },
  { name: "bodyspace", logo: "/partners/bodyspace-white.png" },
  { name: "Genova Diagnostics", logo: "/partners/genova-white.png" },
  { name: "Dr. Bastet", logo: "/partners/dr-bastet-white.png" },
  { name: "SilaBG", logo: "/partners/sila-bg-white.png" },
];
