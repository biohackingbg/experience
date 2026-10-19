import { getPricing } from "@/lib/pricing";
import { ALUMNI_CODE, LIST_LETTERS, alumniDraft } from "@/lib/sequence-letters";
import { SEQUENCE_KINDS, gateReasons, getSequenceConfig, listLetterAt, listLetterStates, runSequences, sequencePreview, sequenceStats, sofia } from "@/lib/sequences";
import { formatPrice } from "@/lib/tickets";

import { KindForm, KindToggle, SendNowForm, SequenceTestForm, SkipForm } from "./SequenceForms";

const when = (d: Date | null) => (d ? d.toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-");

/**
 * The automatic letters: the switch, every letter with its numbers and a
 * preview, the dated list letters with their plan, and the alumni draft.
 */
export async function SequencesSection() {
  const [stats, states, pricing, cfg, due, gates] = await Promise.all([
    sequenceStats(),
    listLetterStates(),
    getPricing(),
    getSequenceConfig(),
    // Who would get each letter if it went this minute, switches and dates aside.
    runSequences({ dry: true, force: true }),
    // Why the next hourly run would skip each one - from the switches and
    // dates alone, so the page does not run the whole thing a second time.
    gateReasons(),
  ]);
  const dueOf = (kind: string) => due.steps.find((s) => s.kind === kind);
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
            Всяко писмо е изключено, докато не го включиш от ключа на реда му; денят „от“ го кара да изчака,
            например края на междинните цени. „Прати сега“ го праща веднага на всички, на които се полага, без да гледа ключа и датата.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">
              <th className="py-2 pr-3 font-normal">Писмо</th>
              <th className="py-2 pr-3 font-normal">Кога</th>
              <th className="py-2 pr-3 font-normal">Следващ час</th>
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
              const c = cfg[k.kind] ?? { on: false, from: null, at: null };
              const d = dueOf(k.kind);
              const whenText = listId ? sofia(listLetterAt(listId as keyof typeof states, cfg)) : k.when;
              const dueN = d?.skipped && !d.sent ? 0 : (d?.sent ?? 0);
              const next = gates[k.kind] ?? (d?.skipped && !d.sent ? d.skipped : `${dueN} писма`);
              return (
                <tr key={k.kind} className="align-top text-bh-ink">
                  <td className="py-2.5 pr-3">
                    <a href={`#seq-${k.kind}`} className="font-semibold hover:underline">{k.title}</a>
                                        {st === "skipped" && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-900">няма да се праща</span>}
                    {st === "sent" && <span className="ml-2 rounded-full bg-[#0E8C7D]/15 px-2 py-0.5 text-[0.6rem] font-semibold text-[#0b6d61]">изпратено</span>}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <KindToggle kind={k.kind} on={c.on} />
                      {k.kind !== "abandoned-1" && st !== "sent" && (
                        <SendNowForm kind={k.kind} title={k.title} due={dueN} />
                      )}
                    </div>
                    <div className="mt-2">
                      <KindForm kind={k.kind} from={c.from} at={c.at} isList={!!listId} />
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-bh-ink/60">{whenText}</td>
                  <td className="py-2.5 pr-3 text-xs text-bh-ink/60">{next}</td>
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
        До всички в списъка с новини, без тези, които вече са купили. Датата на всяко писмо се сменя от „кога“ в таблицата горе.
        Писмата за цените се пращат само докато междинните цени са пуснати; писмо, закъсняло с над 36 часа (например ако писмото е било изключено), не се праща.
      </p>
      <ul className="mt-3 divide-y divide-bh-ink/8 rounded-2xl bg-bh-paper ring-1 ring-bh-ink/8">
        {LIST_LETTERS.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <span className="font-semibold text-bh-ink">{sofia(listLetterAt(l.id, cfg))}</span>
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
              {/* Loaded only when the details open: a closed <details> does not
                  lay out its content, and a lazy iframe waits for layout. */}
              <iframe
                title={`Превю: ${k.title}`}
                src={`/admin/pisma/preglad/poredica/${k.kind}`}
                loading="lazy"
                sandbox=""
                className="mt-3 h-[40rem] w-full rounded-2xl bg-[#f1f5f3] ring-1 ring-bh-ink/8"
              />
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
