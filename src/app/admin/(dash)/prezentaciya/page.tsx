import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { STAGES, deckUrl, getDeckStats } from "@/lib/deck-links";

import { reactivateDeckLink, revokeDeckLink, updateDeckLink } from "./actions";
import { CopyLink, NewLinkForm, PipelineEditor } from "./LinkTools";

export const metadata: Metadata = {
  title: "Презентация | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function bgDateTime(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Sofia",
  }).format(d);
}

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-bh-ink/55">{sub}</div>}
    </div>
  );
}

/**
 * The partner deck's share links: one per recipient, each with its own count.
 * That is how "who opened it" is answered without asking anyone for an email.
 */
export default async function DeckPage() {
  // The layout also checks, but a layout is not an auth boundary — the
  // Next docs are explicit that it may be skipped on RSC navigations.
  if (!(await isAdmin())) redirect("/admin/login");

  const d = await getDeckStats();
  const active = d.links.filter((l) => !l.revokedAt);

  return (
    <div className="px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">
              Партньорска презентация
            </h1>
          </div>
          <Link
            href="/admin"
            className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink"
          >
            ← Табло
          </Link>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
          Презентацията се отваря само през тези линкове — няма общ адрес и не
          е в търсачките. Направи отделен линк за всяка компания (или за пост,
          имейл кампания, екипа) и ще виждаш кой я е отворил и кога, без да
          искаш имейл от никого. Всеки ред е и разговорът с партньора: цъкни
          етапа, за да го смениш и да оставиш бележка и какво се очаква от нас.
          „Спри“ не трие нищо — линкът спира да се отваря, историята остава.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            label="Партньори"
            value={d.byStage.find((s) => s.id === "confirmed")?.n ?? 0}
            sub={d.byStage
              .filter((s) => s.id !== "confirmed" && s.n)
              .map((s) => `${s.n} ${s.label}`)
              .join(" · ") || "потвърдени · още никой не е в процес"}
          />
          <Tile label="Отваряния общо" value={d.total} sub={`${active.length} активни линка`} />
          <Tile label="Последните 7 дни" value={d.last7Days} sub={`днес ${d.today}`} />
          <Tile
            label="Откъде идват"
            value={d.referrers.length ? d.referrers[0].host : "директно"}
            sub={
              d.referrers.length
                ? d.referrers.map((r) => `${r.host} ${r.n}`).join(" · ")
                : "само от директно отваряне на линка"
            }
          />
        </div>

        <div className="mt-10 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
          <h2 className="text-sm font-bold tracking-tight text-bh-ink">Нов линк</h2>
          <div className="mt-3">
            <NewLinkForm />
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Линкове</h2>
          {d.links.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
              Още няма линкове — направи първия по-горе.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
              <table className="w-full min-w-[64rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                    <th className="px-5 py-3 font-medium">За кого</th>
                    <th className="px-5 py-3 font-medium">Етап · бележки</th>
                    <th className="px-5 py-3 font-medium">Линк</th>
                    <th className="px-5 py-3 text-right font-medium">Отваряния</th>
                    <th className="px-5 py-3 font-medium">Последно</th>
                    <th className="px-5 py-3 font-medium">Създаден</th>
                    <th className="px-5 py-3 font-medium">Статус</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {d.links.map((l) => {
                    const url = deckUrl(l.token);
                    const off = !!l.revokedAt;
                    return (
                      <tr
                        key={l.id}
                        className={`border-b border-bh-ink/8 last:border-0 ${off ? "text-bh-ink/45" : ""}`}
                      >
                        <td className={`px-5 py-3 font-medium ${off ? "" : "text-bh-ink"}`}>{l.label}</td>
                        <td className="px-5 py-3 align-top">
                          <PipelineEditor
                            id={l.id}
                            stage={l.stage}
                            note={l.note}
                            nextStep={l.nextStep}
                            stages={STAGES}
                            action={updateDeckLink}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="max-w-[9rem] truncate font-mono text-xs text-bh-ink/70 underline-offset-2 hover:underline"
                            >
                              …/{l.token}
                            </a>
                            <CopyLink url={url} />
                          </div>
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${off ? "" : "text-bh-ink"}`}>{l.views}</td>
                        <td className="px-5 py-3">{bgDateTime(l.lastViewedAt)}</td>
                        <td className="px-5 py-3">{bgDateTime(l.createdAt)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                              off ? "bg-bh-ink/10 text-bh-ink/60" : "bg-[#0E8C7D]/15 text-[#0b6d61]"
                            }`}
                          >
                            {off ? `спрян ${bgDateTime(l.revokedAt)}` : "активен"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {off ? (
                            <form action={reactivateDeckLink}>
                              <input type="hidden" name="id" value={l.id} />
                              <button
                                type="submit"
                                className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
                              >
                                Пусни пак
                              </button>
                            </form>
                          ) : (
                            <form action={revokeDeckLink}>
                              <input type="hidden" name="id" value={l.id} />
                              <button
                                type="submit"
                                className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink/70 transition-colors hover:border-red-600 hover:text-red-600"
                              >
                                Спри
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
