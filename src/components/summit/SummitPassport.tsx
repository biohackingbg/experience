const markers = [
  {
    no: "01",
    title: "Композиция на тялото",
    body: "Биоимпеданс: мускул, висцерални мазнини, вода.",
  },
  {
    no: "02",
    title: "Функционален скрининг",
    body: "Сила на захвата, скорост на походка, изправяне от стол.",
  },
  {
    no: "03",
    title: "Нервна система",
    body: "HRV и дишане в покой, преди и след дихателна сесия.",
  },
  {
    no: "04",
    title: "Метаболитно",
    body: "Кръвна захар, демо на непрекъснат мониторинг, липиден панел.",
  },
  {
    no: "05",
    title: "Кожа и експозом",
    body: "Хидратация, себум, пигментация, слънчеви увреждания.",
  },
  {
    no: "06",
    title: "Сетива и когниция",
    body: "Зрение, слух и кратък когнитивен тест.",
  },
];

export function SummitPassport() {
  return (
    <section id="passport" className="bg-bh-ink py-20 text-white lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-bh-lime">
              Ядрото на офертата
            </p>
            <h2 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Longevity
              <br />
              <span className="text-bh-lime">паспортът</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-white/70">
            Най-честият въпрос след всяка лекция е „добре, а аз къде съм“. Тази
            зона отговаря — и е това, което никой друг wellness формат в България
            не предлага.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {markers.map((m) => (
            <div
              key={m.no}
              className="group bg-bh-ink p-8 transition-colors hover:bg-bh-forest"
            >
              <span className="font-mono text-sm font-semibold text-bh-lime">
                / {m.no}
              </span>
              <h3 className="mt-6 font-display text-xl font-bold tracking-tight">
                {m.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {m.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl font-mono text-xs leading-relaxed uppercase tracking-[0.12em] text-white/40">
          Скринингът не е диагноза. Резултатите се тълкуват от специалист на
          място, който насочва към кого да се обърне посетителят.
        </p>
      </div>
    </section>
  );
}
