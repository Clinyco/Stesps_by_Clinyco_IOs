# Clínyco Steps · PWA quickstart

Coloca estos archivos en la raíz del sitio (o en `/public` si tu framework los copia al build):
- `/manifest.webmanifest`
- `/sw.js`
- `/instalar.html`
- `/icon-180.png`
- `/icon-192.png`
- `/icon-512.png`
- `/_headers` (para Netlify, asegura `Content-Type: application/manifest+json`)

En el `<head>` principal (por ejemplo `index.html`) añade o verifica estas etiquetas:
```
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#e60e68">
<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Clínyco Steps">
<meta name="mobile-web-app-capable" content="yes">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
```

Antes de `</body>` registra el Service Worker:
```
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
</script>
```

Landing `/instalar`:
- Detecta Android, iOS (Safari) y Xiaomi Mi Browser para explicar la instalación.
- Muestra el botón nativo `beforeinstallprompt` cuando Chrome/Edge lo permite.
- Reutiliza el mismo registro del service worker (`/sw.js`).

## Pruebas PWA
- Manifest: abre `/manifest.webmanifest` y verifica respuesta 200.
- Android / Chrome: debe aparecer botón “Instalar app” o menú ⋮ → Añadir a pantalla de inicio.
- iOS / Safari: usar Compartir → Añadir a pantalla de inicio.
- Xiaomi / Mi Browser: menú ≡ o ⋮ → Agregar a pantalla principal.
- Consola: `navigator.serviceWorker.controller` devuelve instancia tras recargar (SW activo).
