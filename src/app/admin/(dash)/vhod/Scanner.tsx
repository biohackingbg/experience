"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { initialScanState, type ScanState } from "@/lib/scan-state";
import { scanTicket } from "./actions";

type Seen = { code: string; status: ScanState["status"]; name?: string };

/**
 * Door scanner.
 *
 * Text input first, deliberately: a handheld barcode scanner types the code and
 * presses Enter, which this handles with no integration at all, and a person can
 * always read the code aloud from the ticket. Camera scanning is layered on top
 * where the browser supports it — Safari does not, and a door queue is the wrong
 * place to discover that.
 */
export function Scanner() {
  const [state, formAction, pending] = useActionState(
    scanTicket,
    initialScanState,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [recent, setRecent] = useState<Seen[]>([]);
  const [admitted, setAdmitted] = useState(0);
  const lastHandled = useRef<number | undefined>(undefined);

  // Keep the caret in the field: staff never tap it, the scanner just types.
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const id = setInterval(focus, 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.scannedAt || state.scannedAt === lastHandled.current) return;
    lastHandled.current = state.scannedAt;

    // Deferred to a frame rather than run inline: updating state straight from
    // an effect body is the pattern React warns about.
    const frame = requestAnimationFrame(() => {
      if (state.code) {
        setRecent((prev) =>
          [
            { code: state.code!, status: state.status, name: state.name },
            ...prev,
          ].slice(0, 8),
        );
      }
      if (state.status === "ok") setAdmitted((n) => n + 1);

      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.focus();

      if (navigator.vibrate) {
        navigator.vibrate(state.status === "ok" ? 60 : [60, 60, 60]);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [state]);

  const tone =
    state.status === "ok"
      ? "bg-emerald-600 text-white"
      : state.status === "used"
        ? "bg-amber-500 text-amber-950"
        : state.status === "invalid" || state.status === "error"
          ? "bg-red-600 text-white"
          : "bg-bh-cloud text-bh-ink/45 ring-1 ring-bh-ink/10";

  return (
    <div className="mt-8">
      <form
        ref={formRef}
        action={formAction}
        className="flex gap-3"
        // A handheld scanner ends its input with Enter, which submits this.
      >
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
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-2xl bg-bh-ink px-6 text-sm font-semibold text-bh-paper disabled:opacity-50"
        >
          Провери
        </button>
      </form>

      {/* Result — sized to be readable at arm's length in a busy foyer. */}
      <div
        className={`mt-5 flex min-h-[9rem] flex-col items-center justify-center rounded-3xl px-6 py-8 text-center transition-colors ${tone}`}
        role="status"
        aria-live="assertive"
      >
        {state.status === "idle" && <p className="text-sm">Готов за сканиране</p>}

        {state.status === "ok" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Заповядай</p>
            <p className="mt-2 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">
              {state.tierName} · {state.code}
            </p>
          </>
        )}

        {state.status === "used" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">
              Вече е влязъл
            </p>
            <p className="mt-2 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">
              {state.usedAt &&
                new Date(state.usedAt).toLocaleString("bg-BG", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
            </p>
          </>
        )}

        {(state.status === "invalid" || state.status === "error") && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">
              Невалиден
            </p>
            <p className="mt-2 text-sm opacity-90">
              {state.message ?? "Кодът не е разпознат."}
            </p>
            {state.code && (
              <p className="mt-1 font-mono text-sm opacity-75">{state.code}</p>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50">
          Влезли в тази сесия
        </span>
        <span className="text-2xl font-black tracking-tight text-bh-ink">
          {admitted}
        </span>
      </div>

      {recent.length > 0 && (
        <ul className="mt-4 divide-y divide-bh-ink/8 rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
          {recent.map((r, i) => (
            <li
              key={`${r.code}-${i}`}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="font-mono text-bh-ink/70">{r.code}</span>
              <span className="flex items-center gap-3">
                {r.name && <span className="text-bh-ink/60">{r.name}</span>}
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    r.status === "ok"
                      ? "bg-emerald-600"
                      : r.status === "used"
                        ? "bg-amber-500"
                        : "bg-red-600"
                  }`}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
