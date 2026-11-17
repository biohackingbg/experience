import "server-only";

import { Resend } from "resend";

import { SURVEY_CLOSES_LABEL } from "@/lib/survey-questions";
import { SITE, surveyUrl } from "@/lib/surveys";

/**
 * The thank-you letters after the summit: to the visitors (with the survey),
 * the partners (with their survey) and the speakers (a thank-you only), and
 * the letter that asks someone added to the 2027 early-access list to
 * confirm it themself.
 */

type Mail = { to: string; subject: string; html: string; text: string };

const F = "-apple-system,Segoe UI,Roboto,sans-serif";
const REPLY_TO = process.env.EMAIL_REPLY_TO?.trim() || "hi@biohacking.bg";

function esc(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

const p = (html: string) => `<p style="margin:14px 0 0;font:400 15px/1.6 ${F};color:#02251fcc">${html}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:22px 0 0"><a href="${href}" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;font:600 15px/1 ${F};padding:15px 24px;border-radius:999px">${label}</a></p>`;
const sign = (lines: string[]) => `<p style="margin:24px 0 0;font:400 15px/1.6 ${F};color:#02251f">${lines.join("<br>")}</p>`;

function frame(inner: string, foot: string): string {
  return `<!doctype html><html lang="bg"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px"><tr><td>
    <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience" style="display:block;border:0;width:200px;height:auto;margin:0 0 22px">
    ${inner}
    <p style="margin:26px 0 0;padding-top:14px;border-top:1px solid #dfe4e0;font:400 12px/1.6 ${F};color:#02251f80">${foot}</p>
  </td></tr></table></body></html>`;
}

/* ---------- Visitors ---------- */

export const VISITOR_SUBJECT = "Благодарим ти, че беше на Sofia Life Summit 💚 Отнема 2 минути";

export function visitorMail(input: { to: string; name: string; token: string; others: { label: string; token: string }[] }): Mail {
  const hello = input.name ? `Здравей, ${esc(input.name)},` : "Здравей,";
  const url = surveyUrl(input.token);
  const company = input.others.length
    ? `<div style="margin:24px 0 0;padding:16px 18px;background:#ffffff;border-radius:14px;border:1px solid #dfe4e0">
      <p style="margin:0;font:600 14px/1.5 ${F};color:#02251f">Беше с компания? Препрати им техните линкове: всеки отговаря за себе си.</p>
      ${input.others.map((o) => `<p style="margin:8px 0 0;font:400 14px/1.5 ${F};color:#02251fcc">${esc(o.label)}: <a href="${surveyUrl(o.token)}" style="color:#146455;font-weight:600">${surveyUrl(o.token)}</a></p>`).join("")}
    </div>`
    : "";
  const html = frame(
    `<h1 style="margin:0;font:800 24px/1.25 ${F};color:#02251f">Благодарим ти, че беше на Sofia Life Summit</h1>
    ${p(hello)}
    ${p("Благодарим ти, че беше с нас на 7 и 8 ноември в Гранд Хотел Милениум. Над 1000 души, над 25 лекции и панела и два дни движение, възстановяване и общност. Без теб нямаше да е същото.")}
    ${p("Вече започнахме да подготвяме следващото издание и искаме то да е направено за теб. Затова ти задаваме няколко кратки въпроса:")}
    ${button(url, "Попълни анкетата")}
    ${p(`Отнема около 2 минути. Анкетата е отворена до ${SURVEY_CLOSES_LABEL}. Ще прочетем всеки отговор.`)}
    ${company}
    ${p(`Скоро ще споделим снимки и моменти от събитието в <a href="https://www.instagram.com/longevitysummit.eu/" style="color:#146455">@longevitysummit.eu</a>.`)}
    ${sign(["До скоро,", "Джулия Димитрова и Мария Варсанова", "Sofia Life Summit | Biohacking.bg"])}`,
    "Получаваш това писмо, защото имаше билет за Sofia Life Summit 2026. Линкът към анкетата е личен: важи за един отговор.",
  );
  const text = [
    input.name ? `Здравей, ${input.name},` : "Здравей,",
    "",
    "Благодарим ти, че беше с нас на 7 и 8 ноември в Гранд Хотел Милениум. Над 1000 души, над 25 лекции и панела и два дни движение, възстановяване и общност. Без теб нямаше да е същото.",
    "",
    "Вече започнахме да подготвяме следващото издание и искаме то да е направено за теб. Затова ти задаваме няколко кратки въпроса:",
    "",
    url,
    "",
    `Отнема около 2 минути. Анкетата е отворена до ${SURVEY_CLOSES_LABEL}. Ще прочетем всеки отговор.`,
    ...(input.others.length ? ["", "Беше с компания? Препрати им техните линкове: всеки отговаря за себе си.", ...input.others.map((o) => `${o.label}: ${surveyUrl(o.token)}`)] : []),
    "",
    "Скоро ще споделим снимки и моменти от събитието в @longevitysummit.eu.",
    "",
    "До скоро,",
    "Джулия Димитрова и Мария Варсанова",
    "Sofia Life Summit | Biohacking.bg",
  ].join("\n");
  return { to: input.to, subject: VISITOR_SUBJECT, html, text };
}

/* ---------- Partners ---------- */

export const PARTNER_SUBJECT = "Благодарим Ви за партньорството на Sofia Life Summit 2026";

export function partnerMail(input: { to: string; name: string; brand: string; token: string }): Mail {
  const url = surveyUrl(input.token);
  const hello = input.name ? `Здравейте, ${esc(input.name)},` : "Здравейте,";
  const html = frame(
    `<h1 style="margin:0;font:800 24px/1.25 ${F};color:#02251f">Благодарим Ви за партньорството</h1>
    ${p(hello)}
    ${p(`Благодарим Ви, че ${esc(input.brand)} беше част от Sofia Life Summit 2026. Вашето присъствие направи Village и зоните за преживяване това, което бяха: място, където хората пробват, питат и се свързват с брандовете.`)}
    ${p(`Ще Ви помолим за 3 минути, за да ни кажете как беше за Вас (анкетата е отворена до ${SURVEY_CLOSES_LABEL}). Обратната Ви връзка ще определи формата за 2027:`)}
    ${button(url, "Попълнете анкетата")}
    ${p("След като съберем отговорите, ще Ви изпратим кратък отчет за събитието (посетители, обхват в социалните мрежи, снимки). Ще получите и предимство при избора на позиция и пакет за следващото издание.")}
    ${sign(["С благодарност,", "Мария Варсанова", "Партньорства | Sofia Life Summit", `<a href="mailto:hi@biohacking.bg" style="color:#146455">hi@biohacking.bg</a>`])}`,
    "Линкът към анкетата е за Вашата марка. Ако искате да отговори колега, просто му го препратете.",
  );
  const text = [
    input.name ? `Здравейте, ${input.name},` : "Здравейте,",
    "",
    `Благодарим Ви, че ${input.brand} беше част от Sofia Life Summit 2026. Вашето присъствие направи Village и зоните за преживяване това, което бяха: място, където хората пробват, питат и се свързват с брандовете.`,
    "",
    `Ще Ви помолим за 3 минути, за да ни кажете как беше за Вас (анкетата е отворена до ${SURVEY_CLOSES_LABEL}). Обратната Ви връзка ще определи формата за 2027:`,
    "",
    url,
    "",
    "След като съберем отговорите, ще Ви изпратим кратък отчет за събитието (посетители, обхват в социалните мрежи, снимки). Ще получите и предимство при избора на позиция и пакет за следващото издание.",
    "",
    "С благодарност,",
    "Мария Варсанова",
    "Партньорства | Sofia Life Summit",
    "hi@biohacking.bg",
  ].join("\n");
  return { to: input.to, subject: PARTNER_SUBJECT, html, text };
}

/* ---------- Speakers ---------- */

/** "Уважаема д-р Иванова" → "д-р Иванова", for the subject line. */
const addressee = (salutation: string) => salutation.replace(/^Уважаем\S*\s+/i, "").trim();

export function speakerMail(input: { to: string; salutation: string; topic: string }): Mail {
  const who = addressee(input.salutation);
  const subject = who ? `Благодарим Ви, ${who}` : "Благодарим Ви";
  const lecture = input.topic ? `Вашата лекция „${esc(input.topic)}“ беше от най-обсъжданите моменти.` : "Вашето участие беше от най-обсъжданите моменти.";
  const html = frame(
    `<p style="margin:0;font:400 15px/1.6 ${F};color:#02251f">${esc(input.salutation)},</p>
    ${p("Искаме лично да Ви благодарим, че бяхте лектор на Sofia Life Summit 2026.")}
    ${p(`${lecture} Публиката си тръгна с отговори, които ще приложи, и с нови въпроси, което е още по-ценно. Благодарим Ви за времето, подготовката и щедростта, с които споделихте знанието си.`)}
    ${p("Ще се радваме и през 2027 да бъдете част от Sofia Life Summit.")}
    ${sign(["С благодарност и уважение,", "Джулия Димитрова, Мария Варсанова и Ема Димитрова", "Sofia Life Summit | Biohacking.bg"])}`,
    "Sofia Life Summit 2026, 7 и 8 ноември, Гранд Хотел Милениум София.",
  );
  const text = [
    `${input.salutation},`,
    "",
    "Искаме лично да Ви благодарим, че бяхте лектор на Sofia Life Summit 2026.",
    "",
    `${input.topic ? `Вашата лекция „${input.topic}“ беше от най-обсъжданите моменти.` : "Вашето участие беше от най-обсъжданите моменти."} Публиката си тръгна с отговори, които ще приложи, и с нови въпроси, което е още по-ценно. Благодарим Ви за времето, подготовката и щедростта, с които споделихте знанието си.`,
    "",
    "Ще се радваме и през 2027 да бъдете част от Sofia Life Summit.",
    "",
    "С благодарност и уважение,",
    "Джулия Димитрова, Мария Варсанова и Ема Димитрова",
    "Sofia Life Summit | Biohacking.bg",
  ].join("\n");
  return { to: input.to, subject, html, text };
}

/* ---------- Early access, confirmed by the person added ---------- */

export function earlyConfirmMail(input: { to: string; by: string; token: string }): Mail {
  const url = `${SITE}/ranen-dostap/${input.token}`;
  const html = frame(
    `<h1 style="margin:0;font:800 24px/1.25 ${F};color:#02251f">Ранен достъп до Sofia Life Summit 2027</h1>
    ${p(`${esc(input.by)} те записа за ранен достъп до билетите за Sofia Life Summit 2027: ще ти пишем, когато билетите излязат, преди общата продажба.`)}
    ${p("Ако искаш, потвърди с един клик:")}
    ${button(url, "Потвърждавам")}
    ${p("Ако не потвърдиш, няма да ти пишем повече.")}`,
    "Получаваш това писмо, защото някой от посетителите на Sofia Life Summit 2026 е написал имейла ти в анкетата след събитието.",
  );
  const text = [
    `${input.by} те записа за ранен достъп до билетите за Sofia Life Summit 2027: ще ти пишем, когато билетите излязат, преди общата продажба.`,
    "",
    "Ако искаш, потвърди с един клик:",
    url,
    "",
    "Ако не потвърдиш, няма да ти пишем повече.",
  ].join("\n");
  return { to: input.to, subject: "Потвърди ранния си достъп до Sofia Life Summit 2027", html, text };
}

/* ---------- Sending ---------- */

/** Sends in batches of 100 (Resend's cap). Returns how many went and the first error, if any. */
export async function sendMails(mails: Mail[]): Promise<{ sent: number; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { sent: 0, error: "Пощата не е настроена." };
  const resend = new Resend(key);
  let sent = 0;
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    const { error } = await resend.batch.send(chunk.map((m) => ({ from, replyTo: REPLY_TO, ...m })));
    if (error) return { sent, error: error.message };
    sent += chunk.length;
  }
  return { sent };
}
