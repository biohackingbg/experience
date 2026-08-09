"use server";

import { isAdmin } from "@/lib/admin-auth";
import type { ScanState } from "@/lib/scan-state";
import { checkInTicket } from "@/lib/tickets-lookup";

/**
 * Door scan.
 *
 * Re-checks the session on every call: a Server Action is a public POST
 * endpoint, and the layout that guards the page does not guard the action.
 */
export async function scanTicket(
  _prev: ScanState,
  formData: FormData,
): Promise<ScanState> {
  if (!(await isAdmin())) {
    return { status: "error", message: "Сесията изтече. Влез отново." };
  }

  const raw = String(formData.get("code") ?? "").trim();
  if (!raw) return { status: "idle" };

  const result = await checkInTicket(raw);
  const scannedAt = Date.now();

  if (result.status === "not_found") {
    return {
      status: "invalid",
      code: raw.toUpperCase(),
      message: "Невалиден код.",
      scannedAt,
    };
  }

  if (result.status === "already_used") {
    return {
      status: "used",
      code: result.ticket.code,
      name: result.ticket.buyerName,
      tierName: result.ticket.tierName,
      usedAt: result.ticket.checkedInAt?.toISOString(),
      scannedAt,
    };
  }

  return {
    status: "ok",
    code: result.ticket.code,
    name: result.ticket.buyerName,
    tierName: result.ticket.tierName,
    scannedAt,
  };
}
