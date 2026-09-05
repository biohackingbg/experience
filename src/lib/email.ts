import "server-only";

import { Resend } from "resend";

import { formatPrice } from "@/lib/tickets";

/**
 * Transactional email.
 *
 * Lazy like the other integrations, so a missing key never breaks a build -
 * and, more importantly, never breaks a *payment*. A failed confirmation email
 * must not fail the webhook: the money is taken and the ticket exists either
 * way, so send errors are logged and swallowed.
 */

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const SITE = "https://thelongevitysummit.eu";

/**
 * The buyer's name is attacker-controlled at checkout and lands inside HTML.
 * Normally that mail goes to the buyer (self-XSS at worst), but the admin
 * resend can deliver the same HTML to any address - without escaping, a €35
 * purchase becomes DKIM-signed phishing from our own domain.
 */
function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type TicketEmailInput = {
  to: string;
  buyerName: string;
  reference: string;
  totalCents: number;
  /** Absent only if numbering somehow failed; the email still sends. */
  invoiceNumber?: number | null;
  tickets: { code: string; tierName: string }[];
  /** The buyer's language; templates follow it where an English one exists. */
  lang?: "bg" | "en";
};

function ticketRows(input: TicketEmailInput, open = "Отвори билета", code = "Код"): string {
  return input.tickets
    .map(
      (t) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #dfe4e0">
          <div style="font:600 15px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">
            ${t.tierName}
          </div>
          <div style="font:400 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f99;margin-top:2px">
            ${code}: <strong style="letter-spacing:1px">${t.code}</strong>
          </div>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid #dfe4e0">
          <a href="${SITE}/bilet/${t.code}"
             style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;
                    font:600 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;
                    padding:11px 18px;border-radius:999px">${open}</a>
        </td>
      </tr>`,
    )
    .join("");
}

/**
 * Plain HTML with inline styles on purpose - email clients strip stylesheets,
 * and Outlook ignores most modern layout. Tables and inline CSS are what
 * actually renders everywhere.
 */
export function ticketEmailHtml(input: TicketEmailInput): string {
  const en = input.lang === "en";
  const w = en
    ? { lost: `Lost this email later? Get your tickets again: ${SITE}/bilet/moite?lang=en`, ready: "Your ticket is ready", hi: `Hi ${esc(input.buyerName)}! ${input.totalCents > 0 ? "Your payment is confirmed. " : ""}Open your ticket below and keep it - you will need it at the entrance.`, open: "Open ticket", code: "Code", dates: "7-8 November 2026", venue: "Grand Hotel Millennium, Sofia", order: "Order", invoice: "Invoice", noPay: "no payment", other: "Is a ticket for someone else? Open it and write their name - that is how we find them at the entrance and print their badge.", foot: "Questions? Reply to this email or write to hi@biohacking.bg. Sofia Life Summit is organised jointly by the Bulgarian Longevity Association and Biohacking.bg." }
    : { lost: `Изгуби писмото? Билетите се изпращат наново оттук: ${SITE}/bilet/moite`, ready: "Билетът ти е готов", hi: `Здравей, ${esc(input.buyerName)}! ${input.totalCents > 0 ? "Плащането е потвърдено. " : ""}Отвори билета си по-долу и го запази - ще ти трябва на входа.`, open: "Отвори билета", code: "Код", dates: "07-08 ноември 2026", venue: "Гранд Хотел Милениум, София", order: "Поръчка", invoice: "Фактура", noPay: "без заплащане", other: "Билет за друг човек? Отвори го и напиши името му - така ще го намерим на входа и баджът ще е с неговото име.", foot: "Ако имаш въпрос, отговори на това писмо или пиши на hi@biohacking.bg. Sofia Life Summit се организира съвместно от Bulgarian Longevity Association и Biohacking.bg." };
  return `<!doctype html>
<html lang="${en ? "en" : "bg"}"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px">
    <tr><td>
      <!-- Alt text carries the brand when images are blocked, which is the
           default in Outlook and for anyone who has turned them off. -->
      <img src="${SITE}/email-logo.png" width="200" height="54"
           alt="Biohacking Experience"
           style="display:block;border:0;outline:none;text-decoration:none;
                  width:200px;height:auto;margin:0 0 22px">
      <div style="font:400 12px/1 -apple-system,Segoe UI,Roboto,sans-serif;
                  letter-spacing:2px;text-transform:uppercase;color:#14645599">
        Sofia Life Summit
      </div>
      <h1 style="margin:14px 0 0;font:800 26px/1.15 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">
        ${w.ready}
      </h1>
      <p style="margin:14px 0 0;font:400 15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3">
        ${w.hi}
      </p>

      <div style="margin-top:26px;height:3px;background:#cef870;border-radius:2px"></div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin-top:6px;border-top:1px solid #dfe4e0">
        ${ticketRows(input, w.open, w.code)}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr>
          <td style="font:400 14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3">
            <strong style="color:#02251f">${w.dates}</strong><br>
            ${w.venue}
          </td>
          <td align="right" style="font:400 14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3">
            ${w.order}<br><strong style="color:#02251f">${input.reference}</strong><br>
            ${input.totalCents > 0 ? `${formatPrice(input.totalCents)} €` : w.noPay}${
              input.invoiceNumber
                ? `<br><a href="${SITE}/faktura/${input.reference}"
                       style="color:#146455;font-weight:600;text-decoration:underline">${w.invoice}</a>`
                : ""
            }
          </td>
        </tr>
      </table>

      <p style="margin:22px 0 0;font:400 13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3">
        ${w.other}
      </p>

      <p style="margin:24px 0 0;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f80">
        ${w.lost}<br><br>${w.foot}
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export function ticketEmailText(input: TicketEmailInput): string {
  const list = input.tickets
    .map((t) => `- ${t.tierName} · ${t.code}\n  ${SITE}/bilet/${t.code}`)
    .join("\n");
  if (input.lang === "en") {
    return [
      `Hi ${input.buyerName}!`,
      "",
      input.totalCents > 0 ? "Your payment is confirmed, your ticket is ready." : "Your ticket is ready.",
      "",
      list,
      "",
      "7-8 November 2026, Grand Hotel Millennium, Sofia",
      `Order ${input.reference} · ${input.totalCents > 0 ? `€${formatPrice(input.totalCents)}` : "no payment"}`,
      ...(input.invoiceNumber ? [`Invoice: ${SITE}/faktura/${input.reference}`] : []),
      "",
      "Is a ticket for someone else? Open it and write their name - that is how we find them at the entrance.",
      "",
      "Questions: hi@biohacking.bg",
    ].join("\n");
  }

  return [
    `Здравей, ${esc(input.buyerName)}!`,
    "",
    input.totalCents > 0 ? "Плащането е потвърдено, билетът ти е готов." : "Билетът ти е готов.",
    "",
    list,
    "",
    "07-08 ноември 2026, Гранд Хотел Милениум, София",
    `Поръчка ${input.reference} · ${formatPrice(input.totalCents)} €`,
    ...(input.invoiceNumber ? [`Фактура: ${SITE}/faktura/${input.reference}`] : []),
    "",
    "Билет за друг човек? Отвори го и напиши името му - така ще го намерим на входа.",
    "",
    "Въпроси: hi@biohacking.bg",
  ].join("\n");
}

export async function sendTicketEmail(input: TicketEmailInput): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;

  if (!resend || !from) {
    console.warn("[email] not configured - skipping ticket email");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.lang === "en" ? `Your Sofia Life Summit ticket · ${input.reference}` : `Билетът ти за Sofia Life Summit · ${input.reference}`,
      html: ticketEmailHtml(input),
      text: ticketEmailText(input),
    });

    if (error) {
      console.error("[email] send failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send threw:", error);
    return false;
  }
}

