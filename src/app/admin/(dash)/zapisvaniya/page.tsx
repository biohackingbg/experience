
import { requireAccess } from "@/lib/access";
import { sql } from "drizzle-orm";

import { CopyEmails } from "./CopyEmails";
import { MailForm } from "./MailForm";
import { audienceCounts, recentMailings } from "@/lib/newsletter";
import type { Audience } from "@/lib/newsletter-options";
import { getDb } from "@/lib/db";
import { signups } from "@/lib/db/schema";
import { getTier } from "@/lib/tickets";
import { HomeLink } from "@/components/admin/HomeLink";

export const dynamic = "force-dynamic";

function bgDateTime(d: Date): string {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function SignupsPage() {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  await requireAccess("zapisvaniya");

  const db = getDb();

  const rows = await db
    .select({
      email: signups.email,
      name: signups.name,
      interestedTier: signups.interestedTier,
      source: signups.source,
      unsubscribedAt: signups.unsubscribedAt,
      createdAt: signups.createdAt,
    })
    .from(signups)
    .orderBy(sql`${signups.createdAt} desc`);

  const active = rows.filter((r) => !r.unsubscribedAt);
  // The list itself must render even if the mailing side fails: this page is
  // where the addresses live, and losing sight of them because a letter count
  // threw is the wrong trade. The reason is shown rather than swallowed.
  let counts: Record<Audience, number> = { signups: 0, buyers: 0, waitlist: 0 };
  let mailings: Awaited<ReturnType<typeof recentMailings>> = [];
  let mailError: string | null = null;
  try {
    [counts, mailings] = await Promise.all([audienceCounts(), recentMailings()]);
  } catch (error) {
    mailError = error instanceof Error ? error.message : String(error);
    console.error("[zapisvaniya] mailing panel failed:", error);
  }

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Админ
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">
              Записвания
            </h1>
          </div>
          <HomeLink />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <p className="text-sm text-bh-ink/60">
            <strong className="font-semibold text-bh-ink">{rows.length}</strong>{" "}
            записани
            {rows.length !== active.length && (
              <>
                {" "}
                · {rows.length - active.length} отписани
              </>
            )}
          </p>
          {active.length > 0 && (
            <CopyEmails emails={active.map((r) => r.email)} />
          )}
        </div>

        {/* Writing to a list, in the same place the list lives. Every letter
            carries a one-click unsubscribe, and what went out is kept below. */}
        <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Писмо до списък</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-bh-ink/55">
            Изпраща се на партиди до сто, с връзка за отписване във всяко писмо. Прати първо проба на
            себе си - изглежда точно както ще го получат. Числото на бутона е броят хора, които ще го получат.
          </p>
          {mailError ? (
            <p className="mt-4 rounded-2xl bg-[#C4607F]/10 px-4 py-3 text-sm text-[#9c3d5c] ring-1 ring-[#C4607F]/30">
              Писането до списък не се зареди: {mailError}. Записаните по-долу се виждат нормално.
            </p>
          ) : (
            <MailForm counts={counts} />
          )}
        </section>

        {mailings.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold tracking-tight text-bh-ink">Изпратени писма</h2>
            <ul className="mt-3 flex flex-col divide-y divide-bh-ink/8">
              {mailings.map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                  <span className="font-medium text-bh-ink">{m.subject}</span>
                  <span className="text-xs text-bh-ink/55">
                    {m.recipients} души · {bgDateTime(m.sentAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {rows.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
            Още никой не се е записал.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="text-left font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/45">
                  <th className="py-3 font-normal">Имейл</th>
                  <th className="py-3 font-normal">Име</th>
                  <th className="py-3 font-normal">Интерес</th>
                  <th className="py-3 font-normal">Откъде</th>
                  <th className="py-3 font-normal">Кога</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.email}
                    className={`border-t border-bh-ink/8 ${
                      r.unsubscribedAt ? "opacity-45" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 text-bh-ink">
                      {r.email}
                      {r.unsubscribedAt && (
                        <span className="ml-2 rounded-full bg-bh-ink/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide">
                          отписан
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-bh-ink/70">{r.name ?? "-"}</td>
                    <td className="py-3 pr-4 text-bh-ink/70">
                      {r.interestedTier
                        ? (getTier(r.interestedTier)?.name ?? r.interestedTier)
                        : "-"}
                    </td>
                    <td className="py-3 pr-4 text-bh-ink/50">
                      {r.source ?? "-"}
                    </td>
                    <td className="py-3 tabular-nums text-bh-ink/60">
                      {bgDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* The suppression list exists for a reason; it should be visible. */}
        <p className="mt-6 max-w-2xl font-mono text-[0.7rem] uppercase leading-relaxed tracking-[0.12em] text-bh-ink/40">
          Копирането взима само неотписаните. Отписаните остават в списъка, за
          да не бъдат добавени пак при следващ внос.
        </p>
      </div>
    </div>
  );
}
