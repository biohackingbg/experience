import { type AppUser, authFromRequest } from "@/lib/app-auth";
import { fail, json, readBody, requireUser } from "@/lib/api-v1";
import {
  PHASES,
  WEEK_TARGET,
  type Challenge,
  cohortOnTrack,
  currentChallenge,
  dateOfDay,
  dayNumber,
  getParticipant,
  isClock,
  joinChallenge,
  leaveChallenge,
  listCheckins,
  sofiaToday,
} from "@/lib/challenge";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/** The whole picture for one person; a guest gets the edition and no "me". */
async function picture(c: Challenge, user: AppUser | null) {
  const today = dayNumber(c.startsOn);
  const base = {
    challenge: {
      slug: c.slug,
      title: c.title,
      startsOn: c.startsOn,
      endsOn: dateOfDay(c.startsOn, c.days),
      days: c.days,
      today,
      todayDate: sofiaToday(),
      phases: PHASES.map((p) => ({ week: p.week, title: p.title, asks: [...p.asks] })),
      weekTarget: WEEK_TARGET,
      consentVersion: c.consentVersion,
    },
  };
  if (!user) return { ...base, me: null };
  const p = await getParticipant(c.id, user.email);
  if (!p || p.leftAt) return { ...base, me: null };
  const [checkins, cohort] = await Promise.all([listCheckins(c.id, user.email), cohortOnTrack(c, p.cohort, Math.max(1, Math.min(c.days, today)))]);
  return {
    ...base,
    me: {
      wakeTarget: p.wakeTarget,
      bedTarget: p.bedTarget,
      cohort: p.cohort,
      joinedAt: p.joinedAt.toISOString(),
      checkins: checkins.map((k) => ({ day: k.day, wake: k.wake, light: k.light, walk: k.walk, bed: k.bed })),
      cohortMembers: cohort.members,
      cohortOnTrack: cohort.onTrack,
    },
  };
}

export async function GET(request: Request) {
  const c = await currentChallenge();
  if (!c) return json({ challenge: null, me: null });
  const user = await authFromRequest(request);
  return json(await picture(c, user), 200, { "Cache-Control": "no-store" });
}

/** Join, or change the chosen times. The app shows the consent text for `consentVersion` first. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const c = await currentChallenge();
  if (!c || !c.active) return fail(404, "no_challenge");
  const body = await readBody<{ wakeTarget?: unknown; bedTarget?: unknown; consentVersion?: unknown }>(request);
  if (!body || !isClock(body.wakeTarget)) return fail(400, "bad_wake");
  if (body.bedTarget != null && body.bedTarget !== "" && !isClock(body.bedTarget)) return fail(400, "bad_bed");
  if (body.consentVersion !== c.consentVersion) return fail(400, "consent_required");
  await joinChallenge(c, auth.user.email, { wakeTarget: body.wakeTarget, bedTarget: isClock(body.bedTarget) ? body.bedTarget : null });
  return json(await picture(c, auth.user), 200, { "Cache-Control": "no-store" });
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const c = await currentChallenge();
  if (c) await leaveChallenge(c.id, auth.user.email);
  return json({ ok: true });
}
