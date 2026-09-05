import { NextResponse } from "next/server";

import { SCOPE_COOKIE, redeemEmailLink } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The link from the letter. Same scoped session a grant link gives, but the
 * link was never handed to anyone - it was mailed to the address on the grant.
 */
export async function GET(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`vhod:${ip}`, 20).allowed) {
    return NextResponse.redirect(new URL("/admin/login?dostap=invalid", request.url));
  }
  const { token } = await ctx.params;
  const r = await redeemEmailLink(decodeURIComponent(token));
  if (!r) return NextResponse.redirect(new URL("/admin/login?dostap=expired", request.url));
  const res = NextResponse.redirect(new URL(r.home, request.url));
  res.cookies.set(SCOPE_COOKIE, r.cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: r.maxAge,
  });
  return res;
}
