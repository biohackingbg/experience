import { Reveal } from "@/components/ui/Reveal";

const days = [
  {
    day: "Събота",
    date: "07.11",
    theme: "Основите, които работят",
    slots: [
      { t: "10:00", s: "Дълголетие за всеки: защо България" },
      { t: "10:40", s: "Биохакинг: кое издържа на научна проверка" },
      { t: "11:30", s: "Метаболитно здраве и новите терапии" },
      { t: "12:20", s: "Сън и циркаден ритъм" },
      { t: "14:00", s: "Хранене за дълголетие, панел" },
      { t: "15:00", s: "Добавки: доказателства срещу хайп" },
      { t: "16:00", s: "Хормони: менопауза и андропауза" },
      { t: "17:00", s: "Питай лекаря, отворен панел" },
    ],
  },
  {
    day: "Неделя",
    date: "08.11",
    theme: "Приложи го",
    slots: [
      { t: "10:00", s: "Кожата като огледало на тялото" },
      { t: "10:45", s: "Микропластмаси и ендокринни дизруптори" },
      { t: "11:30", s: "Мозъкът след 40: какво пази паметта" },
      { t: "12:20", s: "Мускулите като орган за дълголетие" },
      { t: "14:00", s: "Венозни инфузии и NAD+: реални очаквания" },
      { t: "15:00", s: "Ранно откриване на рак: какво и кога" },
      { t: "16:00", s: "Твоят 90-дневен протокол, водена сесия" },
      { t: "17:30", s: "Закриване" },
    ],
  },
];

export function SummitProgram() {
  return (
    <section id="program" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Програма
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              Два дни, две сцени
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Работна програма. Лабораторията и ритуалите работят паралелно през
            целия ден, със записване на час.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {days.map((d, i) => (
            <Reveal key={d.date} delay={i * 120}>
            <div className="bh-mint h-full overflow-hidden rounded-3xl">
              <div className="bh-day-header flex items-baseline justify-between bg-bh-ink px-7 py-6 text-bh-paper">
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-black uppercase tracking-tight">
                    {d.day}
                  </span>
                  <span className="font-mono text-sm text-bh-lime">
                    {d.date}
                  </span>
                </div>
                {/* One line from lg up, where the two cards sit side by side and
                    a wrapped theme would leave their headers different heights.
                    Below that they stack, so wrapping is free. */}
                <span className="text-right text-xs font-medium uppercase tracking-wide text-bh-paper/55 lg:whitespace-nowrap">
                  {d.theme}
                </span>
              </div>

              <ul>
                {d.slots.map((slot, i) => (
                  <li
                    key={slot.t}
                    className={`flex items-center gap-5 px-7 py-4 transition-colors hover:bg-bh-pine/10 ${
                      i !== 0 ? "border-t border-bh-ink/8" : ""
                    }`}
                  >
                    <span className="w-14 shrink-0 font-mono text-sm text-bh-ink/45">
                      {slot.t}
                    </span>
                    <span className="text-sm font-medium text-bh-ink">
                      {slot.s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
