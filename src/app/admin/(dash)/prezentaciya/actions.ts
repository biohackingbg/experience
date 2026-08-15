"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin-auth";
import { createLink, revokeLink } from "@/lib/deck-links";

export type LinkFormState = { status: "idle" | "ok" | "error"; message?: string };

export const initialLinkFormState: LinkFormState = { status: "idle" };

/** Makes a new share link for the partner deck, labelled with who it is for. */
export async function createDeckLink(
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  // Checked here, not only in the layout: a server action is its own entry
  // point and is reachable without ever rendering the page that offers it.
  if (!(await isAdmin())) return { status: "error", message: "Няма достъп." };

  const label = String(formData.get("label") ?? "").trim();
  if (label.length < 2) return { status: "error", message: "Напиши за кого е линкът." };

  await createLink(label);
  revalidatePath("/admin/prezentaciya");
  return { status: "ok", message: `Линк за „${label}“ е готов.` };
}

/** Closes a link. Its history stays; the URL stops opening. */
export async function revokeDeckLink(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await revokeLink(id);
  revalidatePath("/admin/prezentaciya");
}
