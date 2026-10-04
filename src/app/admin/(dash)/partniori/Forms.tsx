"use client";

import { useActionState, useRef, useState } from "react";

import type { PartnerRow } from "@/lib/partner-profiles";

import { type FormState, createPartner, editPartner, removeLogo, removePartner, toggleListed, uploadLogo } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

export type DeckOption = { id: string; label: string; stage: string };

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

function Fields({ p, deck }: { p?: PartnerRow; deck: DeckOption[] }) {
  const name = useRef<HTMLInputElement>(null);
  return (
    <>
      <label className="block text-xs font-semibold text-bh-ink/60">
        Партньор от презентацията
        <select
          name="deckLinkId"
          defaultValue={p?.deckLinkId ?? ""}
          className={`${field} mt-1 font-normal`}
          onChange={(e) => {
            // Starting from the pipeline: offer its label as the public name, once.
            const label = e.target.selectedOptions[0]?.dataset.label;
            if (label && name.current && !name.current.value) name.current.value = label;
          }}
        >
          <option value="">- без връзка (няма щанд на плана) -</option>
          {deck.map((d) => (
            <option key={d.id} value={d.id} data-label={d.label}>{d.label}</option>
          ))}
        </select>
      </label>
      <p className="mt-1 text-[0.7rem] text-bh-ink/50">Връзката показва логото на щанда на плана. Нищо от сделката не се показва.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input ref={name} name="name" defaultValue={p?.name ?? ""} required placeholder="име, както да се вижда (Alma Lasers)" className={field} />
        <input name="category" defaultValue={p?.category ?? ""} placeholder="категория (Уреди, Добавки, Студио…)" className={field} />
      </div>
      <input name="tagline" defaultValue={p?.tagline ?? ""} placeholder="един ред под името" className={`${field} mt-2`} />
      <textarea name="description" defaultValue={p?.description ?? ""} rows={4} placeholder="кои са и какво показват на щанда (до 1200 знака)" className={`${field} mt-2`} />
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_6rem]">
        <input name="website" defaultValue={p?.website ?? ""} placeholder="сайт (example.com)" className={field} />
        <input name="instagram" defaultValue={p?.instagram ?? ""} placeholder="Instagram (@brand)" className={field} />
        <input name="sort" type="number" defaultValue={p?.sort ?? 0} title="подредба: по-малкото е по-горе" className={field} />
      </div>
      <details className="mt-2" open={!!(p?.categoryEn || p?.taglineEn || p?.descriptionEn)}>
        <summary className="cursor-pointer text-xs font-semibold text-bh-ink/60">На английски (по избор)</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input name="categoryEn" defaultValue={p?.categoryEn ?? ""} placeholder="category" className={field} />
          <input name="taglineEn" defaultValue={p?.taglineEn ?? ""} placeholder="one line under the name" className={field} />
        </div>
        <textarea name="descriptionEn" defaultValue={p?.descriptionEn ?? ""} rows={3} placeholder="who they are, in English" className={`${field} mt-2`} />
      </details>
      <label className="mt-3 flex items-center gap-2 text-xs text-bh-ink/70">
        <input type="checkbox" name="listed" defaultChecked={p?.listed ?? false} className="h-3.5 w-3.5 accent-[#146455]" />
        показва се в приложението
      </label>
    </>
  );
}

export function NewPartnerForm({ deck }: { deck: DeckOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createPartner, idle);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">+ Нов профил</button>;
  return (
    <form action={action} className="w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8 sm:w-[36rem]">
      <Fields deck={deck} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">{pending ? "Записва…" : "Добави"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

/**
 * Redraws the chosen file as a PNG of at most 600 px. PNG keeps the
 * transparency most logos have, and an SVG comes out as plain pixels.
 */
async function toPng(file: File): Promise<Blob> {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const w = img.naturalWidth || 600;
    const h = img.naturalHeight || 600;
    const scale = Math.min(1, 600 / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png"));
  } finally {
    URL.revokeObjectURL(src);
  }
}

export function LogoUpload({ id, has }: { id: string; has: boolean }) {
  const [state, setState] = useState<FormState>(idle);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const blob = await toPng(file);
            const fd = new FormData();
            fd.set("id", id);
            fd.set("logo", new File([blob], "logo.png", { type: "image/png" }));
            setState(await uploadLogo(fd));
          } catch {
            setState({ status: "error", message: "Файлът не можа да се прочете." });
          } finally {
            setBusy(false);
            if (input.current) input.current.value = "";
          }
        }}
      />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={small}>
        {busy ? "Качва…" : has ? "Смени логото" : "Лого"}
      </button>
      {has && (
        <form action={removeLogo}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="rounded-full px-2 py-1.5 text-xs text-bh-ink/45 hover:text-red-600">махни логото</button>
        </form>
      )}
      <Msg s={state} />
    </span>
  );
}

export function ListedToggle({ id, listed }: { id: string; listed: boolean }) {
  return (
    <form action={toggleListed}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="listed" value={listed ? "0" : "1"} />
      <button type="submit" className={small}>{listed ? "Скрий от приложението" : "Покажи в приложението"}</button>
    </form>
  );
}

export function PartnerEditor({ p, deck }: { p: PartnerRow; deck: DeckOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editPartner, idle);
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <LogoUpload id={p.id} has={p.hasLogo} />
        <ListedToggle id={p.id} listed={p.listed} />
        <button type="button" onClick={() => setOpen(true)} className={small}>Редактирай</button>
        <form
          action={removePartner}
          onSubmit={(e) => {
            const extra = p.offerCount > 0 ? ` Офертите му (${p.offerCount}) остават, но без лого.` : "";
            if (!window.confirm(`Изтриваш профила на ${p.name}?${extra}`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={p.id} />
          <button type="submit" className="rounded-full px-2 py-1.5 text-xs text-bh-ink/45 hover:text-red-600">Изтрий</button>
        </form>
      </div>
    );
  }
  // Its own pipeline row stays choosable while editing.
  const options = p.deckLinkId && !deck.some((d) => d.id === p.deckLinkId)
    ? [{ id: p.deckLinkId, label: p.deckLabel ?? "текущ", stage: "" }, ...deck]
    : deck;
  return (
    <form action={action} className="mt-3 w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="id" value={p.id} />
      <Fields p={p} deck={options} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">{pending ? "Записва…" : "Запиши"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
