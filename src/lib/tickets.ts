/**
 * The ticket tiers, in one place.
 *
 * The page, the checkout and the schema.org offers all read from here, so a
 * price can never be advertised in one place and charged in another.
 *
 * Prices are in **cents and VAT-inclusive**: consumer sales in Bulgaria must
 * advertise the final price. The net and VAT parts are derived, never typed in
 * by hand, so they cannot drift from the total.
 *
 * There is no `priceCents` field on a tier, deliberately. A tier carries only
 * its regular price; what a buyer actually pays depends on whether the early
 * window is open, and `priceCents(tier, early)` demands that answer explicitly.
 * Money code should not be able to read "the price" without saying which one.
 */

export const VAT_RATE = 0.2;
export const CURRENCY = "EUR";

/**
 * The master switch for selling.
 *
 * Everything that could quote a price or start a checkout reads this -
 * including the server action, so a bookmarked /bilet or a cached page cannot
 * slip an order through while it is off.
 */
export const SALES_OPEN = true;

/** What the page says wherever a price would be. */
export const SALES_SOON_LABEL = "Очаквайте скоро";

/**
 * The launch window: the first 200 tickets, closed by hand.
 *
 * A live counter was tried and taken out. Not for the arithmetic - that
 * worked - but because a public countdown decides the ending for you: two
 * people buying the last two tickets at once, or the price flipping mid
 * evening with nobody watching. The organisers close it themselves, so the
 * moment is chosen rather than stumbled into.
 *
 * `open` is the switch. Flip it to false and every price on the site, in the
 * checkout and in the structured data moves to the list price together.
 * How many are actually sold is in the admin dashboard, which is where the
 * decision gets made from.
 *
 * Note on how this is worded on the page: under the Omnibus rules (ЗЗП чл.
 * 64б) an announced *reduction* must show the lowest price charged in the
 * previous 30 days, and these tickets have never been sold at the regular
 * price. So the struck-through figure is labelled as the price that applies
 * once the launch tickets are gone - a forward-looking condition, not a claim
 * about the past.
 */
export const EARLY_ACCESS = {
  /** The switch. False moves the whole site to the list prices. */
  open: true,
  /** How the offer is described, everywhere it is described. */
  label: "първите 200 билета",
  /** Shown wherever the regular price is struck through. */
  regularAfter: "след първите 200 билета",
};

/**
 * The pre-order window.
 *
 * Tickets are sold from August, as pre-orders, until the end of the month.
 * Said plainly on the page because a buyer paying in August is paying months
 * before the door opens and deserves to know that is deliberate.
 */
export const PRE_ORDER = {
  endsAt: new Date("2026-08-31T23:59:59+03:00"),
  endsLabel: "31 август",
  /** When the offer first became valid - matters to the structured data. */
  validFrom: "2026-08-01T00:00:00+03:00",
};

export function isPreOrder(now: Date = new Date()): boolean {
  return now <= PRE_ORDER.endsAt;
}

export type TierId = "core" | "plus" | "peak";

export type Tier = {
  id: TierId;
  name: string;
  /**
   * Both prices are stated, not derived: the early figures were chosen as
   * round numbers (35/89/249), and no single percentage produces them from
   * the equally round list prices (49/129/349).
   */
  earlyPriceCents: number;
  /** Regular price, VAT included, in cents. Applies from 1 September. */
  listPriceCents: number;
  /** Hard cap on how many of this tier may be sold. */
  capacity: number;
  tagline?: string;
  featured?: boolean;
  features: string[];
  absent: string[];
};

export const TIERS: Tier[] = [
  {
    id: "core",
    name: "CORE",
    earlyPriceCents: 3500,
    listPriceCents: 4900,
    capacity: 700,
    features: [
      "Един ден по избор",
      "Лекции при наличие на места",
      "Партньорски оферти и привилегии",
    ],
    absent: ["Без работилници", "Без специални преживявания"],
  },
  {
    id: "plus",
    name: "PLUS",
    earlyPriceCents: 8900,
    listPriceCents: 12900,
    capacity: 250,
    featured: true,
    features: [
      "И двата дни",
      "Приоритетен достъп до лекциите",
      "Работилниците включени",
      "1 специално преживяване по избор",
      // Храна и напитки - изчакват потвърждение на бюджета (24.08.2026).
      // "Смути + обяд в избран ден",
      "Goody bag на стойност €100+",
    ],
    absent: [],
  },
  {
    id: "peak",
    name: "PEAK",
    earlyPriceCents: 24900,
    listPriceCents: 34900,
    capacity: 50,
    tagline: "Ограничени места",
    features: [
      "Гарантиран достъп + премиум зона",
      "Работилници и преживявания с приоритет",
      // "Смути + обяд през двата дни",
      "Goody bag на стойност €250+",
      "Premium Lounge",
      "Meet & Greet с лектори",
      "Приоритетен вход",
    ],
    absent: [],
  },
];

export function getTier(id: string): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

/** Whether the launch prices still apply. */
export function isEarlyAccess(): boolean {
  return SALES_OPEN && EARLY_ACCESS.open;
}

/** What the buyer pays, VAT included, in cents. */
export function priceCents(tier: Tier, early: boolean): number {
  return early ? tier.earlyPriceCents : tier.listPriceCents;
}

/** Per tier, since the round prices imply slightly different cuts: "-29%". */
export function tierDiscountLabel(tier: Tier): string {
  return `-${Math.round((1 - tier.earlyPriceCents / tier.listPriceCents) * 100)}%`;
}

/** Splits a VAT-inclusive total into its net and VAT parts, in cents. */
export function splitVat(grossCents: number, rate: number = VAT_RATE) {
  const net = Math.round(grossCents / (1 + rate));
  return { netCents: net, vatCents: grossCents - net };
}

/** 5000 → "50", 14500 → "145", 10150 → "101,50" */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("bg-BG", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
