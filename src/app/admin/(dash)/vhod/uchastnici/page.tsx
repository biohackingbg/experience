import type { Metadata } from "next";
import Link from "next/link";

import { PrintButton } from "@/components/admin/PrintButton";
import { requireAccess } from "@/lib/access";
import { listAttendees } from "@/lib/tickets-lookup";

export const metadata: Metadata = {
  title: "Участници | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Everyone expected, one line each, alphabetical - the list that gets
 * printed for the badges and kept at the door as the paper fallback.
 * A ticket without its own name carries the buyer's, flagged so the team
 * knows the badge may need a pen.
 */
export default async function AttendeesPage() {
  await requireAccess("vhod");
  const rows = await listAttendees();
  const unnamedShared = rows.filter((r) => !r.named && rows.filter((x) => x.reference === r.reference).length > 1).length;

  return (
    <div className="px-5 py-8 sm:px-8 print:p-0">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Вход</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Участници</h1>
            <p className="mt-2 text-sm text-bh-ink/60">
              {rows.length} билета · {rows.filter((r) => r.named).length} с име на участника
              {unnamedShared ? ` · ${unnamedShared} в групови поръчки още носят името на купувача` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/vhod" className="rounded-full border border-bh-ink/20 px-4 py-2 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink">
              ← Вход
            </Link>
            <a href="/admin/vhod/uchastnici/eksport" className="rounded-full border border-bh-ink/20 px-4 py-2 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink">
              CSV
            </a>
            <Link href="/admin/vhod/uchastnici/badzhove" target="_blank" className="rounded-full border border-bh-ink/20 px-4 py-2 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink">
              Баджове (PDF)
            </Link>
            <PrintButton label="Печат на списъка" />
          </div>
        </div>

        <h2 className="hidden text-xl font-bold print:block">Sofia Life Summit · 07-08 ноември 2026 · участници</h2>

        {rows.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
            Още няма платени билети.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8 print:mt-3 print:rounded-none print:ring-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Име</th>
                  <th className="px-4 py-3 font-medium">Ниво</th>
                  <th className="px-4 py-3 font-medium">Код</th>
                  <th className="px-4 py-3 font-medium print:hidden">Поръчка</th>
                  <th className="px-4 py-3 font-medium">Влязъл</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.code} className="border-b border-bh-ink/6 last:border-0">
                    <td className="px-4 py-2 text-xs text-bh-ink/45">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-bh-ink">
                      {r.name}
                      {!r.named && (
                        <span className="ml-2 text-[0.62rem] font-normal uppercase tracking-wide text-bh-ink/40" title="Името е на купувача - участникът не е записал своето">
                          купувач
                        </span>
                      )}
                      {r.company && <span className="ml-2 text-xs font-normal text-bh-ink/50">{r.company}</span>}
                    </td>
                    <td className="px-4 py-2 text-bh-ink/75">{r.tierName}</td>
                    <td className="px-4 py-2 font-mono text-xs text-bh-ink/70">{r.code}</td>
                    <td className="px-4 py-2 text-xs text-bh-ink/55 print:hidden">
                      {r.reference}
                      {r.named && r.buyerName !== r.name ? ` · купил ${r.buyerName}` : ""}
                    </td>
                    <td className="px-4 py-2 text-xs text-bh-ink/55">
                      {r.checkedInAt
                        ? r.checkedInAt.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" })
                        : <span className="print:hidden">-</span>}
                      <span className="hidden print:inline">{r.checkedInAt ? "" : "☐"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
