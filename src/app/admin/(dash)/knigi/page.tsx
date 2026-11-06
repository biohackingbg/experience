import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";

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
  },
  {
    id: "protokolite",
    title: "Протоколите на Хюберман",
    author: "д-р Андрю Хюберман",
    price: 30,
    cover: "/knigi/protokolite.jpg",
    url: "https://buy.stripe.com/7sY9AVb4ddADeSt73i18c01",
  },
] as const;

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

  const qrs = await Promise.all(BOOKS.map((b) => qrSvg(b.url)));
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
