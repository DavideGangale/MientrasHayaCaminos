const CACHE = 'vespatrek-v46';
const BASE = '/MientrasHayaCaminos/';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    const urls = [
      BASE + 'Vespa100.html',
      BASE + 'inbox_camera.html',
      BASE + 'manifest.json',
      BASE + 'manifest_camera.json',
      BASE + 'icon-192.png',
      BASE + 'icon-512.png'
    ];

    for (const url of urls) {
      try { await cache.add(url); } catch (e) { console.warn('Pre-cache failed:', url, e); }
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
  const req = event.request;
  const url = new URL(req.url);

  // Applica la regola solo al tuo sito
  if (url.origin !== location.origin) return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith((async () => {
      // ✅ PER INBOX_CAMERA (IPHONE OFFLINE CAMERA):
      // CACHE-FIRST IMMEDIATO (Apertura istantanea senza attendere la rete)
      if (url.pathname.includes('inbox_camera.html')) {
        const cached = await caches.match(BASE + 'inbox_camera.html', { ignoreSearch: true })
                    || await caches.match(req, { ignoreSearch: true });
        if (cached) {
          // In background prova ad aggiornare la cache se online
          fetch(req).then(async (fresh) => {
            if (fresh && fresh.status === 200) {
              const cache = await caches.open(CACHE);
              cache.put(BASE + 'inbox_camera.html', fresh);
            }
          }).catch(() => {});
          return cached;
        }

        // Se non ancora in cache, prova rete
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(CACHE);
            cache.put(BASE + 'inbox_camera.html', fresh.clone());
          }
          return fresh;
        } catch (e) {
          return new Response('Offline: pagina fotocamera non ancora in cache', { status: 503 });
        }
      }

      // ✅ PER LE ALTRE PAGINE (Vespa100.html, public.html):
      // Network con timeout rapido (2s max) per evitare blocchi su connessioni lente/assenti
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const fresh = await fetch(req, { signal: controller.signal });
        clearTimeout(timeoutId);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req, { ignoreSearch: true })
                    || await caches.match(BASE + 'Vespa100.html', { ignoreSearch: true });
        if (cached) return cached;
        return caches.match(BASE + 'Vespa100.html');
      }
    })());
    return;
  }

  // Cache-first per il resto (icone/manifest ecc.)
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => cached || fetch(req))
  );
});
