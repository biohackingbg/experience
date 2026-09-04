/**
 * Speakers.
 *
 * Taken from the organisers' programme document (version 01.08.2026), in the
 * order the programme first introduces each person - which puts the opening
 * panel at the front without anyone having to rank them by hand.
 *
 * Only what the document actually states is recorded here. Titles, specialities
 * and institutions are filled in as they are confirmed; nothing is inferred
 * from a name, least of all a country.
 *
 * DELIBERATELY NOT CARDED - do not "fix" this by adding them back:
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
  /** Medical or research speciality - the credential that matters most here. */
  specialty?: string;
  /** Country of practice, shown as a small label. */
  country?: string;
  /**
   * Hospital, university or company - the institution's own name, nothing
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
  /**
   * Only announced speakers render on the page and in the structured data.
   * The rest of the line-up is deliberately held back: new names are released
   * week by week, and that weekly reveal is the reason to leave an email.
   * Announcing someone = flipping this to true.
   */
  announced?: boolean;
};

/** What the page and the event schema actually show. */
export function announcedSpeakers(): Speaker[] {
  // Local preview switch. Set PREVIEW_ALL_SPEAKERS=1 in .env.local (which is
  // gitignored and never uploaded) to see every card while their titles and
  // photos are being filled in. The variable does not exist in Vercel, so
  // production keeps showing only the announced ones - a half-finished
  // profile cannot slip out by being committed at the wrong moment.
  //
  // Only server components call this, so the flag cannot desync the client.
  if (process.env.PREVIEW_ALL_SPEAKERS === "1") {
    return SPEAKERS.filter((s) => !s.pending);
  }
  return SPEAKERS.filter((s) => s.announced && !s.pending);
}

