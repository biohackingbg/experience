import type { Metadata } from "next";

import { SummitFooter } from "@/components/summit/SummitFooter";
import { SiteNotice } from "@/components/summit/SiteNotice";
import { SummitNav } from "@/components/summit/SummitNav";
import { SummitProgram } from "@/components/summit/SummitProgram";

export const metadata: Metadata = {
  title: "Програма по часове | Sofia Life Summit 2026",
  description: "Програмата на Sofia Life Summit по дни и часове - 07-08 ноември 2026, Гранд Хотел Милениум, София.",
  alternates: { canonical: "/programa", languages: { bg: "/programa", en: "/en/programa" } },
};

// The programme is edited in the admin; the page follows within minutes.
export const revalidate = 300;

/** The programme on its own page, for the links in mail and posts. */
export default function ProgramPage() {
  return (
    <div className="overflow-clip rounded-[1.75rem] bg-bh-paper">
      <SiteNotice />
      <SummitNav />
      <main className="pb-16">
        <SummitProgram />
      </main>
      <SummitFooter />
    </div>
  );
}
