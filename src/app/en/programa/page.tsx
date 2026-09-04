import type { Metadata } from "next";

import { SummitFooter } from "@/components/summit/SummitFooter";
import { SiteNotice } from "@/components/summit/SiteNotice";
import { SummitNav } from "@/components/summit/SummitNav";
import { SummitProgram } from "@/components/summit/SummitProgram";

export const metadata: Metadata = {
  title: "Programme by the hour | Sofia Life Summit 2026",
  description: "The Sofia Life Summit programme by day and hour - 7-8 November 2026, Grand Hotel Millennium, Sofia.",
  alternates: { canonical: "/en/programa", languages: { bg: "/programa", en: "/en/programa" } },
};

export const revalidate = 300;

export default function ProgramPageEn() {
  return (
    <div className="overflow-clip rounded-[1.75rem] bg-bh-paper">
      <SiteNotice lang="en" />
      <SummitNav lang="en" />
      <main className="pb-16">
        <SummitProgram lang="en" />
      </main>
      <SummitFooter lang="en" />
    </div>
  );
}
