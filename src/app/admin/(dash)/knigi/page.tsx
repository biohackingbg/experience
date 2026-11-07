import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { getStripe } from "@/lib/stripe";

import { AutoRefresh } from "./AutoRefresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Книги | Администрация",
  robots: { index: false, follow: false },
};

/**
 * The book table at the summit: a helper holds up a phone or a tablet and the
 * buyer scans the code and pays on their own phone. The links are Stripe
 * Payment Links (made in the Stripe dashboard, books tax category, 9% VAT
 * included, 1-10 copies, name and email asked), so the money and the receipt
 * are Stripe's - nothing here touches an order.
 */
const BOOKS = [
  {
    id: "beztegovnost",
    title: "Безтегловност",
    author: "д-р Росио Салас-Уейлън",
    price: 25,
    cover: "/knigi/beztegovnost.jpg",
    url: "https://buy.stripe.com/5kQ00l1tDbsvdOpbjy18c00",
    link: "plink_1UYvnqPQhzRmdtRLjM1ocRZo",
  },
  {
    id: "protokolite",
    title: "Протоколите на Хюберман",
    author: "д-р Андрю Хюберман",
    price: 30,
    cover: "/knigi/protokolite.jpg",
    url: "https://buy.stripe.com/7sY9AVb4ddADeSt73i18c01",
    link: "plink_1UYvpyPQhzRmdtRLW774nS60",
  },
  {
    id: "zhivei-do-100",
    title: "Живей до 100",
    author: "Румен Георгиев",
    price: 15,
    cover: "/knigi/zhivei-do-100.jpg",
    url: "https://buy.stripe.com/dRm8wRc8haor11D2N218c02",
    link: "plink_1UZ6C5PQhzRmdtRLHz4wskfp",
  },
  {
    id: "teatrite-na-tyaloto",
    title: "Театрите на тялото",
    author: "Джойс Макдугъл, превод Виолета Азис",
    price: 13,
    cover: "/knigi/teatrite-na-tyaloto.jpg",
    url: "https://buy.stripe.com/3cIaEZ0pz9kn39L1IY18c03",
    link: "plink_1UZ6EAPQhzRmdtRLHUvo8T75",
  },
] as const;

type Paid = { id: string; at: Date; book: string; qty: number; amount: number; name: string; email: string; /** In the last 10 minutes. */ fresh: boolean };

/**
 * The paid ones, newest first, from Stripe itself: the reception sees the
 * buyer's name appear here the moment the payment goes through, and hands
 * the book over. Read on every load; nothing is stored on our side.
 */
async function recentPayments(): Promise<Paid[] | null> {
  try {
    const stripe = getStripe();
    const since = Date.now() - 10 * 60_000;
    const lists = await Promise.all(
      BOOKS.map((b) => stripe.checkout.sessions.list({ payment_link: b.link, status: "complete", limit: 30 }).then((r) => ({ b, rows: r.data }))),
    );
    return lists
      .flatMap(({ b, rows }) =>
        rows
          .filter((r) => r.payment_status === "paid")
          .map((r) => ({
            id: r.id,
            at: new Date(r.created * 1000),
            book: b.title,
            qty: Math.max(1, Math.round((r.amount_total ?? 0) / (b.price * 100))),
            amount: (r.amount_total ?? 0) / 100,
            name: r.customer_details?.name ?? "",
            email: r.customer_details?.email ?? "",
            fresh: r.created * 1000 > since,
          })),
      )
      .sort((x, y) => y.at.getTime() - x.at.getTime());
  } catch (e) {
    console.error("[knigi] stripe list failed:", e);
    return null;
  }
}

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

  const [qrs, paid] = await Promise.all([Promise.all(BOOKS.map((b) => qrSvg(b.url))), recentPayments()]);
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
                      <span className="font-mono text-xs text-bh-ink/60">{hhmm(p.at)}</span>
                      {p.fresh && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-white">платено</span>}
                    </div>
                    <div className="truncate font-semibold text-bh-ink">{p.name || p.email || "без име"}</div>
                    <div className="truncate text-xs text-bh-ink/55">{p.book}{p.qty > 1 ? ` × ${p.qty}` : ""}</div>
                  </div>
                  <div className="shrink-0 text-right font-bold text-bh-ink">{p.amount.toFixed(2)} €</div>
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
