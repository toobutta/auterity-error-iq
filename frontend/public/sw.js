/**
 * Service Worker for caching and offline support
 * Implements performance optimizations and caching strategies
 */

const CACHE_NAME = 'auterity-v1.0.0';
const STATIC_CACHE = 'auterity-static-v1.0.0';
const API_CACHE = 'auterity-api-v1.0.0';
const IMAGE_CACHE = 'auterity-images-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/health',
  '/api/user/profile',
  '/api/config',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network
  CACHE_FIRST: 'cache-first',
  // Network first, then cache
  NETWORK_FIRST: 'network-first',
  // Cache only
  CACHE_ONLY: 'cache-only',
  // Network only
  NETWORK_ONLY: 'network-only',
  // Stale while revalidate
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);

      // Skip waiting to activate immediately
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== IMAGE_CACHE) {

            return caches.delete(cacheName);
          }
        })
      );

      // Take control of all clients
      await self.clients.claim();

    })()
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('localhost')) return;

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isImageRequest(request) {
  const url = new URL(request.url);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
  return imageExtensions.some(ext => url.pathname.endsWith(ext));
}

// Cache strategies implementation
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {

    throw error;
  }
}

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {

      return cachedResponse;
    }

    throw error;
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {

    throw error;
  }
}

async function handlePageRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    // Try network first for pages
    const networkResponse = await fetch(request);

    // Cache successful HTML responses
    if (networkResponse.ok && request.headers.get('accept')?.includes('text/html')) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cached page or offline page
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    const offlineResponse = await cache.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {

  // Implement offline action sync logic here
  // This could include retrying failed API calls, syncing local data, etc.
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  );
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.registration.periodicSync.register('content-sync', {
    minInterval: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    getCacheInfo().then((info) => {
      event.ports[0].postMessage(info);
    });
  }
});

// Get cache information
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const cacheInfo = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheInfo[cacheName] = keys.length;
  }

  return cacheInfo;
}

// Export for TypeScript
export {};


