import "server-only";

import { createHash, createSign } from "node:crypto";

import { GOOGLE_CLASS_ID, GOOGLE_ISSUER_ID } from "@/lib/google-wallet-class";
import { dayLabel } from "@/lib/tickets";
import type { TicketView } from "@/lib/tickets-lookup";

/**
 * The ticket as a "Save to Google Wallet" link.
 *
 * Nothing is stored at Google ahead of time except the class (see
 * google-wallet-class.ts): the link carries a signed token holding this one
 * ticket, and Google creates the pass when the person taps it. The QR is the
 * ticket code, as on the page and in Apple Wallet, so the door scanner does
 * not know which one it is reading.
 *
 * Inert until the issuer and the service-account key are in the environment,
 * so a site without them simply has no Google Wallet button.
 */
const SITE = "https://thelongevitysummit.eu";

const serviceEmail = () => process.env.GOOGLE_WALLET_SA_EMAIL?.trim() || null;
const privateKey = () => {
  const raw = process.env.GOOGLE_WALLET_SA_KEY_B64?.trim();
  return raw ? Buffer.from(raw, "base64").toString("utf8") : null;
};

export function googleWalletConfigured(): boolean {
  return Boolean(GOOGLE_ISSUER_ID && serviceEmail() && privateKey());
}

const b64url = (v: Buffer | string) => Buffer.from(v).toString("base64url");

const COPY = {
  bg: { bothDays: "двата дни", page: "Страница на билета" },
  en: { bothDays: "both days", page: "Ticket page" },
} as const;

export function googleWalletUrl(ticket: TicketView): string {
  const email = serviceEmail();
  const key = privateKey();
  if (!email || !key) throw new Error("Google Wallet is not configured");

  const t = COPY[ticket.lang];
  const name = ticket.attendeeName ?? ticket.buyerName;
  const day = dayLabel(ticket.day, ticket.lang) ?? t.bothDays;

  // A pass already in someone's Wallet cannot be changed by a new link with
  // the same id. The id carries a short fingerprint of what is printed on it,
  // so a ticket whose name or day changed gets a fresh pass - the old one
  // keeps the same QR and still scans.
  const version = createHash("sha1").update(`${name}|${day}|${ticket.tierName}`).digest("hex").slice(0, 6);
  const objectId = `${GOOGLE_ISSUER_ID}.${ticket.code.replace(/[^A-Za-z0-9_-]/g, "_")}_${version}`;

  const loc = (value: string) => ({ defaultValue: { language: ticket.lang, value } });
  const object = {
    id: objectId,
    classId: GOOGLE_CLASS_ID,
    state: "ACTIVE",
    barcode: { type: "QR_CODE", value: ticket.code, alternateText: ticket.code },
    ticketHolderName: name,
    ticketType: loc(ticket.tierName),
    linksModuleData: { uris: [{ id: "page", uri: `${SITE}/bilet/${ticket.code}`, description: t.page }] },
  };

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({
      iss: email,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins: [SITE],
      payload: { eventTicketObjects: [object] },
    }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${body}`).sign(key).toString("base64url");
  return `https://pay.google.com/gp/v/save/${header}.${body}.${signature}`;
}
