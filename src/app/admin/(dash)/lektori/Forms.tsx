"use client";

import { useActionState, useRef, useState } from "react";

import type { SpeakerRow } from "@/lib/speakers-data";

import { type FormState, createSpeaker, editSpeaker, removeSpeaker, uploadPhoto } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

function Fields({ s }: { s?: SpeakerRow }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-[7rem_1fr_9rem]">
        <input name="title" defaultValue={s?.title ?? ""} placeholder="Проф. д-р" className={field} />
        <input name="name" defaultValue={s?.name ?? ""} required placeholder="име и фамилия" className={field} />
        <input name="country" defaultValue={s?.country ?? ""} placeholder="държава" className={field} />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input name="specialty" defaultValue={s?.specialty ?? ""} placeholder="специалност (напр. Ендокринолог)" className={field} />
        <input name="topic" defaultValue={s?.topic ?? ""} placeholder="тема / за какво говори" className={field} />
        <input name="role" defaultValue={s?.role ?? ""} placeholder="позиция (напр. Председател)" className={field} />
        <input name="affiliation" defaultValue={s?.affiliation ?? ""} placeholder="институция / компания" className={field} />
      </div>
      <details className="mt-2" open={!!(s?.titleEn || s?.specialtyEn || s?.roleEn || s?.topicEn)}>
        <summary className="cursor-pointer text-xs font-semibold text-bh-ink/60">На английски (по избор)</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input name="titleEn" defaultValue={s?.titleEn ?? ""} placeholder="Prof. Dr." className={field} />
          <input name="specialtyEn" defaultValue={s?.specialtyEn ?? ""} placeholder="speciality in English" className={field} />
          <input name="roleEn" defaultValue={s?.roleEn ?? ""} placeholder="position in English" className={field} />
          <input name="topicEn" defaultValue={s?.topicEn ?? ""} placeholder="topic in English" className={field} />
          <input name="affiliationEn" defaultValue={s?.affiliationEn ?? ""} placeholder="institution in English" className={field} />
        </div>
      </details>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-bh-ink/70">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="announced" defaultChecked={s?.announced ?? false} className="h-3.5 w-3.5 accent-[#146455]" />
          обявен - показва се на сайта
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="pending" defaultChecked={s?.pending ?? false} className="h-3.5 w-3.5 accent-[#146455]" />
          още се потвърждава - никога не се показва
        </label>
      </div>
    </>
  );
}

export function NewSpeakerForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createSpeaker, idle);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">+ Нов лектор</button>;
  return (
    <form action={action} className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <Fields />
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Записва…" : "Добави"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

/** Shrinks the chosen image in the browser to ~1000 px JPEG before it travels. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 1000;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/jpeg", 0.86),
  );
}

export function PhotoUpload({ id }: { id: string }) {
  const [state, setState] = useState<FormState>(idle);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const blob = await shrink(file);
            const fd = new FormData();
            fd.set("id", id);
            fd.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
            setState(await uploadPhoto(fd));
          } catch {
            setState({ status: "error", message: "Файлът не можа да се прочете." });
          } finally {
            setBusy(false);
            if (input.current) input.current.value = "";
          }
        }}
      />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={small}>
        {busy ? "Качва…" : "Снимка"}
      </button>
      <Msg s={state} />
    </span>
  );
}

export function SpeakerEditor({ s }: { s: SpeakerRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editSpeaker, idle);
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <PhotoUpload id={s.id} />
        <button type="button" onClick={() => setOpen(true)} className={small}>Редактирай</button>
        <form
          action={removeSpeaker}
          onSubmit={(e) => {
            if (!window.confirm(`Изтриваш ${s.name}?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={s.id} />
          <button type="submit" className="rounded-full px-2 py-1.5 text-xs text-bh-ink/45 hover:text-red-600">Изтрий</button>
        </form>
      </div>
    );
  }
  return (
    <form action={action} className="mt-2 w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="id" value={s.id} />
      <Fields s={s} />
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Записва…" : "Запиши"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
