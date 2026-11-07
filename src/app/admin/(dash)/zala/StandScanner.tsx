"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef } from "react";

import { Camera } from "../vhod/Camera";
import { bookAtStand, scanStand } from "./actions";
import { initialRoomState } from "./room-state";

const time = (iso: string) => new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });

/**
 * The scanner on a partner stand's page: camera, handheld scanner or a typed
 * code. The ticket says which of its slots at this stand it holds; that one
 * is marked as arrived, and the list below updates.
 */
export function StandScanner({ stand, title, free = [] }: { stand: string; title?: string; free?: { id: string; label: string }[] }) {
  const [scan, action, pending] = useActionState(scanStand, initialRoomState);
  const [booked, bookAction, booking] = useActionState(bookAtStand, initialRoomState);
  // Whichever answered last is on the screen: a scan, or a booking made from it.
  const state = (booked.scannedAt ?? 0) > (scan.scannedAt ?? 0) ? booked : scan;
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
    if (!state.scannedAt || state.scannedAt === handled.current) return;
    handled.current = state.scannedAt;
    if (inputRef.current) inputRef.current.value = "";
    if (navigator.vibrate) navigator.vibrate(state.status === "ok" ? 60 : [60, 60, 60]);
    router.refresh();
  }, [state, router]);

  const tone =
    state.status === "ok"
      ? "bg-emerald-600 text-white"
      : state.status === "already"
        ? "bg-amber-500 text-amber-950"
        : state.status === "idle"
          ? "bg-bh-cloud text-bh-ink/45 ring-1 ring-bh-ink/10"
          : "bg-red-600 text-white";

  return (
    <div className="mt-6">
      <form ref={formRef} action={action} className="flex gap-3">
        <input type="hidden" name="stand" value={stand} />
        {title && <input type="hidden" name="title" value={title} />}
        <input
          ref={inputRef}
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Сканирай или въведи код"
          className="w-full rounded-2xl border border-bh-ink/15 bg-bh-cloud px-4 py-3 font-mono text-base uppercase tracking-[0.12em] text-bh-ink outline-none focus:border-bh-pine"
        />
        <button type="submit" disabled={pending} className="shrink-0 rounded-2xl bg-bh-ink px-5 text-sm font-semibold text-bh-paper disabled:opacity-50">
          Провери
        </button>
      </form>
      <Camera onCode={onCode} />
      <div className={`mt-4 flex min-h-[6rem] flex-col items-center justify-center rounded-3xl px-5 py-5 text-center ${tone}`} role="status" aria-live="assertive">
        {state.status === "idle" && <p className="text-sm">Сканирай билета от приложението</p>}
        {state.status === "ok" && (
          <>
            <p className="text-2xl font-black uppercase tracking-tight">Записан, заповядай</p>
            <p className="mt-1 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-90">{state.slot} · {state.tierName}</p>
          </>
        )}
        {state.status === "already" && (
          <>
            <p className="text-2xl font-black uppercase tracking-tight">Вече е отбелязан</p>
            <p className="mt-1 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-90">{state.slot}{state.at ? ` · дошъл в ${time(state.at)}` : ""}</p>
          </>
        )}
        {state.status === "not_booked" && (
          <>
            <p className="text-2xl font-black uppercase tracking-tight">Не е записан тук</p>
            <p className="mt-1 text-lg font-semibold">{state.name}</p>
            <p className="text-sm opacity-90">{state.tierName}. Запиши го в свободен час:</p>
            {free.length === 0 ? (
              <p className="mt-2 text-sm font-semibold">Няма свободни часове.</p>
            ) : (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {free.map((f) => (
                  <form key={f.id} action={bookAction}>
                    <input type="hidden" name="stand" value={stand} />
                    {title && <input type="hidden" name="title" value={title} />}
                    <input type="hidden" name="code" value={state.code} />
                    <input type="hidden" name="workshopId" value={f.id} />
                    <button type="submit" disabled={booking} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50">
                      {f.label}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </>
        )}
        {(state.status === "no_ticket" || state.status === "error") && (
          <>
            <p className="text-2xl font-black uppercase tracking-tight">Невалиден</p>
            <p className="mt-1 text-sm opacity-90">{state.message ?? "Кодът не е билет."}</p>
            {state.code && <p className="font-mono text-sm opacity-75">{state.code}</p>}
          </>
        )}
      </div>
    </div>
  );
}
