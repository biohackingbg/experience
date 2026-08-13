import { SPEAKERS } from "@/lib/speakers";

/**
 * Speakers, as schema.org performers.
 *
 * Read from the same list the page renders, so a name can never appear in one
 * place and not the other. Unconfirmed slots are skipped — "Обявява се скоро"
 * is a placeholder, not a person, and Google would treat it as one.
 */
const performers = SPEAKERS.filter((s) => !s.pending).map((s) => ({
  "@type": "Person" as const,
  name: [s.title, s.name].filter(Boolean).join(" "),
  ...(s.specialty || s.affiliation
    ? { jobTitle: s.specialty ?? s.affiliation }
    : {}),
  ...(s.affiliation
    ? { affiliation: { "@type": "Organization" as const, name: s.affiliation } }
    : {}),
}));

/**
 * schema.org Event description, emitted as JSON-LD.
 *
 * This is what lets Google show the dates, venue and ticket price directly in
 * the search result instead of a plain link. Keep the offers in step with the
 * tiers in `SummitTickets`.
 */
export const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Sofia Life Summit 2026",
  alternateName: "Biohacking Experience",
  description:
    "Потребителската част на Sofia Life Summit: четири зони, longevity паспорт с 12 станции за измерване, две сцени и Village с 30 компании.",
  startDate: "2026-11-07T10:00:00+02:00",
  endDate: "2026-11-08T18:00:00+02:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  url: "https://thelongevitysummit.eu",
  image: ["https://thelongevitysummit.eu/opengraph-image"],
  inLanguage: "bg",
  location: {
    "@type": "Place",
    name: "Гранд Хотел Милениум София",
    address: {
      "@type": "PostalAddress",
      streetAddress: "бул. „Витоша“ 89Б",
      addressLocality: "София",
      postalCode: "1000",
      addressCountry: "BG",
    },
  },
  performer: performers,
  organizer: [
    {
      "@type": "Organization",
      name: "Bulgarian Longevity Association",
      url: "https://www.longevitybulgaria.com/",
    },
    {
      "@type": "Organization",
      name: "Biohacking.bg",
      url: "https://thelongevitysummit.eu",
    },
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Основен",
      price: "50",
      priceCurrency: "EUR",
      availability: "https://schema.org/PreOrder",
      url: "https://thelongevitysummit.eu/#tickets",
      validFrom: "2026-09-01T00:00:00+03:00",
    },
    {
      "@type": "Offer",
      name: "Пълен",
      price: "145",
      priceCurrency: "EUR",
      availability: "https://schema.org/PreOrder",
      url: "https://thelongevitysummit.eu/#tickets",
      validFrom: "2026-09-01T00:00:00+03:00",
    },
    {
      "@type": "Offer",
      name: "Протокол",
      price: "390",
      priceCurrency: "EUR",
      availability: "https://schema.org/PreOrder",
      url: "https://thelongevitysummit.eu/#tickets",
      validFrom: "2026-09-01T00:00:00+03:00",
    },
  ],
} as const;
