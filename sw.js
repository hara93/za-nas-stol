// Network-first app shell; visited meal photos remain available offline.
const VERSION = 'zns-5981364bb48c';
const FONTS = 'zns-fonts';
const CORE = ['./', './index.html', './experience.css', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('zns-') && k !== VERSION && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(async res => {
      if (res.ok) { const cache = await caches.open(VERSION); await cache.put('./index.html', res.clone()); }
      else { const hit = await caches.match('./index.html'); if (hit) return hit; }
      return res;
    }).catch(() => caches.match('./index.html').then(hit => hit || caches.match('./'))));
    return;
  }
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (font || url.origin === self.location.origin) {
    e.respondWith(caches.open(font ? FONTS : VERSION).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || (font && res.type === 'opaque')) await cache.put(req, res.clone());
      return res;
    }));
  }
});
