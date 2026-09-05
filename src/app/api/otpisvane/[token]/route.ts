import { NextResponse } from "next/server";

import { unsubscribe } from "@/lib/newsletter";
import { readUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

/**
 * The address Gmail and Outlook post to when someone presses their own
 * "unsubscribe" button (RFC 8058). It must answer POST without a body and
 * without a redirect, so it answers plainly.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const email = readUnsubscribeToken(decodeURIComponent(token));
  if (!email) return NextResponse.json({ ok: false }, { status: 400 });
  await unsubscribe(email);
  return NextResponse.json({ ok: true });
}

/** A person who opens the link in a browser gets the page instead. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return NextResponse.redirect(new URL(`/otpisvane/${token}`, "https://thelongevitysummit.eu"));
}
