// Service Worker for D&D / TRPG Interactive Sheet PWA
const CACHE_NAME = 'nexus-trpg-v13';

// Install Event - force update immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event - purge all older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first fetch handler for maximum freshness and reliability
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.origin) return;

  // Never cache sw.js, manifest.json, index.html, navigations, or API endpoints
  if (
    url.pathname === '/sw.js' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('manifest.json') ||
    url.pathname.startsWith('/api/') ||
    event.request.mode === 'navigate'
  ) {
    return;
  }

  // For static hashed assets, prefer network with cache fallback
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

