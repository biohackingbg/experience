import { ownsTicket } from "@/lib/app-tickets";
import { fail, json, limited, readBody, requireUser } from "@/lib/api-v1";
import { pushToEmails } from "@/lib/push";
import { limitNote } from "@/lib/workshop-options";
import { allowanceUsedUp, bookPlace, cancelPlace, getTicketPlaces } from "@/lib/workshops";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

type Ctx = { params: Promise<{ code: string }> };

async function ticketOf(request: Request, ctx: Ctx) {
  const auth = await requireUser(request);
  if ("response" in auth) return { response: auth.response };
  const code = decodeURIComponent((await ctx.params).code).trim().toUpperCase();
  if (!(await ownsTicket(auth.user.email, code))) return { response: fail(404, "no_ticket") };
  return { code, user: auth.user };
}

/** Books a place for this ticket. The reason codes are the library's own, so the app can word each. */
export async function POST(request: Request, ctx: Ctx) {
  if (limited(request, "book", 150)) return fail(429, "too_many");
  const t = await ticketOf(request, ctx);
  if ("response" in t) return t.response;
  const body = await readBody<{ workshopId?: string }>(request);
  const workshopId = String(body?.workshopId ?? "");
  if (!/^[0-9a-f-]{36}$/.test(workshopId)) return fail(400, "invalid");
  const r = await bookPlace(t.code, workshopId);
  // The last place of the tier booked, or one more tried: say so with a push.
  if (r.ok || r.reason === "not_allowed") await notifyLimit(t.user.email, t.code, workshopId, r.ok);
  if (!r.ok) return fail(409, r.reason);
  return json({ ok: true, places: await getTicketPlaces(t.code) });
}

/**
 * The app's alert for "not_allowed" was written for CORE and reads wrong for
 * a PEAK at 3 of 3, and the app cannot get a new build before the summit -
 * so the server says it, as a push that shows even with the app open.
 * Never lets a push failure touch the booking.
 */
async function notifyLimit(email: string, code: string, workshopId: string, justBooked: boolean): Promise<void> {
  try {
    const u = await allowanceUsedUp(code, workshopId);
    if (!u) return;
    const note = limitNote(u.kind, u.allowed, u.tierId);
    await pushToEmails([email], { ...note, data: { screen: "stations" }, collapseId: `limit-${code}-${u.kind}` });
  } catch (e) {
    console.error(`[bookings] limit push failed (${justBooked ? "booked" : "refused"}):`, e);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const t = await ticketOf(request, ctx);
  if ("response" in t) return t.response;
  const body = await readBody<{ workshopId?: string }>(request);
  const workshopId = String(body?.workshopId ?? "");
  if (!/^[0-9a-f-]{36}$/.test(workshopId)) return fail(400, "invalid");
  await cancelPlace(t.code, workshopId);
  return json({ ok: true, places: await getTicketPlaces(t.code) });
}
