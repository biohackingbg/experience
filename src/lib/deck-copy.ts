/**
 * Every word of the partner deck, in Bulgarian and English. The page
 * (/za-partniori/[token]) picks a language from ?lang= and reads only from
 * here, so the two versions cannot drift apart in structure - a partner
 * flips between them on the same link. The Bulgarian is the approved deck
 * (sofia-life-summit-sponsori-svetla, Aug 2026) word for word; the English
 * follows it line by line.
 */


/* ── 02 форматът ── */
const format = [
  {
    h: "Преживяването остава",
    p: "Продуктът ви става част от момент, който посетителят помни и свързва с вашия бранд - не поредна реклама, покрай която минава.",
  },
  {
    h: "Тридесет минути пълно внимание",
    p: "Активациите са със записан час и ограничени места. Никой друг формат не дава на бранда половин час насаме с клиента.",
  },
  {
    h: "Пробваното се купува",
    p: "Когато човек пробва нещо лично, е много по-лесно да го купи. Активностите правят точно това - а Village е на крачка от тях.",
  },
];

/* ── 03 мащаб ── */
const scale = [
  { n: "1 000+", l: "посетители" },
  { n: "5", l: "вида работилници" },
  { n: "50", l: "международни лектори" },
  { n: "30", l: "подбрани бранда" },
];

/* ── 04 организаторите ── */
const organizers = [
  { n: "25 000+", l: "Общност", p: "Изградена аудитория в социалните канали и имейл листата на Biohacking.bg." },
  { n: "10+", l: "Проведени събития", p: "Конференции, корпоративни обучения и ретрийти в България и чужбина." },
  { n: "15+", l: "Корпоративни клиенти", p: "Компании, преминали през wellness програмите и обученията на Biohacking.bg." },
  { n: "400+", l: "Курсисти", p: "Преминали през платените онлайн програми на Biohacking.bg." },
  { n: "BLA", l: "Медицински гръб", p: "Bulgarian Longevity Association - лекари и изследователи, не инфлуенсър формат." },
  { n: "6", l: "Държави в програмата", p: "Karolinska Institutet, Geneva College of Longevity Science, University of Malta и др." },
];

/* ── 05 лекторите - the deck's own credential lines, with the site's portraits ── */
const speakers = [
  { name: "Д-р Райна Стоянова", line1: "България · Ендокринолог", line2: "Председател, Bulgarian Longevity Association", photo: "/speakers/rayna-stoyanova.jpg" },
  { name: "Д-р Rocio Salas-Whalen", line1: "САЩ · Ендокринология", line2: "Автор на „Weightless“", photo: "/speakers/rocio-salas-whalen.jpg" },
  { name: "Проф. Dominik Thor", line1: "Швейцария · Фармация", line2: "President, Geneva College of Longevity Science", photo: "/speakers/dominik-thor.jpg" },
  { name: "Доц. Sara Hägg", line1: "Швеция · Епидемиология на стареенето", line2: "Karolinska Institutet", photo: "/speakers/sara-hagg.jpg" },
  { name: "Д-р Александър Симидчиев", line1: "България · Пулмолог", line2: "Централна клинична болница на МВР", photo: "/speakers/aleksandar-simidchiev.jpg" },
  { name: "Д-р Dean Berman", line1: "Австрия", line2: "Global VP Medical, Alma Lasers", photo: "/speakers/dean-berman.jpg" },
  { name: "Проф. Godfrey Grech", line1: "Малта · Молекулярна онкология", line2: "University of Malta", photo: "/speakers/godfrey-grech.jpg" },
  { name: "Проф. д-р Виктория Сарафян", line1: "България", line2: "Медицински университет - Пловдив", photo: "/speakers/viktoriya-sarafyan.jpg" },
];

/* ── 06 концепцията ── */
const concept = [
  { no: "01", tag: "Знанието", h: "Сцена", sym: "◎", p: "18 лекции и панела - лекари и изследователи на разбираем език." },
  { no: "02", tag: "Тялото", h: "Работилници", sym: "◍", p: "Breathwork, Recovery, Power Plate и пилатес - малки групи със записан час, по 30 минути." },
  { no: "03", tag: "Брандовете", h: "Village", sym: "⌂", p: "30 подбрани компании: добавки, устройства, клиники, храна." },
];

/* ── 07 работилниците ── */
const activities = [
  // Cold plunge е свален, докато не се потвърди, че залата може да
  // осигури вода и ваните (31.08.2026). Върни реда, като се потвърди.
  // { no: "01", h: "Cold Plunge", p: "Потапяне в студена вода с инструктор и подготовка.", img: "/deck/act-cold.jpg" },
  { no: "01", h: "Breathwork", p: "Групови дихателни сесии по 30 минути.", img: "/deck/act-breathwork.jpg" },
  { no: "02", h: "Recovery", p: "Компресия, перкусия и възстановяване след натоварване.", img: "/deck/act-recovery.jpg" },
  { no: "03", h: "Power Plate", p: "Вибрационна тренировка с демонстрации на живо.", img: "/deck/act-powerplate.jpg" },
  { no: "04", h: "Пилатес - постелка", p: "Групови сесии за начинаещи и напреднали.", img: "/deck/act-pilates-mat.jpg" },
  { no: "05", h: "Пилатес - реформър", p: "Малки групи с инструктор, със записан час.", img: "/deck/act-pilates-reformer.jpg" },
];

