import type { Metadata } from "next";

import { requireAccess } from "@/lib/access";
import { STAND_PAGES } from "@/lib/access-options";
import { listWorkshops } from "@/lib/workshops";

import { StandPage } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "Tiana Presolska | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Tiana Presolska's stand alone (Щанд D4: Emsella, Scaneca 3D + InBody, Endospheres), for its team's own access
 * link: the same view as the massage stand's.
 */
export default async function TianaPage() {
  await requireAccess("tiana");
  return <StandPage location={STAND_PAGES.tiana} list={await listWorkshops(true)} back={false} />;
}
