import { fail, json, limited, readBody } from "@/lib/api-v1";
import { recordConsent } from "@/lib/consent-log";
import { MARKETING_CONSENT_VERSION } from "@/lib/marketing-consent";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/** The app's own consent screen writes to the same log as the site's banner, marked as the app's. */
export async function POST(request: Request) {
  if (limited(request, "consent", 20)) return fail(429, "too_many");
  const body = await readBody<{ id?: string; analytics?: boolean; marketing?: boolean }>(request);
  const id = String(body?.id ?? "");
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return fail(400, "invalid");
  await recordConsent({
    consentId: id,
    version: MARKETING_CONSENT_VERSION,
    analytics: body?.analytics === true,
    marketing: body?.marketing === true,
    visitor: null,
    path: "app",
  });
  return json({ ok: true, version: MARKETING_CONSENT_VERSION });
}
