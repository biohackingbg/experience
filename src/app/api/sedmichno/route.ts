import { NextResponse } from "next/server";

import { sendDigestEmail } from "@/lib/email";
import { buildWeekly } from "@/lib/weekly";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Monday's summary of the week, run by Vercel Cron. Same bearer lock as the daily one. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const weekly = await buildWeekly();
    if (new URL(request.url).searchParams.get("dry")) {
      return NextResponse.json({ ok: true, dry: true, subject: weekly.subject, text: weekly.text });
    }
    const sent = await sendDigestEmail(weekly);
    if (!sent) return NextResponse.json({ ok: false, error: "send failed" }, { status: 500 });
    return NextResponse.json({ ok: true, subject: weekly.subject });
  } catch (error) {
    console.error("[weekly] failed:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
