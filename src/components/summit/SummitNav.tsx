import Link from "next/link";

import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { Lang } from "@/lib/i18n";
import { cheapestOf, getPricing, priceOf } from "@/lib/pricing";
import { NAV } from "@/lib/site-copy";
import { SALES_OPEN, formatPrice } from "@/lib/tickets";

export async function SummitNav({ lang = "bg" }: { lang?: Lang }) {
  // The hero gave up its CTA row for a cleaner composition; the price anchor
  // moves here, onto the one button that is now always on screen.
  const pricing = await getPricing();
  // The cheapest tier, not just the cheapest number: the button links to it,
  // so the two must be the same tier.
  const cheapestTier = cheapestOf(pricing);
  const cheapest = priceOf(pricing, cheapestTier);
  const c = NAV[lang];
  const en = lang === "en";

  return (
    /* Sticky glass: translucent paper over a backdrop blur, so the page
       stays legible sliding underneath. Works because the page wrapper
       clips with overflow-clip, not overflow-hidden - hidden would make it
       the scroll container and quietly kill the stickiness. */
    <header className="sticky top-0 z-40 border-b border-bh-ink/10 bg-bh-paper/70 px-5 backdrop-blur-lg sm:px-8 lg:px-10">
      <ScrollProgress />
      <nav className="flex items-center justify-between py-4">
        <Link href="#top" aria-label={c.home} className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Biohacking Experience" className="bh-logo-light-bg h-7 w-auto sm:h-8" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="" aria-hidden className="bh-logo-dark-bg h-7 w-auto sm:h-8" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {c.links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-bh-ink/70 transition-colors hover:text-bh-ink">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* The whole site exists in both languages; the switch is a link,
              so it works with JavaScript off and can be shared as a URL. */}
          <Link
            href={en ? "/" : "/en"}
            hrefLang={en ? "bg" : "en"}
            className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink/80 transition-colors hover:border-bh-ink hover:text-bh-ink"
          >
            {c.otherLang}
          </Link>
          <ThemeToggle />
          {/* Straight into the checkout, on the tier the button just quoted -
              the price in the label and the price on the next screen are the
              same number. */}
          {SALES_OPEN ? (
            <Link
              href={`/bilet?nivo=${cheapestTier.id}${en ? "&lang=en" : ""}`}
              className="bh-gradient inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
            >
              {c.buy(formatPrice(cheapest))}
            </Link>
          ) : (
            <a
              href="#tickets"
              className="bh-gradient inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5"
            >
              {c.soon}
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
