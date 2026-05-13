const CACHE_NAME = "votex-bsit3b-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/jpc-logo.jpg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached if found, otherwise fetch from network
      return cached || fetch(event.request).then((response) => {
        // Don't cache if not a valid response or if it's a cross-origin request we don't want to cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Fallback for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match("/index.html");
      }
    })
  );
});
