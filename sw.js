// Service Worker - Checklist Veicular TJGO
const CACHE_NAME = 'checklist-tjgo-v6';

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
  './brasao.png?v=2'
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

// Fetch: cache-first strategy
self.addEventListener('fetch', event => {
  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições de outras origens
  if (!event.request.url.startsWith(self.location.origin)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Fallback para index.html se estiver offline e for navegação
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
