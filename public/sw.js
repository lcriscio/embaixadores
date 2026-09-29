// Can Candles Embaixadores Service Worker
//
// Páginas (HTML) sempre vêm da rede, para nunca servir um index.html antigo que aponta
// para arquivos de um deploy anterior (causa tela branca). Apenas os arquivos com hash em
// /assets/ e os ícones ficam em cache; o HTML em cache é usado só quando está offline.
const CACHE_NAME = 'cancandles-pwa-v2';
const ASSETS_TO_CACHE = ['/icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const tinhaCacheAntigo = keys.some((key) => key !== CACHE_NAME);
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
      // Quem estava com a versão antiga (tela branca) recarrega automaticamente uma vez.
      if (tinhaCacheAntigo) {
        const janelas = await self.clients.matchAll({ type: 'window' });
        janelas.forEach((janela) => janela.navigate(janela.url).catch(() => {}));
      }
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Navegação: rede primeiro; cache só como fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copia));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Arquivos com hash no nome nunca mudam: cache primeiro.
  if (url.pathname.startsWith('/assets/') || ASSETS_TO_CACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copia = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
            }
            return response;
          }),
      ),
    );
  }
});
