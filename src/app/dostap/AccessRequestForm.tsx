"use client";

import { useActionState } from "react";

import { type RequestState, requestAccess } from "./actions";

const idle: RequestState = { status: "idle" };

export function AccessRequestForm() {
  const [state, action, pending] = useActionState(requestAccess, idle);

  if (state.status === "sent") {
    return (
      <p className="mt-6 rounded-2xl bg-bh-cloud p-4 text-sm leading-relaxed text-bh-ink/75 ring-1 ring-bh-ink/8">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="mt-6">
      <label htmlFor="email" className="sr-only">
        Имейл
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="твоят имейл"
        className="w-full rounded-full border border-bh-ink/20 bg-bh-paper px-4 py-3 text-sm text-bh-ink placeholder:text-bh-ink/40 outline-none focus:border-bh-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-full bg-bh-ink px-5 py-3 text-sm font-semibold text-bh-paper disabled:opacity-50"
      >
        {pending ? "Изпраща…" : "Изпрати ми връзка за вход"}
      </button>
      {state.status === "error" && <p className="mt-3 text-xs text-red-600">{state.message}</p>}
    </form>
  );
}
