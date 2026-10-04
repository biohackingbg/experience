"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import { type OfferInput, addOffer, deleteOffer, updateOffer } from "@/lib/offers";
import { getPartnerName } from "@/lib/partner-profiles";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const UUID = /^[0-9a-f-]{36}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIER_IDS = ["core", "plus", "peak"];

function done() {
  revalidatePath("/admin/oferti");
  revalidatePath("/admin/partniori");
}

/**
 * A calendar day in Sofia. "Valid from" starts at midnight of that day and
 * "valid to" ends at the last minute of it, so "до 30.11" includes the 30th.
 */
function sofiaDay(day: string, end: boolean): Date {
  // Sofia is UTC+2 in winter and UTC+3 in summer; take the offset the day actually has.
  const noon = new Date(`${day}T12:00:00Z`);
  const local = new Date(noon.toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
  const offsetMs = local.getTime() - new Date(noon.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const clock = end ? "23:59:59.999" : "00:00:00.000";
  return new Date(new Date(`${day}T${clock}Z`).getTime() - offsetMs);
}

function link(raw: string): string | null | false {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.toString().slice(0, 500) : false;
  } catch {
    return false;
  }
}

async function parse(formData: FormData): Promise<{ ok: true; input: OfferInput } | { ok: false; message: string }> {
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  const partnerId = String(formData.get("partnerId") ?? "");
  const typed = s("partner", 120);
  const title = s("title", 160);
  const place = String(formData.get("place") ?? "onsite");
  const from = String(formData.get("validFrom") ?? "").trim();
  const to = String(formData.get("validTo") ?? "").trim();
  const url = link(String(formData.get("url") ?? ""));
  const tiers = formData.getAll("tiers").map(String).filter((t) => TIER_IDS.includes(t));
  const sort = Number.parseInt(String(formData.get("sort") ?? "0"), 10);

  if (partnerId && !UUID.test(partnerId)) return { ok: false, message: "Невалиден партньор." };
  const profileName = partnerId ? await getPartnerName(partnerId) : null;
  if (partnerId && !profileName) return { ok: false, message: "Профилът на партньора вече го няма." };
  const partner = profileName ?? typed;
  if (!partner) return { ok: false, message: "Избери партньор или напиши името му." };
  if (!title) return { ok: false, message: "Напиши какво получава човек (заглавие)." };
  if (place !== "onsite" && place !== "online") return { ok: false, message: "Избери къде се ползва." };
  if ((from && !DATE.test(from)) || (to && !DATE.test(to))) return { ok: false, message: "Датите не са разпознати." };
  if (from && to && to < from) return { ok: false, message: "Крайната дата е преди началната." };
  if (url === false) return { ok: false, message: "Линкът не прилича на адрес." };

  return {
    ok: true,
    input: {
      partner,
      partnerId: partnerId || null,
      deckLinkId: null,
      title,
      titleEn: s("titleEn", 160),
      body: s("body", 600),
      bodyEn: s("bodyEn", 600),
      how: s("how", 200),
      howEn: s("howEn", 200),
      code: s("code", 60),
      url,
      // Every tier ticked is the same as none: open to every ticket holder.
      tiers: tiers.length === 0 || tiers.length === TIER_IDS.length ? null : tiers.join(","),
      place,
      validFrom: from ? sofiaDay(from, false) : null,
      validTo: to ? sofiaDay(to, true) : null,
      active: formData.get("active") !== null,
      sort: Number.isInteger(sort) ? Math.max(-999, Math.min(999, sort)) : 0,
    },
  };
}

export async function createOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("oferti"))) return { status: "error", message: "Няма достъп." };
  const p = await parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await addOffer(p.input);
  done();
  return { status: "ok", message: p.input.active ? "Добавена. Вече се вижда в приложението." : "Добавена като скрита." };
}

export async function editOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("oferti"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const p = await parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await updateOffer(id, p.input);
  done();
  return { status: "ok", message: "Записано." };
}

export async function removeOffer(formData: FormData): Promise<void> {
  if (!(await canAccess("oferti"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await deleteOffer(id);
  done();
}

export async function toggleOffer(formData: FormData): Promise<void> {
  if (!(await canAccess("oferti"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await updateOffer(id, { active: formData.get("active") === "1" });
  done();
}