export type ReminderEmailInput = {
  to: string;
  buyerName: string;
  reference: string;
  /** "2× Plus" */
  items: string;
  /** Where "finish the order" lands: the checkout with their tier picked. */
  resumePath: string;
  /** "стартовите цени за първите 200 билета", or null when nothing is discounted. */
  offer: string | null;
  lang?: "bg" | "en";
};

/**
 * The one follow-up to an abandoned checkout. Says plainly that nothing was
 * charged and nothing is held, offers the door, and promises not to write
 * again - which the reminder_sent_at column then enforces.
 */
export function reminderEmailHtml(input: ReminderEmailInput): string {
  const p = `font:400 15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3`;
  if (input.lang === "en") {
    return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px"><tr><td>
      <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience" style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;margin:0 0 22px">
      <div style="font:400 12px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit</div>
      <h1 style="margin:14px 0 0;font:800 26px/1.15 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">Your order was left unfinished</h1>
      <p style="margin:14px 0 0;${p}">Hi ${esc(input.buyerName)}! You started an order for <strong style="color:#02251f">${esc(input.items)}</strong> for Sofia Life Summit, but the payment was not completed. Nothing was charged and no seat is held.</p>
      <p style="margin:14px 0 0;${p}">If you still want to be there on 7-8 November, finish the order here${input.offer ? ` - ${esc(input.offer)} still apply` : ""}:</p>
      <p style="margin:22px 0 0"><a href="${SITE}${input.resumePath}${input.resumePath.includes("?") ? "&" : "?"}lang=en" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px 22px;border-radius:999px">Finish the order</a></p>
      <div style="margin-top:26px;height:3px;background:#cef870;border-radius:2px"></div>
      <p style="margin:22px 0 0;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f80">If you no longer want a ticket, this is the only reminder you will get. Questions: reply to this email or write to hi@biohacking.bg. Order ${input.reference}.</p>
  </td></tr></table></body></html>`;
  }
  return `<!doctype html>
<html lang="bg"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px">
    <tr><td>
      <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience"
           style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;margin:0 0 22px">
      <div style="font:400 12px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#14645599">
        Sofia Life Summit
      </div>
      <h1 style="margin:14px 0 0;font:800 26px/1.15 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">
        Поръчката ти остана недовършена
      </h1>
      <p style="margin:14px 0 0;${p}">
        Здравей, ${esc(input.buyerName)}! Започна поръчка за
        <strong style="color:#02251f">${esc(input.items)}</strong> за Sofia Life Summit,
        но плащането не беше завършено. Нищо не е таксувано и място не е запазено.
      </p>
      <p style="margin:14px 0 0;${p}">
        Ако все още искаш да си там на 07-08 ноември, довърши поръчката оттук${
          input.offer ? ` - ${input.offer} още важат` : ""
        }:
      </p>
      <p style="margin:22px 0 0">
        <a href="${SITE}${input.resumePath}"
           style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;
                  font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px 22px;border-radius:999px">
          Довърши поръчката
        </a>
      </p>
      <div style="margin-top:26px;height:3px;background:#cef870;border-radius:2px"></div>
      <p style="margin:22px 0 0;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f80">
        Ако вече не искаш билет, това е единственото напомняне, което ще получиш.
        Въпроси: отговори на това писмо или пиши на hi@biohacking.bg.
        Поръчка ${input.reference}.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export function reminderEmailText(input: ReminderEmailInput): string {
  if (input.lang === "en") {
    return [
      `Hi ${input.buyerName}!`,
      "",
      `You started an order for ${input.items} for Sofia Life Summit, but the payment was not completed.`,
      "Nothing was charged and no seat is held.",
      "",
      `If you still want to be there on 7-8 November, finish the order here${input.offer ? ` (${input.offer} still apply)` : ""}:`,
      `${SITE}${input.resumePath}${input.resumePath.includes("?") ? "&" : "?"}lang=en`,
      "",
      "If you no longer want a ticket, this is the only reminder you will get.",
      `Questions: hi@biohacking.bg · Order ${input.reference}`,
    ].join("\n");
  }
  return [
    `Здравей, ${input.buyerName}!`,
    "",
    `Започна поръчка за ${input.items} за Sofia Life Summit, но плащането не беше завършено.`,
    "Нищо не е таксувано и място не е запазено.",
    "",
    `Ако все още искаш да си там на 07-08 ноември, довърши поръчката оттук${
      input.offer ? ` (${input.offer} още важат)` : ""
    }:`,
    `${SITE}${input.resumePath}`,
    "",
    "Ако вече не искаш билет, това е единственото напомняне, което ще получиш.",
    `Въпроси: hi@biohacking.bg · Поръчка ${input.reference}`,
  ].join("\n");
}

/** Resolves to Resend's id for the message (the key for its later events), or null if it did not go. */
export async function sendReminderEmail(input: ReminderEmailInput): Promise<string | null> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) {
    console.warn("[email] not configured - skipping reminder email");
    return null;
  }
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.lang === "en" ? `Your Sofia Life Summit ticket is waiting · ${input.reference}` : `Билетът ти за Sofia Life Summit чака · ${input.reference}`,
      html: reminderEmailHtml(input),
      text: reminderEmailText(input),
    });
    if (error) {
      console.error("[email] reminder send failed:", error);
      return null;
    }
    return data?.id ?? "";
  } catch (error) {
    console.error("[email] reminder send threw:", error);
    return null;
  }
}

