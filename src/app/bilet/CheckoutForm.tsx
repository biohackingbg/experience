"use client";

import { useActionState, useEffect, useState } from "react";

import { initialCheckoutState } from "@/lib/checkout-state";
import { CHECKOUT, type Lang } from "@/lib/i18n";
import { PURCHASE_TERMS_TEXT, PURCHASE_TERMS_TEXT_EN } from "@/lib/purchase-terms";
import { TIERS, formatPrice, splitVat } from "@/lib/tickets";
import { type PromoPreview, checkPromo, startCheckout } from "./actions";

const fieldBase =
  "mt-2 w-full rounded-2xl border border-bh-ink/15 bg-bh-cloud px-4 py-3 text-bh-ink outline-none focus:border-bh-pine";

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50"
    >
      {children}
    </label>
  );
}

function Err({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-red-700">
      {children}
    </p>
  );
}

/**
 * `early` is decided on the server and handed down. Working it out here from
 * the browser clock would let a device with the wrong date show one price
 * while the server charged another.
 */
export function CheckoutForm({
  initialTier,
  prices,
  soldOut = [],
  lang = "bg",
  utm,
}: {
  initialTier?: string;
  /** Per tier, VAT included, decided on the server for the stage the site is on. */
  prices: Record<string, number>;
  /** Tier ids with no seats left; shown, but not selectable. */
  soldOut?: string[];
  lang?: Lang;
  /** Campaign tags from the URL, written onto the order so marketing can count it. */
  utm?: { source?: string; campaign?: string };
}) {
  const [state, formAction, pending] = useActionState(
    startCheckout,
    initialCheckoutState,
  );
  const t = CHECKOUT[lang];

  // Stripe's checkout lives on another origin, so the jump has to happen here
  // rather than as a server redirect.
  useEffect(() => {
    if (state.status === "redirect" && state.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  const [tierId, setTierId] = useState(() => {
    const wanted = TIERS.some((t) => t.id === initialTier) && !soldOut.includes(initialTier!) ? initialTier! : null;
    return wanted ?? TIERS.find((t) => !soldOut.includes(t.id))?.id ?? "plus";
  });
  const [quantity, setQuantity] = useState(1);
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [checking, setChecking] = useState(false);

  const tier = TIERS.find((t) => t.id === tierId)!;
  const gross = (prices[tier.id] ?? tier.listPriceCents) * quantity;
  // Preview only - the server resolves the code again when the order is made.
  const discount =
    promo?.ok
      ? Math.max(0, Math.min(gross, promo.kind === "percent" ? Math.round((gross * promo.value) / 100) : promo.value))
      : 0;
  const total = gross - discount;
  const { netCents, vatCents } = splitVat(total);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromo(null);
      return;
    }
    setChecking(true);
    try {
      setPromo(await checkPromo(code));
    } finally {
      setChecking(false);
    }
  };

  return (
    <form action={formAction} className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <input type="hidden" name="lang" value={lang} />
      {utm?.source && <input type="hidden" name="utmSource" value={utm.source} />}
      {utm?.campaign && <input type="hidden" name="utmCampaign" value={utm.campaign} />}
      <div>
        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50">
            {t.tier}
          </legend>
          <div className="mt-3 flex flex-col gap-2">
            {TIERS.map((tier0) => {
              const gone = soldOut.includes(tier0.id);
              return (
              <label
                key={tier0.id}
                className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ring-1 transition-colors ${
                  gone
                    ? "cursor-not-allowed bg-bh-cloud opacity-60 ring-bh-ink/10"
                    : tier0.id === tierId
                      ? "bh-mint cursor-pointer ring-bh-pine"
                      : "cursor-pointer bg-bh-cloud ring-bh-ink/10 hover:ring-bh-ink/25"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tierId"
                    value={tier0.id}
                    checked={tier0.id === tierId}
                    disabled={gone}
                    onChange={() => setTierId(tier0.id)}
                    className="h-4 w-4 accent-bh-pine"
                  />
                  <span className="font-semibold text-bh-ink">{tier0.name}</span>
                </span>
                <span className="font-semibold text-bh-ink">
                  {gone ? <span className="text-xs font-bold uppercase tracking-wide text-bh-ink/60">{t.soldOut}</span> : `${formatPrice(prices[tier0.id] ?? tier0.listPriceCents)} €`}
                </span>
              </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6">
          <Label htmlFor="quantity">{t.quantity}</Label>
          <select
            id="quantity"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={fieldBase}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Err>{state.fieldErrors?.quantity}</Err>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">{t.name}</Label>
            <input id="name" name="name" required autoComplete="name" className={fieldBase} />
            <Err>{state.fieldErrors?.name}</Err>
          </div>
          <div>
            <Label htmlFor="email">{t.email}</Label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={fieldBase}
            />
            <Err>{state.fieldErrors?.email}</Err>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="phone">{t.phone}</Label>
          <input id="phone" name="phone" autoComplete="tel" className={fieldBase} />
        </div>

        <div className="mt-5">
          <Label htmlFor="promo">{t.promo}</Label>
          <div className="mt-2 flex gap-2">
            <input
              id="promo"
              name="promo"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                if (promo) setPromo(null);
              }}
              onBlur={applyPromo}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder={t.promoPlaceholder}
              className={`${fieldBase} mt-0 uppercase`}
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={checking}
              className="shrink-0 rounded-full border border-bh-ink/25 px-4 text-sm font-semibold text-bh-ink disabled:opacity-50"
            >
              {checking ? t.checking : t.apply}
            </button>
          </div>
          {promo && (
            <p className={`mt-1.5 text-xs ${promo.ok ? "text-bh-pine" : "text-red-700"}`}>
              {promo.ok ? t.promoOk(promo.code, promo.label) : promo.message}
            </p>
          )}
          <Err>{state.fieldErrors?.promo}</Err>
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-bh-ink/75">
          <input
            type="checkbox"
            checked={wantsInvoice}
            onChange={(e) => setWantsInvoice(e.target.checked)}
            className="h-4 w-4 accent-bh-pine"
          />
          {t.wantInvoice}
        </label>

        {wantsInvoice && (
          <div className="mt-4 grid gap-5 rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8 sm:grid-cols-2">
            <div>
              <Label htmlFor="invoiceCompany">{t.company}</Label>
              <input id="invoiceCompany" name="invoiceCompany" className={fieldBase} />
            </div>
            <div>
              <Label htmlFor="invoiceVatNumber">{t.vatNumber}</Label>
              <input id="invoiceVatNumber" name="invoiceVatNumber" className={fieldBase} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="invoiceAddress">{t.address}</Label>
              <input id="invoiceAddress" name="invoiceAddress" className={fieldBase} />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-3xl bg-bh-cloud p-7 ring-1 ring-bh-ink/8 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold tracking-tight text-bh-ink">
          {t.summary}
        </h2>

        <dl className="mt-5 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-bh-ink/65">
              {tier.name} × {quantity}
            </dt>
            <dd className="text-bh-ink">{formatPrice(gross)} €</dd>
          </div>
          {discount > 0 && promo?.ok && (
            <div className="flex justify-between text-bh-pine">
              <dt>{t.discount} · {promo.code}</dt>
              <dd>-{formatPrice(discount)} €</dd>
            </div>
          )}
          <div className="flex justify-between text-bh-ink/55">
            <dt>{t.net}</dt>
            <dd>{formatPrice(netCents)} €</dd>
          </div>
          <div className="flex justify-between text-bh-ink/55">
            <dt>{t.vat}</dt>
            <dd>{formatPrice(vatCents)} €</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-bh-ink/10 pt-4">
          <span className="font-semibold text-bh-ink">{t.toPay}</span>
          <span className="text-2xl font-black tracking-tight text-bh-ink">
            {formatPrice(total)} €
          </span>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-bh-ink/75">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-bh-pine"
          />
          <span>
            {lang === "en" ? PURCHASE_TERMS_TEXT_EN : PURCHASE_TERMS_TEXT}{" "}
            <a
              href="/usloviya"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {t.fullTerms}
            </a>
          </span>
        </label>
        <Err>{state.fieldErrors?.terms}</Err>

        {state.status === "error" && state.message && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || state.status === "redirect"}
          className="bh-gradient mt-6 w-full rounded-full px-6 py-4 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {pending || state.status === "redirect"
            ? total === 0 ? t.issuing : t.redirecting
            : total === 0 ? t.free : t.pay(formatPrice(total))}
        </button>

        <p className="mt-3 text-center text-xs text-bh-ink/50">
          {t.stripe}
        </p>
      </aside>
    </form>
  );
}
