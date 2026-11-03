"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<unknown> };

/**
 * Makes the ticket page an app: registers the service worker that keeps it
 * working with no signal, saves this page for it at once (the worker only sees
 * pages loaded after it takes over), and on Android offers the home-screen
 * install. Renders nothing where installing is not on offer.
 */
export function TicketApp({ label, hint }: { label: string; hint: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => caches.open("sls-ticket-v1"))
      .then((cache) => cache.add(location.pathname))
      .catch(() => {});

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;
  return (
    <div className="mt-3 flex flex-col items-center gap-2 px-7 print:hidden">
      <button
        type="button"
        onClick={() => {
          prompt.prompt();
          setPrompt(null);
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-bh-ink/20 px-4 py-2.5 text-sm font-semibold text-bh-ink"
      >
        {label}
      </button>
      <p className="text-center text-[0.7rem] text-bh-ink/45">{hint}</p>
    </div>
  );
}
