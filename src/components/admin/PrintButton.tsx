"use client";

export function PrintButton({ label = "Печат" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper print:hidden"
    >
      {label}
    </button>
  );
}
