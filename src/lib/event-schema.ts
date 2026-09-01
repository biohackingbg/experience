import { announcedSpeakers } from "@/lib/speakers";
import {
  SALES_OPEN,
  CURRENCY,
  PRE_ORDER,
  TIERS,
  priceCents,
} from "@/lib/tickets";
import { getEarlyState } from "@/lib/early-access";

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
export async function buildEventSchema() {
  const { early } = await getEarlyState();

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
  // Ties the event to its Instagram profile, so a search result can show
  // both and the account gains the site's credibility.
  sameAs: ["https://www.instagram.com/longevitysummit.eu"],
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
      // The company page belongs to the organiser, not the event - so it
      // hangs here rather than in the event's own sameAs.
      sameAs: ["https://www.linkedin.com/company/biohacking-bg/"],
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
      // No priceValidUntil any more: the launch price ends on a count, not
      // a date, and inventing a date here would be a promise to Google that
      // the checkout does not keep.
    })),
      }
    : {}),
  } as const;
}
