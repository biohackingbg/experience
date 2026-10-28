import { latin } from "@/lib/latin";

/**
 * The public programme, transcribed from the organisers' final programme
 * "Biohacking Experience - част от Sofia Life Summit 2026" (22.10.2026).
 *
 * Each panel is one row: the title says what kind of session it is, the note
 * lists the talks with their speakers, and `people` carries the names - the
 * speaker pages find their sessions by those names. Module headings are rows
 * too, written "Модул N: ..." with no time; the page draws them as headings.
 */
export type Slot = {
  /** As printed: "10:25-11:20", or a single time for the closing item. */
  time: string;
  title: string;
  /** What the session covers. */
  note?: string;
  /** How the people below are billed: модератор, специален гост, … */
  role?: string;
  /** Names exactly as the programme lists them. */
  people?: string[];
  /** Registration, coffee, lunch - rendered quietly. */
  pause?: boolean;
  /**
   * Which of `people` are still to be confirmed, spelled as they are shown -
   * so the English page can mark a transliterated name too. Filled by
   * `getProgram` from `UNCONFIRMED`, never written by hand.
   */
  unconfirmed?: string[];
};

/**
 * Speakers the organisers have not yet confirmed.
 *
 * They stay on the programme, marked, rather than disappearing from it: a
 * name taken down and put back reads as a cancellation, and the page already
 * says the schedule is preliminary. Names are written exactly as the slots
 * below spell them; the English page matches the transliteration.
 */
export const UNCONFIRMED: string[] = [
  "Dominik Thor",
  "Sara Hägg",
  "Louise Newson",
  "Brad Currier",
  "Melanie Angelova",
  "Симеон Личев",
  "Анелия Биволарска",
  "Guido Axmann",
];

export type Day = {
  day: string;
  date: string;
  theme: string;
  intro: string;
  slots: Slot[];
};

/** The English half of a row. Only the words change: times and names are the same event. */
export type SlotEn = { title?: string; note?: string; role?: string };

/** One talk inside a panel: its title, who gives it and what they are. */
type Talk = { t?: string; te?: string; who: string | string[]; sp?: string; spe?: string };

const names = (t: Talk) => (Array.isArray(t.who) ? t.who : [t.who]);

/** "„Заглавие“ - проф. Име, специалност", one line per talk. */
function talkNote(talks: Talk[], en: boolean): string {
  return talks
    .map((t) => {
      const who = names(t).map((n) => (en ? latin(n) : n)).join(en ? " and " : " и ");
      const sp = en ? t.spe : t.sp;
      const title = en ? t.te : t.t;
      const q = (x: string) => (en ? `“${x}”` : `„${x}“`);
      return `${title ? `${q(title)} - ` : ""}${who}${sp ? `, ${sp}` : ""}`;
    })
    .join("\n");
}

type Row = { slot: Slot; en: SlotEn };

const mod = (n: number, bg: string, en: string): Row => ({
  slot: { time: "", title: `Модул ${n}: ${bg}`, pause: true },
  en: { title: `Module ${n}: ${en}` },
});

const pause = (time: string, bg: string, en: string): Row => ({ slot: { time, title: bg, pause: true }, en: { title: en } });

/** A panel: the talks go into the note, every name into `people`. */
const panel = (time: string, title: string, titleEn: string, talks: Talk[], extra?: { role?: string; roleEn?: string }): Row => ({
  slot: { time, title, note: talkNote(talks, false), people: talks.flatMap(names), ...(extra?.role ? { role: extra.role } : {}) },
  en: { title: titleEn, note: talkNote(talks, true), ...(extra?.roleEn ? { role: extra.roleEn } : {}) },
});

/** A keynote: one title, one speaker, and what they are in the role line. */
const keynote = (time: string, title: string, titleEn: string, who: string, sp: string, spe: string, note?: [string, string]): Row => ({
  slot: { time, title, role: `Keynote · ${sp}`, people: [who], ...(note ? { note: note[0] } : {}) },
  en: { title: titleEn, role: `Keynote · ${spe}`, ...(note ? { note: note[1] } : {}) },
});

