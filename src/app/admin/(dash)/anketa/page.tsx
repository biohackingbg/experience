import type { Metadata } from "next";
import { and, asc, eq, isNotNull } from "drizzle-orm";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { getDb } from "@/lib/db";
import { speakers, surveyInvites } from "@/lib/db/schema";
import { type Question, type SurveyKind, questionsFor } from "@/lib/survey-questions";
import { earlyAccessList, surveyResults, visitorLetters } from "@/lib/surveys";

import { ListSend, VisitorSend } from "./Forms";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Анкета | Администрация",
  robots: { index: false, follow: false },
};

type Row = Awaited<ReturnType<typeof surveyResults>>[number];

function Summary({ q, rows }: { q: Question; rows: Row[] }) {
  const vals = rows.map((r) => (r.answers as Record<string, unknown> | null)?.[q.id]).filter((v) => v !== undefined && v !== null && v !== "");
  if (q.kind === "scale") {
    const nums = vals.map(Number).filter((n) => Number.isFinite(n));
    if (!nums.length) return <p className="text-xs text-bh-ink/45">Още няма отговори.</p>;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const nps = q.max === 10 ? Math.round(((nums.filter((n) => n >= 9).length - nums.filter((n) => n <= 6).length) / nums.length) * 100) : null;
    return (
      <p className="text-sm text-bh-ink">
        средно <b>{avg.toFixed(1)}</b> от {q.max} ({nums.length} отговора)
        {nps !== null && (
          <>
            {", "}NPS <b>{nps > 0 ? `+${nps}` : nps}</b>
          </>
        )}
      </p>
    );
  }
  if (q.kind === "single" || q.kind === "multi" || q.kind === "early") {
    const counts = new Map<string, number>();
    for (const v of vals) for (const x of Array.isArray(v) ? v : [v]) counts.set(String(x), (counts.get(String(x)) ?? 0) + 1);
    if (!counts.size) return <p className="text-xs text-bh-ink/45">Още няма отговори.</p>;
    const max = Math.max(...counts.values());
    return (
      <ul className="space-y-1">
        {[...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k, n]) => (
            <li key={k} className="flex items-center gap-2 text-xs text-bh-ink">
              <span className="w-56 shrink-0 truncate" title={k}>{k}</span>
              <span className="h-2 rounded-full bg-bh-pine/70" style={{ width: `${Math.max(4, (n / max) * 160)}px` }} />
              <span className="font-semibold">{n}</span>
            </li>
          ))}
      </ul>
    );
  }
  if (!vals.length) return <p className="text-xs text-bh-ink/45">Още няма отговори.</p>;
  return (
    <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-2">
      {vals.map((v, i) => (
        <li key={i} className="rounded-xl bg-bh-cloud px-3 py-2 text-xs leading-relaxed text-bh-ink">{String(v)}</li>
      ))}
    </ul>
  );
}

function Results({ kind, rows }: { kind: SurveyKind; rows: Row[] }) {
  const answered = rows.filter((r) => r.submittedAt);
  const sent = rows.filter((r) => r.sentAt).length;
  return (
    <section className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-bh-ink/8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-bh-ink">Резултати: {kind === "partner" ? "партньори" : "посетители"}</h2>
        <a href={`/admin/anketa/eksport?vid=${kind}`} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink">Експорт CSV</a>
      </div>
      <p className="mt-1 text-sm text-bh-ink/60">
        Попълнени <b className="text-bh-ink">{answered.length}</b> от {sent} пратени линка{sent ? ` (${Math.round((answered.length / sent) * 100)}%)` : ""}.
      </p>
      {answered.length > 0 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {questionsFor(kind).map((q) => (
            <div key={q.id} className="rounded-2xl bg-bh-paper/60 p-4 ring-1 ring-bh-ink/6">
              <p className="mb-2 text-sm font-semibold text-bh-ink">{q.label}</p>
              <Summary q={q} rows={answered} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function SurveyAdminPage() {
  await requireAccess("anketa");
  const db = getDb();
  const [letters, sentRows, visitors, partners, early, speakerRows] = await Promise.all([
    visitorLetters(),
    db.select({ ticketId: surveyInvites.ticketId }).from(surveyInvites).where(and(eq(surveyInvites.kind, "visitor"), isNotNull(surveyInvites.sentAt))),
    surveyResults("visitor"),
    surveyResults("partner"),
    earlyAccessList(),
    db.select({ title: speakers.title, name: speakers.name, topic: speakers.topic }).from(speakers).where(eq(speakers.announced, true)).orderBy(asc(speakers.sort)),
  ]);
  const sentSet = new Set(sentRows.map((r) => r.ticketId));
  const due = letters.filter((l) => !sentSet.has(l.own.ticketId)).length;
  const withCompany = letters.filter((l) => l.others.length).length;
  const links = letters.reduce((a, l) => a + 1 + l.others.length, 0);
  const speakerLines = speakerRows.map((s) => `; Уважаеми/а ${[s.title, s.name].filter(Boolean).join(" ")}; ${s.topic ?? ""}`).join("\n");
  const confirmed = early.filter((e) => e.confirmedAt).length;

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">След събитието</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Анкета и писма</h1>
          </div>
          <HomeLink />
        </div>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
          <h2 className="text-lg font-bold text-bh-ink">Посетители: благодарност + анкета</h2>
          <p className="mt-1 text-sm text-bh-ink/65">
            {letters.length} писма за {links} билета. {withCompany} купувачи получават и линковете на компанията си (билети без имейл), за да ги препратят.
            Всеки линк е личен и важи за един отговор.
          </p>
          <VisitorSend due={due} total={letters.length} me="hi@biohacking.bg" />
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
          <h2 className="text-lg font-bold text-bh-ink">Партньори: благодарност + анкета</h2>
          <ListSend
            kind="partners"
            me="hi@biohacking.bg"
            defaultLines=""
            hint="По един ред на партньор: Марка; Име на човека; имейл. Може да поставиш и колони от Google Sheets (разделени с таб). Всеки получава линк, в който марката е попълнена."
          />
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
          <h2 className="text-lg font-bold text-bh-ink">Лектори: благодарствено писмо</h2>
          <ListSend
            kind="speakers"
            me="hi@biohacking.bg"
            defaultLines={speakerLines}
            hint="По един ред: имейл; обръщение; тема на лекцията. Лекторите от сайта са попълнени без имейл: допиши имейла в началото на реда и поправи „Уважаеми/а“ на „Уважаема“ или „Уважаеми“. Редове без имейл се прескачат."
          />
        </section>

        <Results kind="visitor" rows={visitors} />
        <Results kind="partner" rows={partners} />

        <section className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-bh-ink/8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-bh-ink">Ранен достъп 2027</h2>
            <a href="/admin/anketa/eksport?vid=early" className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink">Експорт CSV</a>
          </div>
          <p className="mt-1 text-sm text-bh-ink/60">
            <b className="text-bh-ink">{confirmed}</b> потвърдени имейла, {early.length - confirmed} чакат потвърждение (добавени от приятел).
          </p>
        </section>
      </div>
    </div>
  );
}
