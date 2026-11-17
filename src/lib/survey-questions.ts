/**
 * The post-event survey questions, client-safe: the page draws the form from
 * them and the server checks the answers against them. Answers are stored as
 * JSON keyed by these ids, so a question can be reworded without touching
 * the answers already given; a removed question simply stops being asked.
 */

export type Question =
  | { id: string; kind: "scale"; label: string; min: 0 | 1; max: 5 | 10; low: string; high: string; required?: boolean }
  | { id: string; kind: "single"; label: string; options: string[]; other?: boolean; required?: boolean }
  | { id: string; kind: "multi"; label: string; options: string[]; other?: boolean; required?: boolean }
  | { id: string; kind: "text"; label: string; long?: boolean; required?: boolean; placeholder?: string }
  | { id: string; kind: "early"; label: string };

export type SurveyKind = "visitor" | "partner";

export const EARLY_YES = "Да, искам";

export const VISITOR_QUESTIONS: Question[] = [
  { id: "nps", kind: "scale", label: "Колко вероятно е да препоръчаш Sofia Life Summit на приятел?", min: 0, max: 10, low: "Изобщо не", high: "Със сигурност", required: true },
  { id: "day", kind: "single", label: "Кой ден посети?", options: ["7 ноември (събота)", "8 ноември (неделя)", "И двата дни"], required: true },
  { id: "talks", kind: "scale", label: "Как оценяваш лекциите и панелите?", min: 1, max: 5, low: "Слабо", high: "Отлично" },
  { id: "favourite", kind: "text", label: "Коя лекция или кой лектор ти хареса най-много?" },
  {
    id: "zones",
    kind: "multi",
    label: "Кои зони и активности пробва?",
    options: [
      "Лекции и панели на сцената",
      "Brand Village (щандовете на партньорите)",
      "Пилатес на постелка",
      "Пилатес на реформър",
      "Lagree (Bodyspace)",
      "Power Plate",
      "Breathwork",
      "Restart by Therabody (възстановяване)",
      "InBody анализ",
      "PEMF легло",
      "Хидратационна станция",
      "Нетуъркинг и общност",
      "Не пробвах активности, бях само на лекциите",
    ],
    other: true,
  },
  { id: "organisation", kind: "scale", label: "Как оценяваш организацията: регистрация, локация, програма?", min: 1, max: 5, low: "Слабо", high: "Отлично" },
  { id: "improve", kind: "text", label: "Какво ти липсваше или какво да подобрим?", long: true },
  { id: "topics", kind: "text", label: "Кои теми искаш да видиш догодина?", long: true },
  {
    id: "source",
    kind: "single",
    label: "Откъде научи за събитието?",
    options: ["Instagram", "Facebook", "TikTok", "Препоръка от приятел или познат", "Имейл от Biohacking.bg", "Платена реклама", "От партньор или бранд", "От лектор", "Медии / статия"],
    other: true,
  },
  { id: "again", kind: "single", label: "Би ли дошъл/дошла пак?", options: ["Да, със сигурност", "Може би", "Не"] },
  { id: "early", kind: "early", label: "Искаш ли ранен достъп до билетите за 2027?" },
];

export const PARTNER_QUESTIONS: Question[] = [
  { id: "brand", kind: "text", label: "Име на марката / компанията", required: true },
  { id: "person", kind: "text", label: "Вашето име и позиция" },
  { id: "email", kind: "text", label: "Имейл за връзка" },
  {
    id: "format",
    kind: "multi",
    label: "Какъв беше форматът на Вашето участие?",
    options: ["Щанд в Brand Village", "Активационна зона", "Лекция или панел", "Наименувана зона („powered by“)", "Брандиране на материали"],
    other: true,
  },
  { id: "nps", kind: "scale", label: "Колко вероятно е да препоръчате участието на друг бранд?", min: 0, max: 10, low: "Изобщо не", high: "Със сигурност", required: true },
  { id: "team", kind: "scale", label: "Как оценявате организацията и комуникацията с екипа преди и по време на събитието?", min: 1, max: 5, low: "Слабо", high: "Отлично" },
  { id: "traffic", kind: "scale", label: "Как оценявате трафика към щанда/зоната Ви?", min: 1, max: 5, low: "Слабо", high: "Отлично" },
  { id: "leads", kind: "single", label: "Колко контакта/лийда събрахте приблизително?", options: ["Под 20", "20–50", "50–100", "100–200", "Над 200", "Не сме събирали контакти"] },
  { id: "audience", kind: "scale", label: "Как оценявате качеството на публиката спрямо Вашата целева група?", min: 1, max: 5, low: "Слабо", high: "Отлично" },
  { id: "logistics", kind: "scale", label: "Как оценявате локацията на щанда, монтажа и логистиката?", min: 1, max: 5, low: "Слабо", high: "Отлично" },
  { id: "goals", kind: "single", label: "Постигнахте ли целите си от участието?", options: ["Да, напълно", "Частично", "Не"] },
  { id: "goalsNote", kind: "text", label: "Коментар към предишния въпрос", long: true },
  { id: "liked", kind: "text", label: "Какво най-много Ви хареса?", long: true },
  { id: "improve", kind: "text", label: "Какво да подобрим за партньорите?", long: true },
  { id: "again", kind: "single", label: "Бихте ли участвали през 2027?", options: ["Да", "Вероятно", "Още не знаем", "Не"] },
  {
    id: "format2027",
    kind: "multi",
    label: "Какъв формат Ви интересува за 2027?",
    options: [
      "Щанд в Brand Village",
      "Активационна зона (бранд преживяване)",
      "Лекция или панел на сцената",
      "Наименувана зона („powered by“)",
      "Брандиране на материали (чанта, бадж, програма)",
      "Партньорство за вечеря или нетуъркинг",
    ],
    other: true,
  },
  { id: "offer", kind: "single", label: "Искате ли да получите предложение за 2027 преди общото обявяване?", options: ["Да, изпратете ни предложение", "Да, искаме разговор с екипа", "Не на този етап"] },
];

export const questionsFor = (kind: SurveyKind) => (kind === "partner" ? PARTNER_QUESTIONS : VISITOR_QUESTIONS);

/** The consent the early-access tick records, word for word. */
export const EARLY_CONSENT =
  "Искам ранен достъп до билетите за Sofia Life Summit 2027: Biohacking.bg да ми пише, когато билетите излязат, преди общата продажба. Мога да се отпиша по всяко време.";

export const MAX_EXTRA_EMAILS = 4;

/** The survey takes answers until the end of this day in Sofia; the daily summary stops with it. */
export const SURVEY_CLOSES = new Date("2026-12-06T23:59:59+02:00");
export const SURVEY_CLOSES_LABEL = "6 декември";
export const surveyOpen = (now = Date.now()) => now <= SURVEY_CLOSES.getTime();
