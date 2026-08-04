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
    <section id="program" className="bg-bh-paper py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-bh-forest">
            Програма
          </p>
          <h2 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-bh-ink sm:text-5xl lg:text-6xl">
            Два дни, две сцени
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {days.map((d) => (
            <div
              key={d.date}
              className="overflow-hidden rounded-3xl border border-bh-ink/10 bg-white"
            >
              <div className="flex items-baseline justify-between bg-bh-ink px-7 py-6 text-white">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-2xl font-extrabold uppercase tracking-tight">
                    {d.day}
                  </span>
                  <span className="font-mono text-sm text-bh-lime">{d.date}</span>
                </div>
                <span className="max-w-[9rem] text-right text-xs font-medium uppercase tracking-wide text-white/60">
                  {d.theme}
                </span>
              </div>

              <ul>
                {d.slots.map((slot, i) => (
                  <li
                    key={slot.t}
                    className={`flex items-center gap-5 px-7 py-4 transition-colors hover:bg-bh-lime/15 ${
                      i !== 0 ? "border-t border-bh-ink/8" : ""
                    }`}
                  >
                    <span className="w-14 shrink-0 font-mono text-sm font-semibold text-bh-forest">
                      {slot.t}
                    </span>
                    <span className="text-sm font-medium text-bh-ink sm:text-base">
                      {slot.s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl font-mono text-xs leading-relaxed uppercase tracking-[0.12em] text-bh-ink/45">
          Работна програма. Лабораторията и ритуалите работят паралелно през
          целия ден, със записване на час.
        </p>
      </div>
    </section>
  );
}
