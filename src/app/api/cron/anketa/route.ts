import { NextResponse } from "next/server";

import { sendDigestEmail } from "@/lib/email";
import { SURVEY_CLOSES } from "@/lib/survey-questions";
import { surveyDigest } from "@/lib/surveys";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The survey's evening note to the team (Vercel Cron, see vercel.json). Runs
 * while the survey is open and on the day after it closes, for the last
 * answers; quiet on a day with none. ?dry=1 returns it instead of mailing it.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (Date.now() > SURVEY_CLOSES.getTime() + 36 * 3_600_000) return NextResponse.json({ ok: true, skipped: "survey closed" });
  const digest = await surveyDigest();
  if (!digest) return NextResponse.json({ ok: true, skipped: "no answers today" });
  if (new URL(request.url).searchParams.get("dry")) return NextResponse.json({ ok: true, dry: true, ...digest });
  const sent = await sendDigestEmail(digest);
  return NextResponse.json({ ok: sent, subject: digest.subject }, { status: sent ? 200 : 500 });
}