export type EventInfoInput = {
  to: string;
  buyerName: string;
  reference: string;
  daysLeft: number;
  tickets: { code: string; tierName: string; attendeeName: string | null }[];
  lang?: "bg" | "en";
};

const VENUE_MAPS = "https://maps.google.com/?q=Grand+Hotel+Millennium+Sofia";

/**
 * The "see you next week" mail: where, when, the tickets again, and the one
 * ask that saves the door queue - name the person on each ticket. Sent to
 * every buyer once, by hand, from the admin.
 */
export function eventInfoHtml(input: EventInfoInput): string {
  const f = "-apple-system,Segoe UI,Roboto,sans-serif";
  const p = `font:400 15px/1.6 ${f};color:#02251fb3`;
  const en = input.lang === "en";
  const w = en
    ? { title: `See you in ${input.daysLeft} ${input.daysLeft === 1 ? "day" : "days"}`, hi: `Hi ${esc(input.buyerName)}! Everything you need for the day.`, when: "When", whenV: "<strong style=\"color:#02251f\">7-8 November 2026</strong><br>Registration opens at 09:00, the programme starts at 10:00.", where: "Where", whereV: `<strong style="color:#02251f">Grand Hotel Millennium</strong><br>89B Vitosha Blvd, Sofia · <a href="${VENUE_MAPS}" style="color:#146455;font-weight:600">map</a>`, prog: "Programme", progV: `<a href="${SITE}/programa" style="color:#146455;font-weight:600">Speakers and the programme by the hour</a>`, tickets: "Your tickets", show: "Show the QR code at the entrance - on your phone or printed. One ticket admits one person.", noName: "no attendee name", open: "Open ticket", other: "Is a ticket for someone else? Open it and write their name - that is how we find them at the entrance and print their badge.", foot: `Questions? Reply to this email or write to hi@biohacking.bg. Order ${input.reference}. Sofia Life Summit is organised jointly by the Bulgarian Longevity Association and Biohacking.bg.` }
    : { title: `Виждаме се след ${input.daysLeft} ${input.daysLeft === 1 ? "ден" : "дни"}`, hi: `Здравей, ${esc(input.buyerName)}! Ето всичко, което ти трябва за деня.`, when: "Кога", whenV: "<strong style=\"color:#02251f\">07-08 ноември 2026</strong><br>Регистрацията отваря в 09:00, програмата започва в 10:00.", where: "Къде", whereV: `<strong style="color:#02251f">Гранд Хотел Милениум</strong><br>бул. „Витоша“ 89Б, София · <a href="${VENUE_MAPS}" style="color:#146455;font-weight:600">карта</a>`, prog: "Програма", progV: `<a href="${SITE}/#program" style="color:#146455;font-weight:600">Лектори и програма по часове</a>`, tickets: "Билетите ти", show: "Покажи QR кода на входа - от телефона или разпечатан. Всеки билет е за един човек.", noName: "без име на участник", open: "Отвори билета", other: "Билет за друг човек? Отвори го и напиши името му - така ще го намерим на входа и баджът ще е с неговото име.", foot: `Въпроси: отговори на това писмо или пиши на hi@biohacking.bg. Поръчка ${input.reference}. Sofia Life Summit се организира съвместно от Bulgarian Longevity Association и Biohacking.bg.` };
  const rows = input.tickets
    .map(
      (t) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #dfe4e0">
          <div style="font:600 15px/1.3 ${f};color:#02251f">${t.tierName}${t.attendeeName ? ` · ${esc(t.attendeeName)}` : ""}</div>
          <div style="font:400 13px/1.4 ${f};color:#02251f99;margin-top:2px">${en ? "Code" : "Код"}: <strong style="letter-spacing:1px">${t.code}</strong>${t.attendeeName ? "" : ` · ${w.noName}`}</div>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #dfe4e0">
          <a href="${SITE}/bilet/${t.code}" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;font:600 13px/1 ${f};padding:11px 18px;border-radius:999px">${w.open}</a>
        </td>
      </tr>`,
    )
    .join("");
  return `<!doctype html>
<html lang="${en ? "en" : "bg"}"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px">
    <tr><td>
      <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience"
           style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;margin:0 0 22px">
      <div style="font:400 12px/1 ${f};letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit</div>
      <h1 style="margin:14px 0 0;font:800 26px/1.15 ${f};color:#02251f">${w.title}</h1>
      <p style="margin:14px 0 0;${p}">${w.hi}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px">
        <tr>
          <td style="padding:12px 0;border-top:1px solid #dfe4e0;font:600 13px/1.4 ${f};color:#02251f;white-space:nowrap;vertical-align:top;width:90px">${w.when}</td>
          <td style="padding:12px 0;border-top:1px solid #dfe4e0;${p}">${w.whenV}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #dfe4e0;font:600 13px/1.4 ${f};color:#02251f;vertical-align:top">${w.where}</td>
          <td style="padding:12px 0;border-top:1px solid #dfe4e0;${p}">${w.whereV}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #dfe4e0;font:600 13px/1.4 ${f};color:#02251f;vertical-align:top">${w.prog}</td>
          <td style="padding:12px 0;border-top:1px solid #dfe4e0;${p}">${w.progV}</td>
        </tr>
      </table>

      <h2 style="margin:26px 0 4px;font:700 17px/1.3 ${f};color:#02251f">${w.tickets}</h2>
      <p style="margin:0;font:400 13px/1.5 ${f};color:#02251f99">${w.show}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">${rows}</table>

      <p style="margin:18px 0 0;${p}">
        ${w.other}
      </p>

      <div style="margin-top:26px;height:3px;background:#cef870;border-radius:2px"></div>
      <p style="margin:22px 0 0;font:400 12px/1.6 ${f};color:#02251f80">
        ${w.foot}
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export function eventInfoText(input: EventInfoInput): string {
  if (input.lang === "en") {
    return [
      `Hi ${input.buyerName}! See you in ${input.daysLeft} ${input.daysLeft === 1 ? "day" : "days"} at Sofia Life Summit.`,
      "",
      "WHEN: 7-8 November 2026. Registration opens at 09:00, the programme starts at 10:00.",
      `WHERE: Grand Hotel Millennium, 89B Vitosha Blvd, Sofia · ${VENUE_MAPS}`,
      `PROGRAMME: ${SITE}/programa`,
      "",
      "YOUR TICKETS (show the QR code at the entrance, on your phone or printed; one ticket admits one person):",
      ...input.tickets.map((t) => `- ${t.tierName}${t.attendeeName ? ` · ${t.attendeeName}` : ""} · ${t.code}\n  ${SITE}/bilet/${t.code}`),
      "",
      "Is a ticket for someone else? Open it and write their name - that is how we find them at the entrance.",
      "",
      `Questions: hi@biohacking.bg · Order ${input.reference}`,
    ].join("\n");
  }
  return [
    `Здравей, ${input.buyerName}! Виждаме се след ${input.daysLeft} ${input.daysLeft === 1 ? "ден" : "дни"} на Sofia Life Summit.`,
    "",
    "КОГА: 07-08 ноември 2026. Регистрацията отваря в 09:00, програмата започва в 10:00.",
    `КЪДЕ: Гранд Хотел Милениум, бул. „Витоша“ 89Б, София · ${VENUE_MAPS}`,
    `ПРОГРАМА: ${SITE}/#program`,
    "",
    "БИЛЕТИТЕ ТИ (покажи QR кода на входа, от телефона или разпечатан; всеки билет е за един човек):",
    ...input.tickets.map(
      (t) => `- ${t.tierName}${t.attendeeName ? ` · ${t.attendeeName}` : ""} · ${t.code}\n  ${SITE}/bilet/${t.code}`,
    ),
    "",
    "Билет за друг човек? Отвори го и напиши името му - така ще го намерим на входа.",
    "",
    `Въпроси: hi@biohacking.bg · Поръчка ${input.reference}`,
  ].join("\n");
}

export function eventInfoSubject(daysLeft: number, lang: "bg" | "en" = "bg"): string {
  if (lang === "en") return `Sofia Life Summit is in ${daysLeft} ${daysLeft === 1 ? "day" : "days"} · venue, time and your tickets`;
  return `Sofia Life Summit е след ${daysLeft} ${daysLeft === 1 ? "ден" : "дни"} · адрес, час и билетите ти`;
}

/**
 * Sends the event mail to up to 100 buyers in one API call and reports
 * which references went. Resend's batch endpoint accepts or refuses the
 * whole batch, so a failure here marks nobody as sent and the batch is
 * simply tried again.
 */
export async function sendEventInfoBatch(inputs: EventInfoInput[]): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) return { ok: false, error: "not configured" };
  if (inputs.length === 0) return { ok: true };
  try {
    const { error } = await resend.batch.send(
      inputs.map((input) => ({
        from,
        to: input.to,
        subject: eventInfoSubject(input.daysLeft, input.lang),
        html: eventInfoHtml(input),
        text: eventInfoText(input),
      })),
    );
    if (error) {
      console.error("[email] event info batch failed:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error("[email] event info batch threw:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export type ProformaEmailInput = {
  to: string;
  buyerName: string;
  reference: string;
  totalCents: number;
  items: string;
  dueAt: Date;
  bank: { holder: string; iban: string; bic: string; bank: string };
  lang?: "bg" | "en";
};

/** A bank-transfer order: what to pay, where, until when, and the proforma to attach to the transfer. */
export async function sendProformaEmail(input: ProformaEmailInput): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) return false;
  const f = "-apple-system,Segoe UI,Roboto,sans-serif";
  const due = input.dueAt.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" });
  const row = (k: string, v: string) => `<tr><td style="padding:8px 12px 8px 0;font:600 13px/1.4 ${f};color:#02251f;white-space:nowrap">${k}</td><td style="padding:8px 0;font:400 14px/1.5 ${f};color:#02251f">${v}</td></tr>`;
  const en = input.lang === "en";
  const html = `<!doctype html><html lang="${en ? "en" : "bg"}"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px"><tr><td>
    <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience" style="display:block;border:0;width:200px;height:auto;margin:0 0 22px">
    <div style="font:400 12px/1 ${f};letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit</div>
    <h1 style="margin:14px 0 0;font:800 26px/1.15 ${f};color:#02251f">${en ? "Proforma invoice for" : "Проформа за"} ${esc(input.items)}</h1>
    <p style="margin:14px 0 0;font:400 15px/1.6 ${f};color:#02251fb3">${en ? `Hi ${esc(input.buyerName)}! Your seats are held until <strong style="color:#02251f">${due}</strong>. Once the transfer arrives we send the invoice and the tickets to this address.` : `Здравей, ${esc(input.buyerName)}! Местата са запазени до <strong style="color:#02251f">${due}</strong>. След като преводът пристигне, изпращаме фактурата и билетите на този адрес.`}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:1px solid #dfe4e0;border-bottom:1px solid #dfe4e0;width:100%">
      ${row(en ? "Amount" : "Сума", `${formatPrice(input.totalCents)} € ${en ? "incl. VAT" : "с ДДС"}`)}
      ${row(en ? "Beneficiary" : "Получател", esc(input.bank.holder || "-"))}
      ${row("IBAN", esc(input.bank.iban || "-"))}
      ${row("BIC", esc(input.bank.bic || "-"))}
      ${row(en ? "Bank" : "Банка", esc(input.bank.bank || "-"))}
      ${row(en ? "Reference" : "Основание", `Sofia Life Summit · ${input.reference}`)}
    </table>
    <p style="margin:22px 0 0"><a href="${SITE}/proforma/${input.reference}" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;font:600 14px/1 ${f};padding:14px 22px;border-radius:999px">${en ? "Open the proforma" : "Отвори проформата"}</a></p>
    <p style="margin:22px 0 0;font:400 12px/1.6 ${f};color:#02251f80">${en ? "Questions? Reply to this email or write to hi@biohacking.bg." : "Въпроси: отговори на това писмо или пиши на hi@biohacking.bg."}</p>
  </td></tr></table></body></html>`;
  const text = [
    `Здравей, ${input.buyerName}! Проформа за ${input.items} - Sofia Life Summit.`,
    `Местата са запазени до ${due}. След превода изпращаме фактурата и билетите.`,
    "",
    `Сума: ${formatPrice(input.totalCents)} € с ДДС`,
    `Получател: ${input.bank.holder || "-"}`,
    `IBAN: ${input.bank.iban || "-"} · BIC: ${input.bank.bic || "-"} · ${input.bank.bank || "-"}`,
    `Основание: Sofia Life Summit · ${input.reference}`,
    "",
    `Проформа: ${SITE}/proforma/${input.reference}`,
    "Въпроси: hi@biohacking.bg",
  ].join("\n");
  try {
    const { error } = await resend.emails.send({ from, to: input.to, subject: en ? `Proforma invoice for Sofia Life Summit tickets · ${input.reference}` : `Проформа за билети Sofia Life Summit · ${input.reference}`, html, text });
    if (error) {
      console.error("[email] proforma send failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] proforma send threw:", error);
    return false;
  }
}

/** "A seat freed up" to someone on the waiting list. One line, one link, no pressure. */
export async function sendWaitlistEmail(input: { to: string; tierName: string; tierId: string; left: number }): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) return false;
  const f = "-apple-system,Segoe UI,Roboto,sans-serif";
  const link = `${SITE}/bilet?nivo=${input.tierId}`;
  const html = `<!doctype html><html lang="bg"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px"><tr><td>
    <img src="${SITE}/email-logo.png" width="200" height="54" alt="Biohacking Experience" style="display:block;border:0;width:200px;height:auto;margin:0 0 22px">
    <div style="font:400 12px/1 ${f};letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit</div>
    <h1 style="margin:14px 0 0;font:800 26px/1.15 ${f};color:#02251f">Освободи се място от ${input.tierName}</h1>
    <p style="margin:14px 0 0;font:400 15px/1.6 ${f};color:#02251fb3">Записа се да ти пишем, ако се освободи място от това ниво. Освободиха се ${input.left === 1 ? "едно място" : `${input.left} места`} - първите, които купят, ги вземат.</p>
    <p style="margin:22px 0 0"><a href="${link}" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;font:600 14px/1 ${f};padding:14px 22px;border-radius:999px">Купи билет ${input.tierName}</a></p>
    <p style="margin:22px 0 0;font:400 12px/1.6 ${f};color:#02251f80">Пишем ти само този път. Ако мястото вече е заето, когато отвориш, съжаляваме - и благодарим за интереса. Въпроси: hi@biohacking.bg.</p>
  </td></tr></table></body></html>`;
  const text = [
    `Освободи се място от ${input.tierName} на Sofia Life Summit.`,
    `Записа се да ти пишем, ако се освободи място. Освободиха се ${input.left} - първите, които купят, ги вземат.`,
    "",
    link,
    "",
    "Пишем ти само този път. Въпроси: hi@biohacking.bg",
  ].join("\n");
  try {
    const { error } = await resend.emails.send({ from, to: input.to, subject: `Освободи се място от ${input.tierName} · Sofia Life Summit`, html, text });
    return !error;
  } catch {
    return false;
  }
}

/** One line to the team when money lands. Deliberately plain: it is a nudge, not a report. */
export async function sendSaleAlert(input: {
  reference: string;
  buyerName: string;
  items: string;
  totalCents: number;
  method: "card" | "bank" | "admin";
  soldTotal: number;
  capacity: number;
}): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  const to = process.env.SALES_ALERT_EMAIL ?? process.env.DIGEST_EMAIL ?? "hi@biohacking.bg";
  if (!resend || !from) return false;
  const how = input.method === "card" ? "с карта" : input.method === "bank" ? "по банков път" : "издаден от екипа";
  const money = input.totalCents > 0 ? `${formatPrice(input.totalCents)} €` : "безплатен";
  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Продажба: ${input.items} · ${money}`,
      text: [
        `${input.items} за ${input.buyerName} - ${money} (${how}).`,
        `Поръчка ${input.reference}.`,
        "",
        `Продадени общо: ${input.soldTotal} от ${input.capacity}.`,
        "https://thelongevitysummit.eu/admin",
      ].join("\n"),
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Mail to the organisers themselves - the daily digest. Goes to the team
 * address unless DIGEST_EMAIL says otherwise, so it works without any new
 * configuration on Vercel.
 */
export async function sendDigestEmail(input: { subject: string; text: string; html: string }): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  const to = process.env.DIGEST_EMAIL ?? "hi@biohacking.bg";
  if (!resend || !from) {
    console.warn("[email] digest not configured - skipping");
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from, to, ...input });
    if (error) {
      console.error("[email] digest send failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] digest send threw:", error);
    return false;
  }
}

/**
 * Plain-text alert to the operators - the health check's voice. Deliberately
 * unstyled: it is an alarm, not a newsletter.
 */
export async function sendAlertEmail(subject: string, body: string): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  const to = process.env.HEALTH_ALERT_EMAIL;

  if (!resend || !from || !to) {
    console.warn("[email] alert not configured - skipping");
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from, to, subject, text: body });
    if (error) {
      console.error("[email] alert send failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] alert send threw:", error);
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Letters to a list
 * ------------------------------------------------------------------ */

export type ListMailInput = {
  to: string;
  name: string | null;
  subject: string;
  /** Plain text as typed in the admin; blank lines separate paragraphs. */
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

/** Line breaks the way people type them, escaped, as paragraphs. */
function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font:400 15px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">${esc(p).replaceAll("\n", "<br>")}</p>`,
    )
    .join("");
}

