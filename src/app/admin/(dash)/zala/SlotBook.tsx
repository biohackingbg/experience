"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Camera } from "../vhod/Camera";

import { bookAtStand } from "./actions";
import { initialRoomState } from "./room-state";

/**
 * "Запиши" on a free slot: the stand books someone by ticket code without
 * scanning first (a person at the desk who reads the code out, or a call).
 * Same server check as booking from a scan.
 */
export function SlotBook({
  stand,
  title,
  workshopId,
}: {
  stand: string;
  title?: string;
  workshopId: string;
}) {
  const [state, action, pending] = useActionState(
    bookAtStand,
    initialRoomState,
  );
  const [open, setOpen] = useState(false);
  const handled = useRef<number | undefined>(undefined);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // A scan fills the field and books at once, the same as typing and "Запиши".
  const onCode = useCallback((code: string) => {
    if (!inputRef.current || !formRef.current) return;
    inputRef.current.value = code;
    formRef.current.requestSubmit();
  }, []);

  useEffect(() => {
    if (!state.scannedAt || state.scannedAt === handled.current) return;
    handled.current = state.scannedAt;
    router.refresh();
  }, [state, router]);

  const error =
    state.status === "no_ticket"
      ? "Няма такъв билет."
      : state.status === "error"
        ? state.message
        : null;

  if (!open) {
    return (
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-bh-pine underline"
        >
          + запиши човек
        </button>
        {state.status === "ok" && (
          <span className="text-xs text-emerald-700">
            Записан: {state.name}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="mt-2">
      <form
        ref={formRef}
        action={action}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="stand" value={stand} />
        {title && <input type="hidden" name="title" value={title} />}
        <input type="hidden" name="workshopId" value={workshopId} />
        <input
          ref={inputRef}
          name="code"
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Код на билета"
          className="w-36 rounded-xl border border-bh-ink/15 bg-white px-3 py-1.5 font-mono text-sm uppercase tracking-widest text-bh-ink outline-none focus:border-bh-pine"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-bh-ink px-3 py-1.5 text-xs font-semibold text-bh-paper disabled:opacity-50"
        >
          Запиши
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-bh-ink/50"
        >
          отказ
        </button>
        {error && (
          <p className="w-full text-xs font-semibold text-red-700">{error}</p>
        )}
        {state.status === "ok" && (
          <p className="w-full text-xs font-semibold text-emerald-700">
            Записан: {state.name}
          </p>
        )}
      </form>
      <Camera onCode={onCode} />
    </div>
  );
}
