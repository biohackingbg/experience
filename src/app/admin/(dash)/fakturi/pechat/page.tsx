import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PrintButton } from "@/app/faktura/[reference]/PrintButton";
import { isAdmin } from "@/lib/admin-auth";
import { getAllInvoices } from "@/lib/invoices";

export const metadata: Metadata = {
  title: "Всички фактури | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Every invoice on its own sheet, one after another — "Печат → Запази като
 * PDF" produces a single file with the whole run. No server-side PDF engine
 * needed, and the document is the very same component the buyer sees.
 */
export default async function PrintAllInvoicesPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const rows = await getAllInvoices();

  return (
    <div className="bh-doc min-h-screen px-5 py-10 text-bh-ink sm:px-8 print:p-0">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <Link
              href="/admin/fakturi"
              className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink"
            >
              ← Фактури
            </Link>
            <p className="mt-2 text-sm text-bh-ink/60">
              {rows.length} фактури, по една на лист. „Печат“ и избери „Запази
              като PDF“ — получаваш един файл с всички.
            </p>
          </div>
          <PrintButton />
        </div>

        {rows.length === 0 ? (
          <p className="rounded-2xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
            Още няма издадени фактури.
          </p>
        ) : (
          rows.map((inv) => (
            <div key={inv.number} className="mb-10 break-after-page last:mb-0 print:mb-0">
              {inv.status === "refunded" && (
                <p className="mb-3 rounded-full bg-[#C4607F]/15 px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-[#9c3d5c] print:hidden">
                  Върната — очаква кредитно известие
                </p>
              )}
              <InvoiceDocument inv={inv} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
