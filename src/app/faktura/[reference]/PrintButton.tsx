"use client";

/**
 * Printing is the browser's own job. "Save as PDF" lives inside the same
 * dialog, which is why there is no PDF generator on the server: the file the
 * buyer gets is produced by the machine that asks for it.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
    >
      Изтегли / принтирай
    </button>
  );
}
