/**
 * Option lists shared by the admin forms and the server code that reads
 * them. Deliberately free of "server-only" and of the database: a client
 * component imports these to draw a <select>, and the moment this file
 * touched the DB the build would drag postgres into the browser bundle.
 */

/** The packages as the deck sells them; "extra" covers the à-la-carte items. */
export const TIERS = [
  { id: "village", label: "Village щанд" },
  { id: "silver", label: "Сребърен" },
  { id: "gold", label: "Златен" },
  { id: "platinum", label: "Платинен" },
  { id: "both", label: "Двете събития" },
  { id: "extra", label: "Екстра" },
  { id: "media", label: "Медиен / бартер" },
] as const;
export type TierId = (typeof TIERS)[number]["id"];
export const isTier = (v: unknown): v is TierId => TIERS.some((t) => t.id === v);

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
