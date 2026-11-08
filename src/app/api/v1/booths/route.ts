import { json, publicCache } from "@/lib/api-v1";
import { BOOTHS, ZONES } from "@/lib/booths-plan";
import { getBoard } from "@/lib/booths";
import { listedByDeckLink } from "@/lib/partner-profiles";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/**
 * The hall plan with who is where - nothing about money. A stand whose
 * partner has a public profile carries that profile's name and logo; the
 * pipeline label is the fallback, as before.
 */
/**
 * The app gets its own image: the same v5 plan with a legend under it large
 * enough to read on a phone (83 План на щандовете v5/plan_app.py). Its top is
 * the v5 plan pixel for pixel, only taller (1657 px at 1x against 815), so the
 * boxes, in % of the v5 image, are scaled down in height. The stands come back as not taken: the app paints a
 * taken stand solid green, which hid the number and name printed on it.
 */
const APP_IMAGE = "/plan-shtandove-app.webp";
const APP_H = 1657;
const V5_H = 815;
const APP_ASPECT = 1097 / APP_H;

export async function GET() {
  const [board, profiles] = await Promise.all([getBoard(), listedByDeckLink()]);
  const booths = board.booths.map((b) => {
    const profile = b.partner ? profiles.get(b.partner.id) : undefined;
    return {
      id: b.id,
      zone: b.zone,
      box: [b.box[0], (b.box[1] * V5_H) / APP_H, b.box[2], (b.box[3] * V5_H) / APP_H],
      taken: false,
      partner: profile?.name ?? b.partner?.label ?? b.holdLabel ?? null,
      partnerId: profile?.id ?? null,
      logo: profile?.logo ?? null,
      category: profile?.category ?? null,
    };
  });
  return json({ image: APP_IMAGE, aspect: APP_ASPECT, zones: ZONES, booths, count: BOOTHS.length }, 200, publicCache);
}