const DAY1: Row[] = [
  pause("08:30-09:30", "Регистрация и кафе", "Registration and coffee"),
  {
    slot: { time: "09:30-09:45", title: "Официално откриване", role: "По 5 минути на човек", people: ["Д-р Райна Стоянова", "Джулия Димитрова", "Мария Варсанова"] },
    en: { title: "Official opening", role: "5 minutes each" },
  },
  mod(1, "Императивът на дълголетието - от демографията до медицината", "The longevity imperative - from demography to medicine"),
  {
    slot: {
      time: "09:50-10:20",
      title: "Светът остарява: какво означава това за всеки от нас",
      role: "Fireside с 2 участници",
      note: "Кънчо Стойчев, социолог\nпроф. д-р Георги Бърдаров, демограф",
      people: ["Кънчо Стойчев", "проф. д-р Георги Бърдаров"],
    },
    en: {
      title: "The world is ageing: what it means for each of us",
      role: "Fireside with 2 guests",
      note: `${latin("Кънчо Стойчев")}, sociologist\n${latin("проф. д-р Георги Бърдаров")}, demographer`,
    },
  },
  keynote("10:20-11:00", "Можем ли да измерим скоростта на стареене?", "Can we measure the speed of ageing?", "Sara Hägg", "биолог, молекулярна епидемиология", "biologist, molecular epidemiology"),
  mod(2, "Дълголетие на сърцето", "Longevity of the heart"),
  panel("11:10-11:40", "Панел с 4 гости", "Panel with 4 guests", [
    { t: "Сърцето - двигателят на дългия живот", te: "The heart - the engine of a long life", who: "проф. Цветомир Луканов", sp: "кардиохирург", spe: "cardiac surgeon" },
    { t: "Как метаболизмът състарява сърцето", te: "How metabolism ages the heart", who: "доц. Красимира Христова", sp: "кардиолог", spe: "cardiologist" },
    { t: "Толкова млади, колкото са съдовете ни", te: "As young as our vessels", who: "проф. Милена Станева", sp: "ангиолог", spe: "angiologist" },
    { t: "На колко години е сърцето ти?", te: "How old is your heart?", who: "д-р Танер Шахин", sp: "кардиолог", spe: "cardiologist" },
  ]),
  keynote("11:45-12:15", "Белият дроб като ранен сигнал за здравето", "The lung as an early signal of health", "д-р Александър Симидчиев", "пулмолог, специалист по белодробни болести", "pulmonologist, specialist in lung diseases"),
  keynote("12:20-12:50", "Колко рано можем да видим сърдечносъдовия риск?", "How early can we see cardiovascular risk?", "проф. д-р Иво Петров", "кардиолог", "cardiologist"),
  pause("12:50-13:50", "Обедна почивка", "Lunch break"),
  mod(3, "Мозък и когнитивно дълголетие", "Brain and cognitive longevity"),
  panel("14:00-15:00", "Панел с 4 гости", "Panel with 4 guests", [
    { t: "Роботи, изкуствен интелект и бъдещето на мозъчното здраве", te: "Robots, artificial intelligence and the future of brain health", who: "проф. Николай Габровски", sp: "неврохирург", spe: "neurosurgeon" },
    { t: "Какво разказва ЯМР за това как остарява мозъкът", te: "What an MRI tells us about how the brain ages", who: "доц. Марин Пенков", sp: "образна диагностика", spe: "imaging diagnostics" },
    { t: "Деменцията може да се забави: какво зависи от нас", te: "Dementia can be slowed: what is up to us", who: "доц. д-р Иван Койчев", sp: "невропсихиатър", spe: "neuropsychiatrist" },
    { t: "Колко добре спим наистина?", te: "How well do we really sleep?", who: "доц. д-р Кирил Терзийски" },
  ]),
  keynote("15:05-15:35", "Живеем по-дълго. Оставаме ли същите?", "We live longer. Do we stay the same?", "Виолета Азис", "клиничен психолог", "clinical psychologist"),
  pause("15:35-15:50", "Кафе пауза", "Coffee break"),
  mod(4, "Метаболитно здраве и дълголетие", "Metabolic health and longevity"),
  keynote(
    "15:55-16:25",
    "GLP-1 медикаментите - ново средство за отлагане на стареенето",
    "GLP-1 drugs - a new tool for delaying ageing",
    "Rocio Salas-Whalen",
    "ендокринолог, Ню Йорк, САЩ",
    "endocrinologist, New York, USA",
    ["Представяне на книгата „Безтегловност“.", "Presentation of the book “Weightless”."],
  ),
  keynote("16:30-17:00", "Микробиомът и дълголетието без митове", "The microbiome and longevity without myths", "проф. Godfrey Grech", "онколог", "oncologist"),
  panel("17:05-17:45", "Панел", "Panel", [
    { t: "Захарта, която ни състарява", te: "The sugar that ages us", who: ["Весела Михнева", "Ивайло Богомилов"], sp: "ендокринолози", spe: "endocrinologists" },
    { t: "Затлъстелият черен дроб и топящите се мускули: тихите рискове", te: "The fatty liver and the melting muscles: the silent risks", who: "Милен Василев", sp: "хепатолог", spe: "hepatologist" },
  ]),
  {
    // The final programme lists this slot with her name and nothing else; the
    // title stays her name until the team gives the session one.
    slot: { time: "17:45-18:20", title: "Кристина Вавура" },
    en: { title: latin("Кристина Вавура") },
  },
  {
    slot: {
      time: "17:10-18:10",
      title: "Подписване на книги: „Безтегловност“",
      note: "На щанда, с участието на авторката Rocio Salas-Whalen. Книгата е преведена на български език със съдействието на БЛА.",
      people: ["Rocio Salas-Whalen"],
    },
    en: {
      title: "Book signing: “Weightless”",
      note: "At the stand, with the author Rocio Salas-Whalen. The book has been translated into Bulgarian with the support of the BLA.",
    },
  },
];

