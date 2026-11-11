const CACHE = 'blocks-classic-v3';
const ASSETS = ['./','./index.html','./styles.css','./js/app.js','./js/engine.js','./manifest.webmanifest','./icons/icon.svg'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('blocks-classic-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match('./index.html')) || fetch(request)));
  } else {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});