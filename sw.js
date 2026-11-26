// Offline cache for the hosted game. Always tries the network first, so a new
// version shows up on the next launch; falls back to the saved copy offline.
const CACHE = 'tides-of-survival';
const FILES = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.headers.has('range') || url.pathname.includes('/pack/')) return;   // the asset pack: kept in IndexedDB by the game, so not cached twice
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(req, { ignoreSearch: true })) ||
             (req.mode === 'navigate' && await cache.match('./index.html')) ||
             Response.error();
    }
  })());
});
