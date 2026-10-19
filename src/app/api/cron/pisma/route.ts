import { NextResponse } from "next/server";

import { runSequences } from "@/lib/sequences";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The automatic letters (lib/sequences.ts), run every three hours by Vercel Cron
 * (every hour woke the database 24 times a day for letters that go out on a
 * day, not on a minute).
 * `?dry=1` lists what would go without sending anything. Which letters
 * are on is decided per letter in the dashboard (lib/sequences.ts).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const dry = !!url.searchParams.get("dry");
  const at = url.searchParams.get("now");
  const result = await runSequences({ dry, now: dry && at ? new Date(at) : undefined });
  return NextResponse.json({ ok: true, dry, ...result });
}
