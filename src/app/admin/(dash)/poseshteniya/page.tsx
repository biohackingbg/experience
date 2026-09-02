import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getTrafficData } from "@/lib/site-views";

import { Funnel } from "./Funnel";
import { HomeLink } from "@/components/admin/HomeLink";

export const metadata: Metadata = {
  title: "Посещения | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-bh-ink/55">{sub}</div>}
    </div>
  );
}

/** A plain ranked list: name on the left, count on the right, bar behind it. */
function Ranked({
  title,
  note,
  rows,
  empty,
}: {
  title: string;
  note?: string;
  rows: { key: string; label: string; n: number; sub?: string }[];
  empty: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.n), 0);
  return (
    <section className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
      <h2 className="text-sm font-bold tracking-tight text-bh-ink">{title}</h2>
      {note && <p className="mt-1 text-xs text-bh-ink/55">{note}</p>}
      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-bh-ink/50">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.key} className="relative overflow-hidden rounded-lg px-3 py-2 text-sm">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-lg bg-bh-ink/8"
                style={{ width: `${max ? Math.max((r.n / max) * 100, 2) : 0}%` }}
              />
              <span className="relative flex items-baseline justify-between gap-3">
                <span className="truncate text-bh-ink">{r.label}</span>
                <span className="shrink-0 font-semibold text-bh-ink">
                  {r.n}
                  {r.sub && <span className="ml-2 font-normal text-bh-ink/55">{r.sub}</span>}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DaysChart({ data }: { data: { day: string; views: number; visitors: number }[] }) {
  const max = data.reduce((m, d) => Math.max(m, d.views), 0);
  return (
    <section className="mt-6 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
      <h2 className="text-sm font-bold tracking-tight text-bh-ink">Посещения по дни</h2>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-bh-ink/50">
          Още няма данни за този период.
        </p>
      ) : (
        <div className="mt-5 flex h-40 items-end gap-[3px]">
          {data.map((d) => {
            const [, m, day] = d.day.split("-");
            return (
              <div key={d.day} className="group relative flex flex-1 flex-col justify-end">
                <div
                  className="rounded-t bg-[#0E8C7D]"
                  style={{ height: `${max ? Math.max((d.views / max) * 100, 3) : 0}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-bh-ink px-2 py-1 text-[0.65rem] text-bh-paper group-hover:block">
                  {Number(day)}.{Number(m)} · {d.views} отваряния · {d.visitors} души
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * What the site did this month: how many people came, what they opened, and
 * how far down the path to a ticket they got.
 */
export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ dni?: string }>;
}) {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  if (!(await isAdmin())) redirect("/admin/login");

  const { dni } = await searchParams;
  const days = RANGES.includes(Number(dni) as (typeof RANGES)[number]) ? Number(dni) : 30;
  const d = await getTrafficData(days);

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">
              Посещения
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/poseshteniya?dni=${r}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  r === days
                    ? "bg-bh-ink text-bh-paper"
                    : "border border-bh-ink/20 text-bh-ink hover:border-bh-ink"
                }`}
              >
                {r} дни
              </Link>
            ))}
            <HomeLink />
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
          Броим сами, без Google Analytics и без бисквитки - затова сайтът няма
          нужда от прозорче за съгласие. Един и същ човек се разпознава само в
          рамките на деня и само като число, не като име или адрес.
        </p>

        {!d.tracking && (
          <p className="mt-6 rounded-2xl bg-bh-lime-pale/40 px-6 py-5 text-sm leading-relaxed text-bh-ink">
            Още няма записани посещения. Броенето започва от момента, в който
            това качим на живо - предишният трафик не може да се възстанови,
            защото никога не е бил записван.
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Хора" value={d.visitors} sub={`за ${days} дни · днес ${d.todayVisitors}`} />
          <Tile
            label="Отваряния на страници"
            value={d.views}
            sub={d.visitors ? `${(d.views / d.visitors).toFixed(1)} страници на човек` : "средно на човек -"}
          />
          <Tile
            label="Купили"
            value={d.funnel[3]?.value ?? 0}
            sub={
              d.visitors && d.funnel[3]?.value
                ? `${((d.funnel[3].value / d.visitors) * 100).toFixed(1)}% от посетителите`
                : "от посетителите до платена поръчка"
            }
          />
          <Tile
            label="В списъка за ранни билети"
            value={d.signups}
            sub={`нови записвания за ${days} дни`}
          />
        </div>

        <Funnel steps={d.funnel} />

        <DaysChart data={d.daily} />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Ranked
            title="Най-отваряни страници"
            note="отваряния · в скоби различни хора"
            rows={d.topPages.map((p) => ({
              key: p.path,
              label: p.path,
              n: p.views,
              sub: `(${p.visitors})`,
            }))}
            empty="Още няма отворени страници."
          />
          <Ranked
            title="Откъде идват"
            note="само посещенията, дошли от друг сайт; останалите са директни или от съобщение"
            rows={d.referrers.map((r) => ({ key: r.host, label: r.host, n: r.n }))}
            empty="Всички идват директно - от линк в съобщение, от бележка или напечатан адрес."
          />
          <Ranked
            title="Откъде са"
            note="различни хора по град"
            rows={d.places.map((p) => ({ key: p.place, label: p.place, n: p.n }))}
            empty="Още няма данни."
          />
          <Ranked
            title="С какво гледат"
            rows={d.devices.map((x) => ({
              key: x.device,
              label:
                x.device === "mobile" ? "телефон" : x.device === "desktop" ? "компютър" : x.device,
              n: x.n,
            }))}
            empty="Още няма данни."
          />
        </div>
      </div>
    </div>
  );
}
