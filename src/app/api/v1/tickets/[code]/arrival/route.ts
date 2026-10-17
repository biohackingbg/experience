import { ownsTicket } from "@/lib/app-tickets";
import { fail, json, limited, readBody, requireUser } from "@/lib/api-v1";
import { chooseArrival } from "@/lib/arrivals";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

type Ctx = { params: Promise<{ code: string }> };

/** The app picks an arrival window for one of the user's tickets: { day: 1 | 2, slot: "09:20" }. */
export async function POST(request: Request, ctx: Ctx) {
  if (limited(request, "arrival", 30)) return fail(429, "too_many");
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const code = decodeURIComponent((await ctx.params).code).trim().toUpperCase();
  if (!(await ownsTicket(auth.user.email, code))) return fail(404, "no_ticket");
  const body = await readBody<{ day?: number; slot?: string }>(request);
  const day = Number(body?.day);
  if (day !== 1 && day !== 2) return fail(400, "invalid");
  const r = await chooseArrival(code, day, String(body?.slot ?? ""));
  if (!r.ok) return fail(r.reason === "full" ? 409 : 400, r.reason);
  return json({ ok: true });
}
