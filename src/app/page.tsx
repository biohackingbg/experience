import { SummitNav } from "@/components/summit/SummitNav";
import { SummitHero } from "@/components/summit/SummitHero";
import { SummitConcept } from "@/components/summit/SummitConcept";
import { SummitSpeakers } from "@/components/summit/SummitSpeakers";
import { SummitTracks } from "@/components/summit/SummitTracks";
import { SummitPassport } from "@/components/summit/SummitPassport";
import { SummitProgram } from "@/components/summit/SummitProgram";
import { SummitTickets } from "@/components/summit/SummitTickets";
import { SummitRegister } from "@/components/summit/SummitRegister";
import { SummitSponsors } from "@/components/summit/SummitSponsors";
import { SummitOrganizers } from "@/components/summit/SummitOrganizers";
import { SummitFooter } from "@/components/summit/SummitFooter";
import { eventSchema } from "@/lib/event-schema";

export default function Home() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-bh-paper">
      <script
        type="application/ld+json"
        // Static, authored object — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <SummitNav />
      <main>
        <SummitHero />
        <SummitSpeakers />
        <SummitTracks />
        <SummitConcept />
        <SummitPassport />
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
