import type { Lang } from "@/lib/i18n";

/**
 * Every word on the public site, in both languages.
 *
 * One file rather than a translation per component: a section's Bulgarian
 * and its English sit on adjacent lines, so a change to one is visibly a
 * change to the other, and nothing can be translated into a different
 * promise than the page next to it makes. Client-safe - the speaker grid
 * and the tier cards are client components.
 *
 * Content typed by the team (the programme, the speakers) lives in the
 * database with its own English fields; this file is the frame around it.
 */

export type Copy<T> = Record<Lang, T>;
export const pick = <T,>(c: Copy<T>, lang: Lang): T => c[lang];

export const NAV: Copy<{
  links: { href: string; label: string }[];
  home: string;
  buy: (price: string) => string;
  buyShort: (price: string) => string;
  soon: string;
  soonShort: string;
  otherLang: string;
  otherLangShort: string;
}> = {
  bg: {
    links: [
      { href: "#lektori", label: "Лектори" },
      { href: "#concept", label: "Станции" },
      { href: "#program", label: "Програма" },
      { href: "#tickets", label: "Билети" },
    ],
    home: "Biohacking Experience - начало",
    buy: (price) => `Купи билет от ${price} €`,
    /** What fits on a phone: the price stays, the verb goes. */
    buyShort: (price) => `Билети от ${price} €`,
    soon: "Билети - скоро",
    soonShort: "Билети",
    otherLang: "English",
    otherLangShort: "EN",
  },
  en: {
    links: [
      { href: "#lektori", label: "Speakers" },
      { href: "#concept", label: "Stations" },
      { href: "#program", label: "Programme" },
      { href: "#tickets", label: "Tickets" },
    ],
    home: "Biohacking Experience - home",
    buy: (price) => `Tickets from €${price}`,
    buyShort: (price) => `€${price}+`,
    soon: "Tickets - soon",
    soonShort: "Tickets",
    otherLang: "Български",
    otherLangShort: "БГ",
  },
};

export const HERO: Copy<{
  line1a: string;
  date: string;
  line1b: string;
  line2: string;
  line3: string;
  venue: string;
  welcome: string;
  firstTag: string;
  firstTitle: string;
  firstBody: string;
  visitors: string;
  stations: string;
  stageTag: string;
  speakersLabel: string;
  speakersBody: string;
  toSpeakers: string;
  ctaTickets: (price: string) => string;
  ctaTicketsPlain: string;
  ctaProgramme: string;
  forWhom: string;
}> = {
  bg: {
    line1a: "Два дни,",
    date: "07-08.11.2026",
    line1b: "които могат да",
    line2: "променят начина, по който живееш",
    line3: "следващите 20 години.",
    venue: "Гранд Хотел Милениум",
    welcome:
      "Не конференция със столове в редици. Науката за дълголетието и биохакинга излиза от лабораторията - на разбираем език, за два дни, в които слушаш, измерваш се, изпробваш и си тръгваш с личен протокол.",
    firstTag: "Първото",
    firstTitle: "Първото по рода си биохакинг изживяване в България.",
    firstBody: "Два дни, в които науката за дълголетието се пипа, пробва и измерва - не се слуша от стол.",
    visitors: "посетители",
    stations: "интерактивни станции",
    stageTag: "Сцената",
    speakersLabel: "международни лектори",
    speakersBody:
      "Лекари и изследователи от България и чужбина - на разбираем език, по 25 минути.",
    toSpeakers: "Към лекторите",
    ctaTickets: (price) => `Виж билетите от ${price} €`,
    ctaTicketsPlain: "Виж билетите",
    ctaProgramme: "Виж програмата по часове",
    forWhom: "За всички, без медицинско образование",
  },
  en: {
    line1a: "Two days",
    date: "07-08.11.2026",
    line1b: "that can change",
    line2: "the way you live for the",
    line3: "next twenty years.",
    venue: "Grand Hotel Millennium",
    welcome:
      "Not a conference with chairs in rows. The science of longevity and biohacking leaves the laboratory - in plain language, for two days in which you listen, measure yourself, try things and leave with a protocol of your own.",
    firstTag: "The first",
    firstTitle: "The first biohacking experience of its kind in Bulgaria.",
    firstBody: "Two days in which the science of longevity is handled, tried and measured - not heard from a chair.",
    visitors: "visitors",
    stations: "interactive stations",
    stageTag: "The stage",
    speakersLabel: "international speakers",
    speakersBody:
      "Doctors and researchers from Bulgaria and abroad - in plain language, 25 minutes each.",
    toSpeakers: "To the speakers",
    ctaTickets: (price) => `See the tickets - from €${price}`,
    ctaTicketsPlain: "See the tickets",
    ctaProgramme: "See the programme, hour by hour",
    forWhom: "For everyone, no medical background needed",
  },
};

