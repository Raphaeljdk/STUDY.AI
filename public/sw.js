/// <reference lib="webworker" />

const CACHE_NAME = 'studyai-v2';
const OFFLINE_URL = '/';

// Assets to pre-cache on install (graceful — won't fail if any is missing)
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: pre-cache critical assets — skip failures silently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => console.warn('[SW] Skipping precache:', url))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and Next.js data routes — always go to network
  if (
    request.url.includes('/api/') ||
    request.url.includes('/_next/data/') ||
    request.url.includes('/_next/image')
  ) {
    return;
  }

  // Skip chrome-extension and non-http(s) requests
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === 'navigate') {
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) return offlineResponse;
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    })()
  );
});
