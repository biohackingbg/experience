"use client";

import { useActionState, useEffect, useState } from "react";

import { initialCheckoutState } from "@/lib/checkout-state";
import { PURCHASE_TERMS_TEXT } from "@/lib/purchase-terms";
import { TIERS, formatPrice, priceCents, splitVat } from "@/lib/tickets";
import { startCheckout } from "./actions";

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
  early,
}: {
  initialTier?: string;
  early: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    startCheckout,
    initialCheckoutState,
  );

  // Stripe's checkout lives on another origin, so the jump has to happen here
  // rather than as a server redirect.
  useEffect(() => {
    if (state.status === "redirect" && state.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  const [tierId, setTierId] = useState(
    TIERS.some((t) => t.id === initialTier) ? initialTier! : "plus",
  );
  const [quantity, setQuantity] = useState(1);
  const [wantsInvoice, setWantsInvoice] = useState(false);

  const tier = TIERS.find((t) => t.id === tierId)!;
  const total = priceCents(tier, early) * quantity;
  const { netCents, vatCents } = splitVat(total);

  return (
    <form action={formAction} className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50">
            Ниво
          </legend>
          <div className="mt-3 flex flex-col gap-2">
            {TIERS.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-5 py-4 ring-1 transition-colors ${
                  t.id === tierId
                    ? "bh-mint ring-bh-pine"
                    : "bg-bh-cloud ring-bh-ink/10 hover:ring-bh-ink/25"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tierId"
                    value={t.id}
                    checked={t.id === tierId}
                    onChange={() => setTierId(t.id)}
                    className="h-4 w-4 accent-bh-pine"
                  />
                  <span className="font-semibold text-bh-ink">{t.name}</span>
                </span>
                <span className="font-semibold text-bh-ink">
                  {formatPrice(priceCents(t, early))} €
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <Label htmlFor="quantity">Брой</Label>
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
            <Label htmlFor="name">Име и фамилия</Label>
            <input id="name" name="name" required autoComplete="name" className={fieldBase} />
            <Err>{state.fieldErrors?.name}</Err>
          </div>
          <div>
            <Label htmlFor="email">Имейл</Label>
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
          <Label htmlFor="phone">Телефон (по избор)</Label>
          <input id="phone" name="phone" autoComplete="tel" className={fieldBase} />
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-bh-ink/75">
          <input
            type="checkbox"
            checked={wantsInvoice}
            onChange={(e) => setWantsInvoice(e.target.checked)}
            className="h-4 w-4 accent-bh-pine"
          />
          Искам фактура на фирма
        </label>

        {wantsInvoice && (
          <div className="mt-4 grid gap-5 rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8 sm:grid-cols-2">
            <div>
              <Label htmlFor="invoiceCompany">Фирма</Label>
              <input id="invoiceCompany" name="invoiceCompany" className={fieldBase} />
            </div>
            <div>
              <Label htmlFor="invoiceVatNumber">ЕИК / ДДС номер</Label>
              <input id="invoiceVatNumber" name="invoiceVatNumber" className={fieldBase} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="invoiceAddress">Адрес</Label>
              <input id="invoiceAddress" name="invoiceAddress" className={fieldBase} />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-3xl bg-bh-cloud p-7 ring-1 ring-bh-ink/8 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold tracking-tight text-bh-ink">
          Поръчка
        </h2>

        <dl className="mt-5 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-bh-ink/65">
              {tier.name} × {quantity}
            </dt>
            <dd className="text-bh-ink">{formatPrice(total)} €</dd>
          </div>
          <div className="flex justify-between text-bh-ink/55">
            <dt>Данъчна основа</dt>
            <dd>{formatPrice(netCents)} €</dd>
          </div>
          <div className="flex justify-between text-bh-ink/55">
            <dt>ДДС 20%</dt>
            <dd>{formatPrice(vatCents)} €</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-bh-ink/10 pt-4">
          <span className="font-semibold text-bh-ink">За плащане</span>
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
            {PURCHASE_TERMS_TEXT}{" "}
            <a
              href="/usloviya"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Пълни условия
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
            ? "Пренасочвам към плащане…"
            : `Плати ${formatPrice(total)} €`}
        </button>

        <p className="mt-3 text-center text-xs text-bh-ink/50">
          Плащането се обработва от Stripe. Не съхраняваме данни за карти.
        </p>
      </aside>
    </form>
  );
}
