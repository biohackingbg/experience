import { requestLoginCode } from "@/lib/app-auth";
import { fail, json, langOf, limited, readBody } from "@/lib/api-v1";

export const dynamic = "force-dynamic";

/** Mails a sign-in code. Always answers the same way to a valid address, so nobody can probe who has one. */
export async function POST(request: Request) {
  if (limited(request, "request-code", 10)) return fail(429, "too_many");
  const body = await readBody<{ email?: string; lang?: string }>(request);
  const email = String(body?.email ?? "");
  const r = await requestLoginCode(email, langOf(body?.lang));
  if (!r.ok && r.reason === "invalid") return fail(400, "invalid_email");
  if (!r.ok && r.reason === "too_many") return fail(429, "too_many");
  if (!r.ok) return fail(502, "send_failed");
  return json({ ok: true });
}
