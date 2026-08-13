/**
 * Speakers.
 *
 * Taken from the organisers' programme document (version 01.08.2026), in the
 * order the programme first introduces each person — which puts the opening
 * panel at the front without anyone having to rank them by hand.
 *
 * Only what the document actually states is recorded here. Titles, specialities
 * and institutions are filled in as they are confirmed; nothing is inferred
 * from a name, least of all a country.
 *
 * DELIBERATELY NOT CARDED — do not "fix" this by adding them back:
 * - Two people the source marks "(не е говорено с нея)". A page that sells
 *   tickets cannot announce someone who has not agreed to appear.
 * - Мария Силвестър, Мария Илиева and Диана Радева. All three are on stage and
 *   all three stay in the programme, but they host and perform rather than
 *   lecture, and this section is what a visitor scans to judge the medical
 *   line-up.
 *
 * So a name in `program.ts` without a card here is expected, not a gap.
 *
 * `photo` is a path under /public. Until a portrait arrives the card falls back
 * to a monogram, which reads as deliberate rather than broken.
 */
export type Speaker = {
  id: string;
  /** Prefix shown above the name: "Проф. д-р", "Dr.", "PhD" … */
  title?: string;
  name: string;
  /** Medical or research speciality — the credential that matters most here. */
  specialty?: string;
  /** Country of practice, shown as a small label. */
  country?: string;
  /**
   * Hospital, university or company — the institution's own name, nothing
   * else. A position goes in `role`: the two are joined for display, but the
   * event's structured data emits this as an Organization, and no organisation
   * is called "Председател, Bulgarian Longevity Association".
   */
  affiliation?: string;
  /** Position held there: "Председател", "President", "Head of department". */
  role?: string;
  /** What they speak about at the summit. */
  topic?: string;
  photo?: string;
  /** Set while the slot is still being confirmed. */
  pending?: boolean;
};

export const SPEAKERS: Speaker[] = [
  {
    id: "rayna-stoyanova",
    title: "Д-р",
    name: "Райна Стоянова",
    specialty: "Ендокринолог",
    role: "Председател",
    affiliation: "Bulgarian Longevity Association",
    country: "България",
    photo: "/speakers/rayna-stoyanova.jpg",
  },
  {
    id: "rocio-salas-whalen",
    title: "Д-р",
    name: "Rocio Salas-Whalen",
    specialty: "Ендокринология и обезитология",
    country: "САЩ",
    topic: "Автор на „Weightless“",
    photo: "/speakers/rocio-salas-whalen.jpg",
  },
  {
    id: "dominik-thor",
    title: "Проф.",
    name: "Dominik Thor",
    specialty: "Професор по фармация",
    role: "President",
    affiliation: "Geneva College of Longevity Science",
    country: "Швейцария",
    photo: "/speakers/dominik-thor.jpg",
  },
  {
    id: "sara-hagg",
    name: "Sara Hägg",
    affiliation: "Karolinska Institutet",
    country: "Швеция",
    photo: "/speakers/sara-hagg.jpg",
  },
  {
    id: "aleksandar-simidchiev",
    name: "Александър Симидчиев",
    country: "България",
    photo: "/speakers/aleksandar-simidchiev.jpg",
  },
  {
    id: "dean-berman",
    name: "Dean Berman",
    photo: "/speakers/dean-berman.jpg",
  },
  { id: "milen-vasilev", name: "Милен Василев" },
  { id: "viktoriya-sarafyan", name: "Виктория Сарафян" },
  {
    id: "godfrey-grech",
    name: "Godfrey Grech",
    affiliation: "University of Malta",
  },
  {
    id: "tsvetomir-lukanov",
    name: "Цветомир Луканов",
    affiliation: "University of Heidelberg",
  },
  { id: "krasimira-hristova", name: "Красимира Христова" },
  { id: "ivo-petrov", title: "Проф.", name: "Иво Петров" },
  { id: "nikolay-gabrovski", name: "Николай Габровски" },
  { id: "lachezar-traykov", name: "Лъчезар Трайков" },
  { id: "shima-mehrabiyan", name: "Шима Мехрабиян" },
  { id: "ivan-koychev", name: "Иван Койчев" },
  { id: "kiril-terziyski", name: "Кирил Терзийски" },
  { id: "desislava-dimova", name: "Десислава Димова" },
  { id: "ivan-sigridov", name: "Иван Сигридов" },
  { id: "krasimir-balakov", name: "Красимир Балъков" },
  { id: "milena-hadzhiivanova", name: "Милена Хаджииванова" },
  {
    id: "daniela-ilieva",
    title: "Проф.",
    name: "Даниела Илиева",
    specialty: "NLP специалист",
  },
  { id: "yana-balnikova", name: "Яна Балникова" },
  { id: "maria-marinova", name: "Мария Маринова" },
  { id: "louise-newson", name: "Louise Newson" },
  { id: "maria-yunakova", name: "Мария Юнакова" },
  { id: "malina-petkova", name: "Малина Петкова" },
  { id: "tyana-presolska", name: "Тяна Пресолска" },
  { id: "zdravko-kamenov", name: "Здравко Каменов" },
  { id: "branimir-raduilov", name: "Бранимир Радуилов" },
  { id: "aleksandar-shinkov", name: "Александър Шинков" },
  { id: "paul-lee", name: "Paul Lee" },
  { id: "brad-currier", name: "Brad Currier" },
  { id: "radina-denkova", name: "Радина Денкова" },
  { id: "melanie-angelova", name: "Melanie Angelova" },
  { id: "martin-genov", name: "Мартин Генов" },
  { id: "simeon-lichev", name: "Симеон Личев" },
  { id: "kristina-gazieva", name: "Кристина Газиева" },
  { id: "ekaterina-kurteva", name: "Екатерина Куртева" },
  { id: "aneliya-bivolarska", name: "Анелия Биволарска" },
  { id: "silvena-rowe", name: "Silvena Rowe" },
  { id: "ivan-manchev", name: "Иван Манчев" },
  { id: "morten-scheibye-knudsen", name: "Morten Scheibye-Knudsen" },
  { id: "fahri-saatcioglu", name: "Fahri Saatcioglu" },
  { id: "yani-dragov", name: "Яни Драгов" },
  { id: "vanya-mitova", name: "Ваня Митова" },
  {
    id: "guido-axmann",
    name: "Guido Axmann",
    affiliation: "Geneva College of Longevity Science",
  },
  { id: "tanya-kadiyska", name: "Таня Кадийска" },
  {
    id: "maria-varsanova",
    name: "Мария Варсанова",
    affiliation: "Biohacking BG",
  },
  {
    id: "julia-dimitrova",
    name: "Джулия Димитрова",
    affiliation: "Biohacking BG",
  },
  {
    // Not in the 01.08.2026 programme document, but confirmed earlier and kept
    // rather than dropped — a missing session is not the same as a withdrawal.
    id: "neli-ognyanova",
    title: "Д-р",
    name: "Нели Огнянова",
    country: "България",
    photo: "/speakers/neli-ognyanova.jpg",
  },
];

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