export const TRACKS: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  medEyebrow: string;
  medTitle: string;
  medFor: string;
  medDates: string;
  medPoints: string[];
  medCta: string;
  medAria: string;
  ourFor: string;
  ourDates: string;
  ourPoints: string[];
  ourCta: string;
  ourAria: string;
  footnote: string;
}> = {
  bg: {
    eyebrow: "Как е устроено",
    title: "Две събития под един покрив",
    intro:
      "Медицинската конференция е от 6 до 8 ноември, потребителският фест - на 7 и 8. Една сграда, Гранд Хотел Милениум, но отделни събития с отделни билети.",
    medEyebrow: "Bulgarian Longevity Association",
    medTitle: "Медицинска конференция",
    medFor: "За лекари и специалисти",
    medDates: "06-08 ноември 2026",
    medPoints: [
      "Научни доклади и клинични данни",
      "Международни лектори в пълен формат",
      "Регистрация през сайта на Асоциацията",
    ],
    medCta: "Към регистрацията",
    medAria: "Регистрация за медицинската конференция, longevitybulgaria.com",
    ourFor: "За всички, без медицинско образование",
    ourDates: "07-08 ноември 2026",
    ourPoints: [
      "Четири зони: сцена, движение, възстановяване, Village",
      "Същите лектори, на разбираем език, по 25 минути",
      "Билетите на тази страница",
    ],
    ourCta: "Към билетите",
    ourAria: "Към билетите",
    footnote:
      "Билетът от тази страница дава достъп до Biohacking Experience. Медицинската конференция има отделна регистрация през Bulgarian Longevity Association.",
  },
  en: {
    eyebrow: "How it works",
    title: "Two events under one roof",
    intro:
      "The medical conference runs 6-8 November, the public festival on 7 and 8. One building, Grand Hotel Millennium, but two events with separate tickets.",
    medEyebrow: "Bulgarian Longevity Association",
    medTitle: "Medical conference",
    medFor: "For doctors and specialists",
    medDates: "6-8 November 2026",
    medPoints: [
      "Scientific papers and clinical data",
      "International speakers in full format",
      "Registration on the Association's site",
    ],
    medCta: "To registration",
    medAria: "Registration for the medical conference, longevitybulgaria.com",
    ourFor: "For everyone, no medical background needed",
    ourDates: "7-8 November 2026",
    ourPoints: [
      "Four zones: stage, movement, recovery, Village",
      "The same speakers, in plain language, 25 minutes each",
      "Tickets on this page",
    ],
    ourCta: "To the tickets",
    ourAria: "To the tickets",
    footnote:
      "A ticket from this page admits you to Biohacking Experience. The medical conference has its own registration through the Bulgarian Longevity Association.",
  },
};

