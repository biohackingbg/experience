import type { Metadata } from "next";

import { requireAccess } from "@/lib/access";
import { listWorkshops } from "@/lib/workshops";

import { StandPage } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "Scaneca | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Scaneca 3D + InBody alone at Щанд D4, for its operator's own access link: its slots, names and scanner. */
export default async function ScanecaPage() {
  await requireAccess("scaneca");
  return <StandPage location="Щанд D4" title="Scaneca 3D + InBody" list={await listWorkshops(true)} back={false} />;
}
