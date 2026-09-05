"use client";

import { useState } from "react";

/**
 * The same banner as PNG or as JPEG.
 *
 * LinkedIn refused a PNG cover with an alpha channel - the design is opaque,
 * so the transparency carried nothing but the refusal. Rather than keeping a
 * second copy of every banner on the server, the browser redraws it on a
 * canvas, which drops the alpha and writes a JPEG.
 */
export function BannerDownload({ id, width, height }: { id: string; width: number; height: number }) {
  const [busy, setBusy] = useState(false);

  async function asJpeg() {
    setBusy(true);
    try {
      const res = await fetch(`/api/banner/${id}`);
      const bitmap = await createImageBitmap(await res.blob());
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      // Paint the ground first: a JPEG has no transparency, and without this
      // anything the design leaves clear would come out black.
      ctx.fillStyle = "#02251f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sofia-life-summit-${id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <a
        href={`/api/banner/${id}`}
        download={`sofia-life-summit-${id}.png`}
        className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
      >
        PNG {width}×{height}
      </a>
      <button
        type="button"
        onClick={asJpeg}
        disabled={busy}
        title="Ако мрежата откаже PNG - LinkedIn понякога отказва"
        className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink disabled:opacity-50"
      >
        {busy ? "…" : "JPEG"}
      </button>
    </div>
  );
}
