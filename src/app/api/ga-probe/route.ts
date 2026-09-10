import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { gaId } from "@/lib/ga-id";

export const dynamic = "force-dynamic";

/**
 * A temporary hand for one question: does Google accept our server's events?
 *
 * The Measurement Protocol answers 204 to everything, valid or not, so the
 * only way to tell is to send a marked event and look for it in the reports.
 * This sends one from the deployed server - a different network, the same
 * settings a real purchase uses - and reports what Google said.
 *
 * Team-only, and meant to be deleted once the question is settled.
 */
export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Само за екипа.", { status: 403 });

  const id = gaId();
  const secret = process.env.GA_API_SECRET?.trim() || null;
  if (!id || !secret) {
    return NextResponse.json({ ok: false, reason: "Липсва настройка", hasId: Boolean(id), hasSecret: Boolean(secret) });
  }

  const body = {
    client_id: "648969433.1789065224",
    events: [
      {
        name: "server_check_vercel",
        params: { session_id: "1789070061", engagement_time_msec: "100" },
      },
    ],
  };

  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
  );

  const debug = await fetch(
    `https://www.google-analytics.com/debug/mp/collect?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
  ).then((r) => r.text());

  return NextResponse.json({
    measurementId: id,
    secretEndsWith: secret.slice(-4),
    secretLength: secret.length,
    collectStatus: res.status,
    debug: debug.slice(0, 500),
  });
}
