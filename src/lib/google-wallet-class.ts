/**
 * The Google Wallet "event ticket class": everything that is the same on every
 * ticket (the event, the venue, the colours). It lives at Google, created once
 * by scripts/google-wallet-class.ts, so each ticket's save link only has to
 * carry the person - Google caps that link at about 1800 characters.
 *
 * No server-only import: the script reads it too.
 */
export const GOOGLE_ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID?.trim() ?? "";
export const GOOGLE_CLASS_ID = `${GOOGLE_ISSUER_ID}.sls_2026`;

const SITE = "https://thelongevitysummit.eu";
const bg = (value: string) => ({ defaultValue: { language: "bg", value } });

export function eventTicketClass() {
  return {
    id: GOOGLE_CLASS_ID,
    issuerName: "Sofia Life Summit",
    // Google reviews a class before it shows to the public; until the issuer
    // account is approved only its test users can save the ticket.
    reviewStatus: "UNDER_REVIEW",
    eventName: bg("Sofia Life Summit 2026"),
    venue: {
      name: bg("Гранд Хотел Милениум"),
      address: bg("бул. Витоша 89В, София"),
    },
    // Local time at the venue, without an offset - that is the format Google takes.
    dateTime: { doorsOpen: "2026-11-07T08:30", start: "2026-11-07T10:00", end: "2026-11-08T18:00" },
    logo: { sourceUri: { uri: `${SITE}/email-logo.png` }, contentDescription: bg("Sofia Life Summit") },
    hexBackgroundColor: "#02251f",
    countryCode: "BG",
    locations: [{ latitude: 42.6799, longitude: 23.3176 }],
    multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
    textModulesData: [
      { id: "when", header: "Кога", body: "Събота и неделя, 7-8 ноември 2026. Регистрацията отваря в 8:30." },
      { id: "rules", header: "Правила", body: "Билетът важи за един човек и се проверява на входа по QR кода. Не го споделяй." },
    ],
    linksModuleData: {
      uris: [
        { id: "site", uri: SITE, description: "thelongevitysummit.eu" },
        { id: "help", uri: "mailto:hi@biohacking.bg", description: "Въпроси: hi@biohacking.bg" },
      ],
    },
  };
}
