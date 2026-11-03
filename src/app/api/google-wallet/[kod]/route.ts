import { NextResponse } from "next/server";

import { googleWalletConfigured, googleWalletUrl } from "@/lib/google-wallet";
import { findTicket } from "@/lib/tickets-lookup";

export const dynamic = "force-dynamic";

/**
 * Sends the buyer on to Google Wallet with their ticket. Guarded like the
 * ticket page and the Apple pass: by the code, which is long, random and only
 * ever sent to the buyer, and a ticket that no longer admits anyone gets none.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ kod: string }> }) {
  if (!googleWalletConfigured()) return new NextResponse("Not available", { status: 404 });
  const { kod } = await params;
  const ticket = await findTicket(decodeURIComponent(kod));
  if (!ticket) return new NextResponse("Not found", { status: 404 });

  const res = NextResponse.redirect(googleWalletUrl(ticket), 302);
  // Names change and the link is signed per request; never serve yesterday's.
  res.headers.set("cache-control", "no-store");
  return res;
}