/* ── 08 брандирана работилница ── */
const brandZonePoints = [
  "LED стена с вашето лого",
  "Име на работилницата в програмата",
  "Инструктор с вашия бранд",
  "Мостра за всеки участник",
  "Списък със записалите се",
];

/* ── 09 публиката ── */
const audience = [
  "Предприемачи и мениджъри",
  "Лекари и специалисти",
  "Жени 35-55 с висок разполагаем доход",
  "Инвеститори",
  "Треньори и нутриционисти",
  "Корпоративни екипи",
  "Ранни осиновители на здравни продукти",
  "Biohacking.bg общност",
  "Спортисти",
  "Естетична медицина",
];

const audienceStats = [
  { n: "6 ч.", l: "Среден престой", p: "Ангажирано внимание на място, не импресия от три секунди." },
  { n: "35-349 €", l: "Платен вход", p: "Всеки вече е инвестирал в здравето си, преди да влезе." },
  { n: "×3", l: "Минавания през Village", p: "Повторен контакт с бранда - по няколко пъти на ден." },
  { n: "35-55", l: "Ядро на аудиторията", p: "Активни професионалисти в най-силните си кариерни години." },
  { n: "~120 €", l: "Среден разход за билет", p: "Изчислен от реалния микс на трите нива билети." },
  { n: "249 €", l: "Премиум билетът PEAK", p: "Ограничени места с Premium Lounge и Meet & Greet - запълват се първи." },
];

/* ── 10 пътуването · brand: does this touchpoint put the visitor at a brand? ── */
const journey = [
  { t: "10:00", h: "Регистрация и Village", p: "Първи контакт с брандовете още на входа", brand: true },
  { t: "10:30", h: "Лекция на сцената", p: "25 минути наука на разбираем език", brand: false },
  { t: "11:15", h: "Работилница: движение", p: "Power Plate или пилатес - със записан час", brand: true },
  { t: "12:00", h: "Village и обяд", p: "Дегустации и разговори с брандовете", brand: true },
  { t: "13:30", h: "Работилница: възстановяване", p: "Breathwork или Recovery", brand: true },
  { t: "14:30", h: "Уъркшоп", p: "Малка група, продукт в ръцете", brand: true },
  { t: "15:30", h: "Отново сцената", p: "Панел и въпроси към лекарите", brand: false },
  { t: "16:30", h: "Village преди тръгване", p: "Покупка и последен разговор", brand: true },
];

/* ── 11 стойността ── */
const value = [
  { h: "Квалифицирани контакти", p: "Списък с участниците от вашите активации и лийдове от щанда - хора, които са дали време, не имейл от томбола." },
  { h: "Директен опит с продукта", p: "Качественият разговор започва след пробата, не преди нея. Вашият продукт е в ръцете на посетителя, не на рафт." },
  { h: "Видимост на сцената и в дигитала", p: "Лого пред 1 000 души на място и пред общността на Biohacking.bg преди, по време и след събитието." },
  { h: "Съдържание за цяла година", p: "Професионални снимки и видео от вашата работилница - активи, които маркетингът ви ползва след ноември." },
  { h: "Отчет след събитието", p: "Посещаемост на работилницата, записани сесии, събрани контакти и социален обхват - числа за вашия вътрешен отчет." },
  { h: "Дългосрочни клиенти", p: "Посетителят свързва бранда ви с преживяване, което помни - основата на повторната покупка." },
];

/* ── 12 нива ── */
export type Tier = {
  no: string;
  name: string;
  price: string;
  best?: boolean;
  has: string[];
  not: string[];
};

const tiers: Tier[] = [
  {
    no: "01",
    name: "Сребърен",
    price: "3 500 €",
    has: [
      "Щанд до 6 м² на премиум позиция",
      "2 пълни билета",
      "20 билета за Village",
      "Лого - сайт, дигитал, сцена",
      "Мостра във фестивалната чанта",
      "Видео във Village",
    ],
    not: ["Брандирана работилница", "Лектор на сцената"],
  },
  {
    no: "02",
    name: "Златен",
    price: "5 500 €",
    best: true,
    has: [
      "Щанд до 8 м² на премиум позиция",
      "4 пълни билета",
      "40 билета за Village",
      "Брандирана работилница - движение или възстановяване",
      "Уъркшоп по избор в програмата",
      "Видео на сцената",
      "Всичко от Сребърен",
    ],
    not: ["Лектор на сцената"],
  },
  {
    no: "03",
    name: "Платинен",
    price: "9 500 €",
    has: [
      "Щанд до 10 м² на премиум позиция",
      "6 пълни билета",
      "80 билета за Village",
      "Лектор на сцената, 25 минути",
      "Работилница с вашето име",
      "Категорийна ексклузивност",
      "Всичко от Златен",
    ],
    not: [],
  },
];

/* ── 12b двете събития - фест + медицински конгрес ──
 *
 * Нивата за двете събития заедно. Присъствието на конгреса (06-08.11) е
 * рамка, която се финализира с Bulgarian Longevity Association - тяхното
 * събитие е, тяхна е и програмата. Секцията го казва явно, за да не се чете
 * като поето задължение, преди да е договорено.
 */
