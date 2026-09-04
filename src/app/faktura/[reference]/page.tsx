import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { InvoiceDocument } from "@/components/InvoiceDocument";
import { isAdmin } from "@/lib/admin-auth";
import type { Lang } from "@/lib/i18n";
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
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { reference } = await params;
  const { lang: langParam } = await searchParams;

  // The reference is the only key to a page full of personal data. The
  // keyspace is ~1e9, which holds only while nobody can try candidates at
  // machine speed - so lookups are throttled per address, and a throttled
  // request is indistinguishable from a miss.
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`faktura:${ip}`).allowed) notFound();

  const inv = await getInvoice(decodeURIComponent(reference).toUpperCase());
  if (!inv) notFound();

  // The same page serves the buyer and the team. The buyer's way back is
  // the site; the team's is the dashboard they came from. Decided by the
  // admin cookie, which the buyer does not have.
  const admin = await isAdmin();

  // The sheet opens in the language the buyer bought in; the switch is for
  // the accountant on either side who wants the other one.
  const lang: Lang = langParam === "en" || (!langParam && inv.lang === "en") ? "en" : "bg";
  const other = lang === "en" ? "bg" : "en";

  return (
    <div className="bh-doc min-h-screen px-5 py-10 text-bh-ink sm:px-8 print:p-0">
      <div className="mx-auto w-full max-w-3xl">
        {/* Hidden on paper: the sheet should carry nothing but the document. */}
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link
            href={admin ? "/admin" : "/"}
            className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink"
          >
            {admin ? "← Към таблото" : "← Към сайта"}
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/faktura/${inv.reference}?lang=${other}`}
              className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink"
            >
              {lang === "en" ? "Български" : "English"}
            </Link>
            {inv.creditNoteNumber && (
              <Link
                href={`/faktura/${inv.reference}/kredit?lang=${lang}`}
                className="font-mono text-xs uppercase tracking-[0.2em] text-[#9c3d5c] transition-colors hover:text-bh-ink"
              >
                Кредитно известие →
              </Link>
            )}
            <PrintButton />
          </div>
        </div>

        <InvoiceDocument inv={inv} lang={lang} />
      </div>
    </div>
  );
}