export const SPEAKERS: Speaker[] = [
  {
    id: "rayna-stoyanova",
    announced: true,
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
    announced: true,
    title: "Д-р",
    name: "Rocio Salas-Whalen",
    specialty: "Ендокринология и обезитология",
    country: "САЩ",
    topic: "Автор на „Weightless“",
    photo: "/speakers/rocio-salas-whalen.jpg",
  },
  {
    id: "dominik-thor",
    announced: true,
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
    announced: true,
    title: "Доц.",
    name: "Sara Hägg",
    specialty: "Молекулярна епидемиология на стареенето",
    role: "Ръководител на изследователска група",
    affiliation: "Karolinska Institutet",
    country: "Швеция",
    photo: "/speakers/sara-hagg.jpg",
  },
  {
    // His seat in parliament is left off deliberately: the card exists to say
    // why he belongs on a medical stage, and naming a party on a page that
    // sells tickets reads as a political statement the event is not making.
    id: "aleksandar-simidchiev",
    announced: true,
    title: "Д-р",
    name: "Александър Симидчиев",
    specialty: "Пулмолог и специалист по вътрешни болести",
    role: "Началник на Отделението по функционална диагностика",
    affiliation: "Медицински институт на МВР",
    country: "България",
    // His second post; the card carries one, the credential line the other.
    topic: "Медицински директор, Център за електронно и дистанционно обучение, МУ - Пловдив",
    photo: "/speakers/aleksandar-simidchiev.jpg",
  },
  {
    id: "dean-berman",
    announced: true,
    title: "Д-р",
    name: "Dean Berman",
    specialty: "Longevity медицина и пептидни терапии",
    role: "Global Vice President Medical",
    affiliation: "Alma Lasers",
    country: "Австрия",
    // His second post; the card carries one, the credential line the other.
    topic: "Assistant Professor of Longevity, Geneva College of Longevity Science",
    photo: "/speakers/dean-berman.jpg",
  },
  {
    id: "godfrey-grech",
    announced: true,
    title: "Проф.",
    name: "Godfrey Grech",
    specialty: "Патология и молекулярна онкология",
    affiliation: "University of Malta",
    country: "Малта",
    photo: "/speakers/godfrey-grech.jpg",
  },
  {
    // Degrees sit after the name, the way Bulgarian academia writes them -
    // the emblem on her coat turned out to be MU Plovdiv after all.
    id: "viktoriya-sarafyan",
    announced: true,
    title: "Проф. д-р",
    name: "Виктория Сарафян, дм, дмн",
    affiliation: "Медицински университет - Пловдив",
    country: "България",
    photo: "/speakers/viktoriya-sarafyan.jpg",
  },
  {
    announced: true,
    id: "tsvetomir-lukanov",
    title: "Проф. д-р",
    name: "Цветомир Луканов, дм",
    specialty: "Детска кардиохирургия",
    role: "Ръководител, Секция по детска кардиохирургия",
    affiliation: "Университетска клиника Хайделберг",
    country: "Германия",
    photo: "/speakers/tsvetomir-lukanov.jpg",
  },
  {
    announced: true,
    id: "krasimira-hristova",
    title: "Доц. д-р",
    name: "Красимира Христова, дм",
    specialty: "Кардиология",
    // Where she trained, not where she works: KU Leuven belongs in the
    // credential line, not in `affiliation`, which the structured data emits
    // as the organisation she is at.
    topic: "Магистратура по образна диагностика в кардиологията, KU Leuven",
    photo: "/speakers/krasimira-hristova.jpg",
  },
  {
    announced: true,
    id: "ivo-petrov",
    title: "Член-кор. проф. д-р",
    name: "Иво Петров, дмн",
    specialty: "Кардиология и ангиология",
    // Two posts at the same hospital; the card shows one line, so it carries
    // the senior one and the clinic goes in the credential below. The BAS
    // membership now lives in the title, where she put it.
    role: "Медицински директор",
    affiliation: "Acibadem City Clinic УМБАЛ Витоша",
    country: "България",
    topic: "Началник, Клиника по кардиология и ангиология",
    photo: "/speakers/ivo-petrov.jpg",
  },
  {
    announced: true,
    id: "nikolay-gabrovski",
    title: "Чл.-кор. проф. д-р",
    name: "Николай Габровски, дмн",
    specialty: "Неврохирургия",
    role: "Председател",
    affiliation: "Българско дружество по неврохирургия",
    country: "България",
    photo: "/speakers/nikolay-gabrovski.jpg",
  },
  {
    announced: true,
    id: "lachezar-traykov",
    title: "Акад. проф. д-р",
    name: "Лъчезар Трайков, дмн",
    specialty: "Неврология и невронауки",
    // "Академик" is already in the title, so the affiliation stands alone
    // rather than reading "Академик, Академия" on one line.
    affiliation: "Българска академия на науките",
    country: "България",
    topic: "Експерт по болестта на Алцхаймер, деменции и стареене на мозъка",
    photo: "/speakers/lachezar-traykov.jpg",
  },
  {
    announced: true,
    id: "shima-mehrabiyan",
    title: "Доц. д-р",
    name: "Шима Мехрабиан-Спасова, дмн",
    specialty: "Неврология и невродегенеративни заболявания",
    affiliation: "Катедра по неврология, Медицински университет - София",
    country: "България",
    topic: "Експерт по деменции, болест на Алцхаймер и когнитивни нарушения",
    photo: "/speakers/shima-mehrabiyan.jpg",
  },
  {
    announced: true,
    id: "ivan-koychev",
    title: "Д-р",
    name: "Иван Койчев, MD, PhD",
    specialty: "Невропсихиатрия, деменции и мозъчно здраве",
    role: "Clinical Associate Professor in Neuropsychiatry",
    affiliation: "Imperial College London",
    country: "Великобритания",
    // His clinical post and his field, on the credential line together.
    topic: "Consultant Neuropsychiatrist · Експерт по ранна диагностика, биомаркери и превенция на деменцията",
    photo: "/speakers/ivan-koychev.jpg",
  },
  {
    announced: true,
    id: "kiril-terziyski",
    title: "Доц. д-р",
    name: "Кирил Терзийски, дм",
    specialty: "Медицина на съня и патофизиология",
    role: "Председател",
    affiliation: "Българско дружество по сомнология",
    country: "България",
    // His academic post; the card carries one, the credential line the other.
    topic: "Доцент, Медицински университет - Пловдив",
    photo: "/speakers/kiril-terziyski.jpg",
  },
  {
    announced: true,
    id: "desislava-dimova",
    title: "Д-р",
    name: "Десислава Димова",
    specialty: "Офталмология и окулопластична хирургия",
    country: "България",
    // No institution given yet; the two expertise lines share the credential.
    topic: "Специалист по естетична и реконструктивна окулопластична хирургия · Експерт по хирургични и нехирургични методи за околоочната зона",
    photo: "/speakers/desislava-dimova.jpg",
  },
  {
    announced: true,
    id: "ivan-sigridov",
    title: "Д-р",
    name: "Иван Сигридов",
    specialty: "Пренатална медицина и акушерство и гинекология",
    role: "Основател",
    affiliation: "Медицински център „Д-р Сигридов“",
    country: "България",
    topic: "Експерт по ембрио-фетална морфология, високорискова бременност и подготовка за зачеване",
    photo: "/speakers/ivan-sigridov.jpg",
  },
  {
    announced: true,
    id: "krasimir-balakov",
    name: "Красимир Балъков",
    specialty: "Спортно дълголетие и високо представяне",
    // Not a post at an institution, so it stands alone where the post would.
    role: "Футболна легенда и треньор",
    country: "България",
    topic: "Част от Златното поколение на България и 4-ти в света на FIFA World Cup 1994",
    photo: "/speakers/krasimir-balakov.jpg",
  },
  {
    announced: true,
    id: "milena-hadzhiivanova",
    title: "Д-р",
    name: "Милена Хаджииванова, PhD",
    specialty: "Психология, ментално здраве и устойчивост",
    // A practice, not a post at an institution, so it stands where the post would.
    role: "Психолог и Executive & Mental Performance Coach",
    country: "България",
    topic: "Автор и водещ на Mindset Power Talk",
    photo: "/speakers/milena-hadzhiivanova.jpg",
  },
  {
    announced: true,
    id: "daniela-ilieva",
    title: "Проф. д-р",
    name: "Даниела Илиева, PhD",
    specialty: "Невролингвистично програмиране, комуникация и личностно развитие",
    // An academic chair rather than a post at a named institution.
    role: "Професор по мениджмънт, бизнес комуникации и управление на личностното развитие",
    country: "България",
    topic: "Сертифициран NLP Trainer и Coach",
    photo: "/speakers/daniela-ilieva.jpg",
  },
  {
    announced: true,
    id: "yana-balnikova",
    name: "Яна Балникова",
    specialty: "(Пери)менопауза и женско здраве",
    role: "Основател",
    affiliation: "„Меноморфоза“",
    country: "България",
    topic: "Лектор и застъпник за информираността за перименопаузата и менопаузата",
    photo: "/speakers/yana-balnikova.jpg",
  },
  {
    announced: true,
    id: "maria-marinova",
    name: "Мария Маринова",
    specialty: "Психология, психотерапия и емоционално здраве",
    // A practice, not a post at an institution, so it stands where the post would.
    role: "Психолог и сертифициран психотерапевт",
    country: "България",
    topic: "Семеен консултант под супервизия",
    photo: "/speakers/maria-marinova.jpg",
  },
  {
    announced: true,
    id: "louise-newson",
    title: "Dr",
    name: "Louise Newson, BSc, MBChB, MRCP, FRCGP, DHealth",
    specialty: "Менопауза и женско хормонално здраве",
    role: "Основател",
    affiliation: "Newson Clinic & Newson Education",
    country: "Великобритания",
    // Her other two roles share the credential line.
    topic: "Основател, Balance App · Член, UK Government Menopause Taskforce",
    photo: "/speakers/louise-newson.jpg",
  },
  {
    announced: true,
    id: "maria-yunakova",
    title: "Проф. д-р",
    name: "Мария Юнакова, дм",
    specialty: "Репродуктивна медицина и женско хормонално здраве",
    role: "Председател",
    affiliation: "Българска асоциация по стерилитет и репродуктивно здраве",
    country: "България",
    topic: "Акушер-гинеколог и специалист по асистирана репродукция",
    photo: "/speakers/maria-yunakova.jpg",
  },
  {
    announced: true,
    id: "malina-petkova",
    title: "Доц. д-р",
    name: "Малина Петкова, дм",
    specialty: "Ендокринология, метаболитно и хормонално здраве",
    role: "Началник, Клиника по вътрешни болести",
    affiliation: "УМБАЛ „Лозенец“",
    country: "България",
    // Her academic post; the card carries one, the credential line the other.
    topic: "Преподавател, Медицински факултет на Софийски университет",
    photo: "/speakers/malina-petkova.jpg",
  },
  {
    announced: true,
    id: "tyana-presolska",
    name: "Тяна Пресолска",
    specialty: "Перименопауза, менопауза и женско метаболитно здраве",
    // A qualification rather than a post at an institution, so it stands where the post would.
    role: "Сертифициран специалист по менопауза и магистър по хранене",
    country: "България",
    topic: "Преподавател, Медицински университет - София",
    photo: "/speakers/tyana-presolska.jpg",
  },
  {
    announced: true,
    id: "zdravko-kamenov",
    title: "Проф. д-р",
    name: "Здравко Каменов, дмн",
    specialty: "Ендокринология, метаболитно и хормонално здраве",
    role: "Началник, Клиника по ендокринология и болести на обмяната",
    affiliation: "УМБАЛ „Александровска“",
    country: "България",
    // His academic post; the card carries one, the credential line the other.
    topic: "Ръководител, Катедра по вътрешни болести, Медицински университет - София",
    photo: "/speakers/zdravko-kamenov.jpg",
  },
  {
    announced: true,
    id: "branimir-raduilov",
    title: "Д-р",
    name: "Бранимир Радуилов",
    specialty: "Обща медицина и превантивно здраве",
    // A practice, not a post at an institution, so it stands where the post would.
    role: "Общопрактикуващ лекар",
    country: "България",
    topic: "Експерт в развитието на съвременната първична медицинска помощ",
    photo: "/speakers/branimir-raduilov.jpg",
  },
  {
    announced: true,
    id: "aleksandar-shinkov",
    title: "Доц. д-р",
    name: "Александър Шинков, дм",
    specialty: "Ендокринология, метаболитно и хормонално здраве",
    role: "Председател",
    affiliation: "Българско дружество по ендокринология",
    country: "България",
    // His academic post; the card carries one, the credential line the other.
    topic: "Доцент, Катедра по ендокринология, Медицински университет - София",
    photo: "/speakers/aleksandar-shinkov.jpg",
  },
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
    // Last on purpose: still to be confirmed whether he speaks or hosts.
    id: "milen-vasilev",
    name: "Милен Василев",
  },
];

