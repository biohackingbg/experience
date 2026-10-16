import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/BackLink";
import { getPricing } from "@/lib/pricing";
import { formatPrice } from "@/lib/tickets";
import { upgradeQuote } from "@/lib/upgrades";

import { startUpgrade } from "./actions";

export const metadata: Metadata = {
  title: "Надгради билета си | Sofia Life Summit 2026",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const WHY: Record<string, string> = {
  top_tier: "Този билет вече е на най-високото ниво.",
  used: "Билетът вече е използван на входа и не може да се променя.",
  sold_out: "Местата в по-високото ниво свършиха.",
  nothing_to_pay: "Няма разлика за доплащане.",
  stripe: "Плащането не е настроено в момента. Пиши ни на hi@biohacking.bg.",
  not_found: "Не намираме такъв билет.",
};

/**
 * One ticket, one step up, the difference in price. Reached from the
 * upgrade letters and from the ticket page; the code in the address is
 * the credential, as on the ticket page itself.
 */
export default async function UpgradePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ greshka?: string; otkazano?: string }>;
}) {
  const { code } = await params;
  const { greshka, otkazano } = await searchParams;
  const quote = await upgradeQuote(decodeURIComponent(code));
  if (!quote.ok && quote.reason === "not_found") notFound();
  const pricing = await getPricing();

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5 py-12">
      <div className="w-full max-w-md">
        <BackLink href={`/bilet/${encodeURIComponent(quote.ok ? quote.code : code.toUpperCase())}`}>Към билета</BackLink>
        <div className="mt-6 overflow-hidden rounded-3xl bg-bh-cloud ring-1 ring-bh-ink/10">
          <div className="bh-mint px-7 py-6">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-bh-ink/50">Надграждане на билет</p>
            <h1 className="mt-2 font-display text-2xl font-[900] uppercase leading-none tracking-tight text-bh-ink">
              {quote.ok ? `${quote.from.name} → ${quote.to.name}` : (quote.from?.name ?? "Билет")}
            </h1>
          </div>

          {!quote.ok ? (
            <p className="px-7 py-8 text-sm leading-relaxed text-bh-ink/70">{WHY[quote.reason]}</p>
          ) : (
            <div className="px-7 py-7">
              {(greshka || otkazano) && (
                <p className="mb-5 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
                  {otkazano ? "Плащането беше отказано. Нищо не е таксувано - можеш да опиташ пак." : (WHY[greshka ?? ""] ?? "Нещо не мина. Опитай пак.")}
                </p>
              )}
              <p className="text-sm leading-relaxed text-bh-ink/70">
                Билет <span className="font-mono font-semibold text-bh-ink">{quote.code}</span> е {quote.from.name}, платен {formatPrice(quote.paidCents)} €.
                {" "}{quote.to.name} днес е {formatPrice(quote.targetCents)} €{pricing.discounted ? ` (${pricing.label})` : ""}. Плащаш само разликата; кодът на билета остава същият.
              </p>

              <p className="mt-5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">Какво добавя {quote.to.name}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-bh-ink">
                {quote.to.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-bh-pine" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-end justify-between gap-4 rounded-2xl bg-bh-paper px-5 py-4 ring-1 ring-bh-ink/8">
                <div>
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">Доплащане</div>
                  <div className="mt-1 text-3xl font-black tracking-tight text-bh-ink">{formatPrice(quote.diffCents)} €</div>
                  <div className="mt-1 text-xs text-bh-ink/50">с ДДС · {quote.left} {quote.left === 1 ? "място" : "места"} в {quote.to.name}</div>
                </div>
              </div>

              <form action={startUpgrade} className="mt-5">
                <input type="hidden" name="code" value={quote.code} />
                <button
                  type="submit"
                  className="w-full rounded-full bg-bh-ink px-5 py-3.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
                >
                  Плати {formatPrice(quote.diffCents)} € и надгради
                </button>
              </form>
              <p className="mt-3 text-center text-[0.7rem] leading-relaxed text-bh-ink/45">
                Плащането е през Stripe. Важат <Link href="/usloviya" className="underline underline-offset-2">условията за покупка</Link> на първоначалната поръчка; фактурата за разликата пристига по имейл.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
