import { json } from "@/lib/api-v1";
import { BOOKING_OPENS_AT, bookingOpen, listWorkshops } from "@/lib/workshops";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/**
 * Every open workshop with how many places are left - never cached, seats
 * move. `bookingOpensAt` says when booking opens; until then a booking is
 * refused with the reason "not_open".
 */
export async function GET() {
  const workshops = await listWorkshops();
  return json({ workshops, bookingOpen: bookingOpen(), bookingOpensAt: BOOKING_OPENS_AT.toISOString() }, 200, { "Cache-Control": "no-store" });
}
