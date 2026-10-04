import { listTicketsForEmail } from "@/lib/app-tickets";
import { json, requireUser } from "@/lib/api-v1";
import { isMember } from "@/lib/members";
import { getPricing } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** The signed-in person: their tickets with bookings, and whether they joined the community. */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const [tickets, member, pricing] = await Promise.all([listTicketsForEmail(auth.user.email), isMember(auth.user.email), getPricing()]);
  return json({
    email: auth.user.email,
    lang: auth.user.lang,
    member,
    tickets,
    /** So a guest without a ticket sees the live price on the buy button. */
    prices: pricing.prices,
    priceStage: pricing.stage,
  });
}
