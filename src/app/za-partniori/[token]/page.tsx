import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/ui/Reveal";
import { findActiveLink } from "@/lib/deck-links";
import { DECK_SECTIONS } from "@/lib/deck-sections";

import { JourneyTimeline } from "./JourneyTimeline";
import { ViewBeacon } from "./ViewBeacon";

export const metadata: Metadata = {
  title: "Партньорска програма 2026 | Sofia Life Summit",
  description:
    "Sofia Life Summit — партньорски пакети за брандове. 1 000+ посетители, 30 места във Village, 07—08 ноември 2026, София.",
  // Shared by link with prospective partners, not found by search.
  robots: { index: false, follow: false },
};

// Every request checks the token — a revoked link must close at once.
export const dynamic = "force-dynamic";

/*
 * The partner deck as a page. Content mirrors the approved PDF
 * (sofia-life-summit-sponsori-svetla, Aug 2026) word for word — the copy is
 * the client's, the layout is the site's. Data sits at the top so the deck
 * can be edited without touching layout.
 */

const CONTACT = "hello@biohacking.bg";
const MAILTO = `mailto:${CONTACT}?subject=${encodeURIComponent("Партньорство Sofia Life Summit 2026")}`;

/* ── 02 форматът ── */
const format = [
  {
    h: "Преживяването остава",
    p: "Продуктът ви става част от момент, който посетителят помни и свързва с вашия бранд — не поредна реклама, покрай която минава.",
  },
  {
    h: "Тридесет минути пълно внимание",
    p: "Активациите са със записан час и ограничени места. Никой друг формат не дава на бранда половин час насаме с клиента.",
  },
  {
    h: "Пробваното се купува",
    p: "Когато човек пробва нещо лично, е много по-лесно да го купи. Активностите правят точно това — а Village е на крачка от тях.",
  },
];

/* ── 03 мащаб ── */
const scale = [
  { n: "1 000+", l: "посетители" },
  { n: "4", l: "зони" },
  { n: "10", l: "интерактивни станции" },
  { n: "50", l: "международни лектори" },
  { n: "30", l: "подбрани бранда" },
];

/* ── 04 организаторите ── */
const organizers = [
  { n: "25 000+", l: "Общност", p: "Изградена аудитория в социалните канали и имейл листата на Biohacking.bg." },
  { n: "10+", l: "Проведени събития", p: "Конференции, корпоративни обучения и ретрийти в България и чужбина." },
  { n: "15+", l: "Корпоративни клиенти", p: "Компании, преминали през wellness програмите и обученията на Biohacking.bg." },
  { n: "400+", l: "Курсисти", p: "Преминали през платените онлайн програми на Biohacking.bg." },
  { n: "BLA", l: "Медицински гръб", p: "Bulgarian Longevity Association — лекари и изследователи, не инфлуенсър формат." },
  { n: "6", l: "Държави в програмата", p: "Karolinska Institutet, Geneva College of Longevity Science, University of Malta и др." },
];

/* ── 05 лекторите — the deck's own credential lines, with the site's portraits ── */
const speakers = [
  { name: "Д-р Райна Стоянова", line1: "България · Ендокринолог", line2: "Председател, Bulgarian Longevity Association", photo: "/speakers/rayna-stoyanova.jpg" },
  { name: "Д-р Rocio Salas-Whalen", line1: "САЩ · Ендокринология", line2: "Автор на „Weightless“", photo: "/speakers/rocio-salas-whalen.jpg" },
  { name: "Проф. Dominik Thor", line1: "Швейцария · Фармация", line2: "President, Geneva College of Longevity Science", photo: "/speakers/dominik-thor.jpg" },
  { name: "Доц. Sara Hägg", line1: "Швеция · Епидемиология на стареенето", line2: "Karolinska Institutet", photo: "/speakers/sara-hagg.jpg" },
  { name: "Д-р Александър Симидчиев", line1: "България · Пулмолог", line2: "Централна клинична болница на МВР", photo: "/speakers/aleksandar-simidchiev.jpg" },
  { name: "Д-р Dean Berman", line1: "Австрия", line2: "Global VP Medical, Alma Lasers", photo: "/speakers/dean-berman.jpg" },
  { name: "Проф. Godfrey Grech", line1: "Малта · Молекулярна онкология", line2: "University of Malta", photo: "/speakers/godfrey-grech.jpg" },
  { name: "Проф. д-р Виктория Сарафян", line1: "България", line2: "Медицински университет — Пловдив", photo: "/speakers/viktoriya-sarafyan.jpg" },
];

