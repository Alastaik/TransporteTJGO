const CACHE_NAME = 'tjgo-transporte-v2';
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
  './js/pages/login.js',
  './js/pages/dashboard.js',
  './js/pages/checklist-form.js',
  './js/pages/checklist-view.js',
  './js/pages/history.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentionally not failing if a font fails to load
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.warn(`Falha ao cachear ${url}:`, err)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Skip API requests (they are handled by app logic for offline fallback)
  if (e.request.url.includes('/api/')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === 'GET' && !e.request.url.startsWith('chrome-extension')) {
            cache.put(e.request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Fallback for html pages
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
