const tiers = [
  {
    name: "Основен",
    price: "50",
    featured: false,
    features: [
      "Един ден по избор",
      "Главна сцена",
      "Village и дегустации",
      "2 базови станции",
    ],
    absent: ["Без работилници"],
  },
  {
    name: "Пълен",
    price: "145",
    featured: true,
    features: [
      "И двата дни, двете сцени",
      "Пълен паспорт, 12 станции",
      "2 работилници по избор",
      "1 ритуал по избор",
      "Обяд в 1 ден",
    ],
    absent: [],
  },
  {
    name: "Протокол",
    price: "390",
    featured: false,
    tagline: "Ограничени места",
    features: [
      "Всичко от Пълен",
      "Кръвен панел с разчитане",
      "Гарантирани места",
      "90-дневен личен протокол",
    ],
    absent: [],
  },
];

function Check({ muted }: { muted?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`mt-0.5 h-4 w-4 shrink-0 ${muted ? "opacity-40" : ""}`}
      aria-hidden
    >
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SummitTickets() {
  return (
    <section id="tickets" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Билети
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-tight text-bh-ink">
              Три нива, една логика: колко надълбоко
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Всички билети дават достъп до сцената и Village. Разликата е в
            лабораторията и в това с какво си тръгва посетителят.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-4 lg:grid-cols-3">
          {tiers.map((tier) => {
            const featured = tier.featured;
            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl p-8 ${
                  featured
                    ? "bg-bh-lime-soft text-bh-ink"
                    : "bg-bh-cloud text-bh-ink ring-1 ring-bh-ink/8"
                }`}
              >
                {featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-bh-ink px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-bh-lime">
                    Най-избиран
                  </span>
                )}

                <h3 className="text-xl font-black uppercase tracking-tight">
                  {tier.name}
                </h3>
                {tier.tagline ? (
                  <span className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/50">
                    {tier.tagline}
                  </span>
                ) : (
                  <span className="mt-1 block h-4" />
                )}

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-6xl font-black tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-2xl font-semibold">€</span>
                </div>

                <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-bh-ink/75">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="text-bh-ink">
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                  {tier.absent.map((f) => (
                    <li key={f} className="flex gap-3 opacity-40 line-through">
                      <Check muted />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#register"
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-bh-ink px-6 py-3.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
                >
                  Избери {tier.name}
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-bh-ink/40">
          Групи над 10 души и корпоративни пакети по договаряне · отстъпка за
          студенти и медицински специалисти.
        </p>
      </div>
    </section>
  );
}
