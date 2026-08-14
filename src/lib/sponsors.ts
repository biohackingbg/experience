/**
 * Partners.
 *
 * Two commercially different things, deliberately not mixed:
 *
 * - A zone sponsor buys one of the four zones (3 × €8 000 in the proposal).
 *   The card names the zone, which is a stronger thing to sell than "Gold":
 *   it ties the brand to an experience and explains the price.
 * - A Village exhibitor buys a stand (30 × ~€1 250). Equal tier, many of them,
 *   so they share one wall.
 *
 * Both lists start empty and the section renders nothing until a logo exists.
 * An empty partner grid on a page that sells tickets reads as "nobody backs
 * this" — the same trap as a wall of unconfirmed speaker cards.
 *
 * Never add a name here before the contract is signed.
 */

/** The four zones from the concept. Village is sold as stands, not sponsored. */
export type Zone = "Сцена" | "Лаборатория" | "Ритуали";

export type ZoneSponsor = {
  zone: Zone;
  name: string;
  /**
   * Path under /public. Full colour — sponsor agreements usually specify how
   * the mark may be shown. Optional: a deal can be signed before the artwork
   * arrives, and the name set large carries the card until it does.
   */
  logo?: string;
  url?: string;
};

export type Exhibitor = {
  name: string;
  logo?: string;
  url?: string;
  /** добавки · устройства · лаборатории · клиники · храна */
  category?: string;
};

/** What each zone promises, shown while the sponsor slot is being sold. */
export const ZONE_BLURB: Record<Zone, string> = {
  Сцена: "600 места, две сцени, международни лектори.",
  Лаборатория: "12 станции за измерване, пълен паспорт.",
  Ритуали: "Студ, сауна, дишане, red light, PEMF.",
};

export const ZONE_SPONSORS: ZoneSponsor[] = [
  { zone: "Сцена", name: "Вашият бранд" },
  { zone: "Лаборатория", name: "Вашият бранд" },
  { zone: "Ритуали", name: "Вашият бранд" },
];

export const EXHIBITORS: Exhibitor[] = [
  { name: "Вашият бранд", category: "устройства" },
  { name: "Бранд 02", category: "лаборатории" },
  { name: "Бранд 03", category: "клиники" },
  { name: "Бранд 04", category: "храна" },
  { name: "Бранд 05", category: "технологии" },
  { name: "Бранд 06", category: "добавки" },
  { name: "Бранд 07", category: "устройства" },
  { name: "Бранд 08", category: "лаборатории" },
  { name: "Бранд 09", category: "клиники" },
  { name: "Бранд 10", category: "храна" },
  { name: "Бранд 11", category: "технологии" },
  { name: "Бранд 12", category: "добавки" },
  { name: "Бранд 13", category: "устройства" },
  { name: "Бранд 14", category: "лаборатории" },
  { name: "Бранд 15", category: "клиники" },
  { name: "Бранд 16", category: "храна" },
  { name: "Бранд 17", category: "технологии" },
  { name: "Бранд 18", category: "добавки" },
];
