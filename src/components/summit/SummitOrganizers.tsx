import { Reveal } from "@/components/ui/Reveal";

/**
 * Co-branding strip: one event, two organisers.
 *
 * Both marks get the same height and the same weight of surrounding space, so
 * neither reads as a sponsor of the other. The partner's rose is the only
 * place pink appears on the site — enough to tie the two identities together
 * without importing a second palette.
 *
 * `PARTNER_LOGO` is null until the association supplies artwork; the type
 * lockup below is the interim and is deliberately not a broken image.
 */
const PARTNER_LOGO: string | null = null;

export function SummitOrganizers() {
  return (
    <section className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="rounded-3xl bg-bh-cloud px-8 py-12 ring-1 ring-bh-ink/8 sm:px-12">
          <p className="text-center font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/45">
            Организатори
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14">
            {/* Partner — Bulgarian Longevity Association */}
            <div className="flex items-center justify-center">
              {PARTNER_LOGO ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={PARTNER_LOGO}
                  alt="Bulgarian Longevity Association"
                  className="h-14 w-auto"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-bh-rose/50 text-lg text-bh-rose"
                  >
                    ❀
                  </span>
                  <span className="font-display text-sm font-[800] uppercase leading-tight tracking-[0.06em] text-bh-pine">
                    Bulgarian
                    <br />
                    Longevity
                    <span className="block text-[0.7em] tracking-[0.2em] text-bh-ink/45">
                      Association
                    </span>
                  </span>
                </div>
              )}
            </div>

            <span
              aria-hidden
              className="hidden h-14 w-px bg-bh-ink/15 sm:block"
            />

            {/* Producer — Biohacking Experience */}
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Biohacking Experience"
                className="bh-logo-light-bg h-12 w-auto"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-dark.svg"
                alt=""
                aria-hidden
                className="bh-logo-dark-bg h-12 w-auto"
              />
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-bh-ink/60">
            Sofia Life Summit се организира съвместно от{" "}
            <span className="font-semibold text-bh-ink">
              Bulgarian Longevity Association
            </span>{" "}
            и <span className="font-semibold text-bh-ink">Biohacking.bg</span>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
