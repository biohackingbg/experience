import type { Metadata } from "next";
import Link from "next/link";

import { Arrow } from "@/components/ui/Pictograms";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Партньорска програма 2026 | Sofia Life Summit",
  description:
    "Sofia Life Summit — партньорски пакети за брандове. 1 000+ посетители, 30 места във Village, 07—08 ноември 2026, София.",
  // Shared by link with prospective partners, not found by search.
  robots: { index: false, follow: false },
};

/*
 * The partner deck as a page, after the MYDNA reference: white paper, a lot
 * of air, large light type, hairline rules under numbers, cards with a pill
 * and a corner arrow, oversized step numbers. Our palette, our copy.
 *
 * Content is data at the top so the deck can be edited without touching
 * layout, and so the same numbers cannot drift between two places.
 */

const CONTACT = "hello@biohacking.bg";
const MAILTO = `mailto:${CONTACT}?subject=${encodeURIComponent("Партньорство Sofia Life Summit 2026")}`;

const market = [
  {
    idx: "Пазарът",
    h: "75.8 години",
    p: "Продължителност на живота в България срещу 81.5 средно за ЕС. Eurostat, 2024. Проблемът е национален — и вече е осъзнат.",
  },
  {
    idx: "Купувачът",
    h: "Готов, но необслужен",
    p: "Добавки, устройства, диагностика и клиники растат двуцифрено. Липсва мястото, където човек ги пробва на живо, преди да купи.",
  },
  {
    idx: "Мястото",
    h: "Sofia Life Summit",
    p: "Два дни, в които 1 000+ души влизат в режим „ще променя нещо“. Твоят бранд може да е причината.",
  },
];

const zones = [
  { no: "01", tag: "Сцена", h: "Знанието", p: "Международни имена на разбираем език. 16 лекции и панела по 25 минути." },
  { no: "02", tag: "Движение", h: "Тялото в действие", p: "Пилатес (mat и reformer), Power Plate, водени сесии със записан час." },
  { no: "03", tag: "Възстановяване", h: "Нервната система", p: "Cold plunge, дишане, Recovery Zone. Най-сниманата зона на събитието." },
  { no: "04", tag: "Village", h: "Брандовете", p: "30 подбрани компании: добавки, устройства, клиники, храна, технологии." },
];

const scale = [
  { n: "1 000+", l: "посетители" },
  { n: "2", l: "дни" },
  { n: "4", l: "зони" },
  { n: "16", l: "лекции и панела" },
];

const scaleAccent = [
  { n: "30", l: "места за брандове — и толкова" },
  { n: "50 €", l: "най-ниската цена на билет — публика с намерение" },
  { n: "1", l: "маршрут — всеки минава през Village" },
];

const audience = [
  ["Семейства", true],
  ["Фитнес ентусиасти", false],
  ["Предприемачи", false],
  ["Лекари и медицински специалисти", true],
  ["Диетолози и треньори", false],
  ["Изследователи", false],
  ["Инфлуенсъри", true],
  ["Anti-aging специалисти", false],
  ["Спортисти", false],
  ["Жени 35—55 в перименопауза", true],
  ["Млади професионалисти", false],
  ["Корпоративни HR и wellbeing екипи", false],
  ["Инвеститори и стартъпи", true],
] as const;

const reasons = [
  { n: "01", h: "Демо, не банер", p: "Продуктът се пипа, вкусва и изпробва на място. Това е разликата между impression и опит." },
  { n: "02", h: "Аудитория в решение", p: "Хората идват с въпрос „какво да променя“. Ти си отговорът, който е пред тях в този момент." },
  { n: "03", h: "Само 30 бранда", p: "Village не е панаир. Ограничен брой места означава внимание, а не шум." },
  { n: "04", h: "Доверие по асоциация", p: "Съорганизатор е Bulgarian Longevity Association. Стоиш до лекари и наука, не до промо щанд." },
  { n: "05", h: "Съдържание след събитието", p: "Видео, снимки и UGC от два дни — материал за твоя маркетинг до края на годината." },
];

