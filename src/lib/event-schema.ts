import { announcedSpeakers } from "@/lib/speakers";
import {
  SALES_OPEN,
  CURRENCY,
  EARLY_ACCESS,
  PRE_ORDER,
  TIERS,
  isEarlyAccess,
  priceCents,
} from "@/lib/tickets";

/**
 * Speakers, as schema.org performers.
 *
 * Read from the same list the page renders, so a name can never appear in one
 * place and not the other. Unconfirmed slots are skipped - "Обявява се скоро"
 * is a placeholder, not a person, and Google would treat it as one.
 */
const performers = announcedSpeakers().map((s) => ({
  "@type": "Person" as const,
  name: [s.title, s.name].filter(Boolean).join(" "),
  // Speciality first, then the position held. Never the institution: it was
  // standing in as a jobTitle whenever a speaker had no speciality recorded,
  // which told Google that "Медицински университет - Пловдив" is a job.
  ...(s.specialty ?? s.role ? { jobTitle: s.specialty ?? s.role } : {}),
  ...(s.affiliation
    ? { affiliation: { "@type": "Organization" as const, name: s.affiliation } }
    : {}),
}));

/**
 * schema.org Event description, emitted as JSON-LD.
 *
 * This is what lets Google show the dates, venue and ticket price directly in
 * the search result instead of a plain link.
 *
 * A function rather than a constant: the offers depend on whether the early
 * window is open, and a module-level constant would freeze that answer for the
 * life of the server process - advertising a price in search that the checkout
 * no longer charges.
 */
export function buildEventSchema() {
  const early = isEarlyAccess();

  return {
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
  // No prices in search while the final ones are being settled: a rich
  // result quoting a figure the checkout will not honour is worse than none.
  ...(SALES_OPEN
    ? {
  offers: TIERS.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      price: (priceCents(tier, early) / 100).toFixed(2),
      priceCurrency: CURRENCY,
      availability: "https://schema.org/PreOrder",
      url: "https://thelongevitysummit.eu/bilet",
      validFrom: PRE_ORDER.validFrom,
      // Tells Google when the advertised price stops being true, so a stale
      // rich result does not keep showing the launch price.
      ...(early
        ? { priceValidUntil: EARLY_ACCESS.endsAt.toISOString().slice(0, 10) }
        : {}),
    })),
      }
    : {}),
  } as const;
}
