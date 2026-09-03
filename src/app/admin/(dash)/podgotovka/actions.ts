"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin-auth";
import { isKind, setContact, setDeliverable } from "@/lib/preparation";

const UUID = /^[0-9a-f-]{36}$/;
const str = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max) || null;

function done() {
  revalidatePath("/admin/podgotovka");
  revalidatePath("/admin/finansi");
}

/** "Получено" and back. A plain form, so it works on the phone at the venue. */
export async function markReceived(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const linkId = String(formData.get("linkId") ?? "");
  const kind = formData.get("kind");
  if (!UUID.test(linkId) || !isKind(kind)) return;
  await setDeliverable(linkId, kind, { received: formData.get("to") === "1" });
  done();
}

export async function saveDeliverable(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
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

export async function saveContact(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const linkId = String(formData.get("linkId") ?? "");
  if (!UUID.test(linkId)) return;
  await setContact(linkId, {
    contactName: str(formData.get("name"), 120),
    contactEmail: str(formData.get("email"), 120),
    contactPhone: str(formData.get("phone"), 40),
  });
  done();
}
