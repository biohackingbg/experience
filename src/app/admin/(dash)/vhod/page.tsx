import type { Metadata } from "next";
import Link from "next/link";

import { getDoorStats } from "@/lib/tickets-lookup";
import { Scanner } from "./Scanner";

export const metadata: Metadata = {
  title: "Вход | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DoorPage() {
  const stats = await getDoorStats();

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Проверка
            </p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-bh-ink">
              Вход
            </h1>
          </div>
          <Link
            href="/admin"
            className="font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/50 transition-colors hover:text-bh-ink"
          >
            Продажби →
          </Link>
        </div>

        <div className="mt-5 flex gap-3">
          <div className="flex-1 rounded-2xl bg-bh-cloud px-5 py-4 ring-1 ring-bh-ink/8">
            <div className="text-2xl font-black tracking-tight text-bh-ink">
              {stats.checkedIn}
            </div>
            <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/50">
              влезли общо
            </div>
          </div>
          <div className="flex-1 rounded-2xl bg-bh-cloud px-5 py-4 ring-1 ring-bh-ink/8">
            <div className="text-2xl font-black tracking-tight text-bh-ink">
              {stats.total - stats.checkedIn}
            </div>
            <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/50">
              очаквани
            </div>
          </div>
        </div>

        <Scanner />
      </div>
    </div>
  );
}
