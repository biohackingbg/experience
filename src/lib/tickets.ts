/**
 * The ticket tiers, in one place.
 *
 * The page, the checkout and the schema.org offers all read from here, so a
 * price can never be advertised in one place and charged in another.
 *
 * Prices are in **cents and VAT-inclusive**: consumer sales in Bulgaria must
 * advertise the final price. The net and VAT parts are derived, never typed in
 * by hand, so they cannot drift from the total.
 */

export const VAT_RATE = 0.2;
export const CURRENCY = "EUR";

export type TierId = "basic" | "full" | "protocol";

export type Tier = {
  id: TierId;
  name: string;
  /** Final price the buyer pays, VAT included, in cents. */
  priceCents: number;
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
    priceCents: 5000,
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
    priceCents: 14500,
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
    priceCents: 39000,
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

/** Splits a VAT-inclusive total into its net and VAT parts, in cents. */
export function splitVat(grossCents: number, rate: number = VAT_RATE) {
  const net = Math.round(grossCents / (1 + rate));
  return { netCents: net, vatCents: grossCents - net };
}

/** 5000 → "50", 14500 → "145", 4167 → "41.67" */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("bg-BG", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