export const ZONES: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  items: { tag: string; title: string; text: string }[];
}> = {
  bg: {
    eyebrow: "Концепцията",
    title: "Четири зони, два дни в тялото ти",
    intro:
      "Денят ти минава през четирите - знание, движение, възстановяване и брандовете, които стоят зад тях.",
    items: [
      { tag: "Знанието", title: "Сцена", text: "18 лекции и панела - лекари и изследователи на разбираем език." },
      { tag: "Тялото", title: "Движение", text: "Power Plate зона и пилатес - на постелка и на реформър, със записан час." },
      { tag: "Балансът", title: "Възстановяване", text: "Breathwork сесии и Recovery зона, по 30 минути." },
      { tag: "Брандовете", title: "Village", text: "30 подбрани компании: добавки, устройства, клиники, храна." },
    ],
  },
  en: {
    eyebrow: "The concept",
    title: "Four zones, two days inside your body",
    intro: "Your day moves through all four - knowledge, movement, recovery, and the brands behind them.",
    items: [
      { tag: "Knowledge", title: "Stage", text: "18 talks and panels - doctors and researchers in plain language." },
      { tag: "The body", title: "Movement", text: "A Power Plate zone and pilates - on the mat and on the reformer, by appointment." },
      { tag: "Balance", title: "Recovery", text: "Breathwork sessions and a recovery zone, 30 minutes each." },
      { tag: "The brands", title: "Village", text: "30 selected companies: supplements, devices, clinics, food." },
    ],
  },
};

export const CONCEPT: Copy<{
  eyebrow: string;
  /** Counted from the cards, so the headline cannot promise more than it shows. */
  title: (n: number) => string;
  intro: string;
  stations: string[];
  partnersSoon: string;
}> = {
  bg: {
    eyebrow: "Станциите",
    title: (n) => `${n} интерактивни станции`,
    intro: "Не гледаш отстрани - измерваш се, пробваш, питаш. Всяка станция е водена от партньор в своята област.",
    stations: [
      "Диагностика",
      "Wearables",
      "Recovery",
      "AI & Precision Medicine",
      "Хранителни добавки",
      "Медицински технологии",
      "Women’s Health",
      "Functional Testing",
    ],
    partnersSoon: "Партньорите ще бъдат обявени скоро.",
  },
  en: {
    eyebrow: "The stations",
    title: (n) => `${n} interactive stations`,
    intro: "You do not watch from the side - you measure, try and ask. Each station is run by a partner in its field.",
    stations: [
      "Diagnostics",
      "Wearables",
      "Recovery",
      "AI & Precision Medicine",
      "Supplements",
      "Medical technology",
      "Women’s Health",
      "Functional Testing",
    ],
    partnersSoon: "Partners announced soon.",
  },
};

export const SPEAKERS_SECTION: Copy<{ eyebrow: string; title: string; intro: string; showAll: (n: number) => string }> = {
  bg: {
    eyebrow: "Лектори",
    title: "Международни имена, на разбираем език",
    intro: "Лекари и изследователи от България и чужбина, на една сцена през двата дни.",
    showAll: (n) => `Виж всички ${n} лектори`,
  },
  en: {
    eyebrow: "Speakers",
    title: "International names, in plain language",
    intro: "Doctors and researchers from Bulgaria and abroad, on one stage across the two days.",
    showAll: (n) => `See all ${n} speakers`,
  },
};

export const PROGRAM_SECTION: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  footnote: string;
  days: { day: string; theme: string; intro: string }[];
}> = {
  bg: {
    eyebrow: "Програма",
    title: "Два дни, един голям въпрос",
    intro:
      "Как да превърнем повече години в повече живот? Сцената, движението и възстановяването вървят паралелно през целия ден, със записване на час.",
    footnote: "Предварителна програма · подлежи на финално потвърждение на лектори и часови диапазони.",
    days: [
      { day: "Събота", theme: "Тяло, мозък, сърце и бъдеще", intro: "От науката за стареенето до решенията, които можем да вземем още днес." },
      { day: "Неделя", theme: "", intro: "" },
    ],
  },
  en: {
    eyebrow: "Programme",
    title: "Two days, one big question",
    intro:
      "How do we turn more years into more life? The stage, the movement and the recovery zones run in parallel all day, with sessions you book a time for.",
    footnote: "Preliminary programme · speakers and time slots are still being confirmed.",
    days: [
      { day: "Saturday", theme: "Body, brain, heart and the future", intro: "From the science of ageing to the decisions we can make today." },
      { day: "Sunday", theme: "", intro: "" },
    ],
  },
};

