const CACHE_NAME = 'placar-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = new URL(e.request.url);

  // index.html → sempre busca na rede, nunca serve do cache
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(fetch(e.request));
    return;
  }

  // Demais assets → rede primeiro, cache como fallback
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