export function listMailHtml(input: ListMailInput, unsubUrl: string): string {
  const hi = input.name ? `<p style="margin:0 0 16px;font:600 15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">Здравей, ${esc(input.name)},</p>` : "";
  const cta =
    input.ctaUrl && input.ctaLabel
      ? `<p style="margin:24px 0 0">
           <a href="${esc(input.ctaUrl)}" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;
              font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px 22px;border-radius:999px">${esc(input.ctaLabel)}</a>
         </p>`
      : "";
  return `<!doctype html><html lang="bg"><body style="margin:0;background:#f1f5f3;padding:28px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px">
    <tr><td>
      <div style="font:700 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit</div>
      <h1 style="margin:12px 0 20px;font:800 22px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">${esc(input.subject)}</h1>
      ${hi}
      ${paragraphs(input.body)}
      ${cta}
      <p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #dfe4e0;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f80">
        07-08 ноември 2026 · Гранд Хотел Милениум, София · <a href="${SITE}" style="color:#146455">thelongevitysummit.eu</a><br>
        Получаваш това писмо, защото си оставил имейл за новини около Sofia Life Summit.
        <a href="${esc(unsubUrl)}" style="color:#02251f80">Отпиши се</a>.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export function listMailText(input: ListMailInput, unsubUrl: string): string {
  return [
    input.name ? `Здравей, ${input.name},` : "",
    "",
    input.body.trim(),
    input.ctaUrl && input.ctaLabel ? `\n${input.ctaLabel}: ${input.ctaUrl}` : "",
    "",
    "07-08 ноември 2026 · Гранд Хотел Милениум, София",
    SITE,
    `Отписване: ${unsubUrl}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * One batch of up to a hundred, Resend's limit. Each letter carries its own
 * unsubscribe link, and the List-Unsubscribe header lets Gmail show its own
 * button - which keeps complaints off the spam report.
 */
export async function sendListMailBatch(inputs: ListMailInput[]): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) return { ok: false, error: "Пощата не е настроена." };
  if (inputs.length === 0) return { ok: true };
  const { unsubscribeUrl, unsubscribePostUrl } = await import("@/lib/unsubscribe");
  try {
    const { error } = await resend.batch.send(
      inputs.map((input) => {
        const unsub = unsubscribeUrl(input.to);
        return {
          from,
          to: input.to,
          subject: input.subject,
          html: listMailHtml(input, unsub),
          text: listMailText(input, unsub),
          headers: {
            "List-Unsubscribe": `<${unsubscribePostUrl(input.to)}>, <${unsub}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      }),
    );
    if (error) {
      console.error("[email] list mail batch failed:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error("[email] list mail batch threw:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/* ------------------------------------------------------------------ *
 * The sign-in link for someone with page access
 * ------------------------------------------------------------------ */

export type AccessLinkInput = { to: string; label: string; link: string; pages: string[] };

/**
 * Half an hour of validity, and the letter says so - a sign-in link that
 * looks permanent invites people to keep it in a bookmark, which is exactly
 * what tying access to an address is meant to stop.
 */
export async function sendAccessLinkEmail(input: AccessLinkInput): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) return false;
  const pages = input.pages.map((p) => `<li style="margin:2px 0">${esc(p)}</li>`).join("");
  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: "Вход към администрацията на Sofia Life Summit",
      html: `<!doctype html><html lang="bg"><body style="margin:0;background:#f1f5f3;padding:28px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px">
    <tr><td>
      <div style="font:700 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit</div>
      <h1 style="margin:12px 0 16px;font:800 20px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">Вход за ${esc(input.label)}</h1>
      <p style="margin:0 0 20px;font:400 15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">
        Натисни бутона, за да влезеш. Връзката важи 30 минути и е само за този имейл.
      </p>
      <p style="margin:0 0 24px">
        <a href="${esc(input.link)}" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;
           font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px 22px;border-radius:999px">Влез</a>
      </p>
      <p style="margin:0 0 6px;font:600 13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">Отваря:</p>
      <ul style="margin:0 0 20px;padding-left:18px;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f99">${pages}</ul>
      <p style="margin:0;padding-top:16px;border-top:1px solid #dfe4e0;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f80">
        Ако не си искал(а) вход, просто изтрий това писмо - никой не е влязъл.
      </p>
    </td></tr>
  </table>
</body></html>`,
      text: [
        `Вход за ${input.label}`,
        "",
        "Връзката важи 30 минути и е само за този имейл:",
        input.link,
        "",
        `Отваря: ${input.pages.join(", ")}`,
        "",
        "Ако не си искал(а) вход, изтрий това писмо.",
      ].join("\n"),
    });
    if (error) {
      console.error("[email] access link failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] access link threw:", error);
    return false;
  }
}
