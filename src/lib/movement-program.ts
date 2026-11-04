/**
 * The movement and recovery side of the programme: the Newton and Columbus
 * rooms and the stations that run alongside the stage. The talks on the
 * stage live in the database (see program-data.ts); this part is a fixed
 * timetable that changes rarely, so it stays in code.
 *
 * The bookable sessions (workshops, the small rooms, the one-person
 * stations) are also rows in the workshops table, which is what the ticket
 * page and the app book against; this file is the page's timetable only.
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

export type MoveRoom = {
  room: string;
  /** The studio behind the whole room, shown in its header as "Pilates Reformer by <logo>". */
  partner?: { label: string; logo: string; name: string };
  slots: MoveSlot[];
};

const BODY_SPACE = { label: "Pilates Reformer & Lagree by", logo: "/partners/bodyspace-wordmark-white.png", name: "Body Space" };

const body = (time: string, title: string, host: string, seats: number): MoveSlot => ({ time, title, host, by: "Body Space", seats });
const movez = (time: string, title: string): MoveSlot => ({ time, title, host: "Тодор Захариев", by: "MOVEZ", seats: 30 });
const maya = (time: string, title: string, upTo = false): MoveSlot => ({ time, title, host: "Мая Пауновска", seats: 30, upTo });
const yoga = (time: string): MoveSlot => ({ time, title: "Morning Yoga Flow", host: "Александра Михайлова", seats: 30 });

/** Index 0 = Saturday, 1 = Sunday, like the stage programme. */
export const MOVEMENT_DAYS: MoveRoom[][] = [
  [
    {
      room: "Newton",
      slots: [
        yoga("10:00-10:40"),
        maya("10:50-11:30", "Dynamic Flow"),
        maya("11:40-12:25", "Dynamic Strength"),
        { time: "12:35-13:30", title: "The Power of Breath", host: "Яни Драгов", seats: 30, workshop: true },
        { time: "14:00-15:00", title: "The Inflamed Gut: The Hidden Barrier to Longevity", host: "проф. Godfrey Grech", seats: 15, workshop: true },
        { time: "15:20-16:50", title: "Тялото, в което съм", titleEn: "The body I live in", host: "д-р Виолета Азис", seats: 15, workshop: true },
        movez("17:00-18:00", "Mobility Lab"),
      ],
    },
    {
      room: "Columbus 1",
      partner: BODY_SPACE,
      slots: [
        body("10:00-10:40", "Reformer Reset", "Кристина", 6),
        body("10:50-11:30", "Lagree Burn", "Александра", 4),
        body("11:40-12:20", "Reformer Reset", "Кристина", 6),
        body("12:30-13:10", "Lagree Method", "Николета", 4),
        body("14:00-14:40", "Reformer Reset", "Кристина", 6),
        body("14:50-15:30", "Lagree Burn", "Николета", 4),
        body("15:40-16:20", "Reformer Reset", "Кристина", 6),
        body("16:30-17:10", "Lagree Method", "Николета", 4),
      ],
    },
  ],
  [
    {
      room: "Newton",
      slots: [
        yoga("10:00-10:40"),
        movez("10:50-11:30", "Mobility Lab"),
        movez("11:40-12:20", "Slow Strength"),
        maya("12:40-13:20", "Dynamic Strength"),
        maya("13:30-15:10", "Functional Training", true),
        { time: "15:20-16:50", title: "В търсене на златната среда", titleEn: "In search of the golden mean", host: "проф. Даниела Илиева", seats: 15, workshop: true },
        {
          time: "17:00-17:40",
          title: "Тялото говори: стрес, хормони и адаптация през погледа на ендобиогенната медицина",
          titleEn: "The body speaks: stress, hormones and adaptation through endobiogenic medicine",
          host: "Катина Симеонова",
          seats: 15,
          workshop: true,
        },
      ],
    },
    {
      room: "Columbus 1",
      partner: BODY_SPACE,
      slots: [
        body("10:00-10:40", "Lagree Burn", "Христина", 4),
        body("10:50-11:30", "Reformer Reset", "Кристина", 6),
        body("11:40-12:20", "Lagree Strength", "Христина", 4),
        body("12:30-13:10", "Reformer Experience", "Кристина", 6),
        body("14:00-14:40", "Lagree Method", "Христина", 4),
        body("14:50-15:30", "Reformer Reset", "Кристина", 6),
        body("15:40-16:20", "Lagree Burn", "Христина", 4),
        body("16:30-17:10", "Reformer Strength", "Кристина", 6),
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

/** The same on both days, except where the note says otherwise. */
export const STATIONS: Station[] = [
  {
    zone: "Columbus 2",
    items: [{ name: "REV × POWER", sub: { bg: "REV Cycling + Power Plate", en: "REV Cycling + Power Plate" } }],
    facts: { bg: "15 мин, 3 места REV и 6 Power Plate", en: "15 min, 3 seats REV and 6 Power Plate" },
    note: { bg: "Сесии на всеки 25 минути, 10:30-17:25, с обедна почивка", en: "Sessions every 25 minutes, 10:30-17:25, with a lunch break" },
  },
  {
    zone: "Щанд D4",
    items: [{ name: "SCANECA 3D + INBODY", sub: { bg: "Body Assessment", en: "Body Assessment" } }],
    facts: { bg: "20 мин, 1 човек", en: "20 min, 1 person" },
    note: { bg: "Индивидуални часове 10:00-16:40, и двата дни", en: "Individual slots 10:00-16:40, both days" },
  },
  {
    zone: "Щанд D4",
    items: [
      { name: "ENDOSPHERES", sub: { bg: "Терапия, само в събота", en: "Therapy, Saturday only" } },
      { name: "EMSELLA", sub: { bg: "Терапия, и двата дни", en: "Therapy, both days" } },
    ],
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
