import { SummitNav } from "@/components/summit/SummitNav";
import { SummitHero } from "@/components/summit/SummitHero";
import { SummitConcept } from "@/components/summit/SummitConcept";
import { SummitZones } from "@/components/summit/SummitZones";
import { SummitPartners } from "@/components/summit/SummitPartners";
import { SummitSpeakers } from "@/components/summit/SummitSpeakers";
import { SummitTracks } from "@/components/summit/SummitTracks";
// import { SummitPassport } from "@/components/summit/SummitPassport";
import { SummitProgram } from "@/components/summit/SummitProgram";
import { SummitTickets } from "@/components/summit/SummitTickets";
import { SummitRegister } from "@/components/summit/SummitRegister";
import { SummitSponsors } from "@/components/summit/SummitSponsors";
import { SummitOrganizers } from "@/components/summit/SummitOrganizers";
import { SummitFooter } from "@/components/summit/SummitFooter";
import { buildEventSchema } from "@/lib/event-schema";

// Re-rendered periodically so the early-access window can close on its own.
// A fully static page would keep advertising the launch price, and the number
// of launch tickets left, until the next deploy. A minute is short enough that
// the counter on the page and the one the checkout enforces stay in step.
export const revalidate = 60;

export default async function Home() {
  const schema = await buildEventSchema();

  return (
    <div className="overflow-clip rounded-[1.75rem] bg-bh-paper">
      <script
        type="application/ld+json"
        // Static, authored object - no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <SummitNav />
      <main>
        <SummitHero />
        <SummitSpeakers />
        <SummitTracks />
        <SummitZones />
        <SummitConcept />
        <SummitPartners />
        {/* Held back until the passport programme is confirmed. */}
        {/* <SummitPassport /> */}
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
