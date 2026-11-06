import type { Metadata } from "next";

import { requireAccess } from "@/lib/access";
import { STAND_PAGES } from "@/lib/access-options";
import { listWorkshops } from "@/lib/workshops";

import { StandPage } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "Therabody | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The Re Start by Therabody stand alone (Щанд B1), for its team's own access
 * link: the same view as the massage stand's.
 */
export default async function TherabodyPage() {
  await requireAccess("therabody");
  return <StandPage location={STAND_PAGES.therabody} list={await listWorkshops(true)} back={false} />;
}