export const TICKETS_SECTION: Copy<{
  eyebrow: string;
  launchBadge: (label: string) => string;
  specialBadge: (label: string) => string;
  title: string;
  intro: string;
  introOffer: (label: string, launch: boolean) => string;
  featured: string;
  soldOut: string;
  regularAfter: (label: string) => string;
  left: (n: number) => string;
  choose: (tier: string) => string;
  soon: string;
  compare: string;
  rows: string[][];
  priceRow: string;
  footnote: (offer: string) => string;
  waitTitle: string;
  waitEmail: string;
  waitButton: string;
  waitDone: string;
}> = {
  bg: {
    eyebrow: "Билети",
    launchBadge: (label) => `Стартови цени за ${label}`,
    specialBadge: (label) => `Специални цени ${label}`,
    title: "Три нива, една логика: колко надълбоко",
    intro: "Всички билети дават достъп до сцената и Village. Разликата е в дните, работилниците и специалните преживявания.",
    introOffer: (label, launch) => `Тези цени важат ${launch ? "за " : ""}${label}.`,
    featured: "Най-избиран",
    soldOut: "Изчерпано",
    regularAfter: (label) => `редовна цена ${label}`,
    left: (n) => `Остават ${n} ${n === 1 ? "място" : "места"}`,
    choose: (tier) => `Избери ${tier}`,
    soon: "Скоро в продажба",
    compare: "Сравни билетите",
    priceRow: "Цена",
    rows: [
      ["Достъп", "1 ден по избор", "И двата дни", "И двата дни"],
      ["Лекции", "При наличие на места", "Приоритетен достъп", "Гарантиран достъп"],
      ["Запазени места", "-", "-", "Премиум зона"],
      ["Работилници", "-", "Включени", "Включени с приоритет"],
      ["Специални преживявания", "-", "1 по избор", "Всички включени"],
      ["Goody bag", "-", "Стойност €100+", "Стойност €250+"],
      ["Premium Lounge", "-", "-", "Включен"],
      ["Meet & Greet с лектори", "-", "-", "Включен"],
      ["Приоритетен вход", "-", "-", "Включен"],
      ["Партньорски оферти и привилегии", "✓", "✓", "✓"],
    ],
    footnote: (offer) =>
      `Билетите тук са за Biohacking Experience · медицинската конференция има отделна регистрация${offer} · групи над 10 души и корпоративни пакети по договаряне · отстъпка за студенти и медицински специалисти.`,
    waitTitle: "Изчерпано. Остави имейл и ще ти пишем, ако се освободи място.",
    waitEmail: "имейл",
    waitButton: "Запиши ме",
    waitDone: "Записахме те. Ще ти пишем само ако се освободи място.",
  },
  en: {
    eyebrow: "Tickets",
    launchBadge: (label) => `Launch prices for ${label}`,
    specialBadge: (label) => `Special prices ${label}`,
    title: "Three levels, one logic: how deep you go",
    intro: "Every ticket admits you to the stage and the Village. The difference is the days, the workshops and the special experiences.",
    introOffer: (label) => `These prices apply ${label}.`,
    featured: "Most chosen",
    soldOut: "Sold out",
    regularAfter: (label) => `regular price ${label}`,
    left: (n) => `${n} ${n === 1 ? "place" : "places"} left`,
    choose: (tier) => `Choose ${tier}`,
    soon: "On sale soon",
    compare: "Compare the tickets",
    priceRow: "Price",
    rows: [
      ["Access", "One day of your choice", "Both days", "Both days"],
      ["Talks", "Subject to seats", "Priority access", "Guaranteed access"],
      ["Reserved seating", "-", "-", "Premium area"],
      ["Workshops", "-", "Included", "Included, with priority"],
      ["Special experiences", "-", "One of your choice", "All included"],
      ["Goody bag", "-", "Worth €100+", "Worth €250+"],
      ["Premium Lounge", "-", "-", "Included"],
      ["Meet & Greet with speakers", "-", "-", "Included"],
      ["Priority entrance", "-", "-", "Included"],
      ["Partner offers and privileges", "✓", "✓", "✓"],
    ],
    footnote: (offer) =>
      `Tickets here are for Biohacking Experience · the medical conference has its own registration${offer} · groups over 10 and corporate packages by arrangement · discounts for students and medical professionals.`,
    waitTitle: "Sold out. Leave an email and we will write if a place frees up.",
    waitEmail: "email",
    waitButton: "Add me",
    waitDone: "You are on the list. We will write only if a place frees up.",
  },
};

