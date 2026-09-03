"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

/**
 * Reads the ticket QR with the phone's camera and hands the code to the
 * scanner form. Decoding runs in the page (jsQR on a downscaled frame), so
 * it works in every browser that can open a camera - Safari included, which
 * has no native barcode API. A code is reported once, then ignored for a few
 * seconds, so a ticket held in front of the lens does not fire twice.
 */
export function Camera({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!on) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;
    let last = { code: "", at: 0 };
    let lastTick = 0;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        video.srcObject = stream;
        await video.play();
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const tick = (t: number) => {
          frame = requestAnimationFrame(tick);
          // ~8 frames a second is plenty for a QR and keeps the phone cool.
          if (t - lastTick < 120 || video.readyState < 2) return;
          lastTick = t;
          const w = Math.min(video.videoWidth, 640);
          const scale = w / video.videoWidth;
          canvas.width = w;
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (!hit?.data) return;
          const code = hit.data.trim().toUpperCase();
          const now = Date.now();
          if (code === last.code && now - last.at < 4000) return;
          last = { code, at: now };
          onCode(code);
        };
        frame = requestAnimationFrame(tick);
      } catch {
        setError("Камерата не тръгна - провери разрешението или ползвай полето за код.");
        setOn(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [on, onCode]);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOn((v) => !v);
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            on ? "bg-bh-ink text-bh-paper" : "border border-bh-ink/25 text-bh-ink hover:border-bh-ink"
          }`}
        >
          {on ? "Спри камерата" : "Сканирай с камерата"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      {on && (
        <div className="mt-3 overflow-hidden rounded-2xl bg-black ring-1 ring-bh-ink/10">
          <video ref={videoRef} playsInline muted className="block aspect-[4/3] w-full object-cover" />
        </div>
      )}
      <canvas ref={canvasRef} hidden />
    </div>
  );
}
