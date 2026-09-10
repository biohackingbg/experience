import "server-only";

import { PKPass } from "passkit-generator";

import type { TicketView } from "@/lib/tickets-lookup";
import { dayLabel } from "@/lib/tickets";
import { WALLET_IMAGES } from "@/lib/wallet-images";

/**
 * The ticket as an Apple Wallet pass.
 *
 * The QR carries the same code as the ticket page, so the scanner at the door
 * does not know or care which one it is looking at. Everything a person needs
 * on the day is on the front; the back holds what they need before it.
 *
 * Inert until the signing material exists in the environment, so a site
 * without a certificate simply has no Wallet button.
 */
export const PASS_TYPE_ID = "pass.eu.thelongevitysummit.ticket";
export const TEAM_ID = "N8287WDCJT";

const SITE = "https://thelongevitysummit.eu";

/** Grand Hotel Millennium, Sofia - close enough for the pass to surface on arrival. */
const VENUE = { latitude: 42.6799, longitude: 23.3176 };

const pem = (name: string) => {
  const raw = process.env[name]?.trim();
  return raw ? Buffer.from(raw, "base64").toString("utf8") : null;
};

export function walletConfigured(): boolean {
  return Boolean(pem("APPLE_PASS_CERT_B64") && pem("APPLE_PASS_KEY_B64") && pem("APPLE_WWDR_B64"));
}

const COPY = {
  bg: {
    description: "Билет за Sofia Life Summit 2026",
    date: "ДАТА",
    dateValue: "7–8 ноември",
    attendee: "УЧАСТНИК",
    tier: "НИВО",
    where: "КЪДЕ",
    // Short on purpose: the front truncates at about fifteen characters; the
    // full name and the street are on the back.
    venue: "Хотел Милениум",
    codeLabel: "Код на билета",
    addressLabel: "Адрес",
    address: "Гранд Хотел Милениум, бул. Витоша 89В, София",
    whenLabel: "Кога",
    when: "Събота и неделя, 7–8 ноември 2026. Регистрацията отваря в 8:30.",
    nameLabel: "Име на участника",
    nameHint: "Показваме името от поръчката. Ако билетът е за друг човек, отвори страницата на билета, напиши името му и добави билета в Wallet отново - така ще го намерим на входа и баджът ще е с неговото име.",
    orderLabel: "Поръчка",
    pageLabel: "Страница на билета",
    helpLabel: "Въпроси",
    help: "hi@biohacking.bg",
    rulesLabel: "Правила",
    rules: "Билетът важи за един човек и се проверява на входа по QR кода. Не го споделяй - при второ сканиране на същия код входът е отказан.",
    relevant: "Sofia Life Summit - билетът ти е тук",
  },
  en: {
    description: "Sofia Life Summit 2026 ticket",
    date: "DATE",
    dateValue: "7–8 November",
    attendee: "ATTENDEE",
    tier: "TIER",
    where: "WHERE",
    venue: "Hotel Millennium",
    codeLabel: "Ticket code",
    addressLabel: "Address",
    address: "Grand Hotel Millennium, 89B Vitosha Blvd, Sofia",
    whenLabel: "When",
    when: "Saturday and Sunday, 7–8 November 2026. Registration opens at 8:30.",
    nameLabel: "Attendee name",
    nameHint: "This is the name on the order. If the ticket is for someone else, open the ticket page, write their name and add the ticket to Wallet again - that is how we find them at the entrance and print their badge.",
    orderLabel: "Order",
    pageLabel: "Ticket page",
    helpLabel: "Questions",
    help: "hi@biohacking.bg",
    rulesLabel: "Rules",
    rules: "One ticket admits one person and is checked at the entrance by its QR code. Do not share it - a second scan of the same code is refused.",
    relevant: "Sofia Life Summit - your ticket is here",
  },
} as const;

export async function buildWalletPass(ticket: TicketView): Promise<Buffer> {
  const signerCert = pem("APPLE_PASS_CERT_B64");
  const signerKey = pem("APPLE_PASS_KEY_B64");
  const wwdr = pem("APPLE_WWDR_B64");
  if (!signerCert || !signerKey || !wwdr) throw new Error("Wallet signing material is not configured");

  const t = COPY[ticket.lang];
  // An empty name means "it is for me" - the ticket page says so - so the
  // buyer's name goes on the front, the way the door list already reads it.
  const name = ticket.attendeeName ?? ticket.buyerName;
  const day = dayLabel(ticket.day, ticket.lang);
  const tier = day ? `${ticket.tierName} · ${day}` : ticket.tierName;

  const images = Object.fromEntries(
    Object.entries(WALLET_IMAGES).map(([name, b64]) => [name, Buffer.from(b64, "base64")]),
  );

  const pass = new PKPass(images, { wwdr, signerCert, signerKey }, {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    teamIdentifier: TEAM_ID,
    serialNumber: ticket.code,
    organizationName: "Sofia Life Summit",
    description: t.description,
    backgroundColor: "rgb(2, 37, 31)",
    foregroundColor: "rgb(233, 240, 236)",
    labelColor: "rgb(206, 248, 112)",
    // A ticket is one seat: passing it around only makes the second scan fail.
    sharingProhibited: true,
  });
  pass.type = "eventTicket";

  pass.headerFields.push({ key: "date", label: t.date, value: t.dateValue });
  // No primary field: Wallet can only draw it huge, so the event's name is
  // typography inside the strip instead, at a size chosen by eye.
  pass.secondaryFields.push(
    { key: "attendee", label: t.attendee, value: name },
    { key: "tier", label: t.tier, value: tier, textAlignment: "PKTextAlignmentRight" },
  );
  pass.auxiliaryFields.push({ key: "where", label: t.where, value: t.venue });
  pass.backFields.push(
    { key: "code", label: t.codeLabel, value: ticket.code },
    { key: "when", label: t.whenLabel, value: t.when },
    { key: "address", label: t.addressLabel, value: t.address },
    { key: "name", label: t.nameLabel, value: ticket.attendeeName ? ticket.attendeeName : `${ticket.buyerName}\n\n${t.nameHint}` },
    { key: "order", label: t.orderLabel, value: `${ticket.reference} · ${ticket.buyerName}` },
    { key: "page", label: t.pageLabel, value: `${SITE}/bilet/${ticket.code}` },
    { key: "help", label: t.helpLabel, value: t.help },
    { key: "rules", label: t.rulesLabel, value: t.rules },
  );

  pass.setBarcodes({
    message: ticket.code,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: ticket.code,
  });
  // Surfaces on the lock screen from the morning of the first day, at the venue.
  pass.setRelevantDate(new Date("2026-11-07T06:00:00+02:00"));
  pass.setLocations({ ...VENUE, relevantText: t.relevant });
  pass.setExpirationDate(new Date("2026-11-09T00:00:00+02:00"));

  return pass.getAsBuffer();
}