/** The tier feature lists, which live beside the prices in tickets.ts. */
export const TIER_FEATURES: Record<string, Copy<{ features: string[]; absent: string[]; tagline?: string }>> = {
  core: {
    bg: {
      features: [
        "Един ден по избор - събота или неделя, казваш го на входа",
        "Сцената: 18 лекции по 25 минути, на разбираем език",
        "Станциите за измерване и Village с 30 бранда",
        "Партньорски оферти и привилегии",
      ],
      absent: ["Работилниците и преживяванията са в PLUS и PEAK"],
    },
    en: {
      features: [
        "One day of your choice - Saturday or Sunday, you say which at the door",
        "The stage: 18 talks of 25 minutes, in plain language",
        "The measuring stations and the Village of 30 brands",
        "Partner offers and privileges",
      ],
      absent: ["Workshops and experiences come with PLUS and PEAK"],
    },
  },
  plus: {
    bg: {
      features: ["И двата дни", "Приоритетен достъп до лекциите", "Работилниците включени", "1 специално преживяване по избор", "Goody bag на стойност €100+"],
      absent: [],
    },
    en: {
      features: ["Both days", "Priority access to the talks", "Workshops included", "One special experience of your choice", "Goody bag worth €100+"],
      absent: [],
    },
  },
  peak: {
    bg: {
      tagline: "Ограничени места",
      features: ["Гарантиран достъп + премиум зона", "Работилници и преживявания с приоритет", "Goody bag на стойност €250+", "Premium Lounge", "Meet & Greet с лектори", "Приоритетен вход"],
      absent: [],
    },
    en: {
      tagline: "Limited places",
      features: ["Guaranteed access + premium area", "Workshops and experiences with priority", "Goody bag worth €250+", "Premium Lounge", "Meet & Greet with speakers", "Priority entrance"],
      absent: [],
    },
  },
};

