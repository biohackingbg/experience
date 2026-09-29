import { headers } from "next/headers";

import { recordConsent } from "@/lib/consent-log";
import { MARKETING_CONSENT_VERSION } from "@/lib/marketing-consent";
import { visitorHash } from "@/lib/site-views";

export const dynamic = "force-dynamic";

/**
 * Writes one cookie choice to the log.
 *
 * Deliberately undemanding: the choice is already stored in the visitor's
 * cookie by the time this runs, so this endpoint is evidence, not the gate,
 * and a bad request gets a 204 like a good one - there is nothing for the
 * page to do with a failure. What it refuses is anything that is not the
 * shape the banner sends, so the table cannot be filled with noise.
 */
export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const consentId = typeof b.id === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(b.id) ? b.id : null;
  const version = b.version === MARKETING_CONSENT_VERSION ? MARKETING_CONSENT_VERSION : null;
  if (!consentId || !version || typeof b.analytics !== "boolean" || typeof b.marketing !== "boolean") {
    return new Response(null, { status: 204 });
  }
  const path = typeof b.path === "string" && b.path.startsWith("/") ? b.path.slice(0, 120) : null;

  const head = await headers();
  const ip = (head.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const visitor = ip ? visitorHash(ip, head.get("user-agent") ?? "") : null;

  try {
    await recordConsent({ consentId, version, analytics: b.analytics, marketing: b.marketing, visitor, path });
  } catch (error) {
    console.error("[consent] log write failed:", error);
  }
  return new Response(null, { status: 204 });
}
