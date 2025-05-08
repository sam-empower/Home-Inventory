// Import Workbox from CDN (this gets added during runtime)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;

// Spotlight Search Integration
// This helps with iOS Spotlight integration
let spotlightItems = [];

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Update spotlight items when received from main thread
  if (event.data && event.data.type === 'UPDATE_SPOTLIGHT_ITEMS') {
    spotlightItems = event.data.items || [];
    console.log(`Service worker updated ${spotlightItems.length} items for Spotlight search`);
  }
});

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy
registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year
registerRoute(
  ({url}) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

// Cache CSS, JS, and Web Worker requests with a stale-while-revalidate strategy
registerRoute(
  ({request}) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Cache API requests with NetworkFirst
registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// Cache images with a cache-first strategy
registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Serve HTML pages with a network-first approach for web app navigation
registerRoute(
  ({request}) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);

// Handle offline fallbacks
self.addEventListener('install', (event) => {
  const files = [
    '/',
    '/index.html',
    '/offline.html', // Create this file for offline fallback
    '/manifest.json'
  ];

  event.waitUntil(
    caches.open('offline-fallbacks').then((cache) => {
      return cache.addAll(files);
    })
  );
});

// Cleanup old caches during activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [
    'google-fonts-stylesheets',
    'google-fonts-webfonts',
    'static-resources',
    'api-responses',
    'images',
    'pages',
    'offline-fallbacks'
  ];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Skip waiting and claim clients to update service worker immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Special handling for navigation requests to return index.html for all HTML requests
  // This ensures the SPA routing works properly even for direct URL access
  if (event.request.mode === 'navigate' && !event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }
  
  // Let Workbox handle all other requests
});
