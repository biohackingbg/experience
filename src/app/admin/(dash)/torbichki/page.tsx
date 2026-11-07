import type { Metadata } from "next";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { goodyBagCounts } from "@/lib/tickets-lookup";

import { GoodyScanner } from "./GoodyScanner";

export const metadata: Metadata = {
  title: "Goody bags | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The goody bag table: scan the ticket, hand the bag over, one per ticket. */
export default async function GoodyBagsPage() {
  await requireAccess("torbichki");
  const c = await goodyBagCounts();
  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Раздаване</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Goody bags</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-bh-ink/60">
          Сканирай билета. Зелено: дай торбичка. Жълто: този билет вече е взел, виж кога. Една торбичка на билет.
        </p>
        <div className="mt-5 grid grid-cols-4 gap-2">
          <div className="rounded-2xl bg-bh-cloud px-3 py-3 ring-1 ring-bh-ink/8">
            <div className="text-2xl font-black tracking-tight text-bh-ink">{c.given}</div>
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/50">от {c.total}</div>
          </div>
          {c.byTier.map((t) => (
            <div key={t.tierId} className="rounded-2xl bg-bh-cloud px-3 py-3 ring-1 ring-bh-ink/8">
              <div className="text-2xl font-black tracking-tight text-bh-ink">{t.given}</div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/50">{t.tierId} от {t.total}</div>
            </div>
          ))}
        </div>
        <GoodyScanner />
      </div>
    </div>
  );
}
