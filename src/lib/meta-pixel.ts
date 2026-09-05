import "server-only";

import { createHash } from "node:crypto";

/**
 * Meta's pixel, and the same events sent again from the server.
 *
 * Both halves are inert until the two settings exist, so nothing here can
 * break a page or a payment before anyone has connected an account. The
 * server copy matters because a browser pixel is blocked for a large share
 * of visitors; sending the purchase again from the webhook, with the same
 * event id, lets Meta keep one of the two and drop the duplicate.
 */
export const pixelId = () => process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
const accessToken = () => process.env.META_CAPI_TOKEN?.trim() || null;

/** Meta wants email and phone hashed, lowercase and trimmed first. */
const hash = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export type PurchaseEvent = {
  eventId: string;
  email: string;
  /** Whole currency units, as Meta expects. */
  value: number;
  currency: string;
  /** From the browser, when we have them - they raise the match rate. */
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  eventSourceUrl?: string;
};

/**
 * Sends one purchase to the Conversions API. Never throws: a failed advert
 * event must not fail the webhook that hands someone their ticket.
 */
export async function sendPurchase(event: PurchaseEvent): Promise<void> {
  const id = pixelId();
  const token = accessToken();
  if (!id || !token) return;

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.eventSourceUrl ?? "https://thelongevitysummit.eu/bilet",
        user_data: {
          em: [hash(event.email)],
          ...(event.fbp ? { fbp: event.fbp } : {}),
          ...(event.fbc ? { fbc: event.fbc } : {}),
          ...(event.clientIp ? { client_ip_address: event.clientIp } : {}),
          ...(event.userAgent ? { client_user_agent: event.userAgent } : {}),
        },
        custom_data: { value: event.value, currency: event.currency.toUpperCase() },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${id}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[meta] purchase rejected:", res.status, (await res.text()).slice(0, 300));
    }
  } catch (error) {
    console.error("[meta] purchase threw:", error);
  }
}
