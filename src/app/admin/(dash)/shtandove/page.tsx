import type { Metadata } from "next";

import { HomeLink } from "@/components/admin/HomeLink";

import { requireAccess } from "@/lib/access";
import { getBoard } from "@/lib/booths";
import { BOOTHS, STATUS, ZONES } from "@/lib/booths-plan";

import { Board } from "./Board";

export const metadata: Metadata = {
  title: "Щандове | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-bh-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-bh-ink/55">{sub}</div>}
    </div>
  );
}

/**
 * Who stands where. The plan is the architect's; the state on it is the
 * deal's. Nothing here is typed twice: a stand is "paid" because the
 * partner's money is, in Подготовка.
 */
export default async function BoothsPage() {
  await requireAccess("shtandove");
  const board = await getBoard();
  const taken = board.counts.reserved + board.counts.paid + board.counts.held;

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Щандове</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Изложбената зона във фоайето на Grand Millennium: {BOOTHS.length} модула по 3 × 2 m в четири зони.
          Натисни модул, за да сложиш партньор на него. „Платен“ не се пише тук - идва от парите на партньора в Подготовка.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Свободни" value={board.counts.free} sub={`от ${BOOTHS.length} модула`} />
          <Tile label="Договорени" value={board.counts.reserved} sub="партньор има, плащане още няма" />
          <Tile label="Платени" value={board.counts.paid} sub="парите са дошли" />
          <Tile label="Заети общо" value={taken} sub={board.counts.held ? `вкл. ${board.counts.held} запазени извън списъка` : "партньори и запазени"} />
        </div>

        <div className="mt-6">
          <Board booths={board.booths} partners={board.partners} />
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ZONES.map((z) => {
            const mine = board.booths.filter((b) => b.zone === z.id);
            const free = mine.filter((b) => b.status === "free").length;
            return (
              <div key={z.id} className="rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-bh-ink">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: z.colour }} />
                    {z.id} · {z.label}
                  </h2>
                  <span className="text-xs text-bh-ink/50">
                    {free} свободни от {mine.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-bh-ink/50">{z.hint}</p>
                <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                  {mine.map((b) => (
                    <li key={b.id} className="flex items-baseline justify-between gap-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-bh-ink/25" style={{ background: b.status === "free" ? "white" : STATUS[b.status].colour }} />
                        <span className="font-mono text-xs text-bh-ink/70">{b.id}</span>
                      </span>
                      <span className={`truncate text-right ${b.status === "free" ? "text-bh-ink/35" : "font-medium text-bh-ink"}`}>
                        {b.partner?.label ?? b.holdLabel ?? "свободен"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
