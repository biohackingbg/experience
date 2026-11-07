/** The admin pages a grant can open. Client-safe: the access form draws checkboxes from it. */
export const PAGES = [
  { id: "tablo", label: "Dashboard (продажби)", href: "/admin", sensitive: true },
  { id: "finansi", label: "Финанси", href: "/admin/finansi", sensitive: true },
  { id: "fakturi", label: "Фактури", href: "/admin/fakturi", sensitive: true },
  { id: "dokumenti", label: "Проформи и фактури (не билети)", href: "/admin/dokumenti", sensitive: true },
  { id: "zapisvaniya", label: "Записвания", href: "/admin/zapisvaniya", sensitive: true },
  { id: "pisma", label: "Писма", href: "/admin/pisma", sensitive: true },
  { id: "poseshteniya", label: "Посещения", href: "/admin/poseshteniya", sensitive: false },
  { id: "reklama", label: "Реклама", href: "/admin/reklama", sensitive: false },
  { id: "promo", label: "Промо кодове", href: "/admin/promo", sensitive: false },
  { id: "programa", label: "Програма", href: "/admin/programa", sensitive: false },
  { id: "lektori", label: "Лектори", href: "/admin/lektori", sensitive: false },
  { id: "prezentaciya", label: "Презентация (партньори)", href: "/admin/prezentaciya", sensitive: false },
  { id: "partniori", label: "Партньори (профили)", href: "/admin/partniori", sensitive: false },
  { id: "oferti", label: "Оферти (приложение)", href: "/admin/oferti", sensitive: false },
  { id: "ritam", label: "30 дни ритъм (приложение)", href: "/admin/ritam", sensitive: false },
  { id: "podgotovka", label: "Подготовка", href: "/admin/podgotovka", sensitive: false },
  { id: "shtandove", label: "Щандове (план на залата)", href: "/admin/shtandove", sensitive: false },
  { id: "vhod", label: "Вход на събитието", href: "/admin/vhod", sensitive: false },
  { id: "izdai", label: "Издаване на билети", href: "/admin/izdai", sensitive: true },
  { id: "rabotilnici", label: "Работилници", href: "/admin/rabotilnici", sensitive: false },
  { id: "zala", label: "Зала (вход в работилници и преживявания)", href: "/admin/zala", sensitive: false },
  { id: "knigi", label: "Книги (продажба с QR)", href: "/admin/knigi", sensitive: false },
  { id: "torbichki", label: "Goody bags (раздаване)", href: "/admin/torbichki", sensitive: false },
  { id: "masazhi", label: "Масажи Sense Wellness (само щанд B8)", href: "/admin/masazhi", sensitive: false },
  { id: "therabody", label: "Re Start by Therabody (само щанд B1)", href: "/admin/therabody", sensitive: false },
  { id: "n8", label: "Skin Check by N8 Molecule (само щанд C5)", href: "/admin/n8", sensitive: false },
  { id: "obsidian", label: "PEMF Bed by Obsidian Club (само щанд B2)", href: "/admin/obsidian", sensitive: false },
  { id: "tiana", label: "Tiana Presolska (само щанд D4)", href: "/admin/tiana", sensitive: false },
  { id: "emsella", label: "Emsella (само часовете ѝ на щанд D4)", href: "/admin/emsella", sensitive: false },
  { id: "scaneca", label: "Scaneca 3D + InBody (само часовете ѝ на щанд D4)", href: "/admin/scaneca", sensitive: false },
  { id: "logistika", label: "Логистика на лекторите", href: "/admin/logistika", sensitive: true },
  { id: "smeni", label: "Смени", href: "/admin/smeni", sensitive: true },
] as const;
export type PageId = (typeof PAGES)[number]["id"];
export const isPageId = (v: unknown): v is PageId => PAGES.some((p) => p.id === v);
export const pageLabel = (id: string) => PAGES.find((p) => p.id === id)?.label ?? id;

/**
 * The pages that show one partner stand alone, for that partner's own access
 * link: the stand's 15-minute slots, its names, and nothing of the rooms.
 */
export const STAND_PAGES = { masazhi: "Щанд B8", therabody: "Щанд B1", n8: "Щанд C5", obsidian: "Щанд B2", tiana: "Щанд D4" } as const;

/**
 * Every partner page that shows slots: a whole stand (STAND_PAGES), or one
 * procedure at a stand that runs several (D4: Emsella and Scaneca have their
 * own operators). A grant on one of these may see and mark only its slots.
 */
export const STAND_SCOPES: { page: PageId; location: string; title?: string }[] = [
  ...(Object.entries(STAND_PAGES) as [PageId, string][]).map(([page, location]) => ({ page, location })),
  { page: "emsella", location: "Щанд D4", title: "Emsella" },
  { page: "scaneca", location: "Щанд D4", title: "Scaneca 3D + InBody" },
];
