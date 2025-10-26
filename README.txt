Clynico PWA Update (icons + manifest + service worker)

Colocar estos archivos en la raíz del sitio (o carpeta /public si usas un framework):
- /manifest.json
- /sw.js
- /favicon.ico
- /icon-192.png
- /icon-512.png

En <head> de index.html agrega:
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0e1e54">
<link rel="apple-touch-icon" href="/icon-192.png">
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
## Pruebas PWA
- Manifest: abre `/manifest.webmanifest` y verifica respuesta 200.
- Android / Chrome: debe aparecer botón “Instalar app” o menú ⋮ → Añadir a pantalla de inicio.
- iOS / Safari: usar Compartir → Añadir a pantalla de inicio.
- Xiaomi / Mi Browser: menú ≡ o ⋮ → Agregar a pantalla principal.
- Consola: `navigator.serviceWorker.controller` devuelve instancia si el SW está activo.
