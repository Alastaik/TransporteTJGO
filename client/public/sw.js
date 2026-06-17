const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './brasao.png',
  './imgs/brasao.png',
  './css/style.css',
  './libs/jspdf.umd.min.js',
  './js/app.js',
  './js/api.js',
  './js/auth.js',
  './js/database.js',
  './js/sync.js',
  './js/signature.js',
  './js/vehicles.js',
  './js/pdf-generator.js',
  './js/pdf-professional.js',
  './js/pages/login.js',
  './js/pages/dashboard.js',
  './js/pages/checklist-form.js',
  './js/pages/checklist-view.js',
  './js/pages/history.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0'
];

const CACHE_NAME = 'tjgo-transporte-v13-network-first';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentionally not failing if a font fails to load
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.warn(`Falha ao cachear ${url}:`, err)))
      );
    })
  );
  self.skipWaiting(); // Força a instalação imediata
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim(); // Assume o controle imediatamente
});

self.addEventListener('fetch', (e) => {
  // Ignora requisições de API (tratadas na lógica do app) e extensões
  if (e.request.url.includes('/api/') || e.request.url.startsWith('chrome-extension')) {
    return;
  }
  
  // Estratégia: NETWORK FIRST (Tenta a rede primeiro, se falhar/offline usa o cache)
  // Isso resolve 100% o problema de ficar com versão antiga presa no cache
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Se a requisição foi bem sucedida, atualiza o cache silenciosamente
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar (OFFLINE), busca no cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback para index.html em caso de navegação offline
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
