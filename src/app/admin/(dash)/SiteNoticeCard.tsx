"use client";

import { useActionState } from "react";

import type { Notice } from "@/lib/notice";

import { type ActionState, saveSiteNotice } from "./actions";

const idle: ActionState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

/**
 * The strip above the site: one sentence, two languages, on or off. Shown
 * next to the price stages because the two are almost always used together -
 * a price step is announced by this bar.
 */
export function SiteNoticeCard({ notice }: { notice: Notice }) {
  const [state, action, pending] = useActionState(saveSiteNotice, idle);

  return (
    <form action={action} className={`rounded-3xl p-6 ring-1 ${notice.on ? "bg-[#cef870]/25 ring-[#8fb832]/40" : "bg-white ring-[#0b2a22]/6"}`}>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/55">Лента над сайта</p>
      <p className="mt-1 text-lg font-bold tracking-tight text-bh-ink">{notice.on ? "Включена" : "Изключена"}</p>
      <p className="mt-0.5 text-xs text-bh-ink/55">
        Едно изречение над всичко, с връзка към билетите. За „цените се вдигат на 15 октомври“ или
        „работилниците в събота са пълни“. Празна лента не се показва.
      </p>

      <div className="mt-4 grid gap-2">
        <input name="bg" defaultValue={notice.bg} maxLength={200} placeholder="Цените се вдигат на 15 октомври." className={field} />
        <input name="en" defaultValue={notice.en} maxLength={200} placeholder="Prices go up on 15 October. (по избор)" className={field} />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-bh-ink/80">
        <input type="checkbox" name="on" defaultChecked={notice.on} className="h-3.5 w-3.5 accent-[#146455]" />
        покажи я на сайта
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-5 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "…" : "Запиши"}
        </button>
        {state.status !== "idle" && (
          <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