/* ── 06 концепцията ── */
const concept = [
  { no: "01", tag: "Знанието", h: "Сцена", sym: "◎", p: "18 лекции и панела — лекари и изследователи на разбираем език." },
  { no: "02", tag: "Тялото", h: "Движение", sym: "◍", p: "Power Plate зона и пилатес — на постелка и на реформър, със записан час." },
  { no: "03", tag: "Балансът", h: "Възстановяване", sym: "≋", p: "Cold plunge, breathwork сесии и Recovery зона, по 30 минути." },
  { no: "04", tag: "Брандовете", h: "Village", sym: "⌂", p: "30 подбрани компании: добавки, устройства, клиники, храна." },
];

/* ── 07 зоните ── */
const activities = [
  { no: "01", h: "Cold Plunge", p: "Потапяне в студена вода с инструктор и подготовка.", img: "/deck/act-cold.jpg" },
  { no: "02", h: "Breathwork", p: "Групови дихателни сесии по 30 минути.", img: "/deck/act-breathwork.jpg" },
  { no: "03", h: "Recovery Zone", p: "Компресия, перкусия и възстановяване след натоварване.", img: "/deck/act-recovery.jpg" },
  { no: "04", h: "Power Plate Zone", p: "Вибрационна тренировка с демонстрации на живо.", img: "/deck/act-powerplate.jpg" },
  { no: "05", h: "Пилатес — постелка", p: "Групови сесии за начинаещи и напреднали.", img: "/deck/act-pilates-mat.jpg" },
  { no: "06", h: "Пилатес — реформър", p: "Малки групи с инструктор, със записан час.", img: "/deck/act-pilates-reformer.jpg" },
];

/* ── 08 брандирана зона ── */
const brandZonePoints = [
  "LED стена с вашето лого",
  "Име на зоната в програмата",
  "Инструктор с вашия бранд",
  "Мостра за всеки участник",
  "Списък със записалите се",
];

/* ── 09 публиката ── */
const audience = [
  "Предприемачи и мениджъри",
  "Лекари и специалисти",
  "Жени 35—55 с висок разполагаем доход",
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
  { n: "35—349 €", l: "Платен вход", p: "Всеки вече е инвестирал в здравето си, преди да влезе." },
  { n: "×3", l: "Минавания през Village", p: "Повторен контакт с бранда — по няколко пъти на ден." },
  { n: "35—55", l: "Ядро на аудиторията", p: "Активни професионалисти в най-силните си кариерни години." },
  { n: "~120 €", l: "Среден разход за билет", p: "Изчислен от реалния микс на трите нива билети." },
  { n: "249 €", l: "Премиум билетът PEAK", p: "Ограничени места с Premium Lounge и Meet & Greet — запълват се първи." },
];

/* ── 10 пътуването · brand: does this touchpoint put the visitor at a brand? ── */
const journey = [
  { t: "10:00", h: "Регистрация и Village", p: "Първи контакт с брандовете още на входа", brand: true },
  { t: "10:30", h: "Лекция на сцената", p: "25 минути наука на разбираем език", brand: false },
  { t: "11:15", h: "Активация: движение", p: "Power Plate или пилатес — със записан час", brand: true },
  { t: "12:00", h: "Village и обяд", p: "Дегустации и разговори с брандовете", brand: true },
  { t: "13:30", h: "Активация: възстановяване", p: "Cold plunge, breathwork или Recovery", brand: true },
  { t: "14:30", h: "Уъркшоп", p: "Малка група, продукт в ръцете", brand: true },
  { t: "15:30", h: "Отново сцената", p: "Панел и въпроси към лекарите", brand: false },
  { t: "16:30", h: "Village преди тръгване", p: "Покупка и последен разговор", brand: true },
];

/* ── 11 стойността ── */
const value = [
  { h: "Квалифицирани контакти", p: "Списък с участниците от вашите активации и лийдове от щанда — хора, които са дали време, не имейл от томбола." },
  { h: "Директен опит с продукта", p: "Качественият разговор започва след пробата, не преди нея. Вашият продукт е в ръцете на посетителя, не на рафт." },
  { h: "Видимост на сцената и в дигитала", p: "Лого пред 1 000 души на място и пред общността на Biohacking.bg преди, по време и след събитието." },
  { h: "Съдържание за цяла година", p: "Професионални снимки и видео от вашата зона — активи, които маркетингът ви ползва след ноември." },
  { h: "Отчет след събитието", p: "Посещаемост на зоната, записани сесии, събрани контакти и социален обхват — числа за вашия вътрешен отчет." },
  { h: "Дългосрочни клиенти", p: "Посетителят свързва бранда ви с преживяване, което помни — основата на повторната покупка." },
];

