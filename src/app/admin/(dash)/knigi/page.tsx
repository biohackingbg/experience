import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { BOOKS, type BookSale, allBookSales, bookTotals } from "@/lib/books";

import { AutoRefresh } from "./AutoRefresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Книги | Администрация",
  robots: { index: false, follow: false },
};

type Paid = BookSale & { /** In the last 10 minutes. */ fresh: boolean };

/**
 * Every sale, newest first, card ones read from Stripe on every load: the
 * reception sees the buyer's name appear here the moment the payment goes
 * through, and hands the book over. Nothing is stored on our side.
 */
async function payments(): Promise<Paid[] | null> {
  try {
    const since = Date.now() - 10 * 60_000;
    return (await allBookSales()).map((s) => ({ ...s, fresh: s.channel === "карта" && s.at.getTime() > since }));
  } catch (e) {
    console.error("[knigi] stripe list failed:", e);
    return null;
  }
}

const eur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

const ddmm = (d: Date) => d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", timeZone: "Europe/Sofia" });
const hhmm = (d: Date) => d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });

const qrSvg = (url: string) =>
  QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#02251f", light: "#0000" } });

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  await requireAccess("knigi");
  const { k = "" } = await searchParams;
  const one = BOOKS.find((b) => b.id === k);

  // One book, as big as the screen: the phone turned towards the buyer.
  if (one) {
    const qr = await qrSvg(one.url);
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center px-5 py-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Сканирай и плати</p>
        <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink sm:text-4xl">{one.title}</h1>
        <p className="mt-1 text-sm text-bh-ink/60">{one.author}</p>
        <div className="mt-6 w-full max-w-[min(80vw,28rem)] rounded-3xl bg-white p-6 ring-1 ring-bh-ink/10" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="mt-6 text-5xl font-black tracking-tight text-bh-ink">{one.price} €</p>
        <p className="mt-1 text-sm text-bh-ink/60">с ДДС. Карта, Apple Pay или Google Pay. Разписка по имейл.</p>
        <Link href="/admin/knigi" className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50 hover:text-bh-ink">← Двете книги</Link>
      </div>
    );
  }

  const [qrs, paid] = await Promise.all([Promise.all(BOOKS.map((b) => qrSvg(b.url))), payments()]);
  const totals = paid ? bookTotals(paid) : [];
  const all = totals.reduce((a, t) => ({ copies: a.copies + t.copies, gross: a.gross + t.gross, refunded: a.refunded + t.refunded, amount: a.amount + t.amount }), { copies: 0, gross: 0, refunded: 0, amount: 0 });
  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Продажба</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Книги</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
          Купувачът сканира кода с камерата на своя телефон и плаща там. Може да избере и повече бройки.
          Разписката идва на имейла му от Stripe. Натисни книга, за да покажеш кода на цял екран.
        </p>
        {paid && (
          <section className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-bh-ink/8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-bh-ink">Справка: продадени книги</h2>
              <a href="/admin/knigi/eksport" className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink">
                Експорт CSV
              </a>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-bh-ink/50">
                    <th className="py-2 pr-3 font-semibold">Книга</th>
                    <th className="py-2 pr-3 text-right font-semibold">Бройки</th>
                    <th className="py-2 pr-3 text-right font-semibold">с карта / по фактура</th>
                    <th className="py-2 pr-3 text-right font-semibold">Платено</th>
                    <th className="py-2 pr-3 text-right font-semibold">Върнато</th>
                    <th className="py-2 text-right font-semibold">Остава</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bh-ink/8">
                  {totals.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 pr-3 font-semibold text-bh-ink">{t.title}</td>
                      <td className="py-2 pr-3 text-right font-bold text-bh-ink">{t.copies}</td>
                      <td className="py-2 pr-3 text-right text-bh-ink/60">{t.copiesCard} / {t.copiesInvoice}</td>
                      <td className="py-2 pr-3 text-right text-bh-ink/70">{eur(t.gross)}</td>
                      <td className="py-2 pr-3 text-right text-bh-ink/70">{t.refunded ? eur(t.refunded) : "-"}</td>
                      <td className="py-2 text-right font-semibold text-bh-ink">{eur(t.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-bh-ink/15">
                    <td className="py-2 pr-3 font-bold text-bh-ink">Общо</td>
                    <td className="py-2 pr-3 text-right font-black text-bh-ink">{all.copies}</td>
                    <td />
                    <td className="py-2 pr-3 text-right text-bh-ink/70">{eur(all.gross)}</td>
                    <td className="py-2 pr-3 text-right text-bh-ink/70">{all.refunded ? eur(all.refunded) : "-"}</td>
                    <td className="py-2 text-right font-bold text-bh-ink">{eur(all.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-bh-ink/50">Сумите са с ДДС. Картовите плащания са от Stripe, фактурите от Админ → Документи. Продажба, върната изцяло, не се брои.</p>
          </section>
        )}

        <section className="mt-6 rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight text-bh-ink">Платени</h2>
            <AutoRefresh seconds={10} />
          </div>
          <p className="mt-1 text-xs text-bh-ink/55">
            Направо от Stripe. Ново плащане се появява до 10 секунди. Дай книгата, когато видиш името на купувача тук.
          </p>
          {paid === null ? (
            <p className="mt-3 text-sm text-red-700">Stripe не отговори. Презареди страницата.</p>
          ) : paid.length === 0 ? (
            <p className="mt-3 text-sm text-bh-ink/55">Още няма плащания.</p>
          ) : (
            <ul className="mt-3 divide-y divide-bh-ink/8">
              {paid.slice(0, 25).map((p) => (
                <li key={p.id} className={`flex items-center justify-between gap-3 py-2.5 text-sm ${p.fresh ? "" : "opacity-60"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-bh-ink/60">{ddmm(p.at)} {hhmm(p.at)}</span>
                      {p.fresh && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-white">платено</span>}
                    </div>
                    <div className="truncate font-semibold text-bh-ink">{p.name || p.email || "без име"}</div>
                    <div className="truncate text-xs text-bh-ink/55">{p.book}{p.qty > 1 ? ` × ${p.qty}` : ""}{p.channel === "фактура" ? ", по фактура" : ""}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold text-bh-ink">{p.amount.toFixed(2)} €</div>
                    {p.refunded > 0 && <div className="text-[0.65rem] text-bh-ink/50">върнати {p.refunded.toFixed(2)} €</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {BOOKS.map((b, i) => (
            <Link key={b.id} href={`/admin/knigi?k=${b.id}`} className="flex flex-col items-center rounded-3xl bg-bh-cloud p-6 text-center ring-1 ring-bh-ink/8 transition-colors hover:ring-bh-ink/30">
              <div className="relative h-40 w-full">
                {/* next.config only lets the optimizer resize the speaker routes; these covers are 90 KB as they are. */}
                <Image src={b.cover} alt={b.title} fill unoptimized className="object-contain" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-bh-ink">{b.title}</h2>
              <p className="text-sm text-bh-ink/60">{b.author}</p>
              <div className="mt-4 w-full max-w-[16rem] rounded-2xl bg-white p-4" dangerouslySetInnerHTML={{ __html: qrs[i] }} />
              <p className="mt-4 text-3xl font-black tracking-tight text-bh-ink">{b.price} €</p>
              <p className="text-xs text-bh-ink/55">с ДДС</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
