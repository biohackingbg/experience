import { fail, json, readBody, requireUser } from "@/lib/api-v1";
import { registerDevice, unregisterDevice } from "@/lib/push";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const body = await readBody<{ token?: string; platform?: string; lang?: string }>(request);
  const token = String(body?.token ?? "").trim();
  if (!token || token.length > 400) return fail(400, "invalid");
  await registerDevice(auth.user.email, token, body?.platform === "android" ? "android" : "ios", body?.lang === "en" ? "en" : "bg");
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const body = await readBody<{ token?: string }>(request);
  const token = String(body?.token ?? "").trim();
  if (token) await unregisterDevice(token);
  return json({ ok: true });
}
