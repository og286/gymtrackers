// Gym Tracker service worker — caches the app shell for offline loading.
// GitHub API calls always go to the network.
const CACHE = 'gym-tracker-v6';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' bypasses the HTTP cache so a new service worker
  // always caches the latest files from the server, not stale copies
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(SHELL.map(u =>
      fetch(u, { cache: 'reload' }).then(r => { if (r.ok) return c.put(u, r); })
    ))
  ));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('api.github.com') || e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached =>
      cached ||
      fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
