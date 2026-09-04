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

// Re-rendered periodically as a safety net. Closing the launch prices is a
// switch in the admin, and that switch revalidates this page on the spot;
// this interval only covers a flip that somehow did not.
export const revalidate = 300;

/** The Bulgarian site. Its English twin is /en, built from the same sections. */
export default async function Home() {
  const eventSchema = await buildEventSchema();
  return (
    <div className="overflow-clip rounded-[1.75rem] bg-bh-paper">
      <script
        type="application/ld+json"
        // Authored object - no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <SummitNav />
      <main>
        <SummitHero />
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
