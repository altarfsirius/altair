/* Altair Aero Engineering service worker (v1.26.5). Static files only: the app shell works offline; data calls (Supabase / Edge Functions) are never cached. */
const VERSION = 'altair-aero-1.26.5';
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.png", "logo-128.png", "logo-180.png", "logo-tb.png", "header-laptop.jpg", "header-phone.jpg"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('altair-aero-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;              // Supabase, functions and anything else on another address: straight to the network
  if (req.mode === 'navigate') {                                   // the page: newest when online, last copy when offline
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(k => k.put('index.html', c)); return r; }).catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {                   // images, icons, manifest: cached copy first, refreshed in the background
    const net = fetch(req).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(VERSION).then(k => k.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
