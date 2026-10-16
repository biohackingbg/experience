import { getPricing } from "@/lib/pricing";
import { ALUMNI_CODE, LIST_LETTERS, alumniDraft } from "@/lib/sequence-letters";
import { SEQUENCE_KINDS, listLetterStates, sequencePreview, sequenceStats, sequencesOn, sofia } from "@/lib/sequences";
import { formatPrice } from "@/lib/tickets";

import { SequenceTestForm, SkipForm, ToggleForm } from "./SequenceForms";

const when = (d: Date | null) => (d ? d.toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-");

/**
 * The automatic letters: the switch, every letter with its numbers and a
 * preview, the dated list letters with their plan, and the alumni draft.
 */
export async function SequencesSection() {
  const [on, stats, states, pricing] = await Promise.all([sequencesOn(), sequenceStats(), listLetterStates(), getPricing()]);
  const previews = await Promise.all(SEQUENCE_KINDS.map(async (k) => ({ ...k, letter: await sequencePreview(k.kind) })));
  const alumni = alumniDraft(pricing);

  return (
    <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Автоматични поредици</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
            Четири поредици, проверявани веднъж на час: недовършена поръчка (напомняне на 24 ч и последно на 72 ч),
            CORE → PLUS (ден 0, ден 5 и три дни преди), PLUS → PEAK (веднъж, от 28 октомври) и писмата до
            списъка на датите им. Всяко писмо отива веднъж на човек; който натисне „Не искам повече писма“, отпада от всички.
            „Платили след писмото“ брои поръчки от същия имейл след изпращането - надграждане или покупка.
          </p>
        </div>
        <div className="text-right">
          <div className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-[#0E8C7D]/15 text-[#0b6d61]" : "bg-amber-100 text-amber-900"}`}>
            {on ? "пуснати" : "спрени"}
          </div>
          <ToggleForm on={on} />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">
              <th className="py-2 pr-3 font-normal">Писмо</th>
              <th className="py-2 pr-3 font-normal">Кога</th>
              <th className="py-2 pr-3 text-right font-normal">Изпратени</th>
              <th className="py-2 pr-3 text-right font-normal">Отворени</th>
              <th className="py-2 pr-3 text-right font-normal">Кликнали</th>
              <th className="py-2 pr-3 text-right font-normal">Платили след</th>
              <th className="py-2 font-normal">Последно</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bh-ink/8">
            {SEQUENCE_KINDS.map((k) => {
              const s = stats[k.kind];
              const listId = k.kind.startsWith("list-") ? k.kind.slice(5) : null;
              const st = listId ? states[listId as keyof typeof states] : null;
              return (
                <tr key={k.kind} className="text-bh-ink">
                  <td className="py-2.5 pr-3 font-semibold">
                    <a href={`#seq-${k.kind}`} className="hover:underline">{k.title}</a>
                    {st === "skipped" && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-900">няма да се праща</span>}
                    {st === "sent" && <span className="ml-2 rounded-full bg-[#0E8C7D]/15 px-2 py-0.5 text-[0.6rem] font-semibold text-[#0b6d61]">изпратено</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-bh-ink/60">{k.when}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{s?.sent ?? 0}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{s?.opened ?? 0}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{s?.clicked ?? 0}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {s?.converted ?? 0}
                    {s?.convertedCents ? <span className="text-xs text-bh-ink/50"> · {formatPrice(s.convertedCents)} €</span> : null}
                  </td>
                  <td className="py-2.5 text-xs text-bh-ink/60">{when(s?.lastAt ?? null)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="mt-8 text-base font-bold tracking-tight text-bh-ink">План на писмата до списъка</h3>
      <p className="mt-1 text-xs text-bh-ink/55">
        До всички в списъка с новини, без тези, които вече са купили. Писмата за цените се пращат само докато междинните цени са пуснати;
        писмо, закъсняло с над 36 часа (например ако поредиците са спрени), не се праща.
      </p>
      <ul className="mt-3 divide-y divide-bh-ink/8 rounded-2xl bg-bh-paper ring-1 ring-bh-ink/8">
        {LIST_LETTERS.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <span className="font-semibold text-bh-ink">{sofia(l.at)}</span>
              <span className="text-bh-ink/70"> · {l.title}</span>
              {l.needsDiscount && <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-bh-ink/45">само при междинни цени</span>}
            </div>
            {states[l.id] === "sent" ? <span className="text-xs text-[#0b6d61]">изпратено</span> : <SkipForm id={l.id} skipped={states[l.id] === "skipped"} />}
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-base font-bold tracking-tight text-bh-ink">Писмата, както ги вижда получателят</h3>
      <div className="mt-3 flex flex-col gap-5">
        {previews.map((k) =>
          k.letter ? (
            <details key={k.kind} id={`seq-${k.kind}`} className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
              <summary className="cursor-pointer text-sm font-semibold text-bh-ink">
                {k.title} <span className="font-normal text-bh-ink/55">· {k.letter.subject}</span>
              </summary>
              <div className="mt-3"><SequenceTestForm kind={k.kind} /></div>
              <iframe title={`Превю: ${k.title}`} srcDoc={k.letter.html} sandbox="" className="mt-3 h-[40rem] w-full rounded-2xl bg-[#f1f5f3] ring-1 ring-bh-ink/8" />
            </details>
          ) : (
            <p key={k.kind} id={`seq-${k.kind}`} className="text-xs text-bh-ink/55">
              {k.title}: това е досегашното напомняне - показано е по-долу при писмата до купувачи.
            </p>
          ),
        )}
      </div>

      <h3 className="mt-8 text-base font-bold tracking-tight text-bh-ink">Писмо до курсистите на Biohacking.bg</h3>
      <p className="mt-1 text-xs text-bh-ink/55">
        Списъкът с курсистите не е в сайта, затова това не тръгва само. Кодът <strong className="font-mono">{ALUMNI_CODE}</strong> (-15%, до 150 ползвания, важи и след междинните цени)
        е създаден. Копирай текста в „Записвания → Ново писмо“ или в пощата си.
      </p>
      <div className="mt-3 rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
        <p className="text-sm font-semibold text-bh-ink">Тема: {alumni.subject}</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-bh-ink">{alumni.body}</pre>
        <p className="mt-2 text-xs text-bh-ink/60">Бутон: {alumni.ctaLabel} → {alumni.ctaUrl}</p>
      </div>
    </section>
  );
}