const DAY2: Row[] = [
  mod(5, "Репродуктивно здраве и стареене", "Reproductive health and ageing"),
  panel("09:00-09:45", "Панел с 4 експерти", "Panel with 4 experts", [
    { t: "Уморената имунна система - толкова лошо ли е това?", te: "The tired immune system - is that so bad?", who: "Георги Стаменов", sp: "гинеколог", spe: "gynaecologist" },
    { t: "Имат ли мъжете своята пауза?", te: "Do men have their pause?", who: "проф. Здравко Каменов", sp: "ендокринолог", spe: "endocrinologist" },
    { who: "д-р Атанас Чернев" },
    { t: "Мъжко хормонално здраве и тестостерон", te: "Male hormonal health and testosterone", who: "д-р Бранимир Радуилов", sp: "обща медицина", spe: "general medicine" },
  ]),
  panel("09:50-10:35", "Панел с експерти", "Panel of experts", [
    { who: "проф. Мария Юнакова" },
    { who: "д-р Наталия Петракиева" },
    { who: "доц. Малина Петкова" },
    { who: "Кристина Вавура" },
  ]),
  {
    slot: {
      time: "10:40-11:00",
      title: "Жената DIVA: енергията и възрастта като сила",
      role: "Панел с 4 гости · водещ Джулия Димитрова",
      people: ["Яна Балникова", "Тяна Пресолска", "Мария Илиева"],
    },
    en: { title: "The DIVA woman: energy and age as strength", role: "Panel with 4 guests · host Julia Dimitrova" },
  },
  pause("11:05-11:35", "Кафе пауза", "Coffee break"),
  mod(6, "Ендокринология, онкология и стареене", "Endocrinology, oncology and ageing"),
  panel("11:35-12:15", "Панел с 4 гости", "Panel with 4 guests", [
    { t: "Щитовидната жлеза - тихият диригент на стареенето", te: "The thyroid - the quiet conductor of ageing", who: "доц. д-р Александър Шинков", sp: "ендокринолог", spe: "endocrinologist" },
    { t: "Ранното откриване променя историята", te: "Early detection changes the story", who: "д-р Ваня Митова", sp: "мамолог", spe: "breast specialist" },
    { who: "д-р Цвета Алайков" },
    { t: "Какво казват гените ни за риска от рак", te: "What our genes say about cancer risk", who: "Боряна Герасимова", sp: "шеф на Regena", spe: "head of Regena" },
  ]),
  keynote("12:20-12:40", "Силни кости и мускули за дълъг живот", "Strong bones and muscles for a long life", "Paul Lee", "ортопед", "orthopaedist"),
  pause("12:45-13:45", "Обедна почивка", "Lunch break"),
  {
    slot: {
      time: "13:45-14:15",
      title: "Представяне на книгата „Протоколите на Хюберман“",
      people: ["Нели Огнянова", "Джулия Димитрова", "Мария Варсанова"],
    },
    en: { title: "Presentation of the book “The Huberman Protocols”" },
  },
  mod(7, "Дерматология и дълголетие", "Dermatology and longevity"),
  panel("14:20-14:50", "Панел с 2 гости", "Panel with 2 guests", [
    { t: "Кожата - огледало на стареенето", te: "The skin - a mirror of ageing", who: "Melanie Angelova", sp: "дерматолог", spe: "dermatologist" },
    { t: "Какво разказва косата ни за стреса и възрастта", te: "What our hair tells us about stress and age", who: "проф. дхн Милен Богданов", sp: "органична и физична органична химия", spe: "organic and physical organic chemistry" },
  ]),
  panel("14:55-15:25", "Панел с 2 гости", "Panel with 2 guests", [
    { t: "Липедемът: не е просто наднормено тегло", te: "Lipedema: it is not just excess weight", who: "Sheila Veronese", sp: "професор, инженер", spe: "professor, engineer" },
    { t: "Хормоните - липсващото звено за млада кожа", te: "Hormones - the missing link for young skin", who: "Andre-Robert Rotmann", sp: "гинеколог", spe: "gynaecologist" },
  ]),
  pause("15:25-15:40", "Кафе пауза", "Coffee break"),
  mod(8, "Интервенции за дълголетие - от начина на живот до медицината", "Longevity interventions - from lifestyle to medicine"),
  panel("15:45-16:30", "Панел с 3 гости", "Panel with 3 guests", [
    { t: "Чуваш, виждаш, движиш се - значи мислиш ясно", te: "You hear, you see, you move - so you think clearly", who: "д-р Десислава Димова", sp: "офталмолог", spe: "ophthalmologist" },
    { t: "Светлината като лекарство: патентован метод за дълголетие", te: "Light as medicine: a patented method for longevity", who: "Милена Драганова", sp: "инженер", spe: "engineer" },
    { t: "Нека храната бъде твоето лекарство", te: "Let food be thy medicine", who: "Дерйа Хюсеин Кандиларов", sp: "клиничен диетолог", spe: "clinical dietitian" },
  ]),
  panel("16:35-17:15", "Панел с 4 гости", "Panel with 4 guests", [
    { t: "Уелнес и дишане срещу стареенето", te: "Wellness and breathing against ageing", who: "Fahri Saatcioglu", sp: "физиолог", spe: "physiologist" },
    { who: "Анна Грозданова" },
    { t: "Персонализирана медицина без черна кутия", te: "Personalised medicine without a black box", who: "Guido Axmann", sp: "обща медицина", spe: "general medicine" },
    { t: "Добавки: кои работят и кои - не", te: "Supplements: which work and which do not", who: "Morten Scheibye-Knudsen", sp: "генетик", spe: "geneticist" },
  ]),
  {
    slot: {
      time: "17:20-18:00",
      title: "Sofia Life Conversation: как искаме да живеем след 60, 70 и 80",
      people: ["Красимир Балъков", "Мария Варсанова", "Джулия Димитрова", "Милена Хаджииванова"],
    },
    en: { title: "Sofia Life Conversation: how we want to live at 60, 70 and 80" },
  },
  {
    slot: { time: "18:00-18:15", title: "Закриване: The Longevity Promise", role: "Организаторите", note: "Една измерима промяна за следващите 30 дни." },
    en: { title: "Closing: The Longevity Promise", role: "The organisers", note: "One measurable change for the next 30 days." },
  },
  pause("18:15-19:15", "Farewell drink", "Farewell drink"),
];

export const PROGRAM: Day[] = [
  {
    day: "Събота",
    date: "07.11",
    theme: "Тяло, мозък, сърце и бъдеще",
    intro: "От науката за стареенето до решенията, които можем да вземем още днес.",
    slots: DAY1.map((r) => r.slot),
  },
  {
    day: "Неделя",
    date: "08.11",
    theme: "Хормони, сила, превенция и навици",
    intro: "Практичната страна на дълголетието: какво да запазим, какво да променим и на какво да не вярваме.",
    slots: DAY2.map((r) => r.slot),
  },
];

/** The English half, in the same order as PROGRAM - built from the same rows so they cannot drift. */
export const PROGRAM_EN: SlotEn[][] = [DAY1.map((r) => r.en), DAY2.map((r) => r.en)];
