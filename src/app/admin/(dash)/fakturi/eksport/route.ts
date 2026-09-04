import { NextResponse } from "next/server";

import { canAccess } from "@/lib/access";
import { invoiceNo } from "@/components/InvoiceDocument";
import { getAllInvoices } from "@/lib/invoices";

export const dynamic = "force-dynamic";

/** Excel on a Bulgarian Windows splits on ';' and needs the BOM for UTF-8. */
const SEP = ";";
const BOM = "﻿";

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Amounts as 12,34 - the decimal comma Excel expects in this locale. */
function money(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function bgDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" }).format(d);
}

/**
 * The full invoice run as CSV - one row per invoice, for the accountant.
 * Guarded here too: a route handler is its own entry point.
 */
export async function GET() {
  if (!(await canAccess("fakturi"))) return new NextResponse("Няма достъп.", { status: 403 });

  const rows = await getAllInvoices();
  const header = [
    "Номер",
    "Дата",
    "Поръчка",
    "Получател",
    "Лице за контакт",
    "ЕИК / ДДС №",
    "Адрес",
    "Имейл",
    "Артикули",
    "Отстъпка",
    "Данъчна основа",
    "ДДС %",
    "ДДС",
    "Общо",
    "Валута",
    "Статус",
    "Върната сума",
    "Дата на връщане",
    "Кредитно известие №",
    "КИ дата",
  ];
  const lines = rows.map((r) =>
    [
      invoiceNo(r.number),
      bgDate(r.issuedAt),
      r.reference,
      r.company ?? r.buyerName,
      r.company ? r.buyerName : "",
      r.vatNumber ?? "",
      r.address ?? "",
      r.buyerEmail,
      r.items.map((i) => `${i.quantity}× ${i.tierName}`).join(", "),
      money(r.discountCents),
      money(r.subtotalCents),
      String(r.vatRateBp / 100),
      money(r.vatCents),
      money(r.totalCents),
      r.currency,
      r.status === "refunded" ? "върната - кредитно известие" : r.refundedCents ? "частично върната" : "платена",
      money(r.refundedCents),
      bgDate(r.refundedAt),
      r.creditNoteNumber ? invoiceNo(r.creditNoteNumber) : "",
      bgDate(r.creditNotedAt),
    ]
      .map(cell)
      .join(SEP),
  );

  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  const body = BOM + [header.map(cell).join(SEP), ...lines].join("\r\n") + "\r\n";

  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="fakturi-sofia-life-summit-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
