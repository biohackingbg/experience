import { fail, json, readBody, requireUser } from "@/lib/api-v1";
import { currentChallenge, getParticipant, listCheckins, saveCheckin } from "@/lib/challenge";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/** Four flags for one day. Numbers (steps, wake time, heart rate) never come here. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const c = await currentChallenge();
  if (!c) return fail(404, "no_challenge");
  const p = await getParticipant(c.id, auth.user.email);
  if (!p || p.leftAt) return fail(403, "not_joined");
  const body = await readBody<{ day?: unknown; wake?: unknown; light?: unknown; walk?: unknown; bed?: unknown }>(request);
  const day = Number(body?.day);
  if (!Number.isInteger(day)) return fail(400, "bad_day");
  const r = await saveCheckin(c, auth.user.email, { day, wake: body?.wake === true, light: body?.light === true, walk: body?.walk === true, bed: body?.bed === true });
  if (r !== "ok") return fail(400, r);
  const checkins = await listCheckins(c.id, auth.user.email);
  return json({ ok: true, checkins: checkins.map((k) => ({ day: k.day, wake: k.wake, light: k.light, walk: k.walk, bed: k.bed })) }, 200, { "Cache-Control": "no-store" });
}
