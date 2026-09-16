"use client";

import { useActionState, useState } from "react";

import { TIERS as PACKAGES } from "@/lib/finance-options";
import { formatPrice } from "@/lib/tickets";

import { type DocState, createDoc } from "./actions";

const idle: DocState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

export type PartnerOption = {
  id: string;
  label: string;
  tier: string | null;
  amountCents: number | null;
  money: string | null;
  contactName: string | null;
  contactEmail: string | null;
};

type Line = { description: string; price: string; qty: string };

const emptyLine: Line = { description: "", price: "", qty: "1" };

/**
 * One proforma for something that is not a ticket.
 *
 * Picking a partner fills the sheet from the deal already in the pipeline -
 * retyping a company name and an agreed amount is how the two end up
 * disagreeing. Everything stays editable afterwards.
 */
export function DocumentForm({ partners }: { partners: PartnerOption[] }) {
  const [state, action, pending] = useActionState(createDoc, idle);
  const [partnerId, setPartnerId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [company, setCompany] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  function pickPartner(id: string) {
    setPartnerId(id);
    const p = partners.find((x) => x.id === id);
    if (!p) return;
    setCompany(p.label);
    setBuyerName(p.contactName ?? "");
    setBuyerEmail(p.contactEmail ?? "");
    const packageLabel = PACKAGES.find((t) => t.id === p.tier)?.label;
    setLines([
      {
        description: packageLabel ? `${packageLabel} · Sofia Life Summit 2026` : "Партньорство · Sofia Life Summit 2026",
        price: p.amountCents ? (p.amountCents / 100).toFixed(2) : "",
        qty: "1",
      },
    ]);
  }

  const net = lines.reduce((a, l) => {
    const price = Number(l.price.replace(",", ".")) || 0;
    const qty = Number(l.qty) || 0;
    return a + Math.round(price * 100) * qty;
  }, 0);
  const vat = Math.round(net * 0.2);

  return (
    <form action={action}>
      {partners.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <select value={partnerId} onChange={(e) => pickPartner(e.target.value)} className={field}>
            <option value="">— вземи данните от партньор —</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.amountCents ? ` · ${formatPrice(p.amountCents)} € нето` : ""}
                {p.money === "paid" ? " · платено" : p.money === "invoiced" ? " · фактурирано" : ""}
              </option>
            ))}
          </select>
          <span className="text-xs text-bh-ink/55">от „Презентация“ · потвърдените със сума</span>
        </div>
      )}
      <input type="hidden" name="deckLinkId" value={partnerId} />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input name="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="фирма (получател)" className={field} />
        <input name="vatNumber" placeholder="ЕИК / ДДС номер" className={field} />
        <input name="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required placeholder="лице за контакт" className={field} />
        <input name="buyerEmail" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required placeholder="имейл - там отива проформата" className={field} />
        <input name="address" placeholder="адрес по регистрация" className={`${field} sm:col-span-2`} />
      </div>

      <div className="mt-4 rounded-2xl bg-bh-cloud p-3 ring-1 ring-bh-ink/8">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/50">Какво се фактурира</div>
        {lines.map((l, i) => (
          <div key={i} className="mt-2 grid gap-2 sm:grid-cols-[1fr_9rem_6rem_auto]">
            <input
              name="lineDescription"
              value={l.description}
              onChange={(e) => setLine(i, { description: e.target.value })}
              placeholder="пакет, услуга, такса…"
              className={field}
            />
            <input
              name="linePrice"
              value={l.price}
              onChange={(e) => setLine(i, { price: e.target.value })}
              inputMode="decimal"
              placeholder="€ без ДДС"
              className={field}
            />
            <input
              name="lineQty"
              value={l.qty}
              onChange={(e) => setLine(i, { qty: e.target.value })}
              inputMode="numeric"
              className={field}
              title="количество"
            />
            <button
              type="button"
              onClick={() => setLines((prev) => (prev.length === 1 ? [{ ...emptyLine }] : prev.filter((_, j) => j !== i)))}
              className="rounded-full px-3 py-2 text-xs font-semibold text-bh-ink/50 transition-colors hover:text-red-600"
            >
              Махни
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}
          className="mt-2 rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
        >
          + още един ред
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[8rem_12rem_1fr]">
        <input name="dueDays" type="number" min={1} max={90} defaultValue={7} className={field} title="дни за плащане" />
        <select name="lang" defaultValue="bg" className={field}>
          <option value="bg">документ на български</option>
          <option value="en">двуезичен (EN/BG)</option>
        </select>
        <input name="note" placeholder="бележка за нас (не излиза на документа)" className={field} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Издава…" : "Направи проформа"}
        </button>
        {net > 0 && (
          <span className="text-sm text-bh-ink/70">
            {formatPrice(net)} € нето + {formatPrice(vat)} € ДДС ={" "}
            <strong className="font-semibold text-bh-ink">{formatPrice(net + vat)} €</strong>
          </span>
        )}
      </div>
      {state.status !== "idle" && (
        <p className={`mt-3 text-sm ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>
          {state.message}
          {state.status === "ok" && state.reference && (
            <>
              {" "}
              <a href={`/proforma/${state.reference}`} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
                Отвори проформата
              </a>
            </>
          )}
        </p>
      )}
    </form>
  );
}
