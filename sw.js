const CACHE = "clynico-v6"; // <-- súbelo
self.addEventListener("install", e => {
  self.skipWaiting(); // toma control al instalar
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/","/index.html","/manifest.json"])));
});
self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
