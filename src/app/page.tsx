import { SummitNav } from "@/components/summit/SummitNav";
import { SummitHero } from "@/components/summit/SummitHero";
import { SummitConcept } from "@/components/summit/SummitConcept";
import { SummitPassport } from "@/components/summit/SummitPassport";
import { SummitProgram } from "@/components/summit/SummitProgram";
import { SummitTickets } from "@/components/summit/SummitTickets";
import { SummitRegister } from "@/components/summit/SummitRegister";
import { SummitFooter } from "@/components/summit/SummitFooter";

export default function Home() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-bh-paper">
      <SummitNav />
      <main>
        <SummitHero />
        <SummitConcept />
        <SummitPassport />
        <SummitProgram />
        <SummitTickets />
        <SummitRegister />
      </main>
      <SummitFooter />
    </div>
  );
}
