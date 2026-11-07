import type { Metadata } from "next";

import { requireAccess } from "@/lib/access";
import { STAND_PAGES } from "@/lib/access-options";
import { listWorkshops } from "@/lib/workshops";

import { StandPage } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "N8 Skin Check | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The Skin Check by N8 Molecule (Щанд C5) stand alone, for its team's own access
 * link: the same view as the massage stand's.
 */
export default async function N8Page() {
  await requireAccess("n8");
  return <StandPage location={STAND_PAGES.n8} list={await listWorkshops(true)} back={false} />;
}
