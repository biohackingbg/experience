import "server-only";

import { cache } from "react";

import { getSetting, setSetting } from "@/lib/settings";

/**
 * The words in the automatic letters, editable from the admin.
 *
 * Only prose lives here - never the layout, the logo, the buttons, the
 * ticket rows or the bank table. Those must keep rendering in Outlook and
 * in a phone's mail app, and a letter that loses its button is a letter
 * nobody can act on. What a slot holds is a sentence; what it cannot hold
 * is HTML, because every value is escaped before it reaches the page.
 *
 * Placeholders in curly braces are filled by the letter: `{име}` and the
 * rest are listed on each slot, and anything unknown is dropped rather than
 * printed, so a typo leaves a gap instead of showing braces to a buyer.
 *
 * Bulgarian only. The English letters keep the wording in code - there are
 * few of them, and a half-translated pair is worse than one language.
 */

export type MailSlot = {
  id: string;
  /** The letter it belongs to - the `MailKind` values, as plain strings. */
  letter: string;
  label: string;
  /** Where in the letter it shows, in the team's words. */
  hint: string;
  /** Placeholders this slot may use. */
  vars: string[];
  multiline: boolean;
  /** The wording as it is today; what "върни по подразбиране" restores. */
  fallback: string;
};

export const MAIL_SLOTS = [
  {
    id: "bilet.zaglavie",
    letter: "bilet",
    label: "Заглавие",
    hint: "Голямото заглавие най-отгоре.",
    vars: [],
    multiline: false,
    fallback: "Билетът ти е готов",
  },
  {
    id: "bilet.uvod",
    letter: "bilet",
    label: "Увод",
    hint: "Първият абзац, над билетите.",
    vars: ["име", "плащане"],
    multiline: true,
    fallback: "Здравей, {име}! {плащане}Отвори билета си по-долу и го запази - ще ти трябва на входа.",
  },
  {
    id: "bilet.drug",
    letter: "bilet",
    label: "Билет за друг човек",
    hint: "Редът под билетите, който моли за името на госта.",
    vars: [],
    multiline: true,
    fallback: "Билет за друг човек? Отвори го и напиши името му - така ще го намерим на входа и баджът ще е с неговото име.",
  },
  {
    id: "bilet.podpis",
    letter: "bilet",
    label: "Подпис",
    hint: "Ситният текст най-долу.",
    vars: [],
    multiline: true,
    fallback:
      "Ако имаш въпрос, отговори на това писмо или пиши на hi@biohacking.bg. Sofia Life Summit се организира съвместно от Bulgarian Longevity Association и Biohacking.bg.",
  },

  {
    id: "proforma.uvod",
    letter: "proforma",
    label: "Увод",
    hint: "Абзацът над сметката.",
    vars: ["име", "срок"],
    multiline: true,
    fallback: "Здравей, {име}! Местата са запазени до {срок}. След като преводът пристигне, изпращаме фактурата и билетите на този адрес.",
  },
  {
    id: "proforma.podpis",
    letter: "proforma",
    label: "Подпис",
    hint: "Ситният текст най-долу.",
    vars: [],
    multiline: true,
    fallback: "Въпроси: отговори на това писмо или пиши на hi@biohacking.bg.",
  },

  {
    id: "napomnyane.zaglavie",
    letter: "napomnyane",
    label: "Заглавие",
    hint: "Голямото заглавие най-отгоре.",
    vars: [],
    multiline: false,
    fallback: "Поръчката ти остана недовършена",
  },
  {
    id: "napomnyane.uvod",
    letter: "napomnyane",
    label: "Увод",
    hint: "Първият абзац. Казва, че нищо не е таксувано - не го махай.",
    vars: ["име", "какво"],
    multiline: true,
    fallback: "Здравей, {име}! Започна поръчка за {какво} за Sofia Life Summit, но плащането не беше завършено. Нищо не е таксувано и място не е запазено.",
  },
  {
    id: "napomnyane.podpis",
    letter: "napomnyane",
    label: "Подпис",
    hint: "Ситният текст най-долу, под бутона.",
    vars: [],
    multiline: true,
    fallback: "Ако вече не искаш билет, това е единственото напомняне, което ще получиш. Въпроси: отговори на това писмо или пиши на hi@biohacking.bg.",
  },

  {
    id: "chakasht.zaglavie",
    letter: "chakasht",
    label: "Заглавие",
    hint: "Голямото заглавие. Влиза и в темата на писмото.",
    vars: ["ниво"],
    multiline: false,
    fallback: "Освободи се място от {ниво}",
  },
  {
    id: "chakasht.tekst",
    letter: "chakasht",
    label: "Текст",
    hint: "Абзацът над бутона.",
    vars: ["места"],
    multiline: true,
    fallback: "Записа се да ти пишем, ако се освободи място от това ниво. Освободиха се {места} - първите, които купят, ги вземат.",
  },
  {
    id: "chakasht.podpis",
    letter: "chakasht",
    label: "Подпис",
    hint: "Ситният текст най-долу.",
    vars: [],
    multiline: true,
    fallback: "Пишем ти само този път. Ако мястото вече е заето, когато отвориш, съжаляваме - и благодарим за интереса. Въпроси: hi@biohacking.bg.",
  },

  {
    id: "predi.uvod",
    letter: "predi",
    label: "Увод",
    hint: "Абзацът под заглавието.",
    vars: ["име"],
    multiline: true,
    fallback: "Здравей, {име}! Ето всичко, което ти трябва за деня.",
  },
  {
    id: "predi.chasove",
    letter: "predi",
    label: "Часове",
    hint: "Редът „Кога“, под датата. Тук се пипат часовете на отваряне.",
    vars: [],
    multiline: true,
    fallback: "Регистрацията отваря в 09:00, програмата започва в 10:00.",
  },
  {
    id: "predi.vhod",
    letter: "predi",
    label: "На входа",
    hint: "Редът за QR кода, над билетите.",
    vars: [],
    multiline: true,
    fallback: "Покажи QR кода на входа - от телефона или разпечатан. Всеки билет е за един човек.",
  },
  {
    id: "predi.podpis",
    letter: "predi",
    label: "Подпис",
    hint: "Ситният текст най-долу.",
    vars: ["поръчка"],
    multiline: true,
    fallback:
      "Въпроси: отговори на това писмо или пиши на hi@biohacking.bg. Поръчка {поръчка}. Sofia Life Summit се организира съвместно от Bulgarian Longevity Association и Biohacking.bg.",
  },

  {
    id: "dokument.uvod-proforma",
    letter: "dokument-proforma",
    label: "Увод",
    hint: "Абзацът над сумата. „{име}“ излиза като „, Име“ или празно, ако няма лице за контакт.",
    vars: ["име", "падеж"],
    multiline: true,
    fallback: "Здравейте{име}! Изпращаме проформа фактура{падеж}. След получаване на превода издаваме фактурата.",
  },
  {
    id: "dokument.uvod-faktura",
    letter: "dokument-faktura",
    label: "Увод",
    hint: "Абзацът над сумата. „{номер}“ излиза като „ № 0000001042“.",
    vars: ["име", "номер"],
    multiline: true,
    fallback: "Здравейте{име}! Благодарим за плащането. Прилагаме фактура{номер}.",
  },
  {
    id: "dokument.podpis",
    letter: "dokument-proforma",
    label: "Подпис",
    hint: "Ситният текст най-долу. Един и същ за проформата и за фактурата.",
    vars: [],
    multiline: true,
    fallback: "Въпроси: отговорете на това писмо или пишете на hi@biohacking.bg.",
  },

  {
    id: "dostap.uvod",
    letter: "dostap",
    label: "Увод",
    hint: "Абзацът над бутона „Влез“.",
    vars: [],
    multiline: true,
    fallback: "Натисни бутона, за да влезеш. Връзката важи месец, а след влизане оставаш вписан(а) три месеца.",
  },
  {
    id: "dostap.podpis",
    letter: "dostap",
    label: "Подпис",
    hint: "Ситният текст най-долу.",
    vars: [],
    multiline: true,
    fallback: "Ако не си искал(а) вход, просто изтрий това писмо - никой не е влязъл.",
  },
] as const satisfies readonly MailSlot[];

