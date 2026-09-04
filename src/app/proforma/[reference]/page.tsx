import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ProformaDocument } from "@/components/ProformaDocument";
import { PrintButton } from "@/components/admin/PrintButton";
import { getProforma } from "@/lib/manual-orders";
import { checkRateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "Проформа | Sofia Life Summit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** The proforma for a bank-transfer order, at the reference the mail links to. Same throttle as the invoice. */
export default async function ProformaPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`proforma:${ip}`).allowed) notFound();
  const p = await getProforma(decodeURIComponent(reference).toUpperCase());
  if (!p) notFound();
  return (
    <div className="bh-doc min-h-screen px-5 py-10 text-bh-ink sm:px-8 print:p-0">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink">← Към сайта</Link>
          <div className="flex items-center gap-3">
            {p.paid && <Link href={`/faktura/${p.reference}`} className="font-mono text-xs uppercase tracking-[0.2em] text-bh-pine">Фактура →</Link>}
            <PrintButton />
          </div>
        </div>
        <ProformaDocument p={p} />
      </div>
    </div>
  );
}
