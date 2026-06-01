const CACHE_NAME = 'gorodkvest-v1';
const STATIC_CACHE = 'gorodkvest-static-v1';
const IMAGES_CACHE = 'gorodkvest-images-v1';

// Файлы для кеширования
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/cities.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-256x256.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Установка SW — кешируем статические файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

// Активация — чистим старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== IMAGES_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Стратегия: Cache First, затем Network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Для изображений — отдельный кеш
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const responseClone = response.clone();
          caches.open(IMAGES_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // Для API запросов (cities.json) — Network First
  if (url.pathname.includes('cities.json')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Для всего остального — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
