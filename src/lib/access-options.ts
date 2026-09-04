/** The admin pages a grant can open. Client-safe: the access form draws checkboxes from it. */
export const PAGES = [
  { id: "tablo", label: "Табло (продажби)", href: "/admin", sensitive: true },
  { id: "finansi", label: "Финанси", href: "/admin/finansi", sensitive: true },
  { id: "fakturi", label: "Фактури", href: "/admin/fakturi", sensitive: true },
  { id: "zapisvaniya", label: "Записвания", href: "/admin/zapisvaniya", sensitive: true },
  { id: "pisma", label: "Писма", href: "/admin/pisma", sensitive: true },
  { id: "poseshteniya", label: "Посещения", href: "/admin/poseshteniya", sensitive: false },
  { id: "reklama", label: "Реклама", href: "/admin/reklama", sensitive: false },
  { id: "promo", label: "Промо кодове", href: "/admin/promo", sensitive: false },
  { id: "programa", label: "Програма", href: "/admin/programa", sensitive: false },
  { id: "lektori", label: "Лектори", href: "/admin/lektori", sensitive: false },
  { id: "prezentaciya", label: "Презентация (партньори)", href: "/admin/prezentaciya", sensitive: false },
  { id: "podgotovka", label: "Подготовка", href: "/admin/podgotovka", sensitive: false },
  { id: "vhod", label: "Вход на събитието", href: "/admin/vhod", sensitive: false },
] as const;
export type PageId = (typeof PAGES)[number]["id"];
export const isPageId = (v: unknown): v is PageId => PAGES.some((p) => p.id === v);
export const pageLabel = (id: string) => PAGES.find((p) => p.id === id)?.label ?? id;
