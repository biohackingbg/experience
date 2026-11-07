"use client";

import { cancelAtStand } from "./actions";

/** "Отпиши" beside a name: asks once, because the place goes to whoever books next. */
export function CancelButton({ workshopId, code, name }: { workshopId: string; code: string; name: string }) {
  return (
    <form
      action={cancelAtStand}
      onSubmit={(e) => {
        if (!window.confirm(`Да отпиша ли ${name} от този час? Мястото се освобождава.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="workshopId" value={workshopId} />
      <input type="hidden" name="code" value={code} />
      <button type="submit" className="text-[0.65rem] font-semibold uppercase tracking-wide text-red-700/70 hover:text-red-700">
        отпиши
      </button>
    </form>
  );
}
