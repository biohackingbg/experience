import { json, publicCache } from "@/lib/api-v1";
import { BOOTHS, PLAN_ASPECT, PLAN_IMAGE, ZONES } from "@/lib/booths-plan";
import { getBoard } from "@/lib/booths";

export const dynamic = "force-dynamic";

/** The hall plan with who is where - names only for stands that are taken, nothing about money. */
export async function GET() {
  const board = await getBoard();
  const booths = board.booths.map((b) => ({
    id: b.id,
    zone: b.zone,
    box: b.box,
    taken: b.status !== "free",
    partner: b.partner?.label ?? b.holdLabel ?? null,
  }));
  return json({ image: PLAN_IMAGE, aspect: PLAN_ASPECT, zones: ZONES, booths, count: BOOTHS.length }, 200, publicCache);
}
