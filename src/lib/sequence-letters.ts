/**
 * The words of every automatic letter (lib/sequences.ts decides who gets
 * which and when). Pure: given the facts, returns subject, HTML and text.
 * Kept apart from the runner so the admin can render every letter with
 * sample data without touching the database.
 */

import { type Pricing, priceOf } from "@/lib/pricing";
import { CONCEPT_TOTAL } from "@/lib/site-copy";
import { TIERS, type Tier, formatPrice, getTier } from "@/lib/tickets";

const SITE = "https://thelongevitysummit.eu";
const FONT = "-apple-system,Segoe UI,Roboto,sans-serif";

export function esc(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export type Letter = { subject: string; html: string; text: string };

/** One paragraph; `**bold**` is the only markup. */
function para(text: string): string {
  const html = esc(text).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#02251f">$1</strong>');
  return `<p style="margin:0 0 16px;font:400 15px/1.65 ${FONT};color:#02251f">${html}</p>`;
}
const plain = (text: string) => text.replaceAll("**", "");

function button(label: string, url: string, tone: "pine" | "ink" = "pine"): string {
  const bg = tone === "pine" ? "#146455" : "#02251f";
  return `<p style="margin:6px 0 22px"><a href="${esc(url)}" style="display:inline-block;background:${bg};color:#f1f5f3;text-decoration:none;font:600 14px/1 ${FONT};padding:14px 22px;border-radius:999px">${esc(label)}</a></p>`;
}

function bullets(items: string[]): string {
  return `<ul style="margin:0 0 18px;padding-left:20px">${items
    .map((i) => `<li style="margin:0 0 6px;font:400 15px/1.5 ${FONT};color:#02251f">${esc(i)}</li>`)
    .join("")}</ul>`;
}

/**
 * The frame every sequence letter sits in: the event's name on top, the
 * subject as the heading, the body, and a footer that says why this person
 * is getting it and how to stop - the link is a one-click unsubscribe.
 */
function frame(input: { subject: string; bodyHtml: string; bodyText: string[]; why: string; unsubUrl: string }): Letter {
  const html = `<!doctype html><html lang="bg"><body style="margin:0;background:#f1f5f3;padding:28px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px">
    <tr><td>
      <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience" style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;margin:0 0 20px">
      <div style="font:700 12px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit · 07-08 ноември</div>
      <h1 style="margin:12px 0 20px;font:800 24px/1.25 ${FONT};color:#02251f">${esc(input.subject)}</h1>
      ${input.bodyHtml}
      <div style="margin-top:8px;height:3px;background:#cef870;border-radius:2px"></div>
      <p style="margin:20px 0 0;font:400 12px/1.6 ${FONT};color:#02251f80">
        Гранд Хотел Милениум, бул. „Витоша“ 89Б, София · <a href="${SITE}" style="color:#146455">thelongevitysummit.eu</a><br>
        ${esc(input.why)} Въпроси: отговори на това писмо или пиши на hi@biohacking.bg.
        <a href="${esc(input.unsubUrl)}" style="color:#02251f80">Не искам повече писма</a>.
      </p>
    </td></tr>
  </table></body></html>`;
  const text = [
    ...input.bodyText,
    "",
    "Sofia Life Summit · 07-08 ноември 2026 · Гранд Хотел Милениум, бул. „Витоша“ 89Б, София",
    SITE,
    `${input.why} Въпроси: hi@biohacking.bg`,
    `Не искам повече писма: ${input.unsubUrl}`,
  ].join("\n");
  return { subject: input.subject, html, text };
}

/**
 * A hand-written letter in the same frame: blocks separated by a blank line,
 * a block whose lines all start with "- " is a bullet list, `**bold**` is the
 * only markup and a single line break inside a block stays a line break.
 */
export function plainLetter(input: { subject: string; text: string; why: string; unsubUrl: string }): Letter {
  const blocks = input.text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const html = blocks
    .map((b) => {
      const lines = b.split("\n");
      // A heading line may sit directly above its bullets.
      const firstBullet = lines.findIndex((l) => l.trim().startsWith("- "));
      const head = firstBullet === -1 ? lines : lines.slice(0, firstBullet);
      const rest = firstBullet === -1 ? [] : lines.slice(firstBullet);
      const out: string[] = [];
      if (head.length) {
        const inner = esc(head.join("\n")).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#02251f">$1</strong>').replaceAll("\n", "<br>");
        out.push(`<p style="margin:0 0 ${rest.length ? 8 : 16}px;font:400 15px/1.65 ${FONT};color:#02251f">${inner}</p>`);
      }
      if (rest.length) out.push(bullets(rest.filter((l) => l.trim().startsWith("- ")).map((l) => l.trim().slice(2))));
      return out.join("");
    })
    .join("");
  return frame({ subject: input.subject, bodyHtml: html, bodyText: blocks.map((b) => plain(b)), why: input.why, unsubUrl: input.unsubUrl });
}

const eur = (cents: number) => `${formatPrice(cents)} €`;
const hi = (name: string) => `Здравей, ${name.trim().split(/\s+/)[0] || name}!`;

/* ------------------------------------------------------------------ *
 * 1 · Abandoned checkout, second and last nudge (+72 h)
 * ------------------------------------------------------------------ */

export type Abandoned2Input = { name: string; reference: string; items: string; tierId: string; pricing: Pricing; unsubUrl: string };

export function abandoned2(i: Abandoned2Input): Letter {
  const after = TIERS.map((t) => `${t.name} ${eur(t.listPriceCents)}`).join(", ");
  const offer = i.pricing.discounted
    ? `Специалните цени ${i.pricing.label} още важат - ${i.pricing.regularAfter} билетите са ${after}.`
    : null;
  const url = `${SITE}/bilet?nivo=${encodeURIComponent(i.tierId)}&utm_source=email&utm_campaign=abandoned-2`;
  const lines = [
    `${hi(i.name)} Преди няколко дни започна поръчка за **${i.items}** за Sofia Life Summit, но плащането не мина. Нищо не е таксувано и място не е запазено.`,
    ...(offer ? [offer] : []),
    `Това е последното ни писмо за тази поръчка. Ако нещо те спря - цена, ден, въпрос за програмата - просто отговори, ще помогнем.`,
  ];
  return frame({
    subject: `Последно напомняне за билета ти · ${i.reference}`,
    bodyHtml: para(lines[0]) + (offer ? para(offer) : "") + button("Довърши поръчката", url) + para(lines[lines.length - 1]),
    bodyText: [plain(lines[0]), "", ...(offer ? [offer, ""] : []), `Довърши поръчката: ${url}`, "", lines[lines.length - 1], `Поръчка ${i.reference}`],
    why: `Получаваш това писмо, защото започна поръчка ${i.reference} на thelongevitysummit.eu.`,
    unsubUrl: i.unsubUrl,
  });
}

/* ------------------------------------------------------------------ *
 * 2 + 3 · Upgrade: pay the difference
 * ------------------------------------------------------------------ */

export type UpgradeInput = {
  name: string;
  from: Tier;
  to: Tier;
  /** Each ticket of the order that can move up, with what it costs. */
  tickets: { code: string; attendeeName: string | null; diffCents: number }[];
  /** Seats left in the higher tier. */
  left: number;
  pricing: Pricing;
  unsubUrl: string;
};

export type UpgradeStep = "plus-0" | "plus-5" | "plus-3d" | "peak";

function upgradeBody(i: UpgradeInput, step: UpgradeStep) {
  const to = i.to;
  const todayCents = priceOf(i.pricing, to);
  const first = i.tickets[0];
  const diff = first ? eur(first.diffCents) : "";
  const many = i.tickets.length > 1;
  const later =
    i.pricing.discounted && todayCents < to.listPriceCents && first
      ? `Разликата е спрямо днешната цена на ${to.name} (${eur(todayCents)}, ${i.pricing.label}). ${i.pricing.regularAfter.charAt(0).toUpperCase() + i.pricing.regularAfter.slice(1)} ${to.name} е ${eur(to.listPriceCents)} и разликата става ${eur(to.listPriceCents - (todayCents - first.diffCents))}.`
      : `Разликата е спрямо цената на ${to.name} днес (${eur(todayCents)}).`;

  const gain = to.features;
  const perks = bullets(gain);
  const perksText = gain.map((g) => `- ${g}`).join("\n");

  const intro: Record<UpgradeStep, string[]> = {
    "plus-0": [
      `${hi(i.name)} Благодарим ти, че ще бъдеш част от Sofia Life Summit!`,
      `Твоят билет **${i.from.name}** ти дава достъп до един ден по избор.`,
      `Ако искаш да изживееш **и двата дни**, да се включиш в **работилниците** и да получиш достъп до **едно специално преживяване**, можеш да надградиш билета си до **PLUS само за още ${diff}**${many ? " на билет" : ""}.`,
      `Плащаш единствено разликата, а билетът ти се надгражда на място със същия код.`,
    ],
    "plus-5": [
      `${hi(i.name)} Събота и неделя на Sofia Life Summit са различни: други лектори, други работилници, други преживявания. С **${i.from.name}** избираш един ден. С PLUS си и в двата - за **${diff} отгоре**${many ? " за билет" : ""}, само разликата.`,
    ],
    "plus-3d": [
      `${hi(i.name)} Sofia Life Summit е тази събота и неделя. Ако още се чудиш дали един ден стига: PLUS е на **${diff} отгоре**${many ? " за билет" : ""}, има още **${i.left} места**, и билетът ти се сменя веднага, без нов код.`,
    ],
    peak: [
      `${hi(i.name)} Имаш PLUS - двата дни, работилниците и преживяване по избор. PEAK е за хората, които искат да са най-близо до лекторите: има **${i.left} места** и е на **${diff} отгоре**${many ? " за билет" : ""} - плащаш само разликата, билетът ти се сменя на място.`,
    ],
  };
  const what = `Какво добавя ${to.name}:`;

  const links = i.tickets.map((t) => {
    const url = `${SITE}/bilet/nadgradi/${encodeURIComponent(t.code)}?utm_source=email&utm_campaign=upgrade-${to.id}`;
    const who = t.attendeeName ? ` (${t.attendeeName})` : many ? ` (билет ${t.code})` : "";
    return { label: `Надгради до ${to.name} за ${eur(t.diffCents)}${who}`, url };
  });

  const html =
    intro[step].map(para).join("") +
    para(what) +
    perks +
    links.map((l) => button(l.label, l.url)).join("") +
    para(later);
  const text = [...intro[step].map(plain), "", what, perksText, "", ...links.map((l) => `${l.label}: ${l.url}`), "", later];
  return { html, text };
}

export function upgradeLetter(i: UpgradeInput, step: UpgradeStep): Letter {
  const subject: Record<UpgradeStep, string> = {
    "plus-0": "Билетът ти е тук. А двата дни?",
    "plus-5": "Един ден или двата? Разликата до PLUS",
    "plus-3d": "Три дни до Sofia Life Summit - последен шанс за двата дни",
    peak: `PEAK: ${i.left} места най-близо до лекторите`,
  };
  const { html, text } = upgradeBody(i, step);
  return frame({
    subject: subject[step],
    bodyHtml: html,
    bodyText: text,
    why: `Получаваш това писмо, защото имаш билет ${i.from.name} за Sofia Life Summit.`,
    unsubUrl: i.unsubUrl,
  });
}

/* ------------------------------------------------------------------ *
 * 3b · Pick your arrival time (once the arrival plan is on)
 * ------------------------------------------------------------------ */

export const APP_STORE_URL = "https://apps.apple.com/bg/app/id6819034879";

export function checkinLetter(i: { name: string; codes: string[]; unsubUrl: string }): Letter {
  const links = i.codes.map((c) => ({ label: i.codes.length > 1 ? `Избери час за билет ${c}` : "Избери час за влизане", url: `${SITE}/bilet/${encodeURIComponent(c)}?utm_source=email&utm_campaign=checkin` }));
  const lines = [
    `${hi(i.name)} Sofia Life Summit е след няколко дни. Едно нещо, което ще ти спести опашката на входа: избери **час за влизане** от билета си. Баджът ти ще е готов, а на вратата няма да има тълпа.`,
    `Билетът важи по всяко време - часът е само уговорка за сутринта. Отнема 10 секунди.`,
    `Ако си с iPhone, свали и приложението Biohacking Experience: билетите, програмата и работилниците са в него, а часът за влизане стои на билета ти.`,
  ];
  return frame({
    subject: "Избери си час за влизане на Sofia Life Summit",
    bodyHtml: para(lines[0]) + links.map((l) => button(l.label, l.url)).join("") + para(lines[1]) + para(lines[2]) + button("Свали приложението", APP_STORE_URL, "ink"),
    bodyText: [plain(lines[0]), "", ...links.map((l) => `${l.label}: ${l.url}`), "", lines[1], "", lines[2], `App Store: ${APP_STORE_URL}`],
    why: "Получаваш това писмо, защото имаш билет за Sofia Life Summit.",
    unsubUrl: i.unsubUrl,
  });
}

/* ------------------------------------------------------------------ *
 * 4 · Letters to the news list, on fixed dates
 * ------------------------------------------------------------------ */

export type ListLetterId = "programa" | "48-chasa" | "posleden-den" | "posledni-chasove" | "sedmica" | "sabota";

export type ListLetterDef = {
  id: ListLetterId;
  title: string;
  /** When it goes, Sofia time. The cron runs hourly, so "09:00" means "between 09:00 and 10:00". */
  at: Date;
  /** Only while the mid prices are on: a price letter after the switch would lie. */
  needsDiscount: boolean;
};

export const LIST_LETTERS: ListLetterDef[] = [
  { id: "programa", title: "Програмата по часове", at: new Date("2026-10-20T09:00:00+03:00"), needsDiscount: false },
  { id: "48-chasa", title: "48 часа до края на междинните цени", at: new Date("2026-10-23T09:00:00+03:00"), needsDiscount: true },
  { id: "posleden-den", title: "Последен ден на междинните цени", at: new Date("2026-10-30T09:00:00+02:00"), needsDiscount: true },
  { id: "posledni-chasove", title: "Последни часове", at: new Date("2026-10-30T19:00:00+02:00"), needsDiscount: true },
  { id: "sedmica", title: "Една седмица до събитието", at: new Date("2026-10-31T10:00:00+02:00"), needsDiscount: false },
  { id: "sabota", title: "В събота започваме", at: new Date("2026-11-04T10:00:00+02:00"), needsDiscount: false },
];

export type ListLetterInput = { name: string | null; pricing: Pricing; peakLeft: number; unsubUrl: string };

export function listLetter(id: ListLetterId, i: ListLetterInput): Letter {
  const p = i.pricing;
  const core = getTier("core")!;
  const plus = getTier("plus")!;
  const peak = getTier("peak")!;
  const now = (t: Tier) => eur(priceOf(p, t));
  const list = (t: Tier) => eur(t.listPriceCents);
  const greet = i.name ? `Здравей, ${i.name.trim().split(/\s+/)[0]}!` : "Здравей!";
  const bilet = (c: string) => `${SITE}/bilet?utm_source=email&utm_campaign=list-${c}`;
  const why = "Получаваш това писмо, защото остави имейл за новини около Sofia Life Summit.";
  const priceLine = p.discounted
    ? `Билетите са на междинни цени ${p.label}: CORE ${now(core)}, PLUS ${now(plus)}, PEAK ${now(peak)}. ${p.regularAfter.charAt(0).toUpperCase() + p.regularAfter.slice(1)}: ${list(core)}, ${list(plus)}, ${list(peak)}.`
    : `Билетите: CORE ${now(core)}, PLUS ${now(plus)}, PEAK ${now(peak)}.`;

  const build = (subject: string, lines: string[], cta: { label: string; url: string }, tail?: string) =>
    frame({
      subject,
      bodyHtml: lines.map(para).join("") + button(cta.label, cta.url) + (tail ? para(tail) : ""),
      bodyText: [...lines.map(plain), "", `${cta.label}: ${cta.url}`, ...(tail ? ["", tail] : [])],
      why,
      unsubUrl: i.unsubUrl,
    });

  switch (id) {
    case "programa":
      return build(
        "Програмата на Sofia Life Summit: двата дни по часове",
        [
          `${greet} Програмата е на сайта: лекторите по часове, работилниците и ${CONCEPT_TOTAL}-те станции и преживявания в Гранд Хотел Милениум на 7 и 8 ноември.`,
          `Събота и неделя са различни. С CORE избираш един ден; с PLUS си и в двата, с работилниците и с едно специално преживяване по избор; PEAK добавя Premium Lounge и Meet & Greet с лекторите.`,
          priceLine,
        ],
        { label: "Виж програмата", url: `${SITE}/programa?utm_source=email&utm_campaign=list-programa` },
      );
    case "48-chasa":
      return build(
        "48 часа до края на междинните цени",
        [
          `${greet} В петък, 30 октомври, в полунощ междинните цени свършват. Дотогава: CORE **${now(core)}** (после ${list(core)}), PLUS **${now(plus)}** (после ${list(plus)}), PEAK **${now(peak)}** (после ${list(peak)}).`,
          `Два дни, в които науката за дълголетието се докосва, пробва и измерва - не се слуша от стол. ${CONCEPT_TOTAL} станции и преживявания, работилници и лектори по часове на сайта.`,
        ],
        { label: "Вземи билет на междинна цена", url: bilet("48-chasa") },
      );
    case "posleden-den":
      return build(
        "Днес е последният ден на междинните цени",
        [
          `${greet} Днес до полунощ: CORE **${now(core)}**, PLUS **${now(plus)}**, PEAK **${now(peak)}**. От утре са ${list(core)}, ${list(plus)} и ${list(peak)}.`,
          `Ако си се колебал/а между един ден и двата - PLUS е и двата дни, работилниците и едно специално преживяване по избор. После винаги можеш да надградиш, но на новата цена.`,
        ],
        { label: "Вземи билет", url: bilet("posleden-den") },
      );
    case "posledni-chasove":
      return build(
        "Последни часове на междинните цени",
        [
          `${greet} Кратко: в полунощ цените се сменят. CORE **${now(core)}** → ${list(core)}, PLUS **${now(plus)}** → ${list(plus)}, PEAK **${now(peak)}** → ${list(peak)}.`,
        ],
        { label: "Вземи билет сега", url: bilet("posledni-chasove") },
        "Ако вече имаш билет - извинявай за писмото, и до събота!",
      );
    case "sedmica":
      return build(
        "Една седмица до Sofia Life Summit",
        [
          `${greet} След седмица, в събота и неделя, Гранд Хотел Милениум е два дни дълголетие на живо: лектори по часове, работилници и ${CONCEPT_TOTAL} станции и преживявания - reformer, lagree, breathwork, PEMF, Power Plate, InBody и още.`,
          `PEAK има още **${i.peakLeft} места**: Premium Lounge, Meet & Greet с лекторите, приоритет за работилниците и преживяванията, goody bag на стойност 250 €+.`,
          priceLine,
        ],
        { label: "Виж билетите", url: bilet("sedmica") },
      );
    case "sabota":
      return build(
        "В събота започваме",
        [
          `${greet} Sofia Life Summit е тази събота и неделя, 7 и 8 ноември, в Гранд Хотел Милениум, бул. „Витоша“ 89Б. Регистрацията отваря в 09:00, програмата започва в 10:00.`,
          `Ако още нямаш билет - онлайн е по-бързо от опашката на входа. ${priceLine}`,
        ],
        { label: "Вземи билет", url: bilet("sabota") },
        "До събота!",
      );
  }
}

/* ------------------------------------------------------------------ *
 * The alumni letter - a draft to send by hand to the course list
 * ------------------------------------------------------------------ */

export const ALUMNI_CODE = "ALUMNI";

export function alumniDraft(pricing: Pricing): { subject: string; body: string; ctaLabel: string; ctaUrl: string } {
  const core = getTier("core")!;
  const plus = getTier("plus")!;
  const off = (t: Tier) => eur(Math.round(priceOf(pricing, t) * 0.85));
  return {
    subject: "За курсистите на Biohacking.bg: -15% за Sofia Life Summit",
    body: [
      "Здравей,",
      "",
      "Минал/а си курс при нас, затова това писмо е само за теб: 15% отстъпка за Sofia Life Summit на 7 и 8 ноември в Гранд Хотел Милениум.",
      "",
      `Кодът е ${ALUMNI_CODE} и се пише на стъпката за плащане. С него PLUS (двата дни, работилниците и едно специално преживяване) излиза ${off(plus)}, CORE (един ден) - ${off(core)}. Кодът важи и след края на междинните цени, за един билет на човек.`,
      "",
      "Два дни, в които науката за дълголетието се докосва, пробва и измерва - не се слуша от стол. ${CONCEPT_TOTAL} станции и преживявания, работилници и лектори по часове.",
    ].join("\n"),
    ctaLabel: "Вземи билет с ALUMNI",
    ctaUrl: `${SITE}/bilet?utm_source=email&utm_campaign=alumni`,
  };
}
