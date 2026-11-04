/**
 * The words of every automatic letter (lib/sequences.ts decides who gets
 * which and when). Pure: given the facts, returns subject, HTML and text.
 * Kept apart from the runner so the admin can render every letter with
 * sample data without touching the database.
 */

import { WEB_APP_URL } from "@/lib/app-links";
import { latin } from "@/lib/latin";
import { MOVEMENT_DAYS, STATIONS, WORKSHOPS } from "@/lib/movement-program";
import type { Day } from "@/lib/program";
import { type Pricing, priceOf } from "@/lib/pricing";
import { CONCEPT_TOTAL } from "@/lib/site-copy";
import { TIERS, type Tier, dayLabel, formatPrice, getTier } from "@/lib/tickets";

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
function frame(input: { subject: string; bodyHtml: string; bodyText: string[]; why: string; unsubUrl: string; lang?: "bg" | "en" }): Letter {
  const en = input.lang === "en";
  const L = en
    ? { dates: "Sofia Life Summit · 7-8 November", venue: "Grand Hotel Millennium, 89B Vitosha Blvd, Sofia", ask: "Questions: reply to this email or write to hi@biohacking.bg.", stop: "No more emails", textDates: "Sofia Life Summit · 7-8 November 2026 · Grand Hotel Millennium, 89B Vitosha Blvd, Sofia", textAsk: "Questions: hi@biohacking.bg", textStop: "No more emails" }
    : { dates: "Sofia Life Summit · 07-08 ноември", venue: "Гранд Хотел Милениум, бул. „Витоша“ 89Б, София", ask: "Въпроси: отговори на това писмо или пиши на hi@biohacking.bg.", stop: "Не искам повече писма", textDates: "Sofia Life Summit · 07-08 ноември 2026 · Гранд Хотел Милениум, бул. „Витоша“ 89Б, София", textAsk: "Въпроси: hi@biohacking.bg", textStop: "Не искам повече писма" };
  const html = `<!doctype html><html lang="${en ? "en" : "bg"}"><body style="margin:0;background:#f1f5f3;padding:28px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px">
    <tr><td>
      <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience" style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;margin:0 0 20px">
      <div style="font:700 12px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:#14645599">${L.dates}</div>
      <h1 style="margin:12px 0 20px;font:800 24px/1.25 ${FONT};color:#02251f">${esc(input.subject)}</h1>
      ${input.bodyHtml}
      <div style="margin-top:8px;height:3px;background:#cef870;border-radius:2px"></div>
      <p style="margin:20px 0 0;font:400 12px/1.6 ${FONT};color:#02251f80">
        ${L.venue} · <a href="${SITE}" style="color:#146455">thelongevitysummit.eu</a><br>
        ${esc(input.why)} ${L.ask}
        <a href="${esc(input.unsubUrl)}" style="color:#02251f80">${L.stop}</a>.
      </p>
    </td></tr>
  </table></body></html>`;
  const text = [
    ...input.bodyText,
    "",
    L.textDates,
    SITE,
    `${input.why} ${L.textAsk}`,
    `${L.textStop}: ${input.unsubUrl}`,
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
 * 1b · Abandoned checkout, the last-week offer (sent by hand, once)
 * ------------------------------------------------------------------ */

export type AbandonedOfferInput = { name: string; items: string; tierId: string; code: string; percent: number; unsubUrl: string };

export function abandonedOfferLetter(i: AbandonedOfferInput): Letter {
  const url = `${SITE}/bilet?nivo=${encodeURIComponent(i.tierId)}&promo=${encodeURIComponent(i.code)}&utm_source=email&utm_campaign=abandoned-offer`;
  const lines = [
    `${hi(i.name)} Преди време започна поръчка за **${i.items}** за Sofia Life Summit, но плащането не мина. Нищо не е таксувано.`,
    `Събитието е този уикенд, 7 и 8 ноември в Гранд Хотел Милениум, и още има места. За да дойдеш, ти даваме **-${i.percent}% на всеки билет** с код **${i.code}**. Кодът важи само днес, до полунощ.`,
    `През бутона кодът е попълнен сам; иначе го напиши в полето „Промо код“ на страницата с билетите. Ако нещо те спира - ден, програма, въпрос - отговори на това писмо.`,
  ];
  return frame({
    subject: `-${i.percent}% за билета ти, само днес`,
    bodyHtml: para(lines[0]) + para(lines[1]) + button(`Вземи билет с -${i.percent}%`, url) + para(lines[2]),
    bodyText: [plain(lines[0]), "", plain(lines[1]), "", `Вземи билет с -${i.percent}%: ${url}`, "", lines[2]],
    why: "Получаваш това писмо, защото започна поръчка за билет на thelongevitysummit.eu и не я завърши.",
    unsubUrl: i.unsubUrl,
  });
}

/* ------------------------------------------------------------------ *
 * To buyers of several tickets: hand each one to its person
 * ------------------------------------------------------------------ */

export type HandoverAskInput = { name: string; tickets: ProgrammeTicket[]; unsubUrl: string; lang?: "bg" | "en" };

/** By when every ticket should be registered to the person who uses it. */
export const REGISTER_BY = { bg: "6 ноември, 00:00 (до края на четвъртък)", en: "00:00 on 6 November (the end of Thursday)" } as const;

/**
 * "Register your ticket", to every buyer: one link per ticket, which the
 * buyer opens for their own ticket and forwards for anyone else's. Each
 * person types their name and their address, confirms it with a code, and
 * signs in to the app with it - the app books on one ticket per account, so
 * this is how every ticket gets its own places and the right name. The
 * words follow what the buyer holds: one ticket or several, and whether any
 * of them books (CORE does not).
 */
export function handoverAskLetter(i: HandoverAskInput): Letter {
  const en = i.lang === "en";
  const n = i.tickets.length;
  const many = n > 1;
  const tiers = new Set(i.tickets.map((t) => t.tierName));
  const books = tiers.has("PLUS") || tiers.has("PEAK");
  const first = i.name.trim().split(/\s+/)[0] || i.name;
  const by = REGISTER_BY[en ? "en" : "bg"];
  const limits = en
    ? [tiers.has("PLUS") ? "PLUS: 1 workshop and 1 experience" : null, tiers.has("PEAK") ? "PEAK: 3 workshops and 3 experiences" : null].filter(Boolean).join(", ")
    : [tiers.has("PLUS") ? "PLUS: 1 workshop и 1 experience" : null, tiers.has("PEAK") ? "PEAK: 3 workshops и 3 experiences" : null].filter(Boolean).join(", ");

  const w = en
    ? {
        lead: many
          ? `Hi ${first}! You have **${n} tickets** for Sofia Life Summit. Each one must be registered **by ${by}** to the person who will use it: then ${books ? "everyone books their own workshops and experiences and " : ""}everyone has their ticket and its QR code on their own phone.`
          : `Hi ${first}! Please register your ticket for Sofia Life Summit **by ${by}**. It takes a minute, and then ${books ? "your ticket is in the app and you book workshops and experiences there." : "your ticket and its QR code for the entrance are in the app."}`,
        forWhom: many ? "Open the link for your own ticket and register it. Forward the links for the other tickets to the people they are for." : "If the ticket is for someone else, forward them this link and they register it to themselves.",
        how: [
          "Open the ticket link, write your name and email, and confirm the email with a 6-digit code.",
          "Sign in to the Sofia Life Summit app with that email: from the App Store on iPhone, in the browser on Android or a computer. Your ticket with its QR code for the entrance is there.",
          ...(books ? [`From **Friday, 6 November, at 08:30** you book workshops and experiences on your ticket (${limits}).`] : []),
        ],
        unnamed: "no name yet",
        register: "Register the ticket",
        app: "The app",
        ios: "iPhone: App Store",
        web: "Android and computer",
        subject: many ? `Register your ${n} tickets by 6 November: each to its person` : "Register your Sofia Life Summit ticket by 6 November",
        why: "You are getting this because you have a ticket for Sofia Life Summit.",
      }
    : {
        lead: many
          ? `${hi(i.name)} Имаш **${n} билета** за Sofia Life Summit. Всеки трябва да е регистриран **до ${by}** на човека, който ще го ползва: така ${books ? "всеки си записва сам workshops и experiences и " : ""}всеки има билета си с QR кода в своя телефон.`
          : `${hi(i.name)} Регистрирай билета си за Sofia Life Summit **до ${by}**. Отнема минута, а после ${books ? "билетът ти е в приложението и записваш workshops и experiences там." : "билетът ти с QR кода за входа е в приложението."}`,
        forWhom: many ? "Отвори линка за своя билет и регистрирай него. Линковете за другите билети изпрати на хората, за които са." : "Ако билетът е за друг човек, изпрати му този линк и той ще го регистрира на себе си.",
        how: [
          "Отваряш линка към билета, пишеш името и имейла си и потвърждаваш имейла с 6-цифрен код.",
          "Влизаш с този имейл в приложението Sofia Life Summit: на iPhone от App Store, на Android и компютър от браузъра. Там е билетът с QR кода за входа.",
          ...(books ? [`От **петък, 6 ноември, в 08:30** записваш workshops и experiences според билета (${limits}).`] : []),
        ],
        unnamed: "още без име",
        register: "Регистрирай билета",
        app: "Приложението",
        ios: "iPhone: App Store",
        web: "Android и компютър",
        subject: many ? `Регистрирай ${n}-те си билета до 6 ноември: всеки на своя човек` : "Регистрирай билета си за Sofia Life Summit до 6 ноември",
        why: "Получаваш това писмо, защото имаш билет за Sofia Life Summit.",
      };
  const link = (code: string) => `${SITE}/vzemi?kod=${encodeURIComponent(code)}${en ? "&lang=en" : ""}`;

  const rowsHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-collapse:collapse">${i.tickets
    .map((t) => {
      const url = link(t.code);
      const who = t.attendeeEmail ? `${t.attendeeName ?? ""} (${t.attendeeEmail})` : t.attendeeName ?? (many ? w.unnamed : "");
      return `<tr>
        <td valign="top" style="width:70px;padding:9px 10px 9px 0;border-top:1px solid #02251f14;font:600 13px/1.45 ${FONT};color:#146455">${esc(t.tierName)}</td>
        <td valign="top" style="padding:9px 0;border-top:1px solid #02251f14;font:400 14px/1.45 ${FONT};color:#02251f">${who ? `${esc(who)}<br>` : ""}<a href="${esc(url)}" style="font:400 12px/1.45 ${FONT};color:#146455;word-break:break-all">${esc(url)}</a></td>
      </tr>`;
    })
    .join("")}</table>`;
  const register = !many && i.tickets[0] ? button(w.register, link(i.tickets[0].code)) : "";

  return frame({
    subject: w.subject,
    bodyHtml: para(w.lead) + rowsHtml + register + para(w.forWhom) + bullets(w.how.map(plain)) + h2(w.app) + appButtons(w.ios, w.web),
    bodyText: [plain(w.lead), "", ...i.tickets.map((t) => `${t.tierName} ${t.code}${t.attendeeName ? `: ${t.attendeeName}` : ""}  ${link(t.code)}`), "", w.forWhom, "", ...w.how.map((h) => `- ${plain(h)}`), "", `${w.ios}: ${APP_STORE_URL}`, `${w.web}: ${WEB_APP_URL}`],
    why: w.why,
    unsubUrl: i.unsubUrl,
    lang: en ? "en" : "bg",
  });
}

/* ------------------------------------------------------------------ *
 * Friday 08:30: booking is open, to PEAK
 * ------------------------------------------------------------------ */

export type BookingOpenInput = { name: string; codes: string[]; unsubUrl: string; lang?: "bg" | "en" };

/**
 * The moment booking opens, to everyone holding a PEAK ticket. The app books
 * on one ticket per account, so a buyer who kept several gets a link to each
 * ticket's page, where each books on its own allowance.
 */
export function bookingOpenLetter(i: BookingOpenInput): Letter {
  const en = i.lang === "en";
  const many = i.codes.length > 1;
  const first = i.name.trim().split(/\s+/)[0] || i.name;
  const page = (c: string) => `${SITE}/bilet/${encodeURIComponent(c)}${en ? "?lang=en" : ""}`;
  const w = en
    ? {
        subject: "Booking is open: your 3 workshops and 3 experiences",
        lead: `Hi ${first}! Booking for workshops and experiences is **open now**. With PEAK you book **3 workshops and 3 experiences**, and places go in the order people book.`,
        how: many
          ? "In the app the booking goes on one ticket. For each of your other tickets, open its page below and book there: each ticket has its own 3 and 3."
          : "Open the app and go to Stations, or book on your ticket page.",
        ticket: (c: string) => `Book for ticket ${c}`,
        app: "The app", ios: "iPhone: App Store", web: "Android and computer",
        why: "You are getting this because you have a PEAK ticket for Sofia Life Summit.",
      }
    : {
        subject: "Записването е отворено: твоите 3 workshops и 3 experiences",
        lead: `${hi(i.name)} Записването за workshops и experiences **вече е отворено**. С PEAK записваш **3 workshops и 3 experiences**, а местата се пазят с реда на записване.`,
        how: many
          ? "В приложението записването е на един билет. За всеки от другите си билети отвори страницата му по-долу и запиши там: всеки билет има свои 3 и 3."
          : "Отвори приложението и влез в „Станции“, или запиши от страницата на билета си.",
        ticket: (c: string) => `Запиши за билет ${c}`,
        app: "Приложението", ios: "iPhone: App Store", web: "Android и компютър",
        why: "Получаваш това писмо, защото имаш билет PEAK за Sofia Life Summit.",
      };
  const buttons = (many ? i.codes : i.codes.slice(0, 1)).map((c) => button(many ? w.ticket(c) : en ? "Open my ticket" : "Отвори билета", page(c))).join("");
  return frame({
    subject: w.subject,
    bodyHtml: para(w.lead) + para(w.how) + buttons + h2(w.app) + appButtons(w.ios, w.web),
    bodyText: [plain(w.lead), "", w.how, "", ...i.codes.map((c) => `${w.ticket(c)}: ${page(c)}`), "", `${w.ios}: ${APP_STORE_URL}`, `${w.web}: ${WEB_APP_URL}`],
    why: w.why,
    unsubUrl: i.unsubUrl,
    lang: en ? "en" : "bg",
  });
}

/** The two ways into the app, side by side: the App Store for iPhone, the web app for everything else. */
function appButtons(ios: string, web: string): string {
  return `<p style="margin:6px 0 22px">
      <a href="${APP_STORE_URL}" style="display:inline-block;margin:0 8px 8px 0;background:#02251f;color:#f1f5f3;text-decoration:none;font:600 14px/1 ${FONT};padding:14px 22px;border-radius:999px">${esc(ios)}</a>
      <a href="${WEB_APP_URL}" style="display:inline-block;margin:0 0 8px;background:#146455;color:#f1f5f3;text-decoration:none;font:600 14px/1 ${FONT};padding:14px 22px;border-radius:999px">${esc(web)}</a>
    </p>`;
}

/* ------------------------------------------------------------------ *
 * The programme letter to every buyer (sent by hand, once per address)
 * ------------------------------------------------------------------ */

const DATES = ["07.11", "08.11"];
const DAY_NAMES = ["Събота", "Неделя"];

/** A heading inside the letter, between the paragraphs. */
const h2 = (text: string) => `<h2 style="margin:28px 0 10px;font:800 18px/1.25 ${FONT};color:#02251f">${esc(text)}</h2>`;
const h3 = (text: string) => `<p style="margin:18px 0 6px;font:700 12px/1.3 ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:#146455">${esc(text)}</p>`;

/** Time on the left, the rest on the right: the shape of a printed programme, kept in a table so every mail client lines it up. */
function rows(items: { time: string; title: string; sub?: string; quiet?: boolean }[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;border-collapse:collapse">${items
    .map(
      (r) => `<tr>
        <td valign="top" style="width:92px;padding:7px 10px 7px 0;border-top:1px solid #02251f14;font:400 13px/1.45 ${FONT};color:#02251f80;white-space:nowrap">${esc(r.time)}</td>
        <td valign="top" style="padding:7px 0;border-top:1px solid #02251f14;font:${r.quiet ? 400 : 600} 14px/1.45 ${FONT};color:${r.quiet ? "#02251f80" : "#02251f"}">${esc(r.title)}${
          r.sub ? `<br><span style="font:400 13px/1.45 ${FONT};color:#146455">${esc(r.sub)}</span>` : ""
        }</td>
      </tr>`,
    )
    .join("")}</table>`;
}

