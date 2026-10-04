"use server";

import { revalidatePath } from "next/cache";

import { canAccess } from "@/lib/access";
import {
  type PartnerInput,
  addPartner,
  clearLogo,
  deletePartner,
  setLogo,
  setPartnerListed,
  updatePartner,
} from "@/lib/partner-profiles";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };
const UUID = /^[0-9a-f-]{36}$/;

function done() {
  revalidatePath("/admin/partniori");
  revalidatePath("/admin/oferti");
}

/** "example.com" and "https://example.com/" both end up as a link that opens. */
function url(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.toString().slice(0, 300) : null;
  } catch {
    return null;
  }
}

/** "@brand", "brand" or a full profile link - stored as the link. */
function instagram(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/instagram\.com\//i.test(v)) return url(v);
  const handle = v.replace(/^@/, "").replace(/[^A-Za-z0-9._]/g, "");
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

function parse(formData: FormData): { ok: true; input: PartnerInput } | { ok: false; message: string } {
  const s = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  const name = s("name", 120);
  const deck = String(formData.get("deckLinkId") ?? "");
  const rawSite = String(formData.get("website") ?? "");
  const website = url(rawSite);
  const sort = Number.parseInt(String(formData.get("sort") ?? "0"), 10);

  if (!name) return { ok: false, message: "Напиши името, което се вижда." };
  if (deck && !UUID.test(deck)) return { ok: false, message: "Невалиден партньор от презентацията." };
  if (rawSite.trim() && !website) return { ok: false, message: "Сайтът не прилича на адрес." };

  return {
    ok: true,
    input: {
      deckLinkId: deck || null,
      name,
      category: s("category", 60),
      categoryEn: s("categoryEn", 60),
      tagline: s("tagline", 140),
      taglineEn: s("taglineEn", 140),
      description: s("description", 1200),
      descriptionEn: s("descriptionEn", 1200),
      website,
      instagram: instagram(String(formData.get("instagram") ?? "")),
      listed: formData.get("listed") !== null,
      sort: Number.isInteger(sort) ? Math.max(-999, Math.min(999, sort)) : 0,
    },
  };
}

const taken = (e: unknown) => /partners_deck_link_idx|duplicate key/i.test(String((e as Error)?.message ?? e));

export async function createPartner(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("partniori"))) return { status: "error", message: "Няма достъп." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  try {
    await addPartner(p.input);
  } catch (e) {
    if (taken(e)) return { status: "error", message: "Този партньор от презентацията вече има профил." };
    throw e;
  }
  done();
  return { status: "ok", message: "Профилът е добавен. Качи лого от бутона „Лого“." };
}

export async function editPartner(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await canAccess("partniori"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  try {
    await updatePartner(id, p.input);
  } catch (e) {
    if (taken(e)) return { status: "error", message: "Този партньор от презентацията вече има друг профил." };
    throw e;
  }
  done();
  return { status: "ok", message: "Записано." };
}

export async function removePartner(formData: FormData): Promise<void> {
  if (!(await canAccess("partniori"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await deletePartner(id);
  done();
}

export async function toggleListed(formData: FormData): Promise<void> {
  if (!(await canAccess("partniori"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await setPartnerListed(id, formData.get("listed") === "1");
  done();
}

/** The logo, already redrawn in the browser as a PNG of at most 600 px. */
export async function uploadLogo(formData: FormData): Promise<FormState> {
  if (!(await canAccess("partniori"))) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  const file = formData.get("logo");
  if (!UUID.test(id) || !(file instanceof File)) return { status: "error", message: "Липсва файл." };
  // SVG is redrawn to PNG before it gets here: served from our own domain it could carry script.
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return { status: "error", message: "Само PNG, JPG, WebP или SVG." };
  if (file.size > 1_500_000) return { status: "error", message: "Файлът е над 1,5 MB." };
  await setLogo(id, Buffer.from(await file.arrayBuffer()), file.type);
  done();
  return { status: "ok", message: "Логото е качено." };
}

export async function removeLogo(formData: FormData): Promise<void> {
  if (!(await canAccess("partniori"))) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await clearLogo(id);
  done();
}
