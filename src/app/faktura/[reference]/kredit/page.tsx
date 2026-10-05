import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CreditNoteDocument } from "@/components/InvoiceDocument";
import type { Lang } from "@/lib/i18n";
import { getDocumentInvoice } from "@/lib/documents";
import { getInvoice } from "@/lib/invoices";
import { checkRateLimit } from "@/lib/rate-limit";
import { PrintButton } from "../PrintButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Кредитно известие | Sofia Life Summit",
  // Personal data, reached by the order reference only.
  robots: { index: false, follow: false },
};

/**
 * The credit note behind the same reference key as its invoice - and the
 * same throttle, for the same reason: the reference is the only secret.
 */
export default async function CreditNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { reference } = await params;
  const { lang: langParam } = await searchParams;

  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`faktura:${ip}`).allowed) notFound();

  // A ticket order's, or one raised for a sponsor or a service - one run, one sheet.
  const ref = decodeURIComponent(reference).toUpperCase();
  const order = await getInvoice(ref);
  const inv = order ?? (await getDocumentInvoice(ref));
  if (!inv?.creditNoteNumber) notFound();
  const lang: Lang = langParam === "en" || (!langParam && inv.lang === "en") ? "en" : "bg";

  return (
    <div className="bh-doc min-h-screen px-5 py-10 text-bh-ink sm:px-8 print:p-0">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link
            href={`/faktura/${inv.reference}?lang=${lang}`}
            className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/70 transition-colors hover:text-bh-ink"
          >
            ← Към фактурата
          </Link>
          <PrintButton />
        </div>
        <CreditNoteDocument inv={inv} lang={lang} reason={order ? "reason" : "reasonDocument"} />
      </div>
    </div>
  );
}
