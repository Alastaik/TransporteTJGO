// Service Worker - Checklist Veicular TJGO
const CACHE_NAME = 'checklist-tjgo-v7';

// Usando caminhos relativos de forma compatível com GitHub Pages
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/vehicles.js',
  './js/storage.js',
  './js/signature.js',
  './js/app.js',
  './js/pdf-generator.js',
  './libs/jspdf.umd.min.js',
  './manifest.json',
  './brasao.png'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First strategy (Resolve problemas de atualização para sempre)
self.addEventListener('fetch', event => {
  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições de outras origens
  if (!event.request.url.startsWith(self.location.origin)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      // Quando online: pega da rede (sempre a versão mais nova) e salva no cache
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Quando offline: falhou a rede, busca do cache
      return caches.match(event.request, { ignoreSearch: true }).then(cached => {
        if (cached) return cached;
        // Fallback de navegação
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