export const REGISTER: Copy<{
  eyebrow: string;
  title: string;
  bodyOpen: string;
  bodyClosed: string;
  offerJoin: (offer: string) => string;
  buy: string;
  buyFrom: (price: string) => string;
  soon: string;
  offerNote: (offer: string) => string;
  regularAfter: string;
  becomes: (tier: string, price: string) => string;
  factDates: string;
  factPlace: string;
  factAccess: string;
  accessSoon: string;
  accessOpen: string;
  dates: string;
  venue: string;
}> = {
  bg: {
    eyebrow: "Запази мястото си",
    title: "Два дни. Реални числа. Личен план.",
    bodyOpen: "Билетите са в продажба",
    bodyClosed:
      "Билетите отварят съвсем скоро. Финализираме нивата и цените, за да са честни и към теб, и към програмата, която строим. Местата в работилниците и специалните преживявания са ограничени и се запазват с реда на купуване.",
    offerJoin: (offer) => ` - на ${offer}`,
    buy: "Купи билет",
    buyFrom: (price) => ` от ${price} €`,
    soon: "Очаквайте скоро",
    offerNote: (offer) => `${offer.charAt(0).toUpperCase()}${offer.slice(1)}.`,
    regularAfter: "След тях билетите минават на редовни цени: ",
    becomes: (tier, price) => `${tier} става ${price} €`,
    factDates: "Дати",
    factPlace: "Място",
    factAccess: "Достъп",
    accessSoon: "Билетите - съвсем скоро",
    accessOpen: "Билетите са в продажба",
    dates: "07-08 ноември 2026",
    venue: "Гранд Хотел Милениум, София",
  },
  en: {
    eyebrow: "Save your place",
    title: "Two days. Real numbers. A plan of your own.",
    bodyOpen: "Tickets are on sale",
    bodyClosed:
      "Tickets open very soon. We are finalising the levels and the prices so they are fair both to you and to the programme we are building. Places in the workshops and the special experiences are limited and go in the order people buy.",
    offerJoin: (offer) => ` - at ${offer}`,
    buy: "Buy a ticket",
    buyFrom: (price) => ` from €${price}`,
    soon: "Coming soon",
    offerNote: (offer) => `${offer.charAt(0).toUpperCase()}${offer.slice(1)}.`,
    regularAfter: "After that tickets move to the regular prices: ",
    becomes: (tier, price) => `${tier} becomes €${price}`,
    factDates: "Dates",
    factPlace: "Venue",
    factAccess: "Access",
    accessSoon: "Tickets - very soon",
    accessOpen: "Tickets are on sale",
    dates: "7-8 November 2026",
    venue: "Grand Hotel Millennium, Sofia",
  },
};

export const LIST: Copy<{
  eyebrow: string;
  title: string;
  body: string;
  placeholder: string;
  button: string;
  consent: string;
  done: string;
  footerTitle: string;
  footerButton: string;
}> = {
  bg: {
    eyebrow: "Бъди в течение",
    title: "Програмата, работилниците и цените - на имейл",
    body: "Пишем рядко и само по повод: когато програмата по часове е готова, когато отворим записването за работилниците и преди цените да се вдигнат. Отписваш се с едно кликване.",
    placeholder: "твоят имейл",
    button: "Пиши ми",
    consent: "Съгласен съм да получавам новини за Sofia Life Summit.",
    done: "Готово. Ще ти пишем само по тези три повода.",
    footerTitle: "Новини по имейл",
    footerButton: "Запиши ме",
  },
  en: {
    eyebrow: "Stay in the loop",
    title: "The programme, the workshops and the prices - by email",
    body: "We write rarely and only when there is something: when the hour-by-hour programme is ready, when workshop booking opens, and before the prices go up. One click to unsubscribe.",
    placeholder: "your email",
    button: "Write to me",
    consent: "I agree to receive news about Sofia Life Summit.",
    done: "Done. We will only write on those three occasions.",
    footerTitle: "News by email",
    footerButton: "Sign me up",
  },
};

export const PARTNERS_SECTION: Copy<{ eyebrow: string; title: string; intro: string }> = {
  bg: {
    eyebrow: "Партньорите",
    title: "Кой стои зад Sofia Life Summit",
    intro: "Брандовете, които вече са потвърдили участие. Списъкът расте до ноември.",
  },
  en: {
    eyebrow: "The partners",
    title: "Who stands behind Sofia Life Summit",
    intro: "The brands that have already confirmed. The list grows until November.",
  },
};

