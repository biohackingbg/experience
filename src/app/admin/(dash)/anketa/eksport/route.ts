import { NextResponse } from "next/server";

import { canAccess } from "@/lib/access";
import { questionsFor } from "@/lib/survey-questions";
import { earlyAccessList, surveyResults } from "@/lib/surveys";

export const dynamic = "force-dynamic";

/** Excel on a Bulgarian Windows splits on ';' and needs the BOM for UTF-8. */
const SEP = ";";
const BOM = "﻿";

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join(", ") : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const when = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" }).format(d) : "";

/** The answers, one row per answered link (visitors, partners), or the early-access list. */
export async function GET(request: Request) {
  if (!(await canAccess("anketa"))) return new NextResponse("Няма достъп.", { status: 403 });
  const vid = new URL(request.url).searchParams.get("vid");
  let rows: string[];
  let name: string;

  if (vid === "early") {
    const list = await earlyAccessList();
    rows = [
      ["Имейл", "Потвърден", "Добавен от", "Писмо за потвърждение", "Записан"].join(SEP),
      ...list.map((e) => [e.email, e.confirmedAt ? "да" : "чака", e.invitedBy ?? "сам/а", when(e.inviteSentAt), when(e.createdAt)].map(cell).join(SEP)),
    ];
    name = "ranen-dostap-2027";
  } else {
    const kind = vid === "partner" ? "partner" : "visitor";
    const qs = questionsFor(kind);
    const answered = (await surveyResults(kind)).filter((r) => r.submittedAt);
    const head = [kind === "partner" ? "Марка" : "Билет", "Пратено до", "Попълнено", ...qs.map((q) => q.label), ...(kind === "visitor" ? ["Имейли за ранен достъп"] : [])];
    rows = [
      head.map(cell).join(SEP),
      ...answered.map((r) => {
        const a = (r.answers ?? {}) as Record<string, unknown>;
        return [
          kind === "partner" ? r.brand : `${r.label ?? ""}${r.tierId ? ` [${r.tierId.toUpperCase()}]` : ""}`,
          r.sentTo,
          when(r.submittedAt),
          ...qs.map((q) => a[q.id]),
          ...(kind === "visitor" ? [a.earlyEmails] : []),
        ]
          .map(cell)
          .join(SEP);
      }),
    ];
    name = kind === "partner" ? "anketa-partniori" : "anketa-posetiteli";
  }

  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  return new NextResponse(BOM + rows.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
