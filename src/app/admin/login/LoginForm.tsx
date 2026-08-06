"use client";

import { useActionState } from "react";

import { login, type LoginState } from "../actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8">
      <label
        htmlFor="password"
        className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50"
      >
        Парола
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="mt-2 w-full rounded-2xl border border-bh-ink/15 bg-bh-cloud px-4 py-3 text-bh-ink outline-none focus:border-bh-pine"
      />

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bh-gradient mt-5 w-full rounded-full px-6 py-3 text-sm font-semibold text-bh-ink disabled:opacity-60"
      >
        {pending ? "Проверявам…" : "Влез"}
      </button>
    </form>
  );
}
