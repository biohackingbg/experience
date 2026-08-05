import { Reveal } from "@/components/ui/Reveal";

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
    <section id="passport" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Ядрото на офертата
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-tight text-bh-ink">
              Longevity паспортът
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            „Добре, а аз къде съм“ — тази зона отговаря. Това, което никой друг
            wellness формат в България не предлага.
          </p>
        </Reveal>

        <Reveal className="mt-12 overflow-hidden rounded-3xl bg-bh-cloud ring-1 ring-bh-ink/8">
          <div className="grid sm:grid-cols-2">
            {markers.map((m, i) => (
              <div
                key={m.no}
                className={`flex gap-6 p-8 ${
                  i >= 2 ? "border-t border-bh-ink/8" : ""
                } ${i % 2 === 1 ? "sm:border-l sm:border-bh-ink/8" : ""} ${
                  i === 1 ? "sm:border-t-0" : ""
                }`}
              >
                <span className="font-mono text-sm font-semibold text-bh-pine">{m.no}</span>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-bh-ink">
                    {m.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-bh-ink/60">
                    {m.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <p className="mt-6 max-w-3xl font-mono text-[0.7rem] leading-relaxed uppercase tracking-[0.12em] text-bh-ink/40">
          Скринингът не е диагноза. Резултатите се тълкуват от специалист на
          място, който насочва към кого да се обърне посетителят.
        </p>
      </div>
    </section>
  );
}
