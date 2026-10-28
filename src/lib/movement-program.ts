/**
 * The movement and recovery side of the programme: the Newton and Columbus
 * rooms and the stations that run alongside the stage. The talks on the
 * stage live in the database (see program-data.ts); this part is a fixed
 * timetable that changes rarely, so it stays in code.
 *
 * Names are typed once in Bulgarian - the English page transliterates them
 * (latin.ts); only titles that are words, not names, carry an English form.
 */

type Pair = { bg: string; en: string };

export type MoveSlot = {
  /** As printed: "10:30-11:15". */
  time: string;
  title: string;
  titleEn?: string;
  /** Who leads it ("Алекс", "д-р Виолета Азис"); `by` is the studio or brand, shown after the name. */
  host?: string;
  by?: string;
  seats: number;
  /** "up to 30 seats" - the room is bigger than the group it takes. */
  upTo?: boolean;
  /** A bookable workshop rather than a class. */
  workshop?: boolean;
};

export type MoveRoom = { room: string; slots: MoveSlot[] };

const body = (time: string, title: string, seats: number): MoveSlot => ({ time, title, by: "Body Space", seats });
const workshops = (): MoveSlot[] => [
  { time: "14:00-15:00", title: "The Power of Breath", host: "Яни Драгов", seats: 30, upTo: true, workshop: true },
  { time: "15:20-16:50", title: "Тялото, в което съм", titleEn: "The body I live in", host: "д-р Виолета Азис", seats: 15, workshop: true },
  { time: "17:00-18:00", title: "Търсене на златната среда", titleEn: "Finding the golden mean", host: "проф. Даниела Илиева", seats: 30, upTo: true, workshop: true },
];

/** Index 0 = Saturday, 1 = Sunday, like the stage programme. */
export const MOVEMENT_DAYS: MoveRoom[][] = [
  [
    {
      room: "Newton",
      slots: [
        { time: "10:30-11:15", title: "Morning Yoga Flow", host: "Алекс", seats: 30 },
        { time: "11:40-12:25", title: "Dynamic Flow", host: "Мая Пауновска", seats: 30 },
        { time: "12:50-13:35", title: "Mobility Lab", host: "Тодор Захариев", by: "MOVEZ", seats: 30 },
        ...workshops(),
      ],
    },
    {
      room: "Columbus 1",
      slots: [
        body("10:30-11:10", "Reformer Reset", 6),
        body("11:40-12:20", "Lagree Burn", 4),
        body("12:50-13:30", "Reformer Experience", 6),
        body("14:00-14:40", "Lagree Method", 4),
        body("15:20-16:00", "Reformer Strength", 6),
        body("17:00-17:40", "Lagree Burn", 4),
      ],
    },
  ],
  [
    {
      room: "Newton",
      slots: [
        { time: "10:30-11:15", title: "Wake Up & Flow", host: "Алекс", seats: 30 },
        { time: "11:40-12:25", title: "Mobility for Longevity", host: "Тодор Захариев", by: "MOVEZ", seats: 30 },
        { time: "12:50-13:35", title: "Dynamic Strength", host: "Мая Пауновска", seats: 30 },
        ...workshops(),
      ],
    },
    {
      room: "Columbus 1",
      slots: [
        body("10:30-11:10", "Lagree Burn", 4),
        body("11:40-12:20", "Reformer Reset", 6),
        body("12:50-13:30", "Lagree Strength", 4),
        body("14:00-14:40", "Reformer Experience", 6),
        body("15:20-16:00", "Lagree Method", 4),
        body("17:00-17:40", "Reformer Reset", 6),
      ],
    },
  ],
];

export type Station = {
  zone: string;
  items: { name: string; sub?: Pair }[];
  facts?: Pair;
  note?: Pair;
};

/** The same on both days. */
export const STATIONS: Station[] = [
  {
    zone: "Columbus 2",
    items: [{ name: "REV × POWER", sub: { bg: "REV Cycling + Power Plate", en: "REV Cycling + Power Plate" } }],
    facts: { bg: "30 мин, 9 места", en: "30 min, 9 seats" },
    note: { bg: "Сесии в 10:30, 11:40, 12:50, 14:00, 15:20, 17:00", en: "Sessions at 10:30, 11:40, 12:50, 14:00, 15:20, 17:00" },
  },
  {
    zone: "Newton Recovery",
    items: [{ name: "SCANECA 3D", sub: { bg: "Body Assessment", en: "Body Assessment" } }],
    facts: { bg: "30 мин, 1 човек", en: "30 min, 1 person" },
    note: { bg: "Индивидуални часове през целия ден", en: "Individual slots all day" },
  },
  {
    zone: "Newton Recovery",
    items: [{ name: "ENDOSPHERES", sub: { bg: "Терапия", en: "Therapy" } }],
    facts: { bg: "30 мин, 1 човек", en: "30 min, 1 person" },
    note: { bg: "Индивидуални часове през целия ден", en: "Individual slots all day" },
  },
  {
    zone: "Newton Recovery",
    items: [
      { name: "MITOLIGHT", sub: { bg: "До 5 души едновременно, според протокола", en: "Up to 5 people at a time, per protocol" } },
      { name: "PULSETTO", sub: { bg: "Според протокола", en: "Per protocol" } },
    ],
  },
];
