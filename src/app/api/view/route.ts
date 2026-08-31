import { NextResponse } from "next/server";

import { referrerHost } from "@/lib/deck-links";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanPath, recordSiteView, visitorHash } from "@/lib/site-views";

export const dynamic = "force-dynamic";

/**
 * One beacon per page the visitor opens on the public site.
 *
 * Always answers 204, like the deck's beacon: there is nobody on the other
 * end to show an error to, and a talkative endpoint only helps someone
 * probing it. The address and browser are hashed on arrival and never
 * written down - see site-views.ts.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const path = typeof body?.path === "string" ? cleanPath(body.path) : null;
  if (!path) return new NextResponse(null, { status: 204 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const visitor = visitorHash(ip, ua);

  // Generous: a person clicking through the programme is not a flood.
  if (!checkRateLimit(`site-view:${visitor}`, 40).allowed) {
    return new NextResponse(null, { status: 204 });
  }

  const cityRaw = request.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  try {
    city = cityRaw ? decodeURIComponent(cityRaw).slice(0, 80) : null;
  } catch {
    city = null;
  }

  await recordSiteView({
    path,
    visitor,
    referrerHost: referrerHost(
      typeof body?.referrer === "string" ? body.referrer : null,
      new URL(request.url).hostname,
    ),
    device: body?.device === "mobile" || body?.device === "desktop" ? body.device : null,
    country: request.headers.get("x-vercel-ip-country")?.slice(0, 8) ?? null,
    city,
  });

  return new NextResponse(null, { status: 204 });
}