const congressTiers: Tier[] = [
  {
    no: "01",
    name: "Сребърен +",
    price: "10 000 €",
    has: [
      "Всичко от Сребърен на феста",
      "Щанд във фоайето на конгреса, трите дни",
      "Лого в програмата на конгреса",
      "2 делегатски места",
    ],
    not: ["Сателитен симпозиум", "Материал в делегатската чанта"],
  },
  {
    no: "02",
    name: "Златен +",
    price: "12 000 €",
    best: true,
    has: [
      "Всичко от Златен на феста",
      "Щанд във фоайето на конгреса, трите дни",
      "Материал в делегатската чанта",
      "4 делегатски места",
      "Лого на сцената на конгреса",
    ],
    not: ["Сателитен симпозиум"],
  },
  {
    no: "03",
    name: "Платинен +",
    price: "17 000 €",
    has: [
      "Всичко от Платинен на феста",
      "Сателитен симпозиум, 30 минути",
      "Щанд на премиум позиция в конгреса",
      "6 делегатски места",
      "Категорийна ексклузивност и на двете събития",
    ],
    not: [],
  },
];

/* ── 13 Village щанд ── */
const villageRows: [string, string][] = [
  ["Щанд площ за 2 дни", "до 6 м²"],
  ["Лого на сайта", "Включено"],
  ["Лого в социалните канали", "Включено"],
  ["Мостра във фестивалната чанта", "Включено"],
  ["Билети за Village", "20"],
  ["Право на дегустация и демонстрация", "Включено"],
];

/* ── 14 сравнение ── */
export type Cell = string | boolean;
const compareRows: { row: string; cells: Cell[] }[] = [
  { row: "Щанд площ за 2 дни", cells: ["до 6 м²", "до 8 м²", "до 10 м²"] },
  { row: "Премиум позиция в Village", cells: [true, true, true] },
  { row: "Пълни билети за двата дни", cells: ["2", "4", "6"] },
  { row: "Билети за Village", cells: ["20", "40", "80"] },
  { row: "Лого - сайт, дигитал, сцена", cells: [true, true, true] },
  { row: "Мостра във фестивалната чанта", cells: [true, true, true] },
  { row: "Видео във Village", cells: [true, true, true] },
  { row: "Брандирана работилница", cells: [false, true, true] },
  { row: "Уъркшоп по избор в програмата", cells: [false, true, true] },
  { row: "Видео на сцената", cells: [false, true, true] },
  { row: "Лектор на сцената, 25 мин", cells: [false, false, true] },
  { row: "Работилница с вашето име", cells: [false, false, true] },
];
const compareNames = ["Сребърен", "Златен", "Платинен"];
const comparePrices = ["3 500 €", "5 500 €", "9 500 €"];

/* ── 15 по избор ── */
const extras = [
  { price: "4 500 €", h: "Партньор на Recovery", p: "Breathwork и Recovery работилниците носят вашето име. Присъствие при всяка сесия, двата дни. Най-сниманата част от събитието." },
  { price: "3 000 €", h: "Партньор на Движение", p: "Power Plate или пилатес работилниците с ваше име. Записан час, 30 минути, целодневно. Продуктът се пробва на място." },
  { price: "4 500 €", h: "Презентация / уъркшоп", p: "Сесия до 15 минути с ваш експерт. Запис за вашите канали и място в програмата на сайта." },
  { price: "500 €", h: "Фестивална чанта", p: "Един рекламен материал за 1 000 души, без щанд. Най-бързият вход в събитието." },
];

/* ── 16 след ноември ── */
const after = [
  { t: "До 10 дни", h: "Отчет с данни", p: "Посещаемост на работилницата, записани сесии, лийдове и социален обхват." },
  { t: "До 14 дни", h: "Фото и видео активи", p: "Професионално заснет материал от вашата работилница, с права за ползване." },
  { t: "Ноември", h: "Event recap", p: "Обобщение на събитието към цялата общност - с партньорите в него." },
  { t: "До 31 януари", h: "Право на първи отказ", p: "Вашата категория е запазена за 2027 на фиксирана цена, докато не откажете." },
];

/* ── 17 подкрепа ── */
const supportRows = [
  { l: "Организатори", names: "Bulgarian Longevity Association · Biohacking.bg" },
  { l: "Медицински партньори", names: null },
  { l: "Корпоративни партньори", names: null },
  { l: "Технологични партньори", names: null },
  { l: "Медийни партньори", names: null },
  { l: "Общности", names: null },
];

/* ── 18 founding partners ── */
const territories = [
  { h: "Сцена", sub: "Presenting Partner" },
  // Cold plunge е свален, докато не се потвърди, че залата може да
  // осигури вода и ваните (31.08.2026). Върни реда, като се потвърди.
  // { h: "Cold Plunge", sub: "Активация" },
  { h: "Breathwork", sub: "Работилница" },
  { h: "Recovery", sub: "Работилница" },
  { h: "Power Plate", sub: "Работилница" },
  { h: "Пилатес - постелка", sub: "Работилница" },
  { h: "Пилатес - реформър", sub: "Работилница" },
  { h: "Networking вечеря", sub: "Вечеря, ден 1" },
  { h: "Фестивална чанта", sub: "Мостра за 1 000 души" },
  { h: "Village", sub: "30 места" },
];

const foundingPoints = [
  "Зона с реален трафик и списък с участници, не щанд с брошури",
  "Роля на сцената и име в цялата комуникация до ноември",
  "Отчет с данни след събитието и право на първи отказ за 2027",
];


/* ═══════════════════════════ English ═══════════════════════════ */

