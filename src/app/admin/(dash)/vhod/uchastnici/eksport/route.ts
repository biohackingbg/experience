import { canAccess } from "@/lib/access";
import { listAttendees } from "@/lib/tickets-lookup";

export const dynamic = "force-dynamic";

/** The badge list as CSV - for the printer, the badge template, or a spreadsheet at the door. */
export async function GET() {
  if (!(await canAccess("vhod"))) return new Response("unauthorized", { status: 401 });
  const rows = await listAttendees();
  const cell = (v: string | null | undefined) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [
    ["Име", "Ниво", "Код", "Поръчка", "Купувач", "Имейл", "Фирма", "Име от участника", "Влязъл"].map(cell).join(";"),
    ...rows.map((r) =>
      [
        r.name,
        r.tierName,
        r.code,
        r.reference,
        r.buyerName,
        r.email,
        r.company,
        r.named ? "да" : "не",
        r.checkedInAt ? r.checkedInAt.toISOString() : "",
      ]
        .map(cell)
        .join(";"),
    ),
  ];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="uchastnici.csv"',
    },
  });
}
