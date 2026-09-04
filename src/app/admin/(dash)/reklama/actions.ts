"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin-auth";
import { type CampaignInput, addCampaign, deleteCampaign, suggestCode, updateCampaign } from "@/lib/marketing";
import { isKind, isPlatform } from "@/lib/marketing-options";

export type FormState = { status: "idle" | "ok" | "error"; message?: string };

const UUID = /^[0-9a-f-]{36}$/;

/** Euros as typed - "1 250", "1250,50" - to cents; empty is zero. */
function cents(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").replace(/\s/g, "").replace(",", ".");
  if (!raw) return 0;
  const n = Math.round(Number(raw) * 100);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function int(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").replace(/[\s.]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
const str = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max) || null;

function parse(formData: FormData): { ok: true; input: CampaignInput } | { ok: false; message: string } {
  const platform = formData.get("platform");
  const kind = formData.get("kind");
  const title = str(formData.get("title"), 160);
  const dateRaw = String(formData.get("date") ?? "");
  const timeRaw = String(formData.get("time") ?? "12:00");
  const postedAt = dateRaw ? new Date(`${dateRaw}T${/^\d{2}:\d{2}$/.test(timeRaw) ? timeRaw : "12:00"}:00+03:00`) : new Date();
  const spendCents = cents(formData.get("spend"));

  if (!isPlatform(platform)) return { ok: false, message: "Избери платформа." };
  if (!isKind(kind)) return { ok: false, message: "Избери вид." };
  if (!title) return { ok: false, message: "Напиши за какво е публикацията." };
  if (Number.isNaN(postedAt.getTime())) return { ok: false, message: "Датата не е валидна." };
  if (spendCents === null) return { ok: false, message: "Сумата не е число." };

  const codeRaw = String(formData.get("utm") ?? "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  const url = str(formData.get("url"), 500);
  if (url && !/^https?:\/\//.test(url)) return { ok: false, message: "Линкът трябва да започва с http(s)://" };

  return {
    ok: true,
    input: {
      postedAt,
      platform,
      kind,
      title,
      url,
      utmCampaign: codeRaw || (formData.get("utm") === null ? null : suggestCode(platform, postedAt)),
      spendCents,
      reach: int(formData.get("reach")),
      likes: int(formData.get("likes")),
      comments: int(formData.get("comments")),
      saves: int(formData.get("saves")),
      clicks: int(formData.get("clicks")),
      note: str(formData.get("note"), 300),
    },
  };
}

export async function createCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { status: "error", message: "Няма достъп." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await addCampaign(p.input);
  revalidatePath("/admin/reklama");
  return { status: "ok", message: "Записано." };
}

export async function editCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { status: "error", message: "Няма достъп." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", message: "Невалиден ред." };
  const p = parse(formData);
  if (!p.ok) return { status: "error", message: p.message };
  await updateCampaign(id, p.input);
  revalidatePath("/admin/reklama");
  return { status: "ok", message: "Записано." };
}

export async function removeCampaign(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await deleteCampaign(id);
  revalidatePath("/admin/reklama");
}
