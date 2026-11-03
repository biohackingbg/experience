// Keeps the ticket page working with no signal. The hotel's wifi at the door
// is the one place a QR code must not depend on the network.
//
// A ticket page is fetched from the network first (the arrival slot or the
// name may have changed) and falls back to the last copy this phone saw.
// The built assets are immutable, so they are served from the cache.
const CACHE = "sls-ticket-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("sls-") && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

async function fromNetworkThenCache(request) {
  const cache = await caches.open(CACHE);
  try {
    // A flaky connection hangs rather than fails; give up and use the copy.
    const response = await fetch(request, { signal: AbortSignal.timeout(4000) });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function fromCacheThenNetwork(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname.startsWith("/bilet/")) {
    event.respondWith(fromNetworkThenCache(request));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(fromCacheThenNetwork(request));
  }
});