/**
 * The English half of the cards above, written by hand and keyed by id.
 *
 * Only what changes: a name is a name in both languages (the English page
 * transliterates the Cyrillic ones - see lib/latin.ts). Institutions are
 * given their own official English names where they have one.
 */
export type SpeakerEn = {
  title?: string;
  specialty?: string;
  role?: string;
  affiliation?: string;
  topic?: string;
};

export const SPEAKERS_EN: Record<string, SpeakerEn> = {
  "rayna-stoyanova": { title: "Dr", specialty: "Endocrinologist", role: "President" },
  "rocio-salas-whalen": { title: "Dr", specialty: "Endocrinology and obesity medicine", topic: "Author of \u201cWeightless\u201d" },
  "dominik-thor": { title: "Prof.", specialty: "Professor of pharmacy" },
  "sara-hagg": { title: "Assoc. Prof.", specialty: "Molecular epidemiology of ageing", role: "Research group leader" },
  "aleksandar-simidchiev": {
    title: "Dr",
    specialty: "Pulmonologist and internal medicine specialist",
    role: "Head of the Department of Functional Diagnostics",
    affiliation: "Medical Institute of the Ministry of the Interior",
    topic: "Medical Director, Centre for E-learning and Distance Learning, Medical University - Plovdiv",
  },
  "dean-berman": { title: "Dr", specialty: "Longevity medicine and peptide therapies" },
  "godfrey-grech": { title: "Prof.", specialty: "Pathology and molecular oncology" },
  "viktoriya-sarafyan": { title: "Prof. Dr", affiliation: "Medical University - Plovdiv" },
  "tsvetomir-lukanov": {
    title: "Prof. Dr",
    specialty: "Paediatric cardiac surgery",
    role: "Head, Section of Paediatric Cardiac Surgery",
    affiliation: "Heidelberg University Hospital",
  },
  "krasimira-hristova": {
    title: "Assoc. Prof. Dr",
    specialty: "Cardiology",
    topic: "MSc in cardiovascular imaging, KU Leuven",
  },
  "ivo-petrov": {
    title: "Corr. Mem. Prof. Dr",
    specialty: "Cardiology and angiology",
    role: "Medical Director",
    affiliation: "Acibadem City Clinic Tokuda Vitosha Hospital",
    topic: "Head, Clinic of Cardiology and Angiology",
  },
  "nikolay-gabrovski": {
    title: "Corr. Mem. Prof. Dr",
    specialty: "Neurosurgery",
    role: "President",
    affiliation: "Bulgarian Society of Neurosurgery",
  },
  "lachezar-traykov": {
    title: "Acad. Prof. Dr",
    specialty: "Neurology and neuroscience",
    affiliation: "Bulgarian Academy of Sciences",
    topic: "Expert in Alzheimer\u2019s disease, dementias and brain ageing",
  },
  "shima-mehrabiyan": {
    title: "Assoc. Prof. Dr",
    specialty: "Neurology and neurodegenerative disease",
    affiliation: "Department of Neurology, Medical University - Sofia",
    topic: "Expert in dementias, Alzheimer\u2019s disease and cognitive impairment",
  },
  "ivan-koychev": {
    title: "Dr",
    specialty: "Neuropsychiatry, dementias and brain health",
    topic: "Consultant Neuropsychiatrist \u00b7 Expert in early diagnosis, biomarkers and dementia prevention",
  },
  "kiril-terziyski": {
    title: "Assoc. Prof. Dr",
    specialty: "Sleep medicine and pathophysiology",
    role: "President",
    affiliation: "Bulgarian Society of Sleep Medicine",
    topic: "Associate Professor, Medical University - Plovdiv",
  },
  "desislava-dimova": {
    title: "Dr",
    specialty: "Ophthalmology and oculoplastic surgery",
    topic: "Specialist in aesthetic and reconstructive oculoplastic surgery \u00b7 Expert in surgical and non-surgical treatment of the periocular area",
  },
  "ivan-sigridov": {
    title: "Dr",
    specialty: "Prenatal medicine, obstetrics and gynaecology",
    role: "Founder",
    affiliation: "Dr Sigridov Medical Centre",
    topic: "Expert in embryo-fetal morphology, high-risk pregnancy and preconception care",
  },
  "krasimir-balakov": {
    specialty: "Sporting longevity and high performance",
    role: "Football legend and coach",
    topic: "Part of Bulgaria\u2019s Golden Generation, fourth in the world at the 1994 FIFA World Cup",
  },
  "milena-hadzhiivanova": {
    title: "Dr",
    specialty: "Psychology, mental health and resilience",
    role: "Psychologist and Executive & Mental Performance Coach",
    topic: "Author and host of Mindset Power Talk",
  },
  "daniela-ilieva": {
    title: "Prof. Dr",
    specialty: "Neuro-linguistic programming, communication and personal development",
    role: "Professor of management, business communication and personal development",
    topic: "Certified NLP Trainer and Coach",
  },
  "yana-balnikova": {
    specialty: "(Peri)menopause and women\u2019s health",
    role: "Founder",
    affiliation: "Menomorphosis",
    topic: "Speaker and advocate for perimenopause and menopause awareness",
  },
  "maria-marinova": {
    specialty: "Psychology, psychotherapy and emotional health",
    role: "Psychologist and certified psychotherapist",
    topic: "Family counsellor under supervision",
  },
  "louise-newson": {
    specialty: "Menopause and women\u2019s hormone health",
    role: "Founder",
    topic: "Founder, Balance App \u00b7 Member, UK Government Menopause Taskforce",
  },
  "maria-yunakova": {
    title: "Prof. Dr",
    specialty: "Reproductive medicine and women\u2019s hormone health",
    role: "President",
    affiliation: "Bulgarian Association of Sterility and Reproductive Health",
    topic: "Obstetrician-gynaecologist and specialist in assisted reproduction",
  },
  "malina-petkova": {
    title: "Assoc. Prof. Dr",
    specialty: "Endocrinology, metabolic and hormone health",
    role: "Head, Clinic of Internal Medicine",
    affiliation: "Lozenets University Hospital",
    topic: "Lecturer, Faculty of Medicine, Sofia University",
  },
  "tyana-presolska": {
    specialty: "Perimenopause, menopause and women\u2019s metabolic health",
    role: "Certified menopause specialist and MSc in nutrition",
    topic: "Lecturer, Medical University - Sofia",
  },
  "zdravko-kamenov": {
    title: "Prof. Dr",
    specialty: "Endocrinology, metabolic and hormone health",
    role: "Head, Clinic of Endocrinology and Metabolic Diseases",
    affiliation: "Alexandrovska University Hospital",
    topic: "Head, Department of Internal Medicine, Medical University - Sofia",
  },
  "branimir-raduilov": {
    title: "Dr",
    specialty: "General practice and preventive health",
    role: "General practitioner",
    topic: "Expert in the development of modern primary care",
  },
  "aleksandar-shinkov": {
    title: "Assoc. Prof. Dr",
    specialty: "Endocrinology, metabolic and hormone health",
    role: "President",
    affiliation: "Bulgarian Society of Endocrinology",
    topic: "Associate Professor, Department of Endocrinology, Medical University - Sofia",
  },
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
