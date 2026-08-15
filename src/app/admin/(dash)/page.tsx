import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";

import { getDashboardData } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/tickets";
import { logout } from "../actions";
import { DailyChart } from "./DailyChart";
import { TierBars } from "./TierBars";

export const metadata: Metadata = {
  title: "Продажби | Администрация",
  robots: { index: false, follow: false },
};

// Always read live numbers — a cached dashboard is a misleading dashboard.
export const dynamic = "force-dynamic";

function Money({ cents }: { cents: number }) {
  return <>{formatPrice(cents)} €</>;
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">
        {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-bh-ink/55">{sub}</div>}
    </div>
  );
}

export default async function AdminDashboard() {
  // The layout also checks, but a layout is not an auth boundary — the
  // Next docs are explicit that it may be skipped on RSC navigations.
  if (!(await isAdmin())) redirect("/admin/login");

  const d = await getDashboardData();
  const soldPct = d.capacityTotal
    ? Math.round((d.ticketsSold / d.capacityTotal) * 100)
    : 0;

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bh-ink/15 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Администрация
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-bh-ink">
              Продажби
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              ["/admin/fakturi", "Фактури"],
              ["/admin/zapisvaniya", "Записвания"],
              ["/admin/prezentaciya", "Презентация"],
              ["/admin/vhod", "Вход на събитието"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-bh-ink/20 px-5 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
              >
                {label}
              </Link>
            ))}
            <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-bh-ink/20 px-5 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              Изход
              </button>
            </form>
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            label="Приходи"
            value={<Money cents={d.grossCents} />}
            sub={`нето ${formatPrice(d.netCents)} € · ДДС ${formatPrice(d.vatCents)} €`}
          />
          <Tile
            label="Продадени билета"
            value={d.ticketsSold}
            sub={`${soldPct}% от ${d.capacityTotal} места`}
          />
          <Tile
            label="Поръчки"
            value={d.paidOrders}
            sub={
              [
                d.pendingOrders ? `${d.pendingOrders} в процес` : null,
                d.abandonedOrders ? `${d.abandonedOrders} изоставени` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "няма незавършени"
            }
          />
          <Tile
            label="В списъка за ранни билети"
            value={d.signupCount}
            sub={
              d.signupCount && d.paidOrders
                ? `${Math.round((d.paidOrders / d.signupCount) * 100)}% са купили`
                : "още никой не е купил"
            }
          />
        </div>

        <TierBars tiers={d.perTier} />
        <DailyChart data={d.daily} />

        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">
            Последни поръчки
          </h2>

          {d.recent.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-bh-cloud p-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
              Още няма поръчки. Тук ще се появят веднага щом продажбите тръгнат.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                    <th className="px-5 py-3 font-medium">Номер</th>
                    <th className="px-5 py-3 font-medium">Купувач</th>
                    <th className="px-5 py-3 font-medium">Билети</th>
                    <th className="px-5 py-3 font-medium">Статус</th>
                    <th className="px-5 py-3 text-right font-medium">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent.map((o) => (
                    <tr
                      key={o.reference}
                      className="border-b border-bh-ink/8 last:border-0"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-bh-ink/70">
                        {o.reference}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-bh-ink">{o.name}</div>
                        <div className="text-xs text-bh-ink/55">{o.email}</div>
                      </td>
                      <td className="px-5 py-3 text-bh-ink/75">{o.items}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                            o.status === "paid"
                              ? "bg-[#0E8C7D]/15 text-[#0b6d61]"
                              : "bg-bh-ink/10 text-bh-ink/60"
                          }`}
                        >
                          {o.status === "paid" ? "платена" : o.status === "pending" ? "незавършена" : o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-bh-ink">
                        <Money cents={o.totalCents} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
