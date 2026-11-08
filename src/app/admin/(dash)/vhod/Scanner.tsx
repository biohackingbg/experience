"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import { initialScanState, type ScanState } from "@/lib/scan-state";
import { scanTicket } from "./actions";
import { Camera } from "./Camera";

type Seen = { code: string; status: ScanState["status"]; name?: string };

/**
 * Door scanner.
 *
 * Text input first, deliberately: a handheld barcode scanner types the code and
 * presses Enter, which this handles with no integration at all, and a person can
 * always read the code aloud from the ticket. The camera (Camera.tsx) sits on
 * top and simply types into the same field, so every path ends in one check.
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
  const router = useRouter();

  // A decoded QR is submitted exactly as a typed code would be.
  const onCode = useCallback((code: string) => {
    if (!inputRef.current || !formRef.current) return;
    inputRef.current.value = code;
    formRef.current.requestSubmit();
  }, []);

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
      // The counters and the recent list are server-rendered; pull them in
      // so a second device at the door sees this admission too.
      router.refresh();
    });

    return () => cancelAnimationFrame(frame);
  }, [state, router]);

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

      <Camera onCode={onCode} />

      {/* Result - sized to be readable at arm's length in a busy foyer. */}
      <div
        className={`mt-5 flex min-h-[9rem] flex-col items-center justify-center rounded-3xl px-6 py-8 text-center transition-colors ${tone}`}
        role="status"
        aria-live="assertive"
      >
        {state.status === "idle" && <p className="text-sm">Готов за сканиране</p>}

        {state.status === "ok" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Заповядай</p>
            <TierBadge tier={state.tierName} />
            <p className="mt-3 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">
              {state.day ? `${state.day === 1 ? "Събота 07.11" : "Неделя 08.11"} · ` : ""}{state.code}
            </p>
          </>
        )}

        {state.status === "used" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">
              Вече е влязъл
            </p>
            <TierBadge tier={state.tierName} />
            <p className="mt-3 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">
              първо влизане{" "}
              {state.usedAt &&
                new Date(state.usedAt).toLocaleString("bg-BG", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Europe/Sofia",
                })}
            </p>
            {state.ticket && <TicketCard state={state} />}
          </>
        )}

        {(state.status === "invalid" || state.status === "error") && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">
              {state.name ? "Друг ден" : "Невалиден"}
            </p>
            {state.name && <p className="mt-2 text-lg font-semibold">{state.name}{state.tierName ? `, ${state.tierName}` : ""}</p>}
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

/**
 * The ticket's tier, big enough to read at arm's length: the door tells a
 * PEAK from a CORE at a glance (the PEAK lounge, the workshops), not from a
 * line of small print under the name.
 */
function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return null;
  const t = tier.toUpperCase();
  const colour = t.includes("PEAK") ? "bg-[#ACEC1D] text-[#02251F]" : t.includes("PLUS") ? "bg-white text-[#146455]" : "bg-[#02251F] text-white";
  return <p className={`mt-3 rounded-2xl px-6 py-2 text-4xl font-black uppercase tracking-tight ring-2 ring-white/60 ${colour}`}>{t}</p>;
}

/** The whole ticket on a second scan: who it is for, whose order, what they booked. */
function TicketCard({ state }: { state: ScanState }) {
  const t = state.ticket!;
  const rows: [string, string][] = [
    ["Билет", state.code ?? ""],
    ["Ден", state.day ? (state.day === 1 ? "Събота 07.11" : "Неделя 08.11") : "и двата дни"],
    ["На името на", t.holder],
    ...(t.holderEmail ? ([["Имейл", t.holderEmail]] as [string, string][]) : []),
    ...(t.buyerName !== t.holder ? ([["Купувач", t.buyerName]] as [string, string][]) : []),
    ["Поръчка", t.reference],
  ];
  return (
    <div className="mt-4 w-full max-w-md rounded-2xl bg-white/90 p-4 text-left text-sm text-bh-ink">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-bh-ink/55">{k}</dt>
            <dd className="font-semibold break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {t.bookings.length > 0 && (
        <div className="mt-3 border-t border-bh-ink/10 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-bh-ink/55">Записан за</p>
          <ul className="mt-1 space-y-0.5">
            {t.bookings.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