const formatEn = [
  { h: "The experience stays", p: "Your product becomes part of a moment the visitor remembers and links to your brand - not another ad they walk past." },
  { h: "Thirty minutes of full attention", p: "Activations run on booked slots with limited places. No other format gives a brand half an hour alone with the customer." },
  { h: "What is tried gets bought", p: "Once someone has tried something themselves, buying it is much easier. The activities do exactly that - and the Village is a step away." },
];

const scaleEn = [
  { n: "1,000+", l: "visitors" },
  { n: "5", l: "kinds of workshop" },
  { n: "50", l: "international speakers" },
  { n: "30", l: "selected brands" },
];

const organizersEn = [
  { n: "25,000+", l: "Community", p: "A built audience across Biohacking.bg's social channels and email list." },
  { n: "10+", l: "Events held", p: "Conferences, corporate trainings and retreats in Bulgaria and abroad." },
  { n: "15+", l: "Corporate clients", p: "Companies that have been through Biohacking.bg's wellness programmes and trainings." },
  { n: "400+", l: "Course alumni", p: "Graduates of Biohacking.bg's paid online programmes." },
  { n: "BLA", l: "Medical backing", p: "Bulgarian Longevity Association - doctors and researchers, not an influencer format." },
  { n: "6", l: "Countries in the programme", p: "Karolinska Institutet, Geneva College of Longevity Science, University of Malta and others." },
];

const speakersEn = [
  { name: "Dr Rayna Stoyanova", line1: "Bulgaria · Endocrinologist", line2: "Chair, Bulgarian Longevity Association", photo: "/speakers/rayna-stoyanova.jpg" },
  { name: "Dr Rocio Salas-Whalen", line1: "USA · Endocrinology", line2: "Author of “Weightless”", photo: "/speakers/rocio-salas-whalen.jpg" },
  { name: "Prof. Dominik Thor", line1: "Switzerland · Pharmacy", line2: "President, Geneva College of Longevity Science", photo: "/speakers/dominik-thor.jpg" },
  { name: "Assoc. Prof. Sara Hägg", line1: "Sweden · Epidemiology of ageing", line2: "Karolinska Institutet", photo: "/speakers/sara-hagg.jpg" },
  { name: "Dr Aleksandar Simidchiev", line1: "Bulgaria · Pulmonologist", line2: "Central Clinical Hospital of the Ministry of Interior", photo: "/speakers/aleksandar-simidchiev.jpg" },
  { name: "Dr Dean Berman", line1: "Austria", line2: "Global VP Medical, Alma Lasers", photo: "/speakers/dean-berman.jpg" },
  { name: "Prof. Godfrey Grech", line1: "Malta · Molecular oncology", line2: "University of Malta", photo: "/speakers/godfrey-grech.jpg" },
  { name: "Prof. Dr Viktoriya Sarafyan", line1: "Bulgaria", line2: "Medical University - Plovdiv", photo: "/speakers/viktoriya-sarafyan.jpg" },
];

const conceptEn = [
  { no: "01", tag: "Knowledge", h: "Stage", sym: "◎", p: "18 talks and panels - doctors and researchers in plain language." },
  { no: "02", tag: "The body", h: "Workshops", sym: "◍", p: "Breathwork, Recovery, Power Plate and pilates - small groups on booked 30-minute slots." },
  { no: "03", tag: "The brands", h: "Village", sym: "⌂", p: "30 selected companies: supplements, devices, clinics, food." },
];

const activitiesEn = [
  { no: "01", h: "Breathwork", p: "Group breathing sessions of 30 minutes.", img: "/deck/act-breathwork.jpg" },
  { no: "02", h: "Recovery", p: "Compression, percussion and recovery after exertion.", img: "/deck/act-recovery.jpg" },
  { no: "03", h: "Power Plate", p: "Vibration training with live demonstrations.", img: "/deck/act-powerplate.jpg" },
  { no: "04", h: "Pilates - mat", p: "Group sessions for beginners and advanced.", img: "/deck/act-pilates-mat.jpg" },
  { no: "05", h: "Pilates - reformer", p: "Small groups with an instructor, on booked slots.", img: "/deck/act-pilates-reformer.jpg" },
];

const brandZonePointsEn = [
  "LED wall with your logo",
  "Workshop named in the programme",
  "Instructor under your brand",
  "A sample for every participant",
  "The list of everyone who booked",
];

const audienceEn = [
  "Entrepreneurs and managers",
  "Doctors and specialists",
  "Women 35-55 with high disposable income",
  "Investors",
  "Coaches and nutritionists",
  "Corporate teams",
  "Early adopters of health products",
  "The Biohacking.bg community",
  "Athletes",
  "Aesthetic medicine",
];

const audienceStatsEn = [
  { n: "6 h", l: "Average stay", p: "Engaged attention on site, not a three-second impression." },
  { n: "€35-349", l: "Paid entry", p: "Everyone has already invested in their health before walking in." },
  { n: "×3", l: "Passes through the Village", p: "Repeat contact with the brand - several times a day." },
  { n: "35-55", l: "Core of the audience", p: "Active professionals in their strongest career years." },
  { n: "~€120", l: "Average ticket spend", p: "Calculated from the real mix of the three ticket levels." },
  { n: "€249", l: "The PEAK premium ticket", p: "Limited places with Premium Lounge and Meet & Greet - they sell out first." },
];

