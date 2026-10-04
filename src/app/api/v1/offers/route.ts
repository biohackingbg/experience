import { listTicketsForEmail } from "@/lib/app-tickets";
import { json, requireUser } from "@/lib/api-v1";
import { listOffersFor } from "@/lib/offers";

export const dynamic = "force-dynamic";

/** The deal wall for this person: what their tickets entitle them to. A guest sees the offers open to all. */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const tickets = await listTicketsForEmail(auth.user.email);
  const tiers = [...new Set(tickets.map((t) => t.tierId))];
  const offers = await listOffersFor(tiers, auth.user.lang);
  return json({ offers, tiers }, 200, { "Cache-Control": "no-store" });
}
