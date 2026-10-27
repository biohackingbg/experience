import "server-only";

import { createPrivateKey, createSign } from "node:crypto";
import http2 from "node:http2";

import { and, eq, inArray, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";

/**
 * Apple push, spoken directly: an HTTP/2 session to APNs with a token
 * signed by the team's .p8 key. No SDK, because the whole protocol is one
 * POST per device and a JWT that lives for an hour.
 *
 * Env: APNS_KEY_ID, APNS_KEY_P8 (the key file's text, newlines as \n),
 * APNS_BUNDLE_ID, optional APNS_TEAM_ID (defaults to the Wallet team) and
 * APNS_SANDBOX=1 for development builds.
 *
 * Android goes through Firebase Cloud Messaging (HTTP v1), spoken the same
 * way: a service-account JWT traded for an access token, then one POST per
 * device. Env: FCM_SERVICE_ACCOUNT, the service-account JSON as one string.
 */

const TEAM_ID_DEFAULT = "N8287WDCJT";

export function pushConfigured(): boolean {
  return !!(process.env.APNS_KEY_ID && process.env.APNS_KEY_P8 && process.env.APNS_BUNDLE_ID);
}

export function fcmConfigured(): boolean {
  return !!process.env.FCM_SERVICE_ACCOUNT;
}

let cached: { jwt: string; at: number } | null = null;
function providerToken(): string {
  if (cached && Date.now() - cached.at < 50 * 60_000) return cached.jwt;
  const keyId = process.env.APNS_KEY_ID!;
  const teamId = process.env.APNS_TEAM_ID?.trim() || TEAM_ID_DEFAULT;
  const pem = process.env.APNS_KEY_P8!.replace(/\\n/g, "\n");
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "ES256", kid: keyId })}.${b64({ iss: teamId, iat: Math.floor(Date.now() / 1000) })}`;
  const signer = createSign("SHA256");
  signer.update(unsigned);
  const sig = signer.sign({ key: createPrivateKey(pem), dsaEncoding: "ieee-p1363" }).toString("base64url");
  cached = { jwt: `${unsigned}.${sig}`, at: Date.now() };
  return cached.jwt;
}

export type PushMessage = {
  title: string;
  body: string;
  /** Lands in the app as `data`; a screen to open, an id. */
  data?: Record<string, string>;
  /** Group key, so a second reminder replaces the first. */
  collapseId?: string;
};

type Outcome = { token: string; status: number; reason?: string };

/** Sends one message to many iPhones; reports each token's fate. */
export async function sendPush(tokens: string[], msg: PushMessage): Promise<Outcome[]> {
  if (!pushConfigured() || tokens.length === 0) return tokens.map((token) => ({ token, status: 0, reason: "not_configured" }));
  const host = process.env.APNS_SANDBOX === "1" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const topic = process.env.APNS_BUNDLE_ID!;
  const jwt = providerToken();
  const payload = JSON.stringify({ aps: { alert: { title: msg.title, body: msg.body }, sound: "default" }, ...(msg.data ?? {}) });

  const client = http2.connect(host);
  const one = (token: string) =>
    new Promise<Outcome>((resolve) => {
      const req = client.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        authorization: `bearer ${jwt}`,
        "apns-topic": topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        ...(msg.collapseId ? { "apns-collapse-id": msg.collapseId.slice(0, 64) } : {}),
      });
      let body = "";
      let status = 0;
      req.on("response", (h) => {
        status = Number(h[":status"] ?? 0);
      });
      req.on("data", (c) => {
        body += c;
      });
      req.on("end", () => {
        let reason: string | undefined;
        try {
          reason = body ? (JSON.parse(body).reason as string) : undefined;
        } catch {
          reason = body || undefined;
        }
        resolve({ token, status, reason });
      });
      req.on("error", (e) => resolve({ token, status: 0, reason: String(e) }));
      req.end(payload);
    });
  try {
    return await Promise.all(tokens.map(one));
  } finally {
    client.close();
  }
}


type ServiceAccount = { project_id: string; client_email: string; private_key: string };

let fcmAccess: { token: string; at: number } | null = null;
async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  if (fcmAccess && Date.now() - fcmAccess.at < 50 * 60_000) return fcmAccess.token;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(createPrivateKey(sa.private_key)).toString("base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const body = (await res.json()) as { access_token?: string };
  if (!res.ok || !body.access_token) throw new Error(`fcm_auth_${res.status}`);
  fcmAccess = { token: body.access_token, at: Date.now() };
  return fcmAccess.token;
}

/**
 * Sends one message to many Android devices. A token FCM no longer knows
 * comes back as status 410, the same signal the APNs side uses, so the
 * caller retires both kinds the same way.
 */
export async function sendFcm(tokens: string[], msg: PushMessage): Promise<Outcome[]> {
  if (!fcmConfigured() || tokens.length === 0) return tokens.map((token) => ({ token, status: 0, reason: "not_configured" }));
  let sa: ServiceAccount;
  let access: string;
  try {
    sa = JSON.parse(process.env.FCM_SERVICE_ACCOUNT!) as ServiceAccount;
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
    access = await fcmAccessToken(sa);
  } catch (e) {
    return tokens.map((token) => ({ token, status: 0, reason: String(e) }));
  }
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const one = async (token: string): Promise<Outcome> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${access}`, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: msg.title, body: msg.body },
            data: msg.data ?? {},
            android: {
              priority: "HIGH",
              ...(msg.collapseId ? { collapse_key: msg.collapseId.slice(0, 64) } : {}),
              notification: { channel_id: "default" },
            },
          },
        }),
      });
      if (res.ok) return { token, status: 200 };
      const err = (await res.json().catch(() => ({}))) as { error?: { status?: string } };
      const reason = err.error?.status;
      return { token, status: reason === "NOT_FOUND" || reason === "UNREGISTERED" ? 410 : res.status, reason };
    } catch (e) {
      return { token, status: 0, reason: String(e) };
    }
  };
  return Promise.all(tokens.map(one));
}

/** Pushes to every live device of these addresses, retiring tokens Apple or Google say are gone. */
export async function pushToEmails(emails: string[], msg: PushMessage): Promise<{ sent: number; failed: number }> {
  if (emails.length === 0) return { sent: 0, failed: 0 };
  const db = getDb();
  const rows = await db
    .select({ token: deviceTokens.token, platform: deviceTokens.platform })
    .from(deviceTokens)
    .where(and(inArray(deviceTokens.email, emails), isNull(deviceTokens.disabledAt)));
  const out = [
    ...(await sendPush(rows.filter((r) => r.platform !== "android").map((r) => r.token), msg)),
    ...(await sendFcm(rows.filter((r) => r.platform === "android").map((r) => r.token), msg)),
  ];
  const dead = out.filter((o) => o.status === 410 || o.reason === "BadDeviceToken" || o.reason === "Unregistered").map((o) => o.token);
  if (dead.length) await db.update(deviceTokens).set({ disabledAt: new Date() }).where(inArray(deviceTokens.token, dead));
  return { sent: out.filter((o) => o.status === 200).length, failed: out.length - out.filter((o) => o.status === 200).length };
}

export async function registerDevice(email: string, token: string, platform: string, lang: string): Promise<void> {
  await getDb()
    .insert(deviceTokens)
    .values({ email, token, platform, lang })
    .onConflictDoUpdate({ target: deviceTokens.token, set: { email, platform, lang, lastSeenAt: new Date(), disabledAt: null } });
}

export async function unregisterDevice(token: string): Promise<void> {
  await getDb().update(deviceTokens).set({ disabledAt: new Date() }).where(eq(deviceTokens.token, token));
}
