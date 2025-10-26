// sw.js — mínimo para habilitar instalación PWA en Android
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
