import { NextResponse } from "next/server";

import { canAccess } from "@/lib/access";
import { getTrafficReport, isPeriod, type PeriodId } from "@/lib/traffic";

export const dynamic = "force-dynamic";

/** Excel on a Bulgarian Windows splits on ';' and needs the BOM for UTF-8. */
const SEP = ";";
const BOM = "﻿";

const cell = (v: string | number): string => {
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

/**
 * The days of the chosen period as a table: visitors, ticket-page visitors,
 * tickets and money per day, then the channels. Guarded here too - a route
 * handler is its own entry point.
 */
export async function GET(request: Request) {
  if (!(await canAccess("poseshteniya"))) return new NextResponse("Няма достъп.", { status: 403 });

  const params = new URL(request.url).searchParams;
  const p = params.get("p") ?? undefined;
  const period: PeriodId = isPeriod(p) ? p : "30";
  const r = await getTrafficReport(period, params.get("bot") !== "1");

  const lines: string[] = [];
  lines.push(["Ден", "Хора", "Отваряния", "Стигнали до билетите", "Продадени билети", "Поръчки", "Приход (€)"].join(SEP));
  for (const d of r.daily) {
    lines.push([d.day, d.visitors, d.views, d.ticketVisitors, d.tickets, d.sales, money(d.grossCents)].map(cell).join(SEP));
  }
  lines.push("");
  lines.push(["Канал", "Хора", "Стигнали до билетите", "Билети с код", "Приход (€)"].join(SEP));
  for (const c of r.channels) {
    lines.push([c.channel, c.visitors, c.ticketVisitors, c.tickets, money(c.grossCents)].map(cell).join(SEP));
  }
  lines.push(["Продажби без код", "", "", r.unknownSales.tickets, money(r.unknownSales.grossCents)].map(cell).join(SEP));

  return new NextResponse(BOM + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="poseshteniya-${period}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
