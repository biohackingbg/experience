import { NextResponse } from "next/server";

import { canAccess } from "@/lib/access";
import { allBookSales, bookTotals } from "@/lib/books";

export const dynamic = "force-dynamic";

/** Excel on a Bulgarian Windows splits on ';' and needs the BOM for UTF-8. */
const SEP = ";";
const BOM = "﻿";

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 12,34 - the decimal comma Excel expects in this locale. */
const money = (n: number) => n.toFixed(2).replace(".", ",");

const when = (d: Date) =>
  new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" }).format(d);

/**
 * Every book sold, one row per sale (card from Stripe, bank on an invoice),
 * then the totals per book. Guarded here too: a route handler is its own
 * entry point.
 */
export async function GET() {
  if (!(await canAccess("knigi"))) return new NextResponse("Няма достъп.", { status: 403 });

  const sales = (await allBookSales()).sort((a, b) => a.at.getTime() - b.at.getTime());
  const totals = bookTotals(sales);
  const line = (cells: (string | number | null | undefined)[]) => cells.map(cell).join(SEP);

  const rows = [
    line(["Дата", "Книга", "Бройки", "Платено (с ДДС)", "Върнато", "Остава", "Начин", "Купувач", "Имейл", "Референция"]),
    ...sales.map((s) => line([when(s.at), s.book, s.qty, money(s.gross), money(s.refunded), money(s.amount), s.channel, s.name, s.email, s.ref])),
    "",
    line(["Общо по книги"]),
    line(["Книга", "Бройки", "С карта", "По фактура", "Платено (с ДДС)", "Върнато", "Остава", "Продажби"]),
    ...totals.map((t) => line([t.title, t.copies, t.copiesCard, t.copiesInvoice, money(t.gross), money(t.refunded), money(t.amount), t.sales])),
    line([
      "Общо",
      totals.reduce((a, t) => a + t.copies, 0),
      totals.reduce((a, t) => a + t.copiesCard, 0),
      totals.reduce((a, t) => a + t.copiesInvoice, 0),
      money(totals.reduce((a, t) => a + t.gross, 0)),
      money(totals.reduce((a, t) => a + t.refunded, 0)),
      money(totals.reduce((a, t) => a + t.amount, 0)),
      totals.reduce((a, t) => a + t.sales, 0),
    ]),
  ];

  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  return new NextResponse(BOM + rows.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="knigi-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
