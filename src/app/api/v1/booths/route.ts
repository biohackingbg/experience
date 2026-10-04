import { json, publicCache } from "@/lib/api-v1";
import { BOOTHS, PLAN_ASPECT, PLAN_IMAGE, ZONES } from "@/lib/booths-plan";
import { getBoard } from "@/lib/booths";
import { listedByDeckLink } from "@/lib/partner-profiles";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/**
 * The hall plan with who is where - nothing about money. A stand whose
 * partner has a public profile carries that profile's name and logo; the
 * pipeline label is the fallback, as before.
 */
export async function GET() {
  const [board, profiles] = await Promise.all([getBoard(), listedByDeckLink()]);
  const booths = board.booths.map((b) => {
    const profile = b.partner ? profiles.get(b.partner.id) : undefined;
    return {
      id: b.id,
      zone: b.zone,
      box: b.box,
      taken: b.status !== "free",
      partner: profile?.name ?? b.partner?.label ?? b.holdLabel ?? null,
      partnerId: profile?.id ?? null,
      logo: profile?.logo ?? null,
      category: profile?.category ?? null,
    };
  });
  return json({ image: PLAN_IMAGE, aspect: PLAN_ASPECT, zones: ZONES, booths, count: BOOTHS.length }, 200, publicCache);
}
