import type { Metadata } from "next";

import { requireAccess } from "@/lib/access";
import { STAND_PAGES } from "@/lib/access-options";
import { listWorkshops } from "@/lib/workshops";

import { StandPage } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "Масажи | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The massage stand alone, for the masseurs' own access link: the slots of
 * Щанд B8 with their names and the "Дойде" button, and nothing of the rooms.
 */
export default async function MassagePage() {
  await requireAccess("masazhi");
  return <StandPage location={STAND_PAGES.masazhi} list={await listWorkshops(true)} back={false} />;
}