export type ProgrammeTicket = { code: string; tierName: string; attendeeName: string | null; attendeeEmail: string | null };
export type ProgrammeLetterInput = { name: string; days: Day[]; unsubUrl: string; tickets?: ProgrammeTicket[]; lang?: "bg" | "en" };

/**
 * The whole programme in one letter: the talks on the stage by day and
 * module, the workshops, the experiences in the rooms and at the stations,
 * and when and how places are booked. Speakers not yet confirmed are left
 * out, and a talk whose every speaker is unconfirmed with them, so the
 * letter promises nobody who may not come. English buyers get it in English:
 * `days` then comes from the English programme, and names are transliterated.
 */
export function programmeLetter(i: ProgrammeLetterInput): Letter {
  const en = i.lang === "en";
  const programmeUrl = `${SITE}${en ? "/en" : ""}/programa?utm_source=email&utm_campaign=programme`;
  const html: string[] = [];
  const text: string[] = [];
  const nm = (v: string) => (en ? latin(v) : v);
  const days = en ? ["Saturday", "Sunday"] : DAY_NAMES;
  const w = en
    ? {
        intro: `Hi ${i.name.trim().split(/\s+/)[0] || i.name}! We start on Saturday. Here is the whole programme in one place: the talks on the stage, and the workshops and experiences in the rooms and at the stations.`,
        ask: (n: number) => `You have **${n} tickets**. Each one should be registered **by ${REGISTER_BY.en}** to the person who uses it: forward each person the link to their ticket. They write their name and email, confirm it with a code, and sign in to the app with it, where they book their own workshops and experiences.`,
        mine: "Your tickets", unnamed: "no name yet", forward: "Link for the person", stage: "The stage", with: "with", seats: (n: number, up?: boolean) => `${up ? "up to " : ""}${n} seats`,
        wsNote: "In the Newton room, with limited seats and booking.", stations: "Stations, both days", and: " and ",
        booking: [
          "Booking for workshops and experiences opens on **Friday, 6 November, at 08:30**, in the Sofia Life Summit app and on your ticket page. Places are limited and go in the order people book.",
          "**PLUS:** 1 workshop and 1 experience of your choice. **PEAK:** 3 workshops and 3 experiences. **CORE** admits you to the stage and the Village.",
        ],
        bookTitle: "Booking", site: "See the programme on the site", app: "The app", ios: "iPhone: App Store", web: "Android and computer",
        appLine: "Sign in to the app with the email you bought the ticket with, or the one your ticket was registered to.",
        subject: "The programme: talks, workshops and experiences", why: "You are getting this because you have a ticket for Sofia Life Summit.",
      }
    : {
        intro: `${hi(i.name)} В събота започваме. Ето цялата програма на едно място: лекциите на сцената, workshops и experiences в залите и станциите.`,
        ask: (n: number) => `Имаш **${n} билета**. Всеки трябва да е регистриран **до ${REGISTER_BY.bg}** на човека, който ще го ползва: изпрати на всеки линка към неговия билет. Той пише името и имейла си, потвърждава с код и влиза с него в приложението, където сам си записва workshops и experiences.`,
        mine: "Твоите билети", unnamed: "още без име", forward: "Линк за човека", stage: "Сцената", with: "с", seats: (n: number, up?: boolean) => `${up ? "до " : ""}${n} места`,
        wsNote: "В зала Newton, с ограничени места и записване.", stations: "Станции, и двата дни", and: " и ",
        booking: [
          "Записването за workshops и experiences отваря в **петък, 6 ноември, в 08:30**, в приложението Sofia Life Summit и на страницата на билета ти. Местата са ограничени и се пазят с реда на записване.",
          "**PLUS:** 1 workshop и 1 experience по избор. **PEAK:** 3 workshops и 3 experiences. **CORE** дава достъп до сцената и Village.",
        ],
        bookTitle: "Записване", site: "Виж програмата на сайта", app: "Приложението", ios: "iPhone: App Store", web: "Android и компютър",
        appLine: "Влизаш в приложението с имейла, с който си купил билета, или с който е регистриран билетът ти.",
        subject: "Програмата: лекции, workshops и experiences", why: "Получаваш това писмо, защото имаш билет за Sofia Life Summit.",
      };

  html.push(para(w.intro));
  text.push(plain(w.intro), "");

  // More than one ticket: each should reach the person who uses it, first of all.
  const mine = i.tickets ?? [];
  if (mine.length > 1) {
    const ask = w.ask(mine.length);
    const link = (code: string) => `${SITE}/vzemi?kod=${encodeURIComponent(code)}${en ? "&lang=en" : ""}`;
    html.push(h2(w.mine), para(ask));
    html.push(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse">${mine
        .map((t) => {
          const who = t.attendeeEmail ? `${t.attendeeName ?? ""} (${t.attendeeEmail})` : t.attendeeName ?? w.unnamed;
          return `<tr>
        <td valign="top" style="width:92px;padding:8px 10px 8px 0;border-top:1px solid #02251f14;font:600 13px/1.45 ${FONT};color:#146455">${esc(t.tierName)}</td>
        <td valign="top" style="padding:8px 0;border-top:1px solid #02251f14;font:400 14px/1.45 ${FONT};color:#02251f">${esc(who)}<br><span style="font:400 12px/1.45 ${FONT};color:#02251f80">${esc(t.code)}</span></td>
        <td valign="top" align="right" style="padding:8px 0;border-top:1px solid #02251f14"><a href="${esc(link(t.code))}" style="font:600 13px/1.45 ${FONT};color:#146455">${esc(w.forward)}</a></td>
      </tr>`;
        })
        .join("")}</table>`,
    );
    text.push(w.mine.toUpperCase(), "", plain(ask), "", ...mine.map((t) => `${t.tierName} ${t.code}: ${t.attendeeName ?? w.unnamed}${t.attendeeEmail ? ` (${t.attendeeEmail})` : ""}  ${link(t.code)}`), "");
  }

  // The stage, day by day, module by module.
  html.push(h2(w.stage));
  text.push(w.stage.toUpperCase(), "");
  i.days.forEach((d, n) => {
    html.push(h3(`${days[n] ?? d.day}, ${DATES[n] ?? d.date}: ${d.theme}`));
    text.push(`${days[n] ?? d.day}, ${DATES[n] ?? d.date}: ${d.theme}`);
    let block: { time: string; title: string; sub?: string; quiet?: boolean }[] = [];
    const flush = () => {
      if (block.length) html.push(rows(block));
      block = [];
    };
    for (const s of d.slots) {
      const people = (s.people ?? []).filter((p) => !(s.unconfirmed ?? []).includes(p));
      if (s.people?.length && people.length === 0) continue;
      if (!s.time) {
        // A module heading: a line of its own between the talks.
        flush();
        html.push(`<p style="margin:14px 0 4px;font:700 13px/1.4 ${FONT};color:#02251f">${esc(s.title)}</p>`);
        text.push("", s.title);
        continue;
      }
      block.push({ time: s.time, title: s.title, sub: people.length ? people.join(", ") : undefined, quiet: s.pause });
      text.push(`${s.time}  ${s.title}${people.length ? ` (${people.join(", ")})` : ""}`);
    }
    flush();
    text.push("");
  });

  // Workshops: five, in Newton.
  html.push(h2("Workshops"));
  text.push("WORKSHOPS, NEWTON", "");
  const ws = WORKSHOPS.map((x) => ({
    time: `${days[x.day].slice(0, 3)} ${x.time}`,
    title: en && x.titleEn ? x.titleEn : x.title,
    sub: [x.host ? `${w.with} ${nm(x.host)}` : null, w.seats(x.seats, x.upTo)].filter(Boolean).join(", "),
  }));
  html.push(para(w.wsNote), rows(ws));
  text.push(...ws.map((x) => `${x.time}  ${x.title} (${x.sub})`), "");

  // Experiences: the classes in the rooms, then the stations.
  html.push(h2("Experiences"));
  text.push("EXPERIENCES", "");
  MOVEMENT_DAYS.forEach((rooms, n) => {
    html.push(h3(`${days[n]}, ${DATES[n]}`));
    text.push(`${days[n]}, ${DATES[n]}`);
    for (const r of rooms) {
      const list = r.slots.filter((x) => !x.workshop);
      if (list.length === 0) continue;
      const by = r.partner ? `, ${r.partner.label} ${r.partner.name}` : "";
      html.push(`<p style="margin:12px 0 4px;font:700 13px/1.4 ${FONT};color:#02251f">${esc(r.room + by)}</p>`);
      html.push(rows(list.map((x) => ({ time: x.time, title: en && x.titleEn ? x.titleEn : x.title, sub: [x.host ? `${w.with} ${nm(x.host)}` : null, x.partner ? `powered by ${x.partner.name}` : null].filter(Boolean).join(", ") || undefined }))));
      text.push(`${r.room}${by}`, ...list.map((x) => `${x.time}  ${en && x.titleEn ? x.titleEn : x.title}${x.host ? ` (${w.with} ${nm(x.host)})` : ""}`));
    }
    text.push("");
  });
  html.push(h3(w.stations));
  text.push(w.stations);
  const L = en ? "en" : "bg";
  const st = STATIONS.map((x) => ({
    time: en ? x.zone.replace("Щанд", "Stand") : x.zone,
    title: x.items.map((it) => it.name).join(w.and),
    // The item lines carry what differs by day ("само в събота"), so they go in first.
    sub: [x.items.length > 1 ? x.items.map((it) => (it.sub ? `${it.name}: ${it.sub[L].toLowerCase()}` : null)).filter(Boolean).join("; ") : null, x.facts?.[L], x.note?.[L], x.partner ? `powered by ${x.partner.name}` : null]
      .filter(Boolean)
      .join(". ") || undefined,
  }));
  html.push(rows(st));
  text.push(...st.map((x) => `${x.time}  ${x.title}${x.sub ? ` (${x.sub})` : ""}`), "");

  // Booking, and the way into the app.
  html.push(h2(w.bookTitle), para(w.booking[0]), para(w.booking[1]), button(w.site, programmeUrl));
  text.push(w.bookTitle.toUpperCase(), "", plain(w.booking[0]), "", plain(w.booking[1]), "", `${w.site}: ${programmeUrl}`);
  html.push(h2(w.app), para(w.appLine), appButtons(w.ios, w.web));
  text.push("", w.appLine, `${w.ios}: ${APP_STORE_URL}`, `${w.web}: ${WEB_APP_URL}`);

  return frame({ subject: w.subject, bodyHtml: html.join(""), bodyText: text, why: w.why, unsubUrl: i.unsubUrl, lang: L });
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
  /** The order's language; only the last-chance PEAK letter has an English version so far. */
  lang?: "bg" | "en";
};

export type UpgradeStep = "plus-0" | "plus-5" | "plus-3d" | "peak" | "peak-last";

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

  // The last PEAK letter says what changes against PLUS, line by line, rather than PEAK's whole card.
  const gain: string[] = step === "peak-last" ? [...PEAK_OVER_PLUS.bg] : to.features;
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
    "peak-last": [
      `${hi(i.name)} Sofia Life Summit е тази събота и неделя, а записването за workshops и experiences отваря **в петък в 08:30**. Ако надградиш до PEAK преди това, записваш по лимита на PEAK и имаш **обяд и в двата дни**. Обядът не е включен в PLUS: с PLUS храната е за твоя сметка, с PEAK обядът е безплатен.`,
      `Надграждането е на **${diff} отгоре**${many ? " за билет" : ""}: плащаш само разликата, билетът остава със същия код и записваш вече по лимита на PEAK. В PEAK има още **${i.left} места**.`,
    ],
  };
  const what = step === "peak-last" ? "Какво получаваш с PEAK, в сравнение с PLUS:" : `Какво добавя ${to.name}:`;

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

/** What PEAK gives that PLUS does not, as the last upgrade letter lists it. */
const PEAK_OVER_PLUS = {
  bg: [
    "Безплатен обяд и в двата дни",
    "3 workshops и 3 experiences (с PLUS са 1 и 1)",
    "Premium Lounge през двата дни",
    "Meet & Greet с лекторите",
    "Гарантирано място и премиум зона в залата",
    "Приоритетен вход, без опашка",
    "Goody bag на стойност €250+ (с PLUS е €100+)",
  ],
  en: [
    "Free lunch on both days",
    "3 workshops and 3 experiences (PLUS has 1 and 1)",
    "The Premium Lounge on both days",
    "Meet & Greet with the speakers",
    "A guaranteed seat and the premium area in the hall",
    "Priority entrance, no queue",
    "A goody bag worth €250+ (PLUS: €100+)",
  ],
} as const;

/** The last-chance PEAK letter for an English order: the same offer, in English. */
function upgradePeakLastEn(i: UpgradeInput): Letter {
  const many = i.tickets.length > 1;
  const first = i.tickets[0];
  const diff = first ? eur(first.diffCents) : "";
  const first_ = i.name.trim().split(/\s+/)[0] || i.name;
  const lines = [
    `Hi ${first_}! Sofia Life Summit is this Saturday and Sunday, and booking for workshops and experiences opens **on Friday at 08:30**. Upgrade to PEAK before then and you book on the PEAK allowance, with **lunch on both days**. Lunch is not included in PLUS: with PLUS food is at your own cost, with PEAK lunch is free.`,
    `The upgrade is **${diff} more**${many ? " per ticket" : ""}: you pay only the difference, the ticket keeps its code, and you book on the PEAK allowance. PEAK has **${i.left} places** left.`,
  ];
  const perks = PEAK_OVER_PLUS.en;
  const links = i.tickets.map((t) => {
    const who = t.attendeeName ? ` (${latin(t.attendeeName)})` : many ? ` (ticket ${t.code})` : "";
    return { label: `Upgrade to PEAK for ${eur(t.diffCents)}${who}`, url: `${SITE}/bilet/nadgradi/${encodeURIComponent(t.code)}?lang=en&utm_source=email&utm_campaign=upgrade-peak` };
  });
  return frame({
    subject: "PEAK: lunch on both days, 3 workshops, 3 experiences and Meet & Greet",
    bodyHtml: lines.map(para).join("") + para("What you get with PEAK, compared with PLUS:") + bullets([...perks]) + links.map((l) => button(l.label, l.url)).join(""),
    bodyText: [...lines.map(plain), "", "What you get with PEAK, compared with PLUS:", ...perks.map((p) => `- ${p}`), "", ...links.map((l) => `${l.label}: ${l.url}`)],
    why: "You are getting this because you have a PLUS ticket for Sofia Life Summit.",
    unsubUrl: i.unsubUrl,
    lang: "en",
  });
}

export function upgradeLetter(i: UpgradeInput, step: UpgradeStep): Letter {
  if (step === "peak-last" && i.lang === "en") return upgradePeakLastEn(i);
  const subject: Record<UpgradeStep, string> = {
    "plus-0": "Билетът ти е тук. А двата дни?",
    "plus-5": "Един ден или двата? Разликата до PLUS",
    "plus-3d": "Три дни до Sofia Life Summit - последен шанс за двата дни",
    peak: `PEAK: ${i.left} места най-близо до лекторите`,
    "peak-last": "PEAK: обяд в двата дни, 3 workshops, 3 experiences и Meet & Greet",
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

export type CoreDayTicket = { code: string; attendeeName: string | null; day: number | null };

/** To the buyer of CORE tickets: pick the day of each, or change the one it has. */
export function coreDayLetter(i: { name: string; tickets: CoreDayTicket[]; unsubUrl: string }): Letter {
  const many = i.tickets.length > 1;
  const link = (c: string) => `${SITE}/bilet/${encodeURIComponent(c)}?utm_source=email&utm_campaign=core-day#den`;
  const now = (t: CoreDayTicket) => {
    const who = t.attendeeName ? `${t.code}, ${t.attendeeName}` : t.code;
    return `Билет ${who}: ${dayLabel(t.day) ? `сега е за ${dayLabel(t.day)}` : "още без избран ден"}`;
  };
  const lines = [
    `${hi(i.name)} ${many ? "Билетите ти CORE важат всеки за един от двата дни" : "Билетът ти CORE важи за един от двата дни"} на Sofia Life Summit: събота, 7 ноември, или неделя, 8 ноември. Програмата в двата дни е различна, затова избираш ти.`,
    `Можеш да избереш деня, или да смениш вече избрания, **безплатно до началото на събитието**. Става с едно натискане на страницата на билета, а QR кодът остава същият.`,
    `Ако денят, който имаш, ти е удобен, не е нужно да правиш нищо.`,
  ];
  return frame({
    subject: many ? "Избери или смени деня на билетите си за Sofia Life Summit" : "Избери или смени деня на билета си за Sofia Life Summit",
    bodyHtml:
      para(lines[0]) +
      para(lines[1]) +
      bullets(i.tickets.map(now)) +
      i.tickets.map((t) => button(many ? `Избери ден за ${t.code}` : "Избери или смени деня", link(t.code))).join("") +
      para(lines[2]),
    bodyText: [plain(lines[0]), "", plain(lines[1]), "", ...i.tickets.map((t) => `${now(t)}\n${link(t.code)}`), "", lines[2]],
    why: "Получаваш това писмо, защото имаш билет CORE за Sofia Life Summit.",
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
          `Събота и неделя са различни. С CORE избираш един ден; с PLUS си и в двата, с една работилница и едно специално преживяване по избор; PEAK добавя Premium Lounge и Meet & Greet с лекторите.`,
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
          `PEAK има още **${i.peakLeft} места**: Premium Lounge, Meet & Greet с лекторите, 3 работилници и 3 преживявания, goody bag на стойност 250 €+.`,
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