const territories = [
  { tag: "Сцена", h: "Гласът", p: "Лекция или панел с твой експерт, лого на екрана, видео между сесиите." },
  { tag: "Движение", h: "Енергията", p: "Брандирани постелки, вода, екипировка. Твоето име върху всяка сесия." },
  { tag: "Възстановяване", h: "Емоцията", p: "Cold plunge и дишане — зоната, която се снима и споделя най-много." },
  { tag: "Village", h: "Продажбата", p: "Щанд, семплинг, промо код на място. Кеш още на 17-ти." },
];

const tiers = ["Изложител", "Silver", "Gold", "Platinum"];
type Cell = string | boolean;
const packages: { row: string; cells: Cell[] }[] = [
  { row: "Щанд във Village (м²)", cells: ["4", "6", "9", "12"] },
  { row: "Премиум локация", cells: [false, true, true, true] },
  { row: "Лого на сайт и социални", cells: [true, true, true, true] },
  { row: "Лого на сцената", cells: [false, true, true, true] },
  { row: "Мостра в чантата на посетителя", cells: [false, true, true, true] },
  { row: "Видео на екрана на сцената", cells: [false, false, true, true] },
  { row: "Участие в панел", cells: [false, false, true, true] },
  { row: "Собствена лекция на сцената (25 мин)", cells: [false, false, false, true] },
  { row: "Брандиране на зона", cells: [false, false, false, true] },
  { row: "Ексклузивност в категорията", cells: [false, false, false, true] },
  { row: "Пълни билети за екипа", cells: ["2", "4", "6", "10"] },
  { row: "Билети за твои клиенти", cells: ["20", "40", "60", "100"] },
  { row: "Комуникация в бюлетина и социални", cells: [false, "1 споменаване", "1 самостоятелен пост", "2 самостоятелни поста"] },
];
const prices = ["2 500 €", "4 500 €", "7 500 €", "12 000 €"];

const extras = [
  { h: "Заглавен партньор на зона", p: "Името на бранда ти пред и в комуникацията на цяла зона — Движение, Възстановяване или Village.", price: "по запитване" },
  { h: "Лекция на сцената", p: "25 минути с твой експерт пред залата, включени в официалната програма и във видеото след събитието.", price: "3 500 €" },
  { h: "Мостра или флаер в чантата", p: "Твой продукт в ръцете на всеки посетител, преди още да е влязъл в залата.", price: "800 €" },
];

const steps = [
  { n: "01", h: "Кажи ни целта", p: "20 минути разговор: продажби, лийдове или видимост за бранда." },
  { n: "02", h: "Получаваш оферта", p: "Пакет и активация, съобразени с продукта ти — до 3 работни дни." },
  { n: "03", h: "Запазваш мястото", p: "Договор, категорията ти е блокирана, влизаш в комуникацията веднага." },
];

