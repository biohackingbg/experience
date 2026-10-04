import { revokeSession } from "@/lib/app-auth";
import { json, requireUser } from "@/lib/api-v1";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  await revokeSession(auth.user.sessionId);
  return json({ ok: true });
}
