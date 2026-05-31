const CACHE_NAME = 'placar-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
