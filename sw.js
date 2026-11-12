// The game lives at /blocks/. Other paths (such as /blocks/catalog/) must
// use the network instead of being replaced with the offline game shell.
const CACHE = 'blocks-classic-v4';
const ASSETS = ['./', './index.html', './styles.css', './js/app.js', './js/engine.js', './manifest.webmanifest', './icons/icon.svg'];
const SCOPE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('blocks-classic-') && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Only offline-fallback the actual game's URL. Catalog navigation must
    // reach its own index.html instead of receiving the game index.html.
    const gameNavigation = url.pathname === SCOPE_PATH || url.pathname === SCOPE_PATH + 'index.html';
    if (!gameNavigation) return;
    event.respondWith(
      caches.open(CACHE).then(async (cache) =>
        (await cache.match('./index.html')) || fetch(request)
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
