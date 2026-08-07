import "server-only";

import { Resend } from "resend";

import { formatPrice } from "@/lib/tickets";

/**
 * Transactional email.
 *
 * Lazy like the other integrations, so a missing key never breaks a build —
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

export type TicketEmailInput = {
  to: string;
  buyerName: string;
  reference: string;
  totalCents: number;
  tickets: { code: string; tierName: string }[];
};

function ticketRows(input: TicketEmailInput): string {
  return input.tickets
    .map(
      (t) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #dfe4e0">
          <div style="font:600 15px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">
            ${t.tierName}
          </div>
          <div style="font:400 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f99;margin-top:2px">
            Код: <strong style="letter-spacing:1px">${t.code}</strong>
          </div>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid #dfe4e0">
          <a href="${SITE}/bilet/${t.code}"
             style="display:inline-block;background:#02251f;color:#f2f2ee;text-decoration:none;
                    font:600 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;
                    padding:11px 18px;border-radius:999px">Отвори билета</a>
        </td>
      </tr>`,
    )
    .join("");
}

/**
 * Plain HTML with inline styles on purpose — email clients strip stylesheets,
 * and Outlook ignores most modern layout. Tables and inline CSS are what
 * actually renders everywhere.
 */
function ticketEmailHtml(input: TicketEmailInput): string {
  return `<!doctype html>
<html lang="bg"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px">
    <tr><td>
      <div style="font:400 12px/1 -apple-system,Segoe UI,Roboto,sans-serif;
                  letter-spacing:2px;text-transform:uppercase;color:#14645599">
        Sofia Life Summit
      </div>
      <h1 style="margin:14px 0 0;font:800 26px/1.15 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f">
        Билетът ти е готов
      </h1>
      <p style="margin:14px 0 0;font:400 15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3">
        Здравей, ${input.buyerName}! Плащането е потвърдено. Отвори билета си
        по-долу и го запази — ще ти трябва на входа.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin-top:26px;border-top:1px solid #dfe4e0">
        ${ticketRows(input)}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr>
          <td style="font:400 14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3">
            <strong style="color:#02251f">07—08 ноември 2026</strong><br>
            Гранд Хотел Милениум, София
          </td>
          <td align="right" style="font:400 14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251fb3">
            Поръчка<br><strong style="color:#02251f">${input.reference}</strong><br>
            ${formatPrice(input.totalCents)} €
          </td>
        </tr>
      </table>

      <p style="margin:28px 0 0;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f80">
        Ако имаш въпрос, отговори на това писмо или пиши на hello@biohacking.bg.
        Sofia Life Summit се организира съвместно от Bulgarian Longevity
        Association и Biohacking.bg.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

function ticketEmailText(input: TicketEmailInput): string {
  const list = input.tickets
    .map((t) => `- ${t.tierName} · ${t.code}\n  ${SITE}/bilet/${t.code}`)
    .join("\n");

  return [
    `Здравей, ${input.buyerName}!`,
    "",
    "Плащането е потвърдено, билетът ти е готов.",
    "",
    list,
    "",
    "07—08 ноември 2026, Гранд Хотел Милениум, София",
    `Поръчка ${input.reference} · ${formatPrice(input.totalCents)} €`,
    "",
    "Въпроси: hello@biohacking.bg",
  ].join("\n");
}

export async function sendTicketEmail(input: TicketEmailInput): Promise<boolean> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;

  if (!resend || !from) {
    console.warn("[email] not configured — skipping ticket email");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: `Билетът ти за Sofia Life Summit · ${input.reference}`,
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