/* ── primitives ─────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/50">
      <span className="text-bh-teal" aria-hidden>
        ✳
      </span>
      {children}
    </p>
  );
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`mt-5 max-w-3xl font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-[600] leading-[1.06] tracking-[-0.025em] text-bh-ink ${className}`}
    >
      {children}
    </h2>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-6 py-16 sm:px-10 sm:py-24 lg:px-14 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function CornerArrow() {
  return (
    <span className="absolute right-5 top-5 text-bh-teal/70" aria-hidden>
      <Arrow className="h-6 w-6" />
    </span>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

export default function PartnersPage() {
  return (
    <div className="bh-doc min-h-screen text-bh-ink">
      {/* header */}
      <header className="px-6 pt-8 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-bh-ink/10 pb-6">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Biohacking Experience" className="h-7 w-auto" />
          </Link>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/50">
            Партньорска програма 2026
          </p>
        </div>
      </header>

      {/* 01 cover */}
      <Section className="pt-14 sm:pt-20">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-bh-ink/50">
          Biohacking.bg <span className="text-bh-teal">✳</span> Bulgarian Longevity Association
        </p>
        <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <Eyebrow>Biohacking Experience · 07—08.11.2026</Eyebrow>
            <h1 className="mt-6 font-display text-[clamp(3.4rem,10vw,8.4rem)] font-[300] leading-[0.92] tracking-[-0.04em] text-bh-ink">
              Sofia Life
              <br />
              Summit
            </h1>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-bh-ink/70">
              <span>Гранд Хотел Милениум, София</span>
              <span className="text-bh-teal">1 000+ посетители</span>
              <span>30 бранда</span>
            </div>
          </div>
          <p className="max-w-md text-lg font-light leading-relaxed text-bh-ink/70">
            Два дни, в които 1 000+ души пипат, пробват и решават какво да
            променят в здравето си. Тази брошура е за брандовете, които искат
            да са там в този момент.
          </p>
        </div>
      </Section>

      {/* 02 market */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Защо България, защо сега</Eyebrow>
          <H2>
            Най-ниската продължителност на живот в ЕС. И най-бързо растящият
            интерес към здравето.
          </H2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {market.map((m, i) => (
            <Reveal key={m.idx} delay={i * 90}>
              <div className="border-t border-bh-ink/15 pt-5">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-bh-teal">
                  {m.idx}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{m.h}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-bh-ink/65">{m.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 03 concept */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Концепцията</Eyebrow>
          <H2>Не конференция със столове в редици.</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Посетителят се движи между четири зони през целия ден: слуша,
            движи се, възстановява се, пробва брандове. Никой не седи два дни
            на стол — затова и никой не подминава щанд.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((z, i) => (
            <Reveal key={z.no} delay={i * 80}>
              <article className="relative flex min-h-[15rem] flex-col rounded-[1.4rem] bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <span className="w-fit rounded-full border border-bh-ink/20 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/70">
                  {z.tag}
                </span>
                <CornerArrow />
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

      {/* 04 scale */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Мащабът</Eyebrow>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
          {scale.map((s, i) => (
            <Reveal key={s.l} delay={i * 70}>
              <div>
                <div className="font-display text-[clamp(3rem,6vw,5.2rem)] font-[300] leading-none tracking-[-0.04em]">
                  {s.n}
                </div>
                <div className="mt-4 h-px w-full bg-bh-ink/15" />
                <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-bh-ink/55">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-16 grid gap-x-8 gap-y-12 border-t border-bh-ink/10 pt-14 md:grid-cols-3">
          {scaleAccent.map((s, i) => (
            <Reveal key={s.l} delay={i * 70}>
              <div>
                <div className="font-display text-[clamp(3rem,6vw,5.2rem)] font-[300] leading-none tracking-[-0.04em] text-bh-teal">
                  {s.n}
                </div>
                <div className="mt-4 h-px w-full bg-bh-teal/30" />
                <p className="mt-3 max-w-xs font-mono text-[0.68rem] uppercase leading-relaxed tracking-[0.2em] text-bh-ink/55">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 05 audience */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Кой стои пред щанда ти</Eyebrow>
          <H2>Хора, които вече плащат за здравето си.</H2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-bh-ink/70">
            Билетът е от 50 €. Това само по себе си пресява публиката: идват
            хора с намерение и с бюджет, не случайни минувачи от мол.
          </p>
        </Reveal>
        <Reveal className="mt-10">
          <div className="flex flex-wrap gap-2.5">
            {audience.map(([label, on]) => (
              <span
                key={label}
                className={
                  on
                    ? "rounded-full bg-bh-teal px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full border border-bh-ink/20 px-4 py-2 text-sm text-bh-ink/80"
                }
              >
                {label}
              </span>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* 06 reasons */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Защо това работи по-добре от реклама</Eyebrow>
          <H2>Пет причини брандовете да се връщат всяка година.</H2>
        </Reveal>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {reasons.map((r, i) => (
            <Reveal key={r.n} delay={i * 70}>
              <div>
                <span className="font-display text-5xl font-[300] leading-none tracking-[-0.04em] text-bh-teal">
                  {r.n}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{r.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{r.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 07 territories */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Територии за брандиране</Eyebrow>
          <H2>Избери зона и я направи своя.</H2>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {territories.map((t, i) => (
            <Reveal key={t.tag} delay={i * 80}>
              <article className="relative flex min-h-[13rem] flex-col rounded-[1.4rem] bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <span className="w-fit rounded-full border border-bh-ink/20 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/70">
                  {t.tag}
                </span>
                <CornerArrow />
                <h3 className="mt-8 text-2xl font-semibold tracking-tight">{t.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{t.p}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 08 packages */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Партньорски пакети</Eyebrow>
        </Reveal>
        <Reveal className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr>
                <th className="w-[34%] pb-4 text-left" />
                {tiers.map((t, i) => (
                  <th
                    key={t}
                    className={`pb-4 text-center font-display text-lg font-semibold tracking-tight ${
                      i === 3 ? "text-bh-teal" : "text-bh-ink"
                    }`}
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.row} className="border-t border-bh-ink/10">
                  <td className="py-3.5 pr-4 text-bh-ink/85">{p.row}</td>
                  {p.cells.map((c, i) => (
                    <td key={i} className="py-3.5 text-center">
                      {c === true ? (
                        <span className="text-bh-teal">включено</span>
                      ) : c === false ? (
                        <span className="text-bh-ink/25">—</span>
                      ) : (
                        <span className="text-bh-ink/85">{c}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-bh-ink/20">
                <td className="pt-6 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/50">
                  Инвестиция
                </td>
                {prices.map((p, i) => (
                  <td
                    key={p}
                    className={`pt-6 text-center font-display text-2xl font-semibold tracking-tight ${
                      i === 3 ? "text-bh-teal" : "text-bh-ink"
                    }`}
                  >
                    {p}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Reveal>
        <div className="mt-8 flex flex-wrap justify-between gap-4 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">
          <span>Цените са без ДДС · местата са ограничени до 30 бранда</span>
          <span>Diamond партньорство — по запитване</span>
        </div>
      </Section>

      {/* 09 extras */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Допълнително</Eyebrow>
          <H2>Добави точно това, което ти трябва.</H2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {extras.map((e, i) => (
            <Reveal key={e.h} delay={i * 80}>
              <article className="flex min-h-[15rem] flex-col rounded-[1.4rem] bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <h3 className="text-xl font-semibold tracking-tight">{e.h}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-bh-ink/65">{e.p}</p>
                <div className="mt-auto pt-6 font-display text-2xl font-semibold tracking-tight text-bh-teal">
                  {e.price}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8">
          <p className="max-w-3xl text-sm font-light leading-relaxed text-bh-ink/65">
            Диджитъл пакет (бюлетин, реклама, съдържание с инфлуенсъри),
            брандиран networking коктейл и партньорство върху билета — правим
            ги по мярка.
          </p>
        </Reveal>
      </Section>

      {/* 10 next step */}
      <Section className="border-t border-bh-ink/10">
        <Reveal>
          <Eyebrow>Следваща стъпка</Eyebrow>
          <H2>
            Village е с 30 места. Категориите се затварят по реда на
            подписване.
          </H2>
        </Reveal>
        <div className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div>
                <span className="font-display text-5xl font-[300] leading-none tracking-[-0.04em] text-bh-teal">
                  {s.n}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.h}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-bh-ink/65">{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-14">
          <a
            href={MAILTO}
            className="bh-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
          >
            Запази място за твоя бранд <Arrow className="h-4 w-4" />
          </a>
        </Reveal>
      </Section>

      <footer className="px-6 pb-12 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-4 border-t border-bh-ink/10 pt-8 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/50">
          <a href={`mailto:${CONTACT}`} className="hover:text-bh-ink">
            {CONTACT}
          </a>
          <span>07—08 ноември 2026 · Гранд Хотел Милениум, София</span>
          <span>
            Biohacking.bg <span className="text-bh-teal">✳</span> Bulgarian Longevity Association
          </span>
        </div>
      </footer>
    </div>
  );
}
