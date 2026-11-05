"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import { Camera } from "../vhod/Camera";
import { scanRoom } from "./actions";
import { initialRoomState, type RoomState } from "./room-state";

type Seen = { code: string; status: RoomState["status"]; name?: string };

const time = (iso: string) => new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });

/**
 * The scanner at a room's door. The same three ways in as the main entrance
 * (vhod/Scanner.tsx): the phone camera, a handheld scanner typing into the
 * field, or a code read aloud. Bound to one session; every check says
 * whether this ticket has a place here.
 */
export function RoomScanner({ workshopId }: { workshopId: string }) {
  const [state, formAction, pending] = useActionState(scanRoom, initialRoomState);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [recent, setRecent] = useState<Seen[]>([]);
  const [admitted, setAdmitted] = useState(0);
  const lastHandled = useRef<number | undefined>(undefined);
  const router = useRouter();

  const onCode = useCallback((code: string) => {
    if (!inputRef.current || !formRef.current) return;
    inputRef.current.value = code;
    formRef.current.requestSubmit();
  }, []);

  useEffect(() => {
    const focus = () => {
      // Not while the person is reading a result that needs a decision.
      if (document.activeElement?.tagName === "BUTTON") return;
      inputRef.current?.focus();
    };
    focus();
    const id = setInterval(focus, 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.scannedAt || state.scannedAt === lastHandled.current) return;
    lastHandled.current = state.scannedAt;
    const frame = requestAnimationFrame(() => {
      if (state.code) setRecent((prev) => [{ code: state.code!, status: state.status, name: state.name }, ...prev].slice(0, 8));
      if (state.status === "ok") setAdmitted((n) => n + 1);
      if (inputRef.current) inputRef.current.value = "";
      if (navigator.vibrate) navigator.vibrate(state.status === "ok" ? 60 : [60, 60, 60]);
      // The list and counters are server-rendered: pull them in for this and every other phone at the door.
      router.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [state, router]);

  const tone =
    state.status === "ok"
      ? "bg-emerald-600 text-white"
      : state.status === "already"
        ? "bg-amber-500 text-amber-950"
        : state.status === "not_booked"
          ? "bg-bh-ink text-bh-paper"
          : state.status === "idle"
            ? "bg-bh-cloud text-bh-ink/45 ring-1 ring-bh-ink/10"
            : "bg-red-600 text-white";

  const dot = (s: RoomState["status"]) =>
    s === "ok" ? "bg-emerald-600" : s === "already" ? "bg-amber-500" : s === "not_booked" ? "bg-bh-ink" : "bg-red-600";

  return (
    <div className="mt-6">
      <form ref={formRef} action={formAction} className="flex gap-3">
        <input type="hidden" name="workshopId" value={workshopId} />
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
          Провери
        </button>
      </form>

      <Camera onCode={onCode} />

      <div className={`mt-5 flex min-h-[9rem] flex-col items-center justify-center rounded-3xl px-6 py-8 text-center transition-colors ${tone}`} role="status" aria-live="assertive">
        {state.status === "idle" && <p className="text-sm">Готов за сканиране</p>}

        {state.status === "ok" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Записан, заповядай</p>
            <p className="mt-2 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">{state.tierName} · {state.code}</p>
          </>
        )}

        {state.status === "already" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Вече е влязъл</p>
            <p className="mt-2 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">{state.at && `в ${time(state.at)}`} · {state.code}</p>
          </>
        )}

        {state.status === "not_booked" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Не е записан тук</p>
            <p className="mt-2 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-80">{state.tierName} · {state.code}</p>
            {state.elsewhere ? (
              <p className="mt-3 text-sm">По това време е записан за: <span className="font-semibold">{state.elsewhere}</span></p>
            ) : (state.left ?? 0) > 0 ? (
              <form action={formAction} className="mt-4">
                <input type="hidden" name="workshopId" value={workshopId} />
                <input type="hidden" name="code" value={state.code} />
                <input type="hidden" name="walkin" value="1" />
                <button type="submit" disabled={pending} className="rounded-full bg-[#ACEC1D] px-5 py-2.5 text-sm font-semibold text-bh-ink disabled:opacity-50">
                  Пусни без запис (свободни {state.left})
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm">Залата е пълна.</p>
            )}
          </>
        )}

        {state.status === "full" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Пълно</p>
            <p className="mt-2 text-sm opacity-90">Няма свободно място за {state.code}.</p>
          </>
        )}

        {state.status === "clash" && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Зает по това време</p>
            <p className="mt-2 text-sm opacity-90">Човекът е записан другаде в същия час. {state.code}</p>
          </>
        )}

        {(state.status === "no_ticket" || state.status === "error") && (
          <>
            <p className="text-3xl font-black uppercase tracking-tight">Невалиден</p>
            <p className="mt-2 text-sm opacity-90">{state.message ?? "Кодът не е билет."}</p>
            {state.code && <p className="mt-1 font-mono text-sm opacity-75">{state.code}</p>}
          </>
        )}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50">Пуснати от този телефон</span>
        <span className="text-2xl font-black tracking-tight text-bh-ink">{admitted}</span>
      </div>

      {recent.length > 0 && (
        <ul className="mt-4 divide-y divide-bh-ink/8 rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
          {recent.map((r, i) => (
            <li key={`${r.code}-${i}`} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-mono text-bh-ink/70">{r.code}</span>
              <span className="flex items-center gap-3">
                {r.name && <span className="text-bh-ink/60">{r.name}</span>}
                <span className={`h-2.5 w-2.5 rounded-full ${dot(r.status)}`} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
