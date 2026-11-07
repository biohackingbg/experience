"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef } from "react";

import { Camera } from "../vhod/Camera";
import { type GoodyState, scanGoody, undoGoody } from "./actions";

const idle: GoodyState = { status: "idle" };
const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" }) : "");

/**
 * The goody bag table: same input as the door (a handheld scanner types and
 * presses Enter, the camera types into the same field, a code can be read
 * aloud), one answer: give the bag, or it was already taken and when.
 */
export function GoodyScanner() {
  const [state, action, pending] = useActionState(scanGoody, idle);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<number | undefined>(undefined);
  const router = useRouter();

  const onCode = useCallback((code: string) => {
    if (!inputRef.current || !formRef.current) return;
    inputRef.current.value = code;
    formRef.current.requestSubmit();
  }, []);

  useEffect(() => {
    const id = setInterval(() => inputRef.current?.focus(), 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.scannedAt || state.scannedAt === handled.current) return;
    handled.current = state.scannedAt;
    if (inputRef.current) inputRef.current.value = "";
    if (navigator.vibrate) navigator.vibrate(state.status === "given" ? 60 : [60, 60, 60]);
    router.refresh();
  }, [state, router]);

  const tone =
    state.status === "given"
      ? "bg-emerald-600 text-white"
      : state.status === "already"
        ? "bg-amber-500 text-amber-950"
        : state.status === "invalid" || state.status === "error"
          ? "bg-red-600 text-white"
          : "bg-bh-cloud text-bh-ink/45 ring-1 ring-bh-ink/10";

  return (
    <div className="mt-8">
      <form ref={formRef} action={action} className="flex gap-3">
        <input
          ref={inputRef}
          name="code"
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Сканирай или въведи код"
          className="w-full rounded-2xl border border-bh-ink/15 bg-bh-cloud px-5 py-4 font-mono text-lg uppercase tracking-[0.15em] text-bh-ink outline-none focus:border-bh-pine"
        />
        <button type="submit" disabled={pending} className="shrink-0 rounded-2xl bg-bh-ink px-6 text-sm font-semibold text-bh-paper disabled:opacity-50">
          Дай
        </button>
      </form>

      <Camera onCode={onCode} />

      <div className={`mt-5 flex min-h-[9rem] flex-col items-center justify-center rounded-3xl px-6 py-8 text-center transition-colors ${tone}`} role="status" aria-live="assertive">
        {state.status === "idle" && <p className="text-sm">Готов за сканиране</p>}
        {(state.status === "given" || state.status === "already") && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">{state.status === "given" ? "Дай торбичка" : "Вече е взел"}</p>
            <TierBadge tier={state.tierName} />
            <p className="mt-3 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">
              {state.status === "already" ? `взета в ${time(state.at)} · ` : ""}
              {state.code}
            </p>
            <form action={undoGoody} className="mt-3">
              <input type="hidden" name="code" value={state.code} />
              <button type="submit" className="text-xs font-semibold uppercase tracking-wide underline opacity-80 hover:opacity-100">
                {state.status === "given" ? "Отбелязано по грешка, върни" : "Върни като невзета"}
              </button>
            </form>
          </>
        )}
        {(state.status === "invalid" || state.status === "error") && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Невалиден</p>
            <p className="mt-2 text-sm opacity-90">{state.message}</p>
            {state.code && <p className="mt-1 font-mono text-sm opacity-75">{state.code}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return null;
  const t = tier.toUpperCase();
  const colour = t.includes("PEAK") ? "bg-[#ACEC1D] text-[#02251F]" : t.includes("PLUS") ? "bg-white text-[#146455]" : "bg-[#02251F] text-white";
  return <p className={`mt-3 rounded-2xl px-6 py-2 text-4xl font-black uppercase tracking-tight ring-2 ring-white/60 ${colour}`}>{t}</p>;
}