const journeyEn = [
  { t: "10:00", h: "Registration and the Village", p: "First contact with the brands right at the entrance", brand: true },
  { t: "10:30", h: "Talk on the stage", p: "25 minutes of science in plain language", brand: false },
  { t: "11:15", h: "Workshop: movement", p: "Power Plate or pilates - on a booked slot", brand: true },
  { t: "12:00", h: "Village and lunch", p: "Tastings and conversations with the brands", brand: true },
  { t: "13:30", h: "Workshop: recovery", p: "Breathwork or Recovery", brand: true },
  { t: "14:30", h: "Masterclass", p: "Small group, product in hand", brand: true },
  { t: "15:30", h: "Back to the stage", p: "Panel and questions to the doctors", brand: false },
  { t: "16:30", h: "Village before leaving", p: "A purchase and a last conversation", brand: true },
];

const valueEn = [
  { h: "Qualified contacts", p: "The list of participants from your activations and leads from the stand - people who gave their time, not an email from a raffle." },
  { h: "Direct product experience", p: "The quality conversation starts after the trial, not before it. Your product is in the visitor's hands, not on a shelf." },
  { h: "Visibility on stage and online", p: "Your logo in front of 1,000 people on site and in front of the Biohacking.bg community before, during and after the event." },
  { h: "Content for a whole year", p: "Professional photos and video from your workshop - assets your marketing uses long after November." },
  { h: "A report after the event", p: "Workshop attendance, booked sessions, contacts collected and social reach - numbers for your internal report." },
  { h: "Long-term customers", p: "The visitor links your brand to an experience they remember - the basis of the repeat purchase." },
];

const tiersEn: Tier[] = [
  {
    no: "01", name: "Silver", price: "€3,500",
    has: ["Stand up to 6 m² in a premium position", "2 full tickets", "20 Village tickets", "Logo - site, digital, stage", "Sample in the festival bag", "Video in the Village"],
    not: ["Branded workshop", "Speaker on the stage"],
  },
  {
    no: "02", name: "Gold", price: "€5,500", best: true,
    has: ["Stand up to 8 m² in a premium position", "4 full tickets", "40 Village tickets", "Branded workshop - movement or recovery", "A masterclass of your choice in the programme", "Video on the stage", "Everything in Silver"],
    not: ["Speaker on the stage"],
  },
  {
    no: "03", name: "Platinum", price: "€9,500",
    has: ["Stand up to 10 m² in a premium position", "6 full tickets", "80 Village tickets", "Speaker on the stage, 25 minutes", "Workshop carrying your name", "Category exclusivity", "Everything in Gold"],
    not: [],
  },
];

const congressTiersEn: Tier[] = [
  {
    no: "01", name: "Silver +", price: "€10,000",
    has: ["Everything in Silver at the festival", "Stand in the congress foyer, all three days", "Logo in the congress programme", "2 delegate places"],
    not: ["Satellite symposium", "Material in the delegate bag"],
  },
  {
    no: "02", name: "Gold +", price: "€12,000", best: true,
    has: ["Everything in Gold at the festival", "Stand in the congress foyer, all three days", "Material in the delegate bag", "4 delegate places", "Logo on the congress stage"],
    not: ["Satellite symposium"],
  },
  {
    no: "03", name: "Platinum +", price: "€17,000",
    has: ["Everything in Platinum at the festival", "Satellite symposium, 30 minutes", "Stand in a premium position at the congress", "6 delegate places", "Category exclusivity at both events"],
    not: [],
  },
];

const villageRowsEn: [string, string][] = [
  ["Stand area for 2 days", "up to 6 m²"],
  ["Logo on the site", "Included"],
  ["Logo in the social channels", "Included"],
  ["Sample in the festival bag", "Included"],
  ["Village tickets", "20"],
  ["Right to sample and demonstrate", "Included"],
];

const compareRowsEn: { row: string; cells: Cell[] }[] = [
  { row: "Stand area for 2 days", cells: ["up to 6 m²", "up to 8 m²", "up to 10 m²"] },
  { row: "Premium position in the Village", cells: [true, true, true] },
  { row: "Full tickets for both days", cells: ["2", "4", "6"] },
  { row: "Village tickets", cells: ["20", "40", "80"] },
  { row: "Logo - site, digital, stage", cells: [true, true, true] },
  { row: "Sample in the festival bag", cells: [true, true, true] },
  { row: "Video in the Village", cells: [true, true, true] },
  { row: "Branded workshop", cells: [false, true, true] },
  { row: "A masterclass of your choice in the programme", cells: [false, true, true] },
  { row: "Video on the stage", cells: [false, true, true] },
  { row: "Speaker on the stage, 25 min", cells: [false, false, true] },
  { row: "Workshop carrying your name", cells: [false, false, true] },
];
const compareNamesEn = ["Silver", "Gold", "Platinum"];
const comparePricesEn = ["€3,500", "€5,500", "€9,500"];

const extrasEn = [
  { price: "€4,500", h: "Recovery partner", p: "The Breathwork and Recovery workshops carry your name. Presence at every session, both days. The most photographed part of the event." },
  { price: "€3,000", h: "Movement partner", p: "The Power Plate or pilates workshops with your name. Booked slots, 30 minutes, all day. The product is tried on the spot." },
  { price: "€4,500", h: "Presentation / masterclass", p: "A session of up to 15 minutes with your expert. A recording for your channels and a place in the programme on the site." },
  { price: "€500", h: "Festival bag", p: "One promotional item for 1,000 people, no stand. The fastest way into the event." },
];

