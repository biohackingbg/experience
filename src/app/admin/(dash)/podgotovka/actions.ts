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

export type DealState = { status: "idle" | "ok" | "error"; message?: string };

/**
 * Typed in euros, whole or with a decimal point; stored net, in cents.
 *
 * "bad" rather than null for anything else: a stray "лв", a thousands comma
 * in "1,800" or a slipped letter used to be written as an empty amount, so
 * the number quietly disappeared and the form looked as if it had ignored
 * the click.
 */
function euros(v: FormDataEntryValue | null): number | null | "bad" {
  const raw = String(v ?? "").replace(/\s/g, "").replace("€", "").replace(",", ".");
  if (!raw) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return "bad";
  const n = Math.round(Number(raw) * 100);
  return Number.isFinite(n) ? n : "bad";
}

/**
 * The deal: package, money, barter and what the partner gives. Moved here
 * from Презентация, so the promise is made where it is also ticked off.
 */
export async function saveDeal(_prev: DealState, formData: FormData): Promise<DealState> {
  if (!(await canAccess("podgotovka"))) return { status: "error", message: "Няма достъп - влез пак." };
  const linkId = String(formData.get("linkId") ?? "");
  if (!UUID.test(linkId)) return { status: "error", message: "Партньорът не е разпознат. Презареди страницата." };

  const amountCents = euros(formData.get("amount"));
  if (amountCents === "bad") return { status: "error", message: "Сумата - само цифри: 1800 или 1800.50." };
  const inKindCents = euros(formData.get("inKind"));
  if (inKindCents === "bad") return { status: "error", message: "Бартерът - само цифри: 1800 или 1800.50." };

  const ticketsRaw = String(formData.get("tickets") ?? "").trim();
  const ticketsCount = ticketsRaw ? Number.parseInt(ticketsRaw, 10) : null;
  if (ticketsRaw && !(Number.isInteger(ticketsCount) && (ticketsCount ?? 0) >= 0)) {
    return { status: "error", message: "Билетите - цял брой, 0 или повече." };
  }

  const tier = formData.get("tier");
  const money = formData.get("money");
  const deliverables = formData.getAll("deliverables").filter(isDeliverable);

  await setDeal(linkId, {
    tier: isTier(tier) ? tier : null,
    amountCents,
    money: isMoney(money) ? money : null,
    inKindCents,
    deliverables: deliverables.length ? deliverables.join(",") : null,
    ticketsCount,
  });
  done();
  return {
    status: "ok",
    message: amountCents === null ? "Записано - без сума." : "Записано.",
  };
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
