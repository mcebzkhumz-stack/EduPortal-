/* EduPortal service worker — app-shell caching only.
   Bump CACHE_NAME whenever index.html (or the other shell files) change,
   so returning visitors pick up the new version instead of a stale cache. */
const CACHE_NAME = 'eduportal-shell-v1';
const SHELL_FILES = [
    './',
    './index.html',
    './manifest.json',
    './icons/eduportal-icon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(SHELL_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    // Only handle same-origin GET requests for the app shell. Everything
    // else (GitHub API calls, the cloud storage backends, any other
    // cross-origin fetch the app makes) is left completely untouched so
    // this never interferes with live sync.
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res && res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
