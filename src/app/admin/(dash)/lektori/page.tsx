import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { SPEAKERS, initials } from "@/lib/speakers";
import { listSpeakers, photoUrl } from "@/lib/speakers-data";

import { seedSpeakers, shiftSpeaker, toggleAnnounced } from "./actions";
import { NewSpeakerForm, SpeakerEditor } from "./Forms";

export const metadata: Metadata = {
  title: "Лектори | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Every speaker, announced or not, with the portrait and the switch that puts them on the site. */
export default async function SpeakersAdminPage() {
  await requireAccess("lektori");
  const rows = await listSpeakers();
  const seeded = rows.length > 0;
  const announced = rows.filter((r) => r.announced && !r.pending).length;

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Лектори</h1>
            {seeded && (
              <p className="mt-2 text-sm text-bh-ink/60">
                {announced} обявени на сайта · {rows.length - announced} още не · {rows.filter((r) => !r.hasPhoto).length} без снимка
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {seeded && <NewSpeakerForm />}
            <HomeLink />
          </div>
        </div>

        {!seeded ? (
          <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
            <h2 className="text-lg font-bold tracking-tight text-bh-ink">Първо: вземи лекторите от сайта</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
              Сайтът в момента показва списъка, записан в кода ({SPEAKERS.length} души, със снимките).
              Едно натискане ги копира тук; след това добавяш и редактираш от тази
              страница, а кодът спира да се чете. Отнема около минута заради снимките.
            </p>
            <form action={seedSpeakers} className="mt-4">
              <button type="submit" className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">
                Импортирай лекторите
              </button>
            </form>
          </section>
        ) : (
          <>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
              Редът тук е редът на сайта. „Обяви“ пуска човека на сайта и в
              данните за Google; снимката се качва от бутона на реда и се смалява
              сама. Промените се виждат до пет минути.
            </p>
            <ul className="mt-6 flex flex-col divide-y divide-bh-ink/6 rounded-3xl bg-bh-cloud p-2 ring-1 ring-bh-ink/6">
              {rows.map((s, i) => (
                <li key={s.id} className={`px-4 py-3 ${s.pending ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex flex-col gap-0.5">
                        {(["up", "down"] as const).map((dir) => (
                          <form key={dir} action={shiftSpeaker}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="dir" value={dir} />
                            <button
                              type="submit"
                              disabled={dir === "up" ? i === 0 : i === rows.length - 1}
                              aria-label={dir === "up" ? "нагоре" : "надолу"}
                              className="h-5 w-6 rounded text-xs text-bh-ink/50 hover:bg-bh-ink/8 hover:text-bh-ink disabled:opacity-25"
                            >
                              {dir === "up" ? "▲" : "▼"}
                            </button>
                          </form>
                        ))}
                      </div>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-bh-ink text-bh-paper/60">
                        {s.hasPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl(s)} alt="" className="h-full w-full object-cover object-top" />
                        ) : (
                          <span className="text-sm font-black">{initials(s.name)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-bh-ink">
                          {s.title ? <span className="mr-1 font-mono text-[0.62rem] uppercase tracking-wide text-bh-ink/50">{s.title}</span> : null}
                          {s.name}
                          {s.country && <span className="ml-2 text-xs font-normal text-bh-ink/50">{s.country}</span>}
                        </div>
                        <div className="text-xs text-bh-ink/60">
                          {[s.specialty, [s.role, s.affiliation].filter(Boolean).join(", "), s.topic].filter(Boolean).join(" · ") || "без описание"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide ${
                            s.pending ? "bg-bh-ink/10 text-bh-ink/50" : s.announced ? "bg-[#0E8C7D]/15 text-[#0b6d61]" : "bg-[#d0a11a]/15 text-[#7a5c05]"
                          }`}>
                            {s.pending ? "потвърждава се" : s.announced ? "на сайта" : "скрит"}
                          </span>
                          {!s.hasPhoto && <span className="text-[0.62rem] text-bh-ink/45">без снимка</span>}
                          <Link href={`/admin/izdai?vid=free&ime=${encodeURIComponent(s.name)}&broi=1&bel=${encodeURIComponent("Лектор")}`} className="text-[0.68rem] font-semibold text-bh-ink/70 underline underline-offset-2 hover:text-bh-ink">
                            билет
                          </Link>
                          {!s.pending && (
                            <form action={toggleAnnounced}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="to" value={s.announced ? "0" : "1"} />
                              <button type="submit" className="text-[0.68rem] font-semibold text-bh-ink/70 underline underline-offset-2 hover:text-bh-ink">
                                {s.announced ? "скрий" : "обяви"}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                    <SpeakerEditor s={s} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
