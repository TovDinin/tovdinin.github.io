const CACHE_NAME = 'tobolsk-quest-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/cities.json',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Cache add error:', err))
  );
});

// Перехват запросов и ответ из кеша или сети
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кеша, если есть, иначе идём в сеть
        return response || fetch(event.request);
      })
  );
});

// Обновление кеша при активации
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
