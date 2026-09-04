import { SiteNotice } from "@/components/summit/SiteNotice";
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
import { getAnnouncedSpeakers } from "@/lib/speakers-data";
import { formatPrice } from "@/lib/tickets";

// Re-rendered periodically as a safety net. Closing the launch prices is a
// switch in the admin, and that switch revalidates this page on the spot;
// this interval only covers a flip that somehow did not.
export const revalidate = 300;

/** The Bulgarian site. Its English twin is /en, built from the same sections. */
export default async function Home() {
  // The hero quotes two numbers that also appear further down the page - the
  // line-up size and the cheapest ticket - so both are read once here and
  // handed down, rather than counted twice and disagreeing.
  const [eventSchema, speakers, pricing] = await Promise.all([
    buildEventSchema(),
    getAnnouncedSpeakers(),
    getPricing(),
  ]);
  const from = formatPrice(priceOf(pricing, cheapestOf(pricing)));
  return (
    <div className="overflow-clip rounded-[1.75rem] bg-bh-paper">
      <script
        type="application/ld+json"
        // Authored object - no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <SiteNotice />
      <SummitNav />
      <main>
        <SummitHero speakerCount={speakers.length} from={from} />
        <SummitSpeakers />
        <SummitTracks />
        <SummitZones />
        <SummitConcept />
        <SummitPartners />
        <SummitProgram />
        <SummitTickets />
        <SummitRegister />
        <SummitSponsors />
        <SummitOrganizers />
      </main>
      <SummitFooter />
    </div>
  );
}