const afterEn = [
  { t: "Within 10 days", h: "A report with data", p: "Workshop attendance, booked sessions, leads and social reach." },
  { t: "Within 14 days", h: "Photo and video assets", p: "Professionally shot material from your workshop, with usage rights." },
  { t: "November", h: "Event recap", p: "A summary of the event to the whole community - with the partners in it." },
  { t: "By 31 January", h: "Right of first refusal", p: "Your category is held for 2027 at a fixed price until you decline." },
];

const supportRowsEn = [
  { l: "Organisers", names: "Bulgarian Longevity Association · Biohacking.bg" },
  { l: "Medical partners", names: null },
  { l: "Corporate partners", names: null },
  { l: "Technology partners", names: null },
  { l: "Media partners", names: null },
  { l: "Communities", names: null },
];

const territoriesEn = [
  { h: "Stage", sub: "Presenting Partner" },
  { h: "Breathwork", sub: "Workshop" },
  { h: "Recovery", sub: "Workshop" },
  { h: "Power Plate", sub: "Workshop" },
  { h: "Pilates - mat", sub: "Workshop" },
  { h: "Pilates - reformer", sub: "Workshop" },
  { h: "Networking dinner", sub: "Dinner, day 1" },
  { h: "Festival bag", sub: "A sample for 1,000 people" },
  { h: "Village", sub: "30 places" },
];

const foundingPointsEn = [
  "A zone with real traffic and a list of participants, not a stand with brochures",
  "A role on the stage and your name in all communication until November",
  "A report with data after the event and right of first refusal for 2027",
];

/* ═══════════════════════════ UI strings ═══════════════════════════ */

const CONTACT = "hi@biohacking.bg";

const uiBg = {
  mailto: `mailto:${CONTACT}?subject=${encodeURIComponent("Партньорство Sofia Life Summit 2026")}`,
  metaTitle: "Партньорска програма 2026 | Sofia Life Summit",
  metaDescription: "Sofia Life Summit - партньорски пакети за брандове. 1 000+ посетители, 30 места във Village, 07-08 ноември 2026, София.",
  headerTag: "Партньорска програма 2026",
  coverEyebrow: "Партньорски възможности · 07-08.11.2026",
  coverTag: "Стани партньор",
  coverPill: "Партньорски пакети от 2 500 €",
  coverCta: "Виж работилниците ↓",
  coverP: "Дълголетието е най-бързо растящата тема в потребителското здраве. Sofia Life Summit я превръща в преживяване: два дни, в които 1 000 платили посетители тренират, възстановяват се и изпробват продукти с ръцете си.",
  coverOrg: "Организирано съвместно от Bulgarian Longevity Association и Biohacking.bg",
  formatEyebrow: "Форматът",
  formatH: "Защо преживяването продава повече от щанда",
  scaleEyebrow: "Мащаб",
  scaleH: "Двата дни в числа",
  scaleAlt1: "Залата на Biohacking Experience, пълна с публика",
  scaleCap1: "Biohacking Experience 2025 · пълна зала",
  scaleAlt2: "Сцената на Sofia Life Summit 2026 в Grand Hotel Millennium",
  scaleCap2: "Sofia Life Summit 2026 · сцената в Grand Hotel Millennium",
  scaleH3: "Платена публика, а не случайни минувачи",
  scaleP: "Билети от 35 до 249 € на ранни цени (редовни до 349 €), среден престой около шест часа. Записаните часове за активностите задържат посетителя целия ден.",
  scaleOrg: "↗ Организира се съвместно с Bulgarian Longevity Association",
  orgEyebrow: "Организаторите",
  orgH: "Защо Biohacking.bg и BLA",
  orgP: "Общност, която вече купува в тази категория, и медицинска асоциация, която ѝ дава легитимност.",
  speakersEyebrow: "Сцената",
  speakersH: "50 международни лектори",
  speakersP: "Лекари и изследователи от шест държави, на една сцена през двата дни.",
  conceptEyebrow: "Концепцията",
  conceptH: "Сцена, работилници, Village - един ден в тялото ти",
  zonesEyebrow: "Ядрото на офертата",
  zonesH: "Работилниците",
  zonesP: "Всяка работилница е със записан час и ограничен брой места. Всяка от тях може да носи името на партньор.",
  brandEyebrow: "Как изглежда на място",
  brandH: "Работилницата носи вашето име",
  brandP: "LED стената, разписанието и инструкторът работят под вашия бранд през целия ден - с ваш продукт в ръцете на всеки участник.",
  brandYou: "[Вашият бранд]",
  brandCap: "Работилниците на Sofia Life Summit - визуализация в Гранд Хотел Милениум.",
  brandP2: "Същият формат при вас: вашето лого, вашият инструктор, вашият продукт в ръцете на участниците.",
  audienceEyebrow: "Публиката",
  audienceH: "1 000 души, които вече купуват",
  journeyEyebrow: "Един ден на място",
  journeyH: "Пътуването на посетителя",
  journeyP: "Записаните часове разпределят деня между сцената, работилниците и Village - и връщат всеки посетител при брандовете по няколко пъти.",
  journeyBox: "Осем допирни точки на ден - вашият бранд е на поне три от тях, независимо от пакета.",
  journeyBrand: "Контакт с бранда",
  valueEyebrow: "Стойността",
  valueH: "Какво получава вашата компания",
  valueP: "Написано от вашата гледна точка: какво остава за бранда, когато двата дни свършат.",
  partnersEyebrow: "Кой вече е вътре",
  partnersH: (n: number) => `${n} бранда вече са потвърдили`,
  partnersP: "Диагностика, устройства, възстановяване, движение, клиники и храна. Village се пълни отвътре навън - и категориите се заемат по реда на подписване.",
  partnersP2: "Категорийна ексклузивност се дава само на Платинен - и само докато категорията е свободна.",
  packagesEyebrow: "Партньорства",
  packagesH: "Три партньорски нива",
  packagesP: "Местата на всяко ниво са ограничени. Категорийната ексклузивност е запазена за Платинен - една марка в сегмента.",
  bestValue: "Най-добра стойност",
  mostChosen: "Най-избиран",
  level: "Ниво",
  bothEvents: "двете събития",
  exVat: "/ без ДДС",
  pricesExVat: "Цените са без ДДС",
  congressEyebrow: "Двете събития",
  congressH: "Фестът те среща с човека, който купува. Конгресът - с лекаря, който препоръчва.",
  congressP: "На 06-08 ноември, заедно с феста, се провежда медицинската конференция на Bulgarian Longevity Association. Тези нива дават присъствие и на двете - пред потребителя и пред специалиста.",
  congressNote: "Медицинската конференция има собствена регистрация и програма през Bulgarian Longevity Association. Точният обхват на конгресната част се финализира с тях при подписване, а партньорството за нея се договаря и фактурира отделно от фестивалното.",
  villageEyebrow: "Village щанд",
  villageH: "Village щанд",
  villageP: "Присъствие във Village за двата дни, без допълнения.",
  villagePrice: "2 500 €",
  villageP2: "В цената влизат 20 билета за Village, право на дегустация и позиция по маршрута на всички 1 000 посетители.",
  compareEyebrow: "Сравнение",
  compareH: "Какво включва всяко ниво",
  compareNote: "Village щанд без пакет - 2 500 € (до 6 м²), без активация и допълнения",
  extrasEyebrow: "По избор",
  extrasH: "Отделни възможности",
  titleOnly: "Единствено · По запитване",
  titleP: "Заглавен партньор на събитието. Име в цялата комуникация и в медиите. Ексклузивност в категорията.",
  afterEyebrow: "След ноември",
  afterH: "Партньорството не свършва с феста",
  supportEyebrow: "Подкрепа",
  supportH: "Партньори и организации",
  supportP: "Мястото на вашето лого - до организациите, които вече стоят зад събитието.",
  supportNote: "Логата се добавят при потвърждение - първите партньори застават най-горе.",
  foundingEyebrow: "Партньори · 2026",
  foundingH: "Първите имена още не са заети",
  foundingH3: "Първото име, което България ще свърже с дълголетието.",
  open: "Свободна",
  foundingNote: "Една марка на категория. Местата се разпределят по реда на потвърждаване.",
  nextEyebrow: "Организатори",
  nextH1: "Заповядайте",
  nextH2: "на борда",
  nextP: "Двадесет минути разговор стигат, за да прецените дали форматът работи за вашия бранд.",
  dates: "Дати",
  datesV: "07-08 ноември 2026",
  venue: "Място",
  venueV: "Гранд Хотел Милениум, София",
  partnerships: "Партньорства",
  partnershipsV: "Мария Варсанова",
  min45: "45 мин",
  villageNot1: "Брандирана работилница",
  villageNot2: "Лектор на сцената",
  freeSpots: "свободни места",
};

