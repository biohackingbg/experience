import { SiteNotice } from "@/components/summit/SiteNotice";
import { SummitNav } from "@/components/summit/SummitNav";
import { SummitHero } from "@/components/summit/SummitHero";
import { SummitConcept } from "@/components/summit/SummitConcept";
import { SummitPartners } from "@/components/summit/SummitPartners";
import { SummitSpeakers } from "@/components/summit/SummitSpeakers";
import { SummitTracks } from "@/components/summit/SummitTracks";
import { SummitProgram } from "@/components/summit/SummitProgram";
import { SummitTickets } from "@/components/summit/SummitTickets";
import { SummitRegister } from "@/components/summit/SummitRegister";
import { SummitSponsors } from "@/components/summit/SummitSponsors";
import { SummitOrganizers } from "@/components/summit/SummitOrganizers";
import { BuyBar } from "@/components/summit/BuyBar";
import { SummitFooter } from "@/components/summit/SummitFooter";
import { buildEventSchema } from "@/lib/event-schema";
import { cheapestOf, getPricing, priceOf } from "@/lib/pricing";
import { getAnnouncedSpeakers } from "@/lib/speakers-data";
import { SALES_OPEN, formatPrice } from "@/lib/tickets";
import { SPEAKERS_PLANNED } from "@/lib/site-copy";

// Re-rendered hourly as a safety net. Prices, speakers, the programme and
// every ticket sale revalidate this page on the spot (see the admin actions
// and the Stripe webhook); this interval only covers a change that somehow
// did not. Every re-render is an ISR write plus a function run on the bill,
// and at five minutes that was most of the ISR cost.
export const revalidate = 3600;

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
        <SummitHero speakerCount={SPEAKERS_PLANNED} from={from} />
        <SummitSpeakers />
        <SummitTracks />
        <SummitConcept />
        <SummitPartners />
        <SummitProgram />
        <SummitTickets />
        <SummitRegister />
        <SummitSponsors />
        <SummitOrganizers />
      </main>
      <SummitFooter />
      {SALES_OPEN && <BuyBar from={from} tierId="plus" />}
    </div>
  );
}
