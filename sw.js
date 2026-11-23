// Service worker do Placar do Futebol
// Estratégia: REDE SEMPRE. Nada da home ou dos arquivos do site fica guardado em cache.
// O único item em cache é a página de reserva (offline.html), usada quando a rede falha
// ou o servidor responde 404/5xx. Assim o app (TWA) nunca recebe um erro e nunca prende versão velha.

const CACHE_NAME = 'placar-v5';
const OFFLINE_URL = '/offline.html';

// Página de emergência, usada só se o offline.html não estiver no cache nem no servidor.
const OFFLINE_INLINE = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem conexão</title></head>' +
  '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
  'background:#12151e;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">' +
  '<div><h1 style="font-size:22px">Não foi possível carregar o Placar</h1>' +
  '<p style="color:#9aa3b2">Verifique sua conexão e tente de novo.</p>' +
  '<button onclick="location.href=\'/\'" style="padding:12px 24px;border:0;border-radius:8px;' +
  'background:#1a7a30;color:#fff;font-size:16px">Tentar de novo</button></div></body></html>';

async function paginaOffline() {
  const emCache = await caches.match(OFFLINE_URL);
  if (emCache) return emCache;
  return new Response(OFFLINE_INLINE, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    } catch (_) {
      // Se o offline.html ainda não existir, a instalação continua e a página de emergência é usada.
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Só trata páginas do próprio site. API, imagens, CSS, JS e vídeos seguem direto pela rede.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.mode !== 'navigate') return;

  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.status === 404 || res.status >= 500) return await paginaOffline();
      return res;
    } catch (_) {
      return await paginaOffline();
    }
  })());
});
