import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { InvoiceDocument } from "@/components/InvoiceDocument";
import { PrintButton } from "./PrintButton";
import { getInvoice } from "@/lib/invoices";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Фактура | Sofia Life Summit",
  // Carries a name, an email and sometimes a company address. It should never
  // turn up in a search result.
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  // The reference is the only key to a page full of personal data. The
  // keyspace is ~1e9, which holds only while nobody can try candidates at
  // machine speed — so lookups are throttled per address, and a throttled
  // request is indistinguishable from a miss.
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`faktura:${ip}`).allowed) notFound();

  const inv = await getInvoice(decodeURIComponent(reference).toUpperCase());
  if (!inv) notFound();

  return (
    <div className="bh-doc min-h-screen px-5 py-10 text-bh-ink sm:px-8 print:p-0">
      <div className="mx-auto w-full max-w-3xl">
        {/* Hidden on paper: the sheet should carry nothing but the document. */}
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink"
          >
            ← Към сайта
          </Link>
          <PrintButton />
        </div>

        <InvoiceDocument inv={inv} />
      </div>
    </div>
  );
}

