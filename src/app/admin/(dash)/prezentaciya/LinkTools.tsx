"use client";

import { useActionState, useState } from "react";

import { createDeckLink, initialLinkFormState } from "./actions";

/** New share link: a label for who it is for, nothing else to fill in. */
export function NewLinkForm() {
  const [state, action, pending] = useActionState(createDeckLink, initialLinkFormState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="label"
        required
        minLength={2}
        maxLength={80}
        placeholder="за кого е — напр. Alma Lasers"
        className="w-64 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {pending ? "Създава…" : "Нов линк"}
      </button>
      {state.status !== "idle" && (
        <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}

/** Puts the full URL on the clipboard — the thing you actually do with a link. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
      className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
    >
      {done ? "Копиран ✓" : "Копирай линка"}
    </button>
  );
}
