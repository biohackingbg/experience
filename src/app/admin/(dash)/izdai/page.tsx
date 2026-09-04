import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { getBankDetails, listBankOrders } from "@/lib/manual-orders";
import { getPricing } from "@/lib/pricing";
import { formatPrice } from "@/lib/tickets";

import { bankCancel, bankPaid } from "./actions";
import { BankForm, IssueForm } from "./Forms";

export const metadata: Metadata = {
  title: "Издаване на билети | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const bgDate = (d: Date) => d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", timeZone: "Europe/Sofia" });

/** Tickets the team issues by hand: free ones for partners and speakers, bank-transfer ones for companies. */
export default async function IssuePage({
  searchParams,
}: {
  searchParams: Promise<{ vid?: string; ime?: string; imeil?: string; broi?: string; bel?: string; nivo?: string }>;
}) {
  await requireAccess("izdai");
  const sp = await searchParams;
  const [bankOrders, bank, pricing] = await Promise.all([listBankOrders(), getBankDetails(), getPricing()]);
  const prefill = {
    kind: sp.vid === "bank" ? ("bank" as const) : sp.vid === "free" ? ("free" as const) : undefined,
    name: sp.ime,
    email: sp.imeil,
    quantity: sp.broi ? Math.max(1, Math.min(200, Number.parseInt(sp.broi, 10) || 1)) : undefined,
    note: sp.bel,
    tierId: sp.nivo,
  };

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Издаване на билети</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          <strong className="font-semibold text-bh-ink">Безплатни</strong> - за партньори по договор и за лектори:
          билетите се издават веднага и отиват на имейла, без фактура. <strong className="font-semibold text-bh-ink">По банков път</strong> -
          за фирма, която плаща по проформа: местата се запазват до срока, купувачът получава проформата, а когато преводът
          дойде, натискаш „Платена“ и излизат фактурата и билетите, точно както при плащане с карта.
        </p>

        <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Нова поръчка</h2>
          <div className="mt-4"><IssueForm prefill={prefill} prices={pricing.prices} /></div>
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Чакат превод</h2>
          {bankOrders.length === 0 ? (
            <p className="mt-3 text-sm text-bh-ink/55">Няма отворени поръчки по банков път.</p>
          ) : (
            <ul className="mt-3 divide-y divide-bh-ink/8">
              {bankOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 text-sm">
                    <span className="font-mono text-xs text-bh-ink/60">{o.reference}</span>
                    <span className="ml-2 font-medium text-bh-ink">{o.company ?? o.name}</span>
                    {o.company && <span className="ml-1 text-xs text-bh-ink/55">· {o.name}</span>}
                    <div className="text-xs text-bh-ink/60">
                      {o.items} · {formatPrice(o.totalCents)} € · {o.email} · създадена {bgDate(o.createdAt)}
                      {o.bankDueAt && <span className={o.overdue ? " font-semibold text-[#9c3d5c]" : ""}> · срок {bgDate(o.bankDueAt)}{o.overdue ? " (изтекъл - местата са свободни)" : ""}</span>}
                      {o.note && <span> · {o.note}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/proforma/${o.reference}`} target="_blank" className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink">Проформа</Link>
                    <form action={bankPaid}>
                      <input type="hidden" name="reference" value={o.reference} />
                      <button type="submit" className="rounded-full bg-[#146455] px-3.5 py-1.5 text-xs font-semibold text-white">Платена</button>
                    </form>
                    <form action={bankCancel}>
                      <input type="hidden" name="reference" value={o.reference} />
                      <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold text-bh-ink/50 hover:text-red-600">Откажи</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-sm font-bold tracking-tight text-bh-ink">Банкови данни за проформата</h2>
          <p className="mt-1 text-xs text-bh-ink/55">Излизат в проформата и в писмото до купувача. Без тях проформата показва тире.</p>
          <div className="mt-3"><BankForm bank={bank} /></div>
        </section>
      </div>
    </div>
  );
}
