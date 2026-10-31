// Network-first app shell; visited meal photos remain available offline.
const VERSION = 'zns-8dbada567247';
const FONTS = 'zns-fonts';
const CORE = ["./", "./index.html", "./pregled-recepata.html", "./experience.css?v=7c5acd419659", "./shopping-data.js?v=68ac99a6ce87", "./shopping.js?v=f32bb0beb1e7", "./spices.js?v=5738cfa827db", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
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
    const review = url.pathname === new URL('./pregled-recepata.html', self.location.href).pathname;
    const page = review ? './pregled-recepata.html' : './index.html';
    e.respondWith(fetch(req).then(async res => {
      if (res.ok) { const cache = await caches.open(VERSION); await cache.put(page, res.clone()); }
      else { const hit = await caches.match(page); if (hit) return hit; }
      return res;
    }).catch(() => caches.match(page).then(hit => hit || new Response('Sadržaj nije dostupan izvan mreže. Otvori ga jednom uz internetsku vezu.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}))));
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
