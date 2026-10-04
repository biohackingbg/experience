import { json, readBody, requireUser } from "@/lib/api-v1";
import { COMMUNITY_CONSENT_VERSION, isMember, joinCommunity, leaveCommunity } from "@/lib/members";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  return json({ member: await isMember(auth.user.email), consentVersion: COMMUNITY_CONSENT_VERSION });
}

/** The explicit yes to the community. The app shows the text for `consentVersion` before this is called. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const body = await readBody<{ name?: string }>(request);
  await joinCommunity(auth.user.email, body?.name ? String(body.name).trim().slice(0, 120) : null, "app");
  return json({ ok: true, member: true });
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  await leaveCommunity(auth.user.email);
  return json({ ok: true, member: false });
}
