import { NextResponse } from "next/server";

import { buildDigest } from "@/lib/digest";
import { sendDigestEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The morning digest, run by Vercel Cron (see vercel.json). Same lock as the
 * health check: only the cron's bearer secret gets a send out of this.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const digest = await buildDigest();
    // ?dry=1 returns the digest instead of mailing it - for checking the
    // wording without spending a send.
    if (new URL(request.url).searchParams.get("dry")) {
      return NextResponse.json({ ok: true, dry: true, subject: digest.subject, text: digest.text });
    }
    const sent = await sendDigestEmail(digest);
    if (!sent) return NextResponse.json({ ok: false, error: "send failed" }, { status: 500 });
    return NextResponse.json({ ok: true, subject: digest.subject });
  } catch (error) {
    console.error("[digest] failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
