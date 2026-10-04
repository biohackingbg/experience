import { verifyLoginCode } from "@/lib/app-auth";
import { fail, json, langOf, limited, readBody } from "@/lib/api-v1";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (limited(request, "verify", 20)) return fail(429, "too_many");
  const body = await readBody<{ email?: string; code?: string; device?: string; lang?: string }>(request);
  const r = await verifyLoginCode(String(body?.email ?? ""), String(body?.code ?? ""), body?.device ? String(body.device) : null, langOf(body?.lang));
  if (!r.ok) return fail(r.reason === "too_many" ? 429 : 400, r.reason);
  return json({ token: r.token, email: r.email });
}
