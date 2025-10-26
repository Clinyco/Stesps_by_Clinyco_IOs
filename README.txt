Clynico PWA Update (icons + manifest + service worker)

Colocar estos archivos en la raíz del sitio (o carpeta /public si usas un framework):
- /manifest.json
- /sw.js
- /favicon.ico
- /icons/icon-192.png
- /icons/icon-512.png

En <head> de index.html agrega:
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0e1e54">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">

Antes de </body> agrega:
<script>
if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js"); }
</script>

Commit al repo GitHub que conecta con Netlify:
git add .
git commit -m "feat(pwa): nuevos íconos + manifest + sw v4"
git push origin main

Netlify hará el deploy automático.
Abre https://clynicosteps.netlify.app/ y prueba instalar.