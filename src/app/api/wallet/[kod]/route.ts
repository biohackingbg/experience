import { NextResponse } from "next/server";

import { findTicket } from "@/lib/tickets-lookup";
import { buildWalletPass, walletConfigured } from "@/lib/wallet-pass";

export const dynamic = "force-dynamic";

/**
 * The ticket as a file Wallet understands.
 *
 * Guarded by the same thing as the ticket page: the code, which is long,
 * random and only ever sent to the buyer. A ticket that no longer admits
 * anyone - the order refunded - gets no pass either, since the lookup only
 * resolves sold tickets.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ kod: string }> }) {
  if (!walletConfigured()) return new NextResponse("Not available", { status: 404 });
  const { kod } = await params;
  const ticket = await findTicket(decodeURIComponent(kod));
  if (!ticket) return new NextResponse("Not found", { status: 404 });

  const pkpass = await buildWalletPass(ticket);
  return new NextResponse(new Uint8Array(pkpass), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      "content-disposition": `attachment; filename="sofia-life-summit-${ticket.code}.pkpass"`,
      // Names change and passes are re-fetched; never serve yesterday's.
      "cache-control": "no-store",
    },
  });
}
