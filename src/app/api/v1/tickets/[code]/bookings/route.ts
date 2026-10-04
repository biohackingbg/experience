import { ownsTicket } from "@/lib/app-tickets";
import { fail, json, limited, readBody, requireUser } from "@/lib/api-v1";
import { bookPlace, cancelPlace, getTicketPlaces } from "@/lib/workshops";

export const dynamic = "force-dynamic";

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
  if (limited(request, "book", 30)) return fail(429, "too_many");
  const t = await ticketOf(request, ctx);
  if ("response" in t) return t.response;
  const body = await readBody<{ workshopId?: string }>(request);
  const workshopId = String(body?.workshopId ?? "");
  if (!/^[0-9a-f-]{36}$/.test(workshopId)) return fail(400, "invalid");
  const r = await bookPlace(t.code, workshopId);
  if (!r.ok) return fail(409, r.reason);
  return json({ ok: true, places: await getTicketPlaces(t.code) });
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
