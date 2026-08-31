/**
 * Partners.
 *
 * Two commercially different things, deliberately not mixed:
 *
 * - A zone sponsor buys one of the zones the day is built from. The card
 *   names the zone, which is a stronger thing to sell than "Gold": it ties
 *   the brand to an experience and explains the price.
 * - A Village exhibitor buys a stand, one of thirty. Equal tier, many of
 *   them, so they share one wall.
 *
 * Prices live in the partner deck, not here - they have moved once already
 * and a number in this comment only goes stale.
 *
 * Both lists start empty and the section renders nothing until a logo exists.
 * An empty partner grid on a page that sells tickets reads as "nobody backs
 * this" - the same trap as a wall of unconfirmed speaker cards.
 *
 * Never add a name here before the contract is signed.
 */

/**
 * The zones a brand can put its name on: the four the day is built from
 * (SummitZones.tsx) minus Village, which is sold as stands rather than
 * sponsored - a sponsor cannot buy the zone the other sponsors are in.
 *
 * Spelled exactly as the deck sells them. A partner who paid for "името на
 * зоната" has to find that name on the public page.
 */
export type Zone = "Сцена" | "Движение" | "Възстановяване";

export type ZoneSponsor = {
  zone: Zone;
  name: string;
  /**
   * Path under /public. Full colour - sponsor agreements usually specify how
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
  Сцена: "18 лекции и панела, международни лектори.",
  Движение: "Power Plate и пилатес, със записан час.",
  Възстановяване: "Breathwork сесии и Recovery зона, по 30 минути.",
};

// Empty until a contract is signed - the section renders nothing until then.
// (Placeholder names were left here from a layout preview and went live;
// keep these arrays empty rather than "Вашият бранд".)
export const ZONE_SPONSORS: ZoneSponsor[] = [];

export const EXHIBITORS: Exhibitor[] = [];
