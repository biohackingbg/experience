import type { Metadata } from "next";

import { requireAccess } from "@/lib/access";
import { listWorkshops } from "@/lib/workshops";

import { StandPage } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "Emsella | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Emsella alone at Щанд D4, for its operator's own access link: its slots, names and scanner. */
export default async function EmsellaPage() {
  await requireAccess("emsella");
  return <StandPage location="Щанд D4" title="Emsella" list={await listWorkshops(true)} back={false} />;
}
