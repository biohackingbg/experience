import { NextResponse } from "next/server";

import { findActiveLink, recordView, referrerHost } from "@/lib/deck-links";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Receives the deck's view beacon. Always answers 204 — a beacon has no one
 * to report an error to, and refusing loudly would only tell a prober which
 * tokens exist.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`deck-view:${ip}`).allowed) return new NextResponse(null, { status: 204 });

  let body: { token?: unknown; referrer?: unknown; device?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const token = typeof body?.token === "string" ? body.token : "";
  const link = token ? await findActiveLink(token) : null;
  if (!link) return new NextResponse(null, { status: 204 });

  const ownHost = new URL(request.url).hostname;
  const device = body?.device === "mobile" || body?.device === "desktop" ? body.device : null;

  await recordView({
    linkId: link.id,
    referrerHost: referrerHost(typeof body?.referrer === "string" ? body.referrer : null, ownHost),
    device,
  });

  return new NextResponse(null, { status: 204 });
}
