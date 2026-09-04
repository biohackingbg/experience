import type { Metadata } from "next";

import { SummitNav } from "@/components/summit/SummitNav";
import { SummitHero } from "@/components/summit/SummitHero";
import { SummitConcept } from "@/components/summit/SummitConcept";
import { SummitZones } from "@/components/summit/SummitZones";
import { SummitPartners } from "@/components/summit/SummitPartners";
import { SummitSpeakers } from "@/components/summit/SummitSpeakers";
import { SummitTracks } from "@/components/summit/SummitTracks";
import { SummitProgram } from "@/components/summit/SummitProgram";
import { SummitTickets } from "@/components/summit/SummitTickets";
import { SummitRegister } from "@/components/summit/SummitRegister";
import { SummitSponsors } from "@/components/summit/SummitSponsors";
import { SummitOrganizers } from "@/components/summit/SummitOrganizers";
import { SummitFooter } from "@/components/summit/SummitFooter";
import { buildEventSchema } from "@/lib/event-schema";
import { cheapestOf, getPricing, priceOf } from "@/lib/pricing";
import { META } from "@/lib/site-copy";
import { formatPrice } from "@/lib/tickets";

export const revalidate = 300;

/**
 * The same page in English. Same sections, same data, same prices - only
 * the words change, and they come from one file next to their Bulgarian
 * originals so the two cannot drift into different promises.
 */
export async function generateMetadata(): Promise<Metadata> {
  const pricing = await getPricing();
  const description = META.en.describe(formatPrice(priceOf(pricing, cheapestOf(pricing))));
  return {
    title: META.en.title,
    description,
    alternates: { canonical: "/en", languages: { bg: "/", en: "/en" } },
    openGraph: { type: "website", locale: "en_GB", url: "https://thelongevitysummit.eu/en", siteName: "Sofia Life Summit", title: META.en.title, description },
    twitter: { card: "summary_large_image", title: META.en.title, description },
  };
}

export default async function HomeEn() {
  const eventSchema = await buildEventSchema();
  return (
    <div className="overflow-clip rounded-[1.75rem] bg-bh-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />
      <SummitNav lang="en" />
      <main>
        <SummitHero lang="en" />
        <SummitSpeakers lang="en" />
        <SummitTracks lang="en" />
        <SummitZones lang="en" />
        <SummitConcept lang="en" />
        <SummitPartners lang="en" />
        <SummitProgram lang="en" />
        <SummitTickets lang="en" />
        <SummitRegister lang="en" />
        <SummitSponsors lang="en" />
        <SummitOrganizers lang="en" />
      </main>
      <SummitFooter lang="en" />
    </div>
  );
}
