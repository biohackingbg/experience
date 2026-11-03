// Creates (or updates) the Sofia Life Summit ticket class at Google Wallet.
// Run once after the issuer account and the service account exist, and again
// whenever src/lib/google-wallet-class.ts changes:
//
//   npx tsx --env-file=.env.local scripts/google-wallet-class.ts
//
// Needs GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_EMAIL, GOOGLE_WALLET_SA_KEY_B64.
import { createSign } from "node:crypto";

import { eventTicketClass, GOOGLE_CLASS_ID } from "../src/lib/google-wallet-class";

const email = process.env.GOOGLE_WALLET_SA_EMAIL?.trim();
const keyB64 = process.env.GOOGLE_WALLET_SA_KEY_B64?.trim();
if (!email || !keyB64 || !process.env.GOOGLE_WALLET_ISSUER_ID) {
  throw new Error("Set GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_EMAIL and GOOGLE_WALLET_SA_KEY_B64 first.");
}
const key = Buffer.from(keyB64, "base64").toString("utf8");

const b64url = (v: string) => Buffer.from(v).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const claims = b64url(
  JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }),
);
const sig = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(key).toString("base64url");

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: `${head}.${claims}.${sig}`,
  }),
});
const token = (await tokenRes.json()) as { access_token?: string; error_description?: string };
if (!token.access_token) throw new Error(`No access token: ${token.error_description ?? tokenRes.status}`);

const base = "https://walletobjects.googleapis.com/walletobjects/v1/eventTicketClass";
const auth = { authorization: `Bearer ${token.access_token}`, "content-type": "application/json" };
const body = JSON.stringify(eventTicketClass());

// Insert; if the class already exists, update it in place.
let res = await fetch(base, { method: "POST", headers: auth, body });
if (res.status === 409) res = await fetch(`${base}/${encodeURIComponent(GOOGLE_CLASS_ID)}`, { method: "PUT", headers: auth, body });
console.log(res.status, await res.text());
if (!res.ok) process.exit(1);
