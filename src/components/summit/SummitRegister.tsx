import { EarlyAccessForm } from "@/components/summit/EarlyAccessForm";
import { Reveal } from "@/components/ui/Reveal";
import { Calendar, Pin, TicketIcon } from "@/components/ui/Pictograms";

const facts = [
  { label: "Дати", value: "07—08 ноември 2026", icon: Calendar },
  { label: "Място", value: "Гранд Хотел Милениум, София", icon: Pin },
  { label: "Достъп", value: "Ранни билети от септември", icon: TicketIcon },
];

export function SummitRegister() {
  return (
    <section id="register" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="rounded-[2rem] bg-bh-ink px-8 py-14 text-bh-paper sm:px-12 lg:px-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-lime">
              Запази мястото си
            </p>
            <h2 className="mt-5 text-[clamp(2.1rem,5vw,4rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight">
              Един ден. Реални числа. Личен план.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-bh-paper/65">
              Местата в Лабораторията и ритуалите са с предварително записване.
              Ранните билети тръгват от септември — остави имейл и ще си сред
              първите, които ще ги получат.
            </p>

            <EarlyAccessForm />
          </div>

          <dl className="mt-14 grid gap-8 border-t border-bh-paper/15 pt-8 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label}>
                <f.icon className="h-6 w-6 text-bh-lime" />
                <dt className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-bh-paper/45">
                  {f.label}
                </dt>
                <dd className="mt-2 text-lg font-bold tracking-tight">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
