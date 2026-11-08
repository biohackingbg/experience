import type { Metadata } from "next";
import Link from "next/link";

import { requireAccess } from "@/lib/access";
import { listWorkshops } from "@/lib/workshops";

import { StandPage, todayDay } from "../zala/StandPage";

export const metadata: Metadata = {
  title: "Записване | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Every workshop, experience and stand slot on one page, for the team to book
 * and cancel people by code, phone or name - the stands' own pages, all at
 * once. A room or a stand narrows it; the day defaults to today, and slots
 * already over are left out.
 */
export default async function BookingAdminPage({ searchParams }: { searchParams: Promise<{ l?: string; d?: string }> }) {
  await requireAccess("zala");
  const { l = "", d = "" } = await searchParams;
  const list = await listWorkshops(true);
  const day = d === "1" || d === "2" ? Number(d) : (todayDay() ?? 2);
  const locations = [...new Set(list.filter((w) => w.active && w.startsAt && w.day === day && w.location).map((w) => w.location as string))].sort((a, b) => a.localeCompare(b, "bg"));
  const location = locations.includes(l) ? l : undefined;
  const href = (p: { l?: string; d?: number }) => {
    const q = new URLSearchParams();
    if (p.l) q.set("l", p.l);
    q.set("d", String(p.d ?? day));
    return `/admin/zapis?${q.toString()}`;
  };
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${on ? "bg-bh-ink text-bh-paper ring-bh-ink" : "bg-bh-cloud text-bh-ink ring-bh-ink/15 hover:ring-bh-ink/40"}`;
  return (
    <div>
      <div className="px-5 pt-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {[1, 2].map((n) => (
              <Link key={n} href={href({ l: location, d: n })} className={chip(day === n)}>
                {n === 1 ? "Събота 07.11" : "Неделя 08.11"}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={href({ d: day })} className={chip(!location)}>
              Всички
            </Link>
            {locations.map((x) => (
              <Link key={x} href={href({ l: x, d: day })} className={chip(location === x)}>
                {x}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <StandPage location={location} list={list} day={day} back={false} sessionLinks heading={location ?? "Записване"} hidePast />
    </div>
  );
}
