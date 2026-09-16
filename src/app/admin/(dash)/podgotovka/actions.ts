"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { isMoney, isTier } from "@/lib/deck-links";
import { isDeliverable } from "@/lib/finance-options";
import { isKind, setContact, setDeal, setDeliverable } from "@/lib/preparation";

const UUID = /^[0-9a-f-]{36}$/;
const str = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max) || null;

function done() {
  revalidatePath("/admin/podgotovka");
  revalidatePath("/admin/finansi");
}

/** "Получено" and back. A plain form, so it works on the phone at the venue. */
export async function markReceived(formData: FormData): Promise<void> {
  if (!(await canAccess("podgotovka"))) return;
  const linkId = String(formData.get("linkId") ?? "");
  const kind = formData.get("kind");
  if (!UUID.test(linkId) || !isKind(kind)) return;
  await setDeliverable(linkId, kind, { received: formData.get("to") === "1" });
  done();
}

export async function saveDeliverable(formData: FormData): Promise<void> {
  if (!(await canAccess("podgotovka"))) return;
  const linkId = String(formData.get("linkId") ?? "");
  const kind = formData.get("kind");
  if (!UUID.test(linkId) || !isKind(kind)) return;
  const due = String(formData.get("due") ?? "").trim();
  await setDeliverable(linkId, kind, {
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null,
    note: str(formData.get("note"), 200),
  });
  done();
}

/**
 * The deal: package, money, barter and what the partner gives. Moved here
 * from Презентация, so the promise is made where it is also ticked off.
 */
export async function saveDeal(formData: FormData): Promise<void> {
  if (!(await canAccess("podgotovka"))) return;
  const linkId = String(formData.get("linkId") ?? "");
  if (!UUID.test(linkId)) return;

  // Typed in euros, whole or with a comma; stored net, in cents. A value
  // that is not a number is left alone rather than written as zero.
  const cents = (v: FormDataEntryValue | null) => {
    const raw = String(v ?? "").replace(/\s/g, "").replace(",", ".");
    if (!raw) return null;
    const n = Math.round(Number(raw) * 100);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const tier = formData.get("tier");
  const money = formData.get("money");
  const deliverables = formData.getAll("deliverables").filter(isDeliverable);
  const ticketsRaw = String(formData.get("tickets") ?? "").trim();
  const ticketsCount = ticketsRaw ? Number.parseInt(ticketsRaw, 10) : null;

  await setDeal(linkId, {
    tier: isTier(tier) ? tier : null,
    amountCents: cents(formData.get("amount")),
    money: isMoney(money) ? money : null,
    inKindCents: cents(formData.get("inKind")),
    deliverables: deliverables.length ? deliverables.join(",") : null,
    ticketsCount: Number.isInteger(ticketsCount) && (ticketsCount ?? 0) >= 0 ? ticketsCount : null,
  });
  done();
}

export async function saveContact(formData: FormData): Promise<void> {
  if (!(await canAccess("podgotovka"))) return;
  const linkId = String(formData.get("linkId") ?? "");
  if (!UUID.test(linkId)) return;
  await setContact(linkId, {
    contactName: str(formData.get("name"), 120),
    contactEmail: str(formData.get("email"), 120),
    contactPhone: str(formData.get("phone"), 40),
  });
  done();
}