export const SPONSORS_SECTION: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  zoneSponsor: string;
  village: (n: number) => string;
  blurbs: Record<string, string>;
}> = {
  bg: {
    eyebrow: "Партньори",
    title: "Марките, които стоят зад деня",
    intro:
      "Всяка зона има свой партньор, а във Village се събират подбрани компании - добавки, устройства, лаборатории, клиники и храна.",
    zoneSponsor: "Спонсор на зоната",
    village: (n) => `Village · ${n} експонента`,
    blurbs: {
      Сцена: "18 лекции и панела, международни лектори.",
      Движение: "Power Plate и пилатес, със записан час.",
      Възстановяване: "Breathwork сесии и Recovery зона, по 30 минути.",
    },
  },
  en: {
    eyebrow: "Partners",
    title: "The brands behind the day",
    intro:
      "Each zone has its own partner, and the Village gathers selected companies - supplements, devices, laboratories, clinics and food.",
    zoneSponsor: "Zone sponsor",
    village: (n) => `Village · ${n} exhibitors`,
    blurbs: {
      Сцена: "18 talks and panels, international speakers.",
      Движение: "Power Plate and pilates, by appointment.",
      Възстановяване: "Breathwork sessions and a recovery zone, 30 minutes each.",
    },
  },
};

export const ORGANIZERS: Copy<{ eyebrow: string; body: [string, string, string] }> = {
  bg: { eyebrow: "Организатори", body: ["Sofia Life Summit се организира съвместно от ", " и ", "."] },
  en: { eyebrow: "Organisers", body: ["Sofia Life Summit is organised jointly by ", " and ", "."] },
};

export const FOOTER: Copy<{
  about: string;
  navTitle: string;
  contactTitle: string;
  links: { href: string; label: string }[];
  venue: string;
  dates: string;
  terms: string;
  privacy: string;
  tagline: string;
  lost: string;
}> = {
  bg: {
    about: "Sofia Life Summit се организира съвместно от Bulgarian Longevity Association и Biohacking.bg.",
    navTitle: "Навигация",
    contactTitle: "Контакт",
    links: [
      { href: "#concept", label: "Концепция" },
      { href: "#program", label: "Програма" },
      { href: "#tickets", label: "Билети" },
      { href: "/bilet/moite", label: "Изгубих билета си" },
    ],
    venue: "Гранд Хотел Милениум, София",
    dates: "07-08 ноември 2026",
    terms: "Общи условия",
    privacy: "Поверителност",
    tagline: "Sofia Life Summit · Longevity for everyone",
    lost: "Изгубих билета си",
  },
  en: {
    about: "Sofia Life Summit is organised jointly by the Bulgarian Longevity Association and Biohacking.bg.",
    navTitle: "Navigation",
    contactTitle: "Contact",
    links: [
      { href: "#concept", label: "Concept" },
      { href: "#program", label: "Programme" },
      { href: "#tickets", label: "Tickets" },
      { href: "/bilet/moite?lang=en", label: "I lost my ticket" },
    ],
    venue: "Grand Hotel Millennium, Sofia",
    dates: "7-8 November 2026",
    terms: "Terms",
    privacy: "Privacy",
    tagline: "Sofia Life Summit · Longevity for everyone",
    lost: "I lost my ticket",
  },
};

/** Title and description for the page itself, per language. */
export const META: Copy<{ title: string; describe: (from: string) => string }> = {
  bg: {
    title: "Sofia Life Summit 2026 - дълголетие и биохакинг, София | Biohacking Experience",
    describe: (from) =>
      "Фест за дълголетие и биохакинг - 07-08 ноември 2026, Гранд Хотел " +
      "Милениум, София. Четири зони, longevity паспорт, станции за " +
      `измерване, международни лектори. Билети от ${from} €.`,
  },
  en: {
    title: "Sofia Life Summit 2026 - longevity and biohacking in Sofia | Biohacking Experience",
    describe: (from) =>
      "A festival of longevity and biohacking - 7-8 November 2026, Grand Hotel " +
      "Millennium, Sofia. Four zones, a longevity passport, measuring " +
      `stations, international speakers. Tickets from €${from}.`,
  },
};
