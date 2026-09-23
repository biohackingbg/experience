/**
 * Option lists shared by the admin forms and the server code that reads
 * them. Deliberately free of "server-only" and of the database: a client
 * component imports these to draw a <select>, and the moment this file
 * touched the DB the build would drag postgres into the browser bundle.
 */

/**
 * The packages as the deck sells them, at the deck's prices.
 *
 * `priceCents` is the list price, net of VAT, and exists so a form can show
 * what the package costs beside its name - never to fill an amount in by
 * itself. A deal is whatever was agreed, and a package that quietly
 * overwrote a negotiated number would be worse than no help at all.
 *
 * `label` stays the bare name because it is also what an invoice line is
 * built from; the price is added only where a menu is drawn.
 *
 * "both" is the old lump for the two events together, kept so the partners
 * who carry it do not lose their package; the three "+" levels below are
 * what the deck actually sells.
 */
export const TIERS = [
  { id: "village", label: "Village щанд", priceCents: 250000 },
  { id: "silver", label: "Сребърен", priceCents: 350000 },
  { id: "gold", label: "Златен", priceCents: 550000 },
  { id: "platinum", label: "Платинен", priceCents: 950000 },
  { id: "silver-plus", label: "Сребърен + (двете събития)", priceCents: 1000000 },
  { id: "gold-plus", label: "Златен + (двете събития)", priceCents: 1200000 },
  { id: "platinum-plus", label: "Платинен + (двете събития)", priceCents: 1700000 },
  { id: "recovery", label: "Партньор на Recovery", priceCents: 450000 },
  { id: "movement", label: "Партньор на Движение", priceCents: 300000 },
  { id: "workshop", label: "Презентация / уъркшоп", priceCents: 450000 },
  { id: "bag", label: "Материал във фестивалната чанта", priceCents: 50000 },
  { id: "both", label: "Двете събития", priceCents: null },
  { id: "extra", label: "Екстра", priceCents: null },
  { id: "media", label: "Медиен / бартер", priceCents: null },
  { id: "custom", label: "Друго / по договаряне", priceCents: null },
] as const;
export type TierId = (typeof TIERS)[number]["id"];
export const isTier = (v: unknown): v is TierId => TIERS.some((t) => t.id === v);

/** "Златен · 5 500 €" for a menu; the bare name when the package has no list price. */
export function tierMenuLabel(t: { label: string; priceCents: number | null }): string {
  if (t.priceCents === null) return t.label;
  return `${t.label} · ${(t.priceCents / 100).toLocaleString("bg-BG")} €`;
}

export const tierPriceCents = (id: string | null | undefined): number | null =>
  TIERS.find((t) => t.id === id)?.priceCents ?? null;

/** Where the cash is. Agreed money is a promise; paid money is in the bank. */
export const MONEY = [
  { id: "agreed", label: "договорено" },
  { id: "invoiced", label: "фактурирано" },
  { id: "paid", label: "платено" },
] as const;
export type MoneyId = (typeof MONEY)[number]["id"];
export const isMoney = (v: unknown): v is MoneyId => MONEY.some((m) => m.id === v);

/** Fixed, so "Зала" and "зала" cannot become two categories. */
export const CATEGORIES = [
  { id: "venue", label: "Зала" },
  { id: "catering", label: "Кетъринг" },
  { id: "tech", label: "Техника и сцена" },
  { id: "speakers", label: "Лектори и пътувания" },
  { id: "marketing", label: "Маркетинг" },
  { id: "production", label: "Продукция и печат" },
  { id: "team", label: "Екип" },
  { id: "other", label: "Други" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const isCategory = (v: unknown): v is CategoryId => CATEGORIES.some((c) => c.id === v);
export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const EXPENSE_STATUS = [
  { id: "planned", label: "планиран" },
  { id: "invoiced", label: "фактуриран" },
  { id: "paid", label: "платен" },
  { id: "cancelled", label: "отменен" },
] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUS)[number]["id"];
export const isExpenseStatus = (v: unknown): v is ExpenseStatus =>
  EXPENSE_STATUS.some((s) => s.id === v);

/**
 * What a sponsor delivers. Fixed ids rather than free text: the note field
 * carries the conversation, this carries what has to be built, collected or
 * scheduled - and only a fixed list can be counted across all partners.
 */
export const DELIVERABLES = [
  { id: "stand", label: "Щанд", short: "щанд" },
  { id: "activation", label: "Активация в зона", short: "активация" },
  { id: "workshop", label: "Уъркшоп", short: "уъркшоп" },
  { id: "speaker", label: "Лектор на сцената", short: "лектор" },
  { id: "logo", label: "Лого на сайта и сцената", short: "лого" },
  { id: "bag", label: "Материал в чантата", short: "чанта" },
  { id: "goody", label: "Продукт за goody bag", short: "продукт" },
] as const;
export type DeliverableId = (typeof DELIVERABLES)[number]["id"];
export const isDeliverable = (v: unknown): v is DeliverableId =>
  DELIVERABLES.some((d) => d.id === v);
export const deliverableShort = (id: string) =>
  DELIVERABLES.find((d) => d.id === id)?.short ?? id;

/** "stand,bag" -> ["stand", "bag"], ignoring anything unrecognised. */
export function parseDeliverables(v: string | null): DeliverableId[] {
  if (!v) return [];
  return v.split(",").map((x) => x.trim()).filter(isDeliverable);
}
