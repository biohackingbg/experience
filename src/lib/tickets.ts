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
 * The launch window.
 *
 * `endsAt` is a placeholder until the sales dates are fixed with the
 * association — change it here and the page, the checkout, the signup form and
 * the structured data all follow.
 *
 * Note on how this is worded on the page: under the Omnibus rules (ЗЗП чл. 64б)
 * an announced *reduction* must show the lowest price charged in the previous
 * 30 days, and these tickets have never been sold at the regular price. So the
 * struck-through figure is labelled as the price that starts on a date — a
 * forward-looking schedule, not a claim about the past.
 */
export const EARLY_ACCESS = {
  discount: 0.3,
  // Ends with the pre-order window: one deadline, deliberately. After
  // 31 August there are no further discounts — tickets go to list price.
  endsAt: new Date("2026-08-31T23:59:59+03:00"),
  /** Deadline as it reads in a sentence. */
  endsLabel: "31 август",
  /** Shown wherever the regular price is struck through. */
  regularFrom: "1 септември",
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
  /** When the offer first became valid — matters to the structured data. */
  validFrom: "2026-08-01T00:00:00+03:00",
};

export function isPreOrder(now: Date = new Date()): boolean {
  return now <= PRE_ORDER.endsAt;
}

export type TierId = "basic" | "full" | "protocol";

export type Tier = {
  id: TierId;
  name: string;
  /** Regular price, VAT included, in cents. Applies once the window closes. */
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
    id: "basic",
    name: "Основен",
    listPriceCents: 5000,
    capacity: 700,
    features: [
      "Един ден по избор",
      "Главна сцена",
      "Village и дегустации",
      "2 базови станции",
    ],
    absent: ["Без работилници"],
  },
  {
    id: "full",
    name: "Пълен",
    listPriceCents: 14500,
    capacity: 250,
    featured: true,
    features: [
      "И двата дни, двете сцени",
      "Пълен паспорт, 12 станции",
      "2 работилници по избор",
      "1 ритуал по избор",
      "Обяд в 1 ден",
    ],
    absent: [],
  },
  {
    id: "protocol",
    name: "Протокол",
    listPriceCents: 39000,
    capacity: 50,
    tagline: "Ограничени места",
    features: [
      "Всичко от Пълен",
      "Кръвен панел с разчитане",
      "Гарантирани места",
      "90-дневен личен протокол",
    ],
    absent: [],
  },
];

export function getTier(id: string): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

/**
 * Whether the early window is open.
 *
 * Server code calls this and passes the answer down. The browser is never
 * asked, because a device with a wrong clock would then show one price while
 * the server charged another.
 */
export function isEarlyAccess(now: Date = new Date()): boolean {
  return now <= EARLY_ACCESS.endsAt;
}

/** What the buyer pays, VAT included, in cents. */
export function priceCents(tier: Tier, early: boolean): number {
  return early
    ? Math.round(tier.listPriceCents * (1 - EARLY_ACCESS.discount))
    : tier.listPriceCents;
}

/** "-30%" */
export function discountLabel(): string {
  return `-${Math.round(EARLY_ACCESS.discount * 100)}%`;
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