const uiEn: typeof uiBg = {
  mailto: `mailto:${CONTACT}?subject=${encodeURIComponent("Partnership Sofia Life Summit 2026")}`,
  metaTitle: "Partner programme 2026 | Sofia Life Summit",
  metaDescription: "Sofia Life Summit - partner packages for brands. 1,000+ visitors, 30 places in the Village, 7-8 November 2026, Sofia.",
  headerTag: "Partner programme 2026",
  coverEyebrow: "Partnership opportunities · 07-08.11.2026",
  coverTag: "Become a partner",
  coverPill: "Partner packages from €2,500",
  coverCta: "See the workshops ↓",
  coverP: "Longevity is the fastest-growing topic in consumer health. Sofia Life Summit turns it into an experience: two days in which 1,000 paying visitors train, recover and try products with their own hands.",
  coverOrg: "Organised jointly by the Bulgarian Longevity Association and Biohacking.bg",
  formatEyebrow: "The format",
  formatH: "Why an experience sells more than a stand",
  scaleEyebrow: "Scale",
  scaleH: "The two days in numbers",
  scaleAlt1: "The Biohacking Experience hall, full",
  scaleCap1: "Biohacking Experience 2025 · a full hall",
  scaleAlt2: "The Sofia Life Summit 2026 stage at Grand Hotel Millennium",
  scaleCap2: "Sofia Life Summit 2026 · the stage at Grand Hotel Millennium",
  scaleH3: "A paying audience, not passers-by",
  scaleP: "Tickets from €35 to €249 at early prices (regular up to €349), average stay around six hours. Booked activity slots keep the visitor on site all day.",
  scaleOrg: "↗ Organised jointly with the Bulgarian Longevity Association",
  orgEyebrow: "The organisers",
  orgH: "Why Biohacking.bg and BLA",
  orgP: "A community that already buys in this category, and a medical association that gives it legitimacy.",
  speakersEyebrow: "The stage",
  speakersH: "50 international speakers",
  speakersP: "Doctors and researchers from six countries, on one stage across both days.",
  conceptEyebrow: "The concept",
  conceptH: "Stage, workshops, Village - a day in your own body",
  zonesEyebrow: "The core of the offer",
  zonesH: "The workshops",
  zonesP: "Every workshop runs on booked slots with limited places. Each of them can carry a partner's name.",
  brandEyebrow: "What it looks like on site",
  brandH: "The workshop carries your name",
  brandP: "The LED wall, the schedule and the instructor work under your brand all day - with your product in every participant's hands.",
  brandYou: "[Your brand]",
  brandCap: "The Sofia Life Summit workshops - a visualisation at Grand Hotel Millennium.",
  brandP2: "The same format, yours: your logo, your instructor, your product in the participants' hands.",
  audienceEyebrow: "The audience",
  audienceH: "1,000 people who already buy",
  journeyEyebrow: "One day on site",
  journeyH: "The visitor's journey",
  journeyP: "Booked slots spread the day between the stage, the workshops and the Village - and bring every visitor back to the brands several times.",
  journeyBox: "Eight touchpoints a day - your brand is at no fewer than three of them, whatever the package.",
  journeyBrand: "Brand contact",
  valueEyebrow: "The value",
  valueH: "What your company gets",
  valueP: "Written from your point of view: what stays with the brand when the two days are over.",
  partnersEyebrow: "Who is already in",
  partnersH: (n: number) => `${n} brands have already confirmed`,
  partnersP: "Diagnostics, devices, recovery, movement, clinics and food. The Village fills from the inside out - and categories are taken in order of signing.",
  partnersP2: "Category exclusivity goes only with Platinum - and only while the category is free.",
  packagesEyebrow: "Partnerships",
  packagesH: "Three partner levels",
  packagesP: "Places at every level are limited. Category exclusivity is reserved for Platinum - one brand per segment.",
  bestValue: "Best value",
  mostChosen: "Most chosen",
  level: "Level",
  bothEvents: "both events",
  exVat: "/ ex. VAT",
  pricesExVat: "Prices exclude VAT",
  congressEyebrow: "The two events",
  congressH: "The festival puts you in front of the person who buys. The congress - in front of the doctor who recommends.",
  congressP: "On 6-8 November, alongside the festival, the Bulgarian Longevity Association holds its medical conference. These levels give presence at both - in front of the consumer and the specialist.",
  congressNote: "The medical conference has its own registration and programme through the Bulgarian Longevity Association. The exact scope of the congress part is finalised with them at signing, and that partnership is agreed and invoiced separately from the festival one.",
  villageEyebrow: "Village stand",
  villageH: "Village stand",
  villageP: "Presence in the Village for both days, nothing added.",
  villagePrice: "€2,500",
  villageP2: "The price includes 20 Village tickets, the right to sample and demonstrate, and a position on the route of all 1,000 visitors.",
  compareEyebrow: "Comparison",
  compareH: "What each level includes",
  compareNote: "Village stand without a package - €2,500 (up to 6 m²), no activation or add-ons",
  extrasEyebrow: "Optional",
  extrasH: "Stand-alone options",
  titleOnly: "One only · On request",
  titleP: "Title partner of the event. Name across all communication and media. Category exclusivity.",
  afterEyebrow: "After November",
  afterH: "The partnership does not end with the festival",
  supportEyebrow: "Support",
  supportH: "Partners and organisations",
  supportP: "Where your logo goes - next to the organisations already behind the event.",
  supportNote: "Logos are added on confirmation - the first partners go to the top.",
  foundingEyebrow: "Partners · 2026",
  foundingH: "The first names are not taken yet",
  foundingH3: "The first name Bulgaria will associate with longevity.",
  open: "Open",
  foundingNote: "One brand per category. Places are allocated in order of confirmation.",
  nextEyebrow: "Organisers",
  nextH1: "Welcome",
  nextH2: "aboard",
  nextP: "Twenty minutes of conversation are enough to judge whether the format works for your brand.",
  dates: "Dates",
  datesV: "7-8 November 2026",
  venue: "Venue",
  venueV: "Grand Hotel Millennium, Sofia",
  partnerships: "Partnerships",
  partnershipsV: "Maria Varsanova",
  min45: "45 min",
  villageNot1: "Branded workshop",
  villageNot2: "Speaker on the stage",
  freeSpots: "free places",
};

/* ═══════════════════════════ export ═══════════════════════════ */

export type DeckLang = "bg" | "en";
export const deckLangOf = (v: string | undefined): DeckLang => (v === "en" ? "en" : "bg");

export const DECK_CONTACT = CONTACT;

export const DECK_COPY = {
  bg: { ui: uiBg, format, scale, organizers, speakers, concept, activities, brandZonePoints, audience, audienceStats, journey, value, tiers, congressTiers, villageRows, compareRows, compareNames, comparePrices, extras, after, supportRows, territories, foundingPoints },
  en: { ui: uiEn, format: formatEn, scale: scaleEn, organizers: organizersEn, speakers: speakersEn, concept: conceptEn, activities: activitiesEn, brandZonePoints: brandZonePointsEn, audience: audienceEn, audienceStats: audienceStatsEn, journey: journeyEn, value: valueEn, tiers: tiersEn, congressTiers: congressTiersEn, villageRows: villageRowsEn, compareRows: compareRowsEn, compareNames: compareNamesEn, comparePrices: comparePricesEn, extras: extrasEn, after: afterEn, supportRows: supportRowsEn, territories: territoriesEn, foundingPoints: foundingPointsEn },
} as const;

export type DeckCopy = (typeof DECK_COPY)["bg"];
