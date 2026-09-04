import { NextResponse } from "next/server";

import { SCOPE_COOKIE, redeemToken } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The link a grant is sent as. Opening it starts a scoped session and lands
 * on the first allowed page; a dead link goes to the login with a note.
 */
export async function GET(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`grant:${ip}`, 20).allowed) return NextResponse.redirect(new URL("/admin/login?dostap=invalid", request.url));
  const { token } = await ctx.params;
  const r = await redeemToken(token);
  if (!r) return NextResponse.redirect(new URL("/admin/login?dostap=invalid", request.url));
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
