"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { createLink, createLinks, isMoney, isStage, isTier, reactivateLink, regenerateToken, revokeLink, updateLinkPipeline } from "@/lib/deck-links";
import { isDeliverable } from "@/lib/finance-options";

export type LinkFormState = { status: "idle" | "ok" | "error"; message?: string };

/** Makes a new share link for the partner deck, labelled with who it is for. */
export async function createDeckLink(
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  // Checked here, not only in the layout: a server action is its own entry
  // point and is reachable without ever rendering the page that offers it.
  if (!(await canAccess("prezentaciya"))) return { status: "error", message: "Няма достъп." };

  const label = String(formData.get("label") ?? "").trim();
  if (label.length < 2) return { status: "error", message: "Напиши за кого е линкът." };

  await createLink(label);
  revalidatePath("/admin/prezentaciya");
  return { status: "ok", message: `Линк за „${label}“ е готов.` };
}

/** Closes a link. Its history stays; the URL stops opening. */
export async function revokeDeckLink(formData: FormData): Promise<void> {
  if (!(await canAccess("prezentaciya"))) return;
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await revokeLink(id);
  revalidatePath("/admin/prezentaciya");
}

/** Reopens a stopped link. Nothing is ever deleted here - only switched. */
export async function reactivateDeckLink(formData: FormData): Promise<void> {
  if (!(await canAccess("prezentaciya"))) return;
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await reactivateLink(id);
  revalidatePath("/admin/prezentaciya");
}

/** Saves stage, note and next step for one link. */
export async function updateDeckLink(
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  if (!(await canAccess("prezentaciya"))) return { status: "error", message: "Няма достъп." };

  const id = String(formData.get("id") ?? "");
  const stage = formData.get("stage");
  if (!/^[0-9a-f-]{36}$/.test(id) || !isStage(stage)) {
    return { status: "error", message: "Невалидни данни." };
  }
  const clean = (v: FormDataEntryValue | null, max: number) => {
    const t = String(v ?? "").trim().slice(0, max);
    return t.length ? t : null;
  };

  // Money is typed in euros, whole or with a comma; stored net, in cents.
  const amountRaw = String(formData.get("amount") ?? "").replace(/\s/g, "").replace(",", ".");
  const amountCents = amountRaw ? Math.round(Number(amountRaw) * 100) : null;
  if (amountCents !== null && (!Number.isFinite(amountCents) || amountCents < 0)) {
    return { status: "error", message: "Сумата не е число." };
  }
  const tier = formData.get("tier");
  const money = formData.get("money");

  // Barter is valued the same way as cash but stored apart from it.
  const inKindRaw = String(formData.get("inKind") ?? "").replace(/\s/g, "").replace(",", ".");
  const inKindCents = inKindRaw ? Math.round(Number(inKindRaw) * 100) : null;
  if (inKindCents !== null && (!Number.isFinite(inKindCents) || inKindCents < 0)) {
    return { status: "error", message: "Стойността на бартера не е число." };
  }
  const deliverables = formData.getAll("deliverables").filter(isDeliverable);
  const ticketsRaw = String(formData.get("tickets") ?? "").trim();
  const ticketsCount = ticketsRaw ? Number.parseInt(ticketsRaw, 10) : null;
  if (ticketsCount !== null && (!Number.isInteger(ticketsCount) || ticketsCount < 0)) {
    return { status: "error", message: "Билетите трябва да са цяло число." };
  }

  await updateLinkPipeline(id, {
    label: clean(formData.get("label"), 80) ?? undefined,
    stage,
    note: clean(formData.get("note"), 1000),
    nextStep: clean(formData.get("nextStep"), 300),
    owner: clean(formData.get("owner"), 40),
    tier: isTier(tier) ? tier : null,
    amountCents,
    money: isMoney(money) ? money : null,
    inKindCents,
    deliverables: deliverables.length ? deliverables.join(",") : null,
    ticketsCount,
  });
  revalidatePath("/admin/prezentaciya");
  return { status: "ok", message: "Записано." };
}

/** Pasted list of names, one per line, all led by the same person. */
export async function createDeckLinksBulk(
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  if (!(await canAccess("prezentaciya"))) return { status: "error", message: "Няма достъп." };

  const owner = String(formData.get("owner") ?? "").trim().slice(0, 40) || null;
  const lines = String(formData.get("labels") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    // A guard, not a real limit: a paste this long is a mistake.
    .slice(0, 200);

  if (lines.length === 0) return { status: "error", message: "Постави поне едно име." };

  const { created, skipped } = await createLinks(lines, owner);
  revalidatePath("/admin/prezentaciya");

  if (created.length === 0) {
    return { status: "error", message: `Нищо ново - всички ${skipped.length} вече имат линк.` };
  }
  return {
    status: "ok",
    message: skipped.length
      ? `${created.length} нови линка${owner ? ` за ${owner}` : ""} · ${skipped.length} вече съществуваха`
      : `${created.length} нови линка${owner ? ` за ${owner}` : ""}.`,
  };
}

/**
 * Issues a fresh address for a link whose old one never reached the partner
 * (mangled by a messenger, truncated in a mail). Views, stage and notes stay
 * with the link; only the address changes, so the old one stops working.
 */
export async function regenerateDeckLink(formData: FormData): Promise<void> {
  if (!(await canAccess("prezentaciya"))) return;
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await regenerateToken(id);
  revalidatePath("/admin/prezentaciya");
}
