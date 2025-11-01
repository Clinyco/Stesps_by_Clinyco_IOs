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

Netlify hará el deploy automático.
Abre https://clynicosteps.netlify.app/ y prueba instalar.
## Pruebas PWA
- Manifest: abre `/manifest.webmanifest` y verifica respuesta 200.
- Android / Chrome: debe aparecer botón “Instalar app” o menú ⋮ → Añadir a pantalla de inicio.
- iOS / Safari: usar Compartir → Añadir a pantalla de inicio.
- Xiaomi / Mi Browser: menú ≡ o ⋮ → Agregar a pantalla principal.
- Consola: `navigator.serviceWorker.controller` devuelve instancia tras recargar (SW activo).
- Consola: `navigator.serviceWorker.controller` devuelve instancia si el SW está activo.

## Persistencia de pasos en Zendesk Sell (A1)

### Mapeo A1 — una Note por paso
- Cada paso se guarda como una **Note** de Zendesk Sell ligada al contacto ancla (`SELL_TIPS_CONTACT_ID`).
- El contenido de la nota comienza con _front-matter_ YAML:
  ```yaml
  ---
  type: "step"
  checklist_key: "client-onboarding-v1"
  step_id: "s1"
  title: "Enviar antecedentes"
  desc: "Adjuntar en PDF."
  href: "https://cliny.co/ayuda/antecedentes"
  note: "Cliente envía viernes."
  status: "pending"
  order: 1
  support_ticket_id:
  updated_by: "agent@clinyco.cl"
  updated_at: "2025-10-31T10:00:00Z"
  ---
  ```
- Las tags asociadas a la nota siguen el patrón `step`, `checklist:<key>`, `step:<step_id>`.

### Variables de entorno clave
Configura `.env` (usa `.env.example` como guía):

```
SELL_BASE_URL=https://api.getbase.com
SELL_ACCESS_TOKEN=<<TOKEN_SELL>>
SELL_TIPS_CONTACT_ID=<<ID_NUM_CONTACTO_ANCLA_TIPS>>
ALLOWED_AGENT_EMAILS=agent@clinyco.cl,otra@clinyco.cl
APP_BASE_URL=<<https://tu-sitio.netlify.app>>

# Opcionales (Zendesk Support & Google Drive)
ZENDESK_SUPPORT_SUBDOMAIN=<<subdominio>>
ZENDESK_SUPPORT_EMAIL=<<email>>
ZENDESK_SUPPORT_API_TOKEN=<<token>>
SUPPORT_DEFAULT_VIEW_ID=<<id_view_support>>
DRIVE_TEMPLATE_ID=<<doc_template_id>>
DRIVE_FOLDER_ID=<<folder_id>>
```

`ALLOWED_AGENT_EMAILS` controla el RBAC: solo correos en esa lista pueden crear/editar pasos vía API (cabecera `x-agent-email`).

### Endpoints disponibles (`/app/api/checklists/...`)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/checklists/:key/steps` | Lista pasos ordenados (sin notas públicas). Cache `s-maxage=60`. |
| `POST` | `/api/checklists/:key/steps` | Crea paso (agente autenticado). Genera UUID si no viene `id`. |
| `PUT` | `/api/checklists/:key/steps/:id` | Actualiza paso con _optimistic locking_ (`updated_at`). |
| `DELETE` | `/api/checklists/:key/steps/:id` | Elimina la nota correspondiente. |
| `POST` | `/api/checklists/:key/steps/:id/toggle` | Alterna `pending ↔ done` y persiste. |

Ejemplo `curl` para actualizar un paso:

```
curl -X PUT "https://tu-sitio.netlify.app/api/checklists/client-onboarding-v1/steps/s1" \
  -H "Content-Type: application/json" \
  -H "x-agent-email: agent@clinyco.cl" \
  -d '{
    "title": "Enviar antecedentes",
    "desc": "Adjuntar documentos PDF",
    "note": "Cliente adjunta viernes",
    "status": "pending",
    "order": 1,
    "updated_at": "2025-10-31T10:00:00Z"
  }'
```

### Contacto ancla en Zendesk Sell
- Crea (o identifica) un contacto genérico para almacenar las notas del checklist.
- Copia su `id` numérico en `SELL_TIPS_CONTACT_ID`.
- Las notas nuevas se añadirán allí, manteniendo la trazabilidad en una sola entidad.

### Smart Link para agentes
Comparte enlaces directos a la checklist editable:

```
https://<<APP_BASE_URL>>/agent-steps.html?key=<checklist_key>&agent={owner.email}
```

Los agentes autenticados verán el botón “Guardar” con persistencia en Sell; si la API no está disponible, la página conserva un _fallback_ local (`localStorage`).

### Opcionales
- Configura `ZENDESK_SUPPORT_*` y `DRIVE_*` si deseas exponer vistas de soporte o documentos de referencia desde la misma UI.
- El backend valida términos sensibles (`assertStepIsSafe`) para evitar introducir PII/PHI.
