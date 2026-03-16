const CACHE = 'vespatrek-v2';
const BASE = '/MientrasHayaCaminos/';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    const urls = [
      BASE + 'Vespa100.html',
      BASE + 'manifest.json',
      BASE + 'icon-192.png',
      BASE + 'icon-512.png'
    ];

    for (const url of urls) {
      try { await cache.add(url); } catch (e) {}
    }

    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : null));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
