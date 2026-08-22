import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE } from "@/lib/admin-auth";

/**
 * Optimistic gate only.
 *
 * This just bounces requests that carry no session cookie at all, to save a
 * render. It does **not** verify the signature - the Next docs are explicit
 * that proxy is not an authorization solution - so the real check stays in
 * `admin/(dash)/layout.tsx`, which validates the token server-side.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!request.cookies.get(ADMIN_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
