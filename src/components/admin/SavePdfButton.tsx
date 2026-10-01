"use client";

import { useEffect } from "react";

/**
 * "Запази като PDF" for a document page.
 *
 * A browser will not write a PDF without its own dialog, so the button opens
 * that dialog with everything already right: the page title becomes the file
 * name (so the PDF is called "Проформа DOC-…" rather than the site's title),
 * and the print stylesheet strips the chrome. With `auto`, the dialog opens
 * on arrival - the admin's "PDF" link lands here and the dialog is up before
 * the eye has found the button.
 */
export function SavePdfButton({ fileName, auto = false }: { fileName: string; auto?: boolean }) {
  const save = () => {
    const previous = document.title;
    document.title = fileName;
    // Restored after the dialog closes: the title is the file name only for
    // as long as the dialog is on screen.
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  useEffect(() => {
    if (!auto) return;
    // After paint, so the document is laid out before the dialog snapshots it.
    const t = window.setTimeout(save, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return (
    <span className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={save}
        className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper"
      >
        Запази като PDF
      </button>
      <span className="hidden text-[0.68rem] text-bh-ink/50 sm:inline">в прозореца избери „Save as PDF“</span>
    </span>
  );
}
