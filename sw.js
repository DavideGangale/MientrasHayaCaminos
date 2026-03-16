const CACHE = 'vespatrek-v2';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Metti qui SOLO file che esistono sicuramente
    const urls = [
      './',
      './manifest.json',
      './icon-192.png',
      './icon-512.png'
    ];

    for (const url of urls) {
      try { await cache.add(url); } catch (e) { /* ignora */ }
    }

    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // pulizia vecchie cache
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