export type MailTextId = (typeof MAIL_SLOTS)[number]["id"];
export type MailTexts = Record<MailTextId, string>;

export const isMailTextId = (v: unknown): v is MailTextId => MAIL_SLOTS.some((s) => s.id === v);

export const defaultMailTexts = Object.fromEntries(MAIL_SLOTS.map((s) => [s.id, s.fallback])) as MailTexts;

/**
 * The edited wording, with the code defaults under it.
 *
 * Cached per request: one confirmation mail asks for the same texts from the
 * HTML and the plain-text build, and a webhook must not pay for two queries.
 * A database failure falls back to the defaults rather than throwing - a
 * missing sentence is a poorer letter, a thrown error is no letter at all,
 * and this runs inside the payment webhook.
 */
export const getMailTexts = cache(async (): Promise<MailTexts> => {
  try {
    const row = await getSetting("mail_texts");
    if (!row) return defaultMailTexts;
    const saved = JSON.parse(row.value) as Record<string, unknown>;
    const out = { ...defaultMailTexts };
    for (const slot of MAIL_SLOTS) {
      const v = saved[slot.id];
      if (typeof v === "string" && v.trim()) out[slot.id] = v;
    }
    return out;
  } catch (error) {
    console.error("[mail-texts] falling back to the defaults:", error);
    return defaultMailTexts;
  }
});

/** Writes the edited slots; a slot equal to its default is not stored. */
export async function saveMailTexts(patch: Partial<MailTexts>): Promise<void> {
  const current = await getSetting("mail_texts");
  const saved: Record<string, string> = current ? (JSON.parse(current.value) as Record<string, string>) : {};
  for (const [id, value] of Object.entries(patch)) {
    if (!isMailTextId(id)) continue;
    const clean = String(value ?? "").trim();
    if (!clean || clean === defaultMailTexts[id]) delete saved[id];
    else saved[id] = clean.slice(0, 2000);
  }
  await setSetting("mail_texts", JSON.stringify(saved));
}

const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * One slot, ready to drop into a letter.
 *
 * The template is escaped first and the values are substituted after, so a
 * value may carry its own markup - `{срок}` is bold in the HTML letter and
 * bare in the plain-text one - while nothing an editor types can become a
 * tag. An unknown placeholder disappears instead of printing its braces.
 */
export function mailText(
  texts: MailTexts,
  id: MailTextId,
  vars: Record<string, string> = {},
  mode: "html" | "text" = "text",
): string {
  const template = texts[id] ?? defaultMailTexts[id];
  const base = mode === "html" ? escapeHtml(template) : template;
  return base.replace(/\{([^{}]+)\}/g, (_m, name: string) => vars[name] ?? "");
}
