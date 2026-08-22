import { NextResponse } from "next/server";

import { findActiveLink, recordProgress, recordView, referrerHost } from "@/lib/deck-links";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ok = () => new NextResponse(null, { status: 204 });

const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
const int = (v: unknown, max: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0;

/**
 * Receives the deck's beacons: one "open" per opening, then "progress" as the
 * reader leaves or hides the tab. Always answers 204 - a beacon has no one to
 * report an error to, and refusing loudly would only tell a prober which
 * tokens exist.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
  } catch {
    return ok();
  }

  const token = str(body?.token, 64);
  const viewId = str(body?.viewId, 64);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (body?.kind === "progress") {
    // Several per opening are normal (each tab switch); throttle per opening
    // rather than per address so an office behind one IP is not cut off.
    if (!viewId || !token) return ok();
    if (!checkRateLimit(`deck-progress:${viewId}`).allowed) return ok();
    const link = await findActiveLink(token);
    if (!link) return ok();
    await recordProgress({
      linkId: link.id,
      viewId,
      seconds: int(body?.seconds, 6 * 3600),
      scrollPct: int(body?.scrollPct, 100),
      section: str(body?.section, 40),
    });
    return ok();
  }

  if (!checkRateLimit(`deck-view:${ip}`).allowed) return ok();
  const link = token ? await findActiveLink(token) : null;
  if (!link) return ok();

  const ownHost = new URL(request.url).hostname;
  const device = body?.device === "mobile" || body?.device === "desktop" ? body.device : null;
  // Vercel's edge geo headers - a city, not an address. The IP is not stored.
  const country = str(request.headers.get("x-vercel-ip-country"), 8);
  const cityRaw = request.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  try {
    city = cityRaw ? decodeURIComponent(cityRaw).slice(0, 80) : null;
  } catch {
    city = null;
  }

  await recordView({
    linkId: link.id,
    viewId,
    visitor: str(body?.visitor, 64),
    referrerHost: referrerHost(str(body?.referrer, 500), ownHost),
    device,
    country,
    city,
    browser: str(body?.browser, 20),
    os: str(body?.os, 20),
  });

  return ok();
}
