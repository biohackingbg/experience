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
   * Path under /public/partners. Optional: a deal is often signed before the
   * artwork arrives, and the name set in type carries the tile until it does.
   */
  logo?: string;
  /**
   * A white / single-colour version of the mark, for the dark background.
   * When a partner supplies one it is used directly on the green; when they
   * do not, `logo` is shown on a light tile instead, which keeps their own
   * colours intact rather than inventing a treatment their brand guide may
   * not permit.
   */
  logoLight?: string;
  url?: string;
  /** What they are partnering on, one short line: "Партньор на Възстановяване". */
  role?: string;
};

export const PARTNERS: Partner[] = [
  { name: "Regina Life Clinic", logo: "/partners/regina-life-clinic.webp" },
  // Their own white version, so it goes straight on the green.
  { name: "Alpha Life Sciences", logoLight: "/partners/alpha-life-sciences-white.png" },
  { name: "AgeHack", logo: "/partners/agehack.png" },
  { name: "Therabody", logo: "/partners/therabody.png" },
  // Therabody's own studio brand, confirmed separately from Therabody.
  { name: "RE START by Therabody", logo: "/partners/restart-therabody.png" },
  { name: "Dupissima Aesthetics", logo: "/partners/dupissima.png" },
  { name: "FITBOX", logo: "/partners/fitbox.jpg" },
  { name: "Manchini Coffee", logo: "/partners/manchini-coffee.png" },
];
