import { json } from "@/lib/api-v1";
import { getArrivalPlan, slotCounts, slotLabel } from "@/lib/arrivals";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/**
 * The arrival plan for the app's ticket screen: whether it is on, the
 * windows with their labels, and how many places each still has per day.
 */
export async function GET() {
  const plan = await getArrivalPlan();
  if (!plan.on) return json({ on: false, days: [] }, 200, { "Cache-Control": "no-store" });
  const days = await Promise.all(
    ([1, 2] as const).map(async (day) => {
      const counts = await slotCounts(day);
      return {
        day,
        slots: plan.slots.map((id) => ({
          id,
          label: slotLabel(plan, id, "bg"),
          labelEn: slotLabel(plan, id, "en"),
          free: id.endsWith("+") ? null : Math.max(0, plan.capacity - (counts[id] ?? 0)),
        })),
      };
    }),
  );
  return json({ on: true, days }, 200, { "Cache-Control": "no-store" });
}