/* ── 12 нива ── */
type Tier = {
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
    price: "10 000 €",
    has: [
      "Щанд до 6 м² на премиум позиция",
      "2 пълни билета",
      "20 билета за Village зоната",
      "Лого — сайт, дигитал, сцена",
      "Мостра във фестивалната чанта",
      "Видео в Village зоната",
    ],
    not: ["Брандирана активация в зона", "Лектор на сцената"],
  },
  {
    no: "02",
    name: "Златен",
    price: "12 000 €",
    best: true,
    has: [
      "Щанд до 8 м² на премиум позиция",
      "4 пълни билета",
      "40 билета за Village зоната",
      "Брандирана активация в зона Движение или Възстановяване",
      "Уъркшоп в зона по избор",
      "Видео на сцената",
      "Всичко от Сребърен",
    ],
    not: ["Лектор на сцената"],
  },
  {
    no: "03",
    name: "Платинен",
    price: "17 000 €",
    has: [
      "Щанд до 10 м² на премиум позиция",
      "6 пълни билета",
      "80 билета за Village зоната",
      "Лектор на сцената, 25 минути",
      "Име на брандирана зона",
      "Категорийна ексклузивност",
      "Всичко от Златен",
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
  ["Билети за Village зоната", "20"],
  ["Право на дегустация и демонстрация", "Включено"],
];

/* ── 14 сравнение ── */
type Cell = string | boolean;
const compareRows: { row: string; cells: Cell[] }[] = [
  { row: "Щанд площ за 2 дни", cells: ["до 6 м²", "до 8 м²", "до 10 м²"] },
  { row: "Премиум позиция в Village", cells: [true, true, true] },
  { row: "Пълни билети за двата дни", cells: ["2", "4", "6"] },
  { row: "Билети за Village зоната", cells: ["20", "40", "80"] },
  { row: "Лого — сайт, дигитал, сцена", cells: [true, true, true] },
  { row: "Мостра във фестивалната чанта", cells: [true, true, true] },
  { row: "Видео в Village зоната", cells: [true, true, true] },
  { row: "Брандирана активация в зона", cells: [false, true, true] },
  { row: "Уъркшоп в зона по избор", cells: [false, true, true] },
  { row: "Видео на сцената", cells: [false, true, true] },
  { row: "Лектор на сцената, 25 мин", cells: [false, false, true] },
  { row: "Име на брандирана зона", cells: [false, false, true] },
];
const compareNames = ["Сребърен", "Златен", "Платинен"];
const comparePrices = ["10 000 €", "12 000 €", "17 000 €"];

/* ── 15 по избор ── */
const extras = [
  { price: "4 500 €", h: "Партньор на Recovery", p: "Cold plunge и breathwork зоната носи вашето име. Присъствие при всяка сесия, двата дни. Най-сниманата зона на събитието." },
  { price: "3 000 €", h: "Партньор на Движение", p: "Power Plate или пилатес зоната с ваше име. Записан час, 30 минути, целодневно. Продуктът се пробва на място." },
  { price: "4 500 €", h: "Презентация / уъркшоп", p: "Сесия до 15 минути с ваш експерт. Запис за вашите канали и място в програмата на сайта." },
  { price: "500 €", h: "Фестивална чанта", p: "Един рекламен материал за 1 000 души, без щанд. Най-бързият вход в събитието." },
];

/* ── 16 след ноември ── */
const after = [
  { t: "До 10 дни", h: "Отчет с данни", p: "Посещаемост на зоната, записани сесии, лийдове и социален обхват." },
  { t: "До 14 дни", h: "Фото и видео активи", p: "Професионално заснет материал от вашата зона, с права за ползване." },
  { t: "Ноември", h: "Event recap", p: "Обобщение на събитието към цялата общност — с партньорите в него." },
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
  { h: "Cold Plunge", sub: "Активация" },
  { h: "Breathwork", sub: "Активация" },
  { h: "Recovery Zone", sub: "Активация" },
  { h: "Power Plate", sub: "Активация" },
  { h: "Пилатес — постелка", sub: "Активация" },
  { h: "Пилатес — реформър", sub: "Активация" },
  { h: "Networking вечеря", sub: "Вечеря, ден 1" },
  { h: "Фестивална чанта", sub: "Мостра за 1 000 души" },
  { h: "Village", sub: "30 места" },
];

const foundingPoints = [
  "Зона с реален трафик и списък с участници, не щанд с брошури",
  "Роля на сцената и име в цялата комуникация до ноември",
  "Отчет с данни след събитието и право на първи отказ за 2027",
];

/* ── primitives ─────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/70">
      <span className="text-bh-pine" aria-hidden>
        ✳
      </span>
      {children}
    </p>
  );
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`mt-5 max-w-3xl font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-[900] leading-[1.04] tracking-[-0.025em] text-bh-ink ${className}`}
    >
      {children}
    </h2>
  );
}

/**
 * `name` marks the section for the reading-progress beacon: the admin sees
 * the deepest section a reader reached, in the order they appear here.
 */
/**
 * `dark` flips the section to forest. It works by re-pinning the local
 * colour tokens, so every text-bh-ink/NN and bg-bh-cloud inside simply
 * follows — no per-element dark variants.
 */
const DARK_SECTION = {
  backgroundColor: "#0a3229",
  // Direct color too, not only the token: text without an explicit
  // text-bh-* class inherits the ROOT's already-resolved dark ink, so the
  // token flip alone leaves it dark-on-dark.
  color: "#f2f2ee",
  "--color-bh-ink": "#f2f2ee",
  "--color-bh-paper": "#0a3229",
  "--color-bh-cloud": "#0d3a30",
  "--color-bh-pine": "#cef870",
} as React.CSSProperties;

function Section({
  name,
  id,
  dark,
  children,
  className = "",
}: {
  name: string;
  id?: string;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      data-deck-section={name}
      id={id}
      style={dark ? DARK_SECTION : undefined}
      className={`px-6 py-16 sm:px-10 sm:py-24 lg:px-14 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function Tick() {
  return (
    <span className="mt-0.5 shrink-0 text-bh-pine" aria-hidden>
      ✳
    </span>
  );
}

function Dash() {
  return (
    <span className="mt-0.5 shrink-0 text-bh-ink/30" aria-hidden>
      —
    </span>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

/**
 * Reachable only through a share link made in the admin. An unknown or
 * revoked token is a plain 404 — the deck does not confirm it exists.
 */
export default async function PartnersPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await findActiveLink(token);
  if (!link) notFound();

  return (
    <div className="bh-doc min-h-screen text-bh-ink">
      <ViewBeacon token={token} sections={DECK_SECTIONS} />

      {/* header */}
      <header className="px-6 pt-8 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-bh-ink/10 pb-6">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Biohacking Experience" className="h-7 w-auto" />
          </Link>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/70">
            Партньорска програма 2026
          </p>
        </div>
      </header>

      {/* 01 cover */}
      <Section name="cover" className="pt-14 sm:pt-20">
        <Eyebrow>Партньорски възможности · 07—08.11.2026</Eyebrow>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <h1 className="font-display text-[clamp(3.4rem,10vw,8.4rem)] font-[900] leading-[0.92] tracking-[-0.04em] text-bh-ink">
              Стани
              <br />
              партньор
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-white">
                Партньорски пакети от 2 500 €
              </span>
              <a
                href="#zonite"
                className="rounded-full border border-bh-ink/25 px-5 py-2.5 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
              >
                Виж зоните ↓
              </a>
            </div>
          </div>
          <div>
            <p className="max-w-md text-lg font-light leading-relaxed text-bh-ink/70">
              Дълголетието е най-бързо растящата тема в потребителското здраве.
              Sofia Life Summit я превръща в преживяване: два дни, в които 1 000
              платили посетители тренират, възстановяват се и изпробват продукти
              с ръцете си.
            </p>
            <p className="mt-4 font-mono text-[0.68rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/70">
              Организирано съвместно от Bulgarian Longevity Association и
              Biohacking.bg
            </p>
          </div>
        </div>
      </Section>

      {/* 02 форматът */}
      <Section name="format" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Форматът</Eyebrow>
          <H2>Защо преживяването продава повече от щанда</H2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {format.map((f, i) => (
            <Reveal key={f.h} delay={i * 90}>
              <div className="border-t border-bh-ink/15 pt-5">
                <span className="text-bh-pine" aria-hidden>
                  ✳
                </span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{f.h}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-bh-ink/65">{f.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 03 мащаб */}
      <Section name="scale" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Мащаб</Eyebrow>
          <H2>Двата дни в числа</H2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {scale.map((s, i) => (
            <Reveal key={s.l} delay={i * 70}>
              <div>
                <div className="font-display text-[clamp(2.6rem,5.4vw,4.6rem)] font-[300] leading-none tracking-[-0.04em]">
                  {s.n}
                </div>
                <div className="mt-4 h-px w-full bg-bh-ink/15" />
                <p className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-bh-ink/70">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/deck/zala.jpg"
              alt="Залата на Biohacking Experience, пълна с публика"
              loading="lazy"
              className="w-full rounded-[1.6rem] object-cover"
            />
            <figcaption className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/65">
              Залата на Biohacking Experience
            </figcaption>
          </figure>
        </Reveal>
        <Reveal className="mt-10">
          <div className="rounded-[1.4rem] bg-bh-cloud p-7 ring-1 ring-bh-ink/8">
            <h3 className="text-lg font-semibold tracking-tight">
              Платена публика, а не случайни минувачи
            </h3>
            <p className="mt-2 max-w-3xl text-sm font-light leading-relaxed text-bh-ink/65">
              Билети от 35 до 249 € на ранни цени (редовни до 349 €), среден
              престой около шест часа. Записаните часове за активностите
              задържат посетителя целия ден.
            </p>
            <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-pine">
              ↗ Организира се съвместно с Bulgarian Longevity Association
            </p>
          </div>
        </Reveal>
      </Section>

      {/* 04 организаторите */}
      <Section name="organizers" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Организаторите</Eyebrow>
          <H2>Защо Biohacking.bg и BLA</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Общност, която вече купува в тази категория, и медицинска асоциация,
            която ѝ дава легитимност.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {organizers.map((o, i) => (
            <Reveal key={o.l} delay={i * 70}>
              <div>
                <div className="font-display text-5xl font-[300] leading-none tracking-[-0.04em] text-bh-pine">
                  {o.n}
                </div>
                <h3 className="mt-4 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-bh-ink/70">{o.l}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{o.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 05 лекторите */}
      <Section name="speakers" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Сцената</Eyebrow>
          <H2>50 международни лектори</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Първите обявени имена — лекари и изследователи от шест държави. Нови
            лектори всяка седмица.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {speakers.map((s, i) => (
            <Reveal key={s.name} delay={i * 70}>
              <article className="group relative aspect-[3/4] overflow-hidden rounded-[1.6rem] bg-[#0d3a30] text-white ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.photo}
                  alt={s.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                {/* Ink gradient from the foot so the type stays legible on any
                    portrait — the photographs range from studio white to dark. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#02251f]/90 via-[#02251f]/25 via-50% to-transparent"
                />
                <div className="absolute inset-x-4 bottom-4">
                  <h3 className="font-display text-[1.45rem] font-[500] leading-[1.05] tracking-[-0.02em] text-white">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/70">
                    {s.line1}
                  </p>
                  <p className="mt-1 text-[0.8rem] font-light leading-snug text-white/85">{s.line2}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 06 концепцията */}
      <Section name="concept" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Концепцията</Eyebrow>
          <H2>Четири зони, един ден в тялото ти</H2>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {concept.map((z, i) => (
            <Reveal key={z.no} delay={i * 80}>
              <article className="relative flex min-h-[15rem] flex-col rounded-[1.4rem] bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <div className="flex items-start justify-between">
                  <span className="w-fit rounded-full border border-bh-ink/20 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/70">
                    {z.tag}
                  </span>
                  <span className="text-2xl text-bh-pine/70" aria-hidden>
                    {z.sym}
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{z.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{z.p}</p>
                <span className="mt-auto pt-6 font-display text-6xl font-[300] leading-none tracking-[-0.05em] text-bh-ink/85">
                  {z.no}
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 07 зоните */}
      <Section name="zones" id="zonite" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Ядрото на офертата</Eyebrow>
          <H2>Какво се случва в зоните</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Всяка активност е със записан час и ограничен брой места. Всяка от
            тях може да носи името на партньор.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a, i) => (
            <Reveal key={a.no} delay={i * 60}>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.img}
                  alt={a.h}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-[1.4rem] object-cover"
                />
                <figcaption className="mt-4 border-t border-bh-ink/15 pt-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-bh-pine">/ {a.no}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{a.h}</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{a.p}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 08 брандирана зона — the LED-wall visual */}
      <Section name="brandzone" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Как изглежда на място</Eyebrow>
          <H2>Зоната носи вашето име</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            LED стената, разписанието и инструкторът работят под вашия бранд през
            целия ден — с ваш продукт в ръцете на всеки участник.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          {/* The zone as the visitor sees it: the LED wall over the room. A
              styled mock rather than a render — honest about being a concept,
              and it puts the buyer's name on the wall. */}
          <figure>
            <div className="relative overflow-hidden rounded-[1.6rem] bg-[#0a3229] p-6 sm:p-10">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(11,180,160,0.22),transparent_65%)]" />
              {/* the LED wall */}
              <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#04231d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-10">
                <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.3em] text-white/70">
                  <span>Sofia Life Summit 26</span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bh-teal" aria-hidden />
                    Live
                  </span>
                </div>
                <p className="mt-8 font-display text-[clamp(1.8rem,5vw,3.6rem)] font-[600] uppercase leading-[0.95] tracking-[-0.02em] text-white">
                  Pilates
                  <br />
                  Reformer Flow
                </p>
                <p className="mt-4 inline-block rounded-md bg-[#cef870] px-3 py-1.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#02251f]">
                  [Вашият бранд]
                </p>
                <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5 font-mono text-[0.68rem] uppercase tracking-[0.25em] text-white/70">
                  <span className="rounded-full border border-white/20 px-3 py-1">13:45</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">45 мин</span>
                </div>
              </div>
              {/* floor line, to ground the wall in a room */}
              <div aria-hidden className="relative mx-auto mt-6 h-px max-w-4xl bg-white/15" />
            </div>
            <figcaption className="mt-3 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/65">
              Cold plunge и реформър зоните на Sofia Life Summit — визуализация в
              Гранд Хотел Милениум.
            </figcaption>
          </figure>
        </Reveal>

        <Reveal className="mt-10">
          <p className="max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Същият формат при вас: вашето лого, вашият инструктор, вашият продукт
            в ръцете на участниците.
          </p>
          <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {brandZonePoints.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-bh-ink/80">
                <Tick />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* 09 публиката */}
      <Section name="audience" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Публиката</Eyebrow>
          <H2>1 000 души, които вече купуват</H2>
        </Reveal>
        <Reveal className="mt-10">
          <div className="flex flex-wrap gap-2.5">
            {audience.map((label, i) => (
              <span
                key={label}
                className={
                  i % 3 === 0
                    ? "rounded-full bg-bh-pine px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full border border-bh-ink/20 px-4 py-2 text-sm text-bh-ink/80"
                }
              >
                {label}
              </span>
            ))}
          </div>
        </Reveal>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {audienceStats.map((s, i) => (
            <Reveal key={s.l} delay={i * 70}>
              <div>
                <div className="font-display text-5xl font-[300] leading-none tracking-[-0.04em]">{s.n}</div>
                <div className="mt-4 h-px w-full bg-bh-ink/15" />
                <h3 className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-bh-ink/70">{s.l}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 10 пътуването — timeline infographic */}
      <Section name="journey" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Един ден на място</Eyebrow>
          <H2>Пътуването на посетителя</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Записаните часове разпределят деня между зоните — и връщат всеки
            посетител при брандовете по няколко пъти.
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <JourneyTimeline steps={journey} />
        </Reveal>
        <Reveal className="mt-10">
          <p className="rounded-[1.4rem] bg-bh-cloud p-6 text-sm font-medium leading-relaxed text-bh-ink ring-1 ring-bh-ink/8">
            Осем допирни точки на ден — вашият бранд е на поне три от тях,
            независимо от пакета.
          </p>
        </Reveal>
      </Section>

      {/* 11 стойността */}
      <Section name="value" dark className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Стойността</Eyebrow>
          <H2>Какво получава вашата компания</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Написано от вашата гледна точка: какво остава за бранда, когато
            двата дни свършат.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((v, i) => (
            <Reveal key={v.h} delay={i * 60}>
              <div className="border-t border-bh-ink/15 pt-5">
                <span className="text-bh-pine" aria-hidden>
                  ✳
                </span>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{v.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{v.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 12 нива */}
      <Section name="packages" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Партньорства</Eyebrow>
          <H2>Три партньорски нива</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Местата на всяко ниво са ограничени. Категорийната ексклузивност е
            запазена за Платинен — една марка в сегмента.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.no} delay={i * 80}>
              <article
                className={`relative flex h-full flex-col rounded-[1.6rem] p-7 ${
                  t.best
                    ? "bg-[#0a3229] text-white ring-1 ring-[#0a3229]"
                    : "bg-bh-cloud text-bh-ink ring-1 ring-bh-ink/8"
                }`}
              >
                {t.best && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#cef870] px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[#02251f]">
                    Най-добра стойност
                  </span>
                )}
                <p className={`font-mono text-[0.62rem] uppercase tracking-[0.25em] ${t.best ? "text-white/50" : "text-bh-ink/65"}`}>
                  Ниво {t.no}
                </p>
                <h3 className="mt-3 font-display text-3xl font-[600] tracking-[-0.02em]">{t.name}</h3>
                <p className="mt-4 font-display text-4xl font-[300] tracking-[-0.03em]">
                  {t.price}
                  <span className={`ml-2 align-middle font-sans text-xs font-normal ${t.best ? "text-white/50" : "text-bh-ink/65"}`}>
                    / без ДДС
                  </span>
                </p>
                <ul className={`mt-7 flex flex-col gap-2.5 border-t pt-6 text-sm ${t.best ? "border-white/15" : "border-bh-ink/10"}`}>
                  {t.has.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 ${t.best ? "text-[#cef870]" : "text-bh-pine"}`} aria-hidden>
                        ✳
                      </span>
                      {f}
                    </li>
                  ))}
                  {t.not.map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 ${t.best ? "text-white/40" : "text-bh-ink/40"}`}>
                      <Dash />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 13 Village щанд */}
      <Section name="village" className="border-t border-bh-ink/10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <Reveal>
            <Eyebrow>Village щанд</Eyebrow>
            <H2>Village щанд</H2>
            <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-bh-ink/70">
              Присъствие в зоната на брандовете за двата дни, без допълнения.
            </p>
            <p className="mt-6 font-display text-5xl font-[300] tracking-[-0.03em]">
              2 500 €
              <span className="ml-2 align-middle font-sans text-xs font-normal text-bh-ink/65">/ без ДДС</span>
            </p>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-bh-ink/65">
              В цената влизат 20 билета за Village зоната, право на дегустация и
              позиция по маршрута на всички 1 000 посетители.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="rounded-[1.4rem] bg-bh-cloud p-2 ring-1 ring-bh-ink/8">
              <table className="w-full text-sm">
                <tbody>
                  {villageRows.map(([k, v]) => (
                    <tr key={k} className="border-b border-bh-ink/8 last:border-0">
                      <td className="px-5 py-3.5 text-bh-ink/75">{k}</td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        <span className="mr-2 text-bh-pine" aria-hidden>
                          ✳
                        </span>
                        {v}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-bh-ink/8">
                    <td className="px-5 py-3.5 text-bh-ink/40">Брандирана активация в зона</td>
                    <td className="px-5 py-3.5 text-right text-bh-ink/40">—</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 text-bh-ink/40">Лектор на сцената</td>
                    <td className="px-5 py-3.5 text-right text-bh-ink/40">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-right font-mono text-[0.6rem] uppercase tracking-[0.2em] text-bh-ink/40">
              Цените са без ДДС
            </p>
          </Reveal>
        </div>
      </Section>

      {/* 14 сравнение */}
      <Section name="compare" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Сравнение</Eyebrow>
          <H2>Какво включва всяко ниво</H2>
        </Reveal>
        <Reveal className="mt-12">
          <div className="overflow-x-auto rounded-[1.4rem] bg-bh-cloud ring-1 ring-bh-ink/8">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-bh-ink/10">
                  <th className="px-5 py-4 text-left font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/65" />
                  {compareNames.map((n) => (
                    <th key={n} className="px-5 py-4 text-right font-display text-lg font-[600] tracking-tight">
                      {n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => (
                  <tr key={r.row} className="border-b border-bh-ink/8">
                    <td className="px-5 py-3 text-bh-ink/75">{r.row}</td>
                    {r.cells.map((c, i) => (
                      <td key={i} className="px-5 py-3 text-right">
                        {c === true ? (
                          <span className="text-bh-pine" aria-hidden>
                            ✳
                          </span>
                        ) : c === false ? (
                          <span className="text-bh-ink/30">—</span>
                        ) : (
                          <span className="font-medium">{c}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-5 py-4" />
                  {comparePrices.map((p) => (
                    <td key={p} className="px-5 py-4 text-right font-display text-xl font-[500] tracking-tight">
                      {p}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-light text-bh-ink/70">
            Village щанд без пакет — 2 500 € (до 6 м²), без активация и
            допълнения
          </p>
          <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-bh-ink/40">
            Цените са без ДДС
          </p>
        </Reveal>
      </Section>

      {/* 15 по избор */}
      <Section name="extras" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>По избор</Eyebrow>
          <H2>Отделни възможности</H2>
        </Reveal>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {extras.map((e, i) => (
            <Reveal key={e.h} delay={i * 70}>
              <div className="border-t border-bh-ink/15 pt-5">
                <div className="font-display text-4xl font-[300] tracking-[-0.03em] text-bh-pine">{e.price}</div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{e.h}</h3>
                <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-bh-ink/65">{e.p}</p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={extras.length * 70}>
            <div className="border-t border-bh-ink/15 pt-5">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-[300] tracking-[-0.03em] text-bh-pine">Diamond</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/65">
                  Единствено · По запитване
                </span>
              </div>
              <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-bh-ink/65">
                Заглавен партньор на събитието. Име в цялата комуникация и в
                медиите. Ексклузивност в категорията.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 16 след ноември */}
      <Section name="after" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>След ноември</Eyebrow>
          <H2>Партньорството не свършва с феста</H2>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {after.map((a, i) => (
            <Reveal key={a.h} delay={i * 80}>
              <article className="flex h-full flex-col rounded-[1.4rem] bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-pine">{a.t}</p>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{a.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{a.p}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 17 подкрепа */}
      <Section name="support" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Подкрепа</Eyebrow>
          <H2>Партньори и организации</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Мястото на вашето лого — до организациите, които вече стоят зад
            събитието.
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <div className="flex flex-col">
            {supportRows.map((r) => (
              <div
                key={r.l}
                className="flex flex-col gap-3 border-t border-bh-ink/10 py-5 last:border-b sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.25em] text-bh-ink/70">{r.l}</span>
                {r.names ? (
                  <span className="text-sm font-medium">{r.names}</span>
                ) : (
                  <span className="flex gap-2" aria-label="свободни места">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-9 w-24 rounded-lg bg-bh-ink/[0.04] ring-1 ring-bh-ink/8" />
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/65">
            Логата се добавят при потвърждение — първите партньори застават
            най-горе.
          </p>
        </Reveal>
      </Section>

      {/* 18 founding partners */}
      <Section name="founding" className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Партньори · 2026</Eyebrow>
          <H2>Първите имена още не са заети</H2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <article className="flex h-full flex-col rounded-[1.6rem] bg-[#0a3229] p-8 text-white">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[#cef870]">
                Founding Partner 2026
              </p>
              <h3 className="mt-5 font-display text-[clamp(1.7rem,3vw,2.4rem)] font-[500] leading-[1.08] tracking-[-0.02em]">
                Първото име, което България ще свърже с дълголетието.
              </h3>
              <ul className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/85">
                {foundingPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 text-[#cef870]" aria-hidden>
                      ✳
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <div className="grid gap-3 sm:grid-cols-2">
              {territories.map((t) => (
                <div
                  key={t.h}
                  className="flex items-center justify-between gap-3 rounded-[1.1rem] bg-bh-cloud px-5 py-4 ring-1 ring-bh-ink/8"
                >
                  <div>
                    <p className="font-semibold tracking-tight">{t.h}</p>
                    <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.15em] text-bh-ink/65">
                      {t.sub}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-bh-lime-pale px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#02251f]">
                    Свободна
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/65">
              Една марка на категория. Местата се разпределят по реда на
              потвърждаване.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* 19 следваща стъпка */}
      <Section name="next" dark className="border-t border-bh-ink/10 pb-24">
        <Reveal>
          <Eyebrow>Организатори</Eyebrow>
          <h2 className="mt-5 font-display text-[clamp(2.6rem,7vw,5.6rem)] font-[900] leading-[0.95] tracking-[-0.04em] text-bh-ink">
            Заповядайте
            <br />
            на борда
          </h2>
          <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-bh-ink/70">
            Двадесет минути разговор стигат, за да прецените дали форматът
            работи за вашия бранд.
          </p>
          <a
            href={MAILTO}
            className="mt-8 inline-block rounded-full bg-bh-ink px-8 py-4 text-base font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
          >
            {CONTACT}
          </a>
          <dl className="mt-14 grid gap-x-8 gap-y-6 border-t border-bh-ink/10 pt-8 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-bh-ink/65">Дати</dt>
              <dd className="mt-2 font-medium">07—08 ноември 2026</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-bh-ink/65">Място</dt>
              <dd className="mt-2 font-medium">Гранд Хотел Милениум, София</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-bh-ink/65">Партньорства</dt>
              <dd className="mt-2 font-medium">Мария Варсанова</dd>
            </div>
          </dl>
          <p className="mt-10 font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/40">
            thelongevitysummit.eu
          </p>
        </Reveal>
      </Section>
    </div>
  );
}
