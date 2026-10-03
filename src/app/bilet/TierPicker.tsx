"use client";

import { CHECKOUT, type Lang } from "@/lib/i18n";
import { TIER_FEATURES } from "@/lib/site-copy";
import { TIERS, type Tier, formatPrice } from "@/lib/tickets";

/**
 * The three tiers as a choice rather than a price list.
 *
 * Before this the page showed three radio rows - a name and a number each,
 * cheapest first and preselected. With nothing but prices to compare, the
 * lowest wins, and the ads were landing people exactly there. Now PLUS
 * comes first and open, PEAK anchors above it, CORE sits last and says what
 * it leaves out; each card carries what the money buys. The order is this
 * component's alone: `TIERS` keeps its own, which the reports and the admin
 * rely on.
 */
const ORDER: Tier["id"][] = ["plus", "peak", "core"];

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`mt-0.5 h-4 w-4 shrink-0 ${className ?? ""}`} aria-hidden>
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TierPicker({
  value,
  onChange,
  prices,
  discounted,
  regularAfter,
  soldOut,
  lang,
}: {
  value: string;
  onChange: (id: string) => void;
  prices: Record<string, number>;
  /** A discounted stage is on, so the list price is struck beside the current one. */
  discounted: boolean;
  /** "след първите 200 билета" - the condition under which the struck price applies. */
  regularAfter: string;
  soldOut: string[];
  lang: Lang;
}) {
  const t = CHECKOUT[lang];
  const tiers = ORDER.map((id) => TIERS.find((x) => x.id === id)!);
  const price = (id: string) => prices[id] ?? TIERS.find((x) => x.id === id)!.listPriceCents;
  const upgradeCents = price("plus") - price("core");

  return (
    <div className="mt-3 flex flex-col gap-3">
      {tiers.map((tier) => {
        const gone = soldOut.includes(tier.id);
        const selected = tier.id === value && !gone;
        const copy = TIER_FEATURES[tier.id][lang];
        const p = price(tier.id);
        const twoDays = tier.id !== "core";
        // Whole class names, never assembled: Tailwind reads the source.
        const surface = gone
          ? "cursor-not-allowed bg-bh-cloud text-bh-ink opacity-60 ring-1 ring-bh-ink/10"
          : selected
            ? "bh-forest bh-gradient-outline cursor-pointer text-bh-paper"
            : "cursor-pointer bg-bh-cloud text-bh-ink ring-1 ring-bh-ink/10 hover:ring-bh-ink/30";
        const muted = selected ? "text-bh-paper/60" : "text-bh-ink/50";
        const struck = selected ? "text-bh-paper/40" : "text-bh-ink/35";
        return (
          <label key={tier.id} className={`relative block rounded-3xl p-5 transition-colors ${surface}`}>
            <input
              type="radio"
              name="tierId"
              value={tier.id}
              checked={tier.id === value}
              disabled={gone}
              onChange={() => onChange(tier.id)}
              className="sr-only"
            />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-black tracking-tight">{tier.name}</span>
                  {gone ? (
                    <span className="rounded-full bg-bh-ink/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.15em]">{t.soldOut}</span>
                  ) : tier.featured ? (
                    <span className="bh-gradient rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-bh-ink">{t.mostPopular}</span>
                  ) : tier.tagline ? (
                    <span className={`text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${muted}`}>{t.limited}</span>
                  ) : null}
                </div>
                <div className={`mt-1 text-xs ${muted}`}>{twoDays ? t.bothDays : t.oneDay}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-black leading-none tracking-tight">{formatPrice(p)} €</div>
                {discounted && !gone && (
                  <div className={`mt-1 text-[0.7rem] ${struck}`}>
                    <s>{formatPrice(tier.listPriceCents)} €</s> {regularAfter}
                  </div>
                )}
              </div>
            </div>

            {/* The open card says what the money buys; a closed one says it in
                one line, so the three still fit a phone screen together. */}
            {selected ? (
              <ul className={`mt-4 flex flex-col gap-1.5 text-sm ${selected ? "text-bh-paper/85" : "text-bh-ink/75"}`}>
                {copy.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
                {copy.absent.map((f) => (
                  <li key={f} className={`flex items-start gap-2 ${muted}`}>
                    <span className="mt-0.5 inline-block h-4 w-4 shrink-0 text-center leading-4">–</span>
                    <span>{f}</span>
                  </li>
                ))}
                {tier.id === "core" && upgradeCents > 0 && (
                  <li className="mt-2 rounded-2xl bg-bh-paper/10 px-3 py-2 text-xs text-bh-paper/90">
                    {t.upgrade(formatPrice(upgradeCents))}
                  </li>
                )}
              </ul>
            ) : (
              !gone && (
                <p className={`mt-3 text-xs leading-snug ${muted}`}>
                  {tier.id === "core" ? copy.absent[0] ?? "" : copy.features.slice(0, 3).join(" · ")}
                </p>
              )
            )}
          </label>
        );
      })}
    </div>
  );
}
