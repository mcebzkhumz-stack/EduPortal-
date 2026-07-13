// Minimal offline cache for EduPortal. Caches this page's own shell so it
// still opens (read-only, last-loaded data) with no connection. Data itself
// keeps syncing through the app's normal cloud storage layer once back
// online — this only covers the app shell, not a full offline data store.
const CACHE = 'eduportal-shell-v1';
self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html'])).catch(() => { }));
    self.skipWaiting();
});
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
});
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
