import type { Metadata } from "next";

import { requireAccess } from "@/lib/access";
import { STAND_PAGES } from "@/lib/access-options";
import { listWorkshops } from "@/lib/workshops";

import { StandPage } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "Obsidian PEMF | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The PEMF Bed by Obsidian Club (Щанд B2) stand alone, for its team's own access
 * link: the same view as the massage stand's.
 */
export default async function ObsidianPage() {
  await requireAccess("obsidian");
  return <StandPage location={STAND_PAGES.obsidian} list={await listWorkshops(true)} back={false} />;
}
