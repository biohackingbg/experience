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
    <section id="tickets" className="bg-bh-forest py-20 text-white lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-bh-lime">
            Билети
          </p>
          <h2 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            Три нива, една логика:
            <br />
            колко надълбоко
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            Всички билети дават достъп до сцената и Village. Разликата е в
            лабораторията и в това с какво си тръгва посетителят.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const featured = tier.featured;
            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl p-8 ${
                  featured
                    ? "bg-bh-lime text-bh-ink lg:-translate-y-3"
                    : "border border-white/15 bg-white/[0.04] text-white"
                }`}
              >
                {featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-bh-ink px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-bh-lime">
                    Най-избиран
                  </span>
                )}

                <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight">
                  {tier.name}
                </h3>
                {tier.tagline && (
                  <span className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-bh-lime">
                    {tier.tagline}
                  </span>
                )}

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-6xl font-extrabold tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-2xl font-semibold">€</span>
                </div>

                <ul
                  className={`mt-8 flex flex-1 flex-col gap-3 text-sm ${
                    featured ? "text-bh-ink/80" : "text-white/75"
                  }`}
                >
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className={featured ? "text-bh-forest" : "text-bh-lime"}>
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                  {tier.absent.map((f) => (
                    <li key={f} className="flex gap-3 opacity-45 line-through">
                      <Check muted />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#register"
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                    featured
                      ? "bg-bh-ink text-bh-lime"
                      : "bg-bh-lime text-bh-ink"
                  }`}
                >
                  Избери {tier.name}
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-[0.12em] text-white/45">
          Групи над 10 души и корпоративни пакети по договаряне · отстъпка за
          студенти и медицински специалисти.
        </p>
      </div>
    </section>
  );
}
