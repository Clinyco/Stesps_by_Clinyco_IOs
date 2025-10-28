# Clínyco Steps – Tips informativos

Aplicación Next.js 14 para gestionar tips educativos sincronizados con Zendesk Sell. Incluye panel con control de acceso para agentes, consumo público de tips publicados y páginas estáticas de pasos con botón de contacto.

## Requisitos previos

- Node.js 18 LTS o superior.
- Token personal (PAT) de Zendesk Sell con permisos para Notes o Custom Objects.
- Contacto en Zendesk Sell llamado “Clinyco Tips” y su `SELL_TIPS_CONTACT_ID`.

## Configuración

1. Copia `.env.example` a `.env` y completa los valores:

   ```bash
   cp .env.example .env
   ```

   - `SELL_BASE_URL`: URL base de la API (por defecto `https://api.getbase.com`).
   - `SELL_ACCESS_TOKEN`: Personal Access Token de Zendesk Sell.
   - `SELL_TIPS_CONTACT_ID`: ID del contacto que agrupa los tips (para Plan B: Notes).
   - `ALLOWED_AGENT_EMAILS`: Correos autorizados (separados por coma) para el panel de agentes.
   - `APP_BASE_URL`: URL pública de la app (usada para fetch server-side).
   - `ENABLE_CUSTOM_OBJECTS`: `true` para usar Custom Objects (Plan A) si la cuenta tiene Sunshine legacy.

2. Instala dependencias:

   ```bash
   npm install
   ```

3. Ejecuta en desarrollo:

   ```bash
   npm run dev
   ```

4. Accede a:
   - `/` – Inicio.
   - `/tips` – Lista pública de tips publicados.
   - `/tips/[id]` – Detalle de tip con Markdown sanitizado.
   - `/agent` – Panel de agentes (requiere cabecera/cookie `user-email` dentro de `ALLOWED_AGENT_EMAILS`).
   - `/client-steps.html` y `/agent-steps.html` – Pasos estáticos con botón “Escribir a mi Ejecutiva de Gestión”.

## Integración con Zendesk Sell

La app usa Zendesk Sell como único backend:

- **Plan A (Custom Objects)**: activa `ENABLE_CUSTOM_OBJECTS=true` para usar el objeto `tip`. Cada registro mantiene `title`, `body_md`, `tags`, `status`, `updated_by` y `updated_at`.
- **Plan B (Notes)**: por defecto. Serializa el contenido en Markdown con front-matter YAML y etiqueta todas las notas con `tip`.

Las solicitudes se realizan con `Authorization: Bearer <SELL_ACCESS_TOKEN>` y cabecera `User-Agent` personalizada. Se implementa reintento exponencial ante `429`.

## Seguridad y cumplimiento

- El middleware bloquea `/agent` y mutaciones `/api/tips*` a usuarios no autorizados.
- `safeContent` rechaza textos con posibles PII (emails ajenos a `@clinyco.cl`, números largos, términos clínicos sensibles).
- Las respuestas públicas se cachean brevemente (`s-maxage=120`).
- El renderizado en `/tips/[id]` aplica sanitización con DOMPurify.
- Todos los documentos muestran el disclaimer: “La información es educativa y no reemplaza orientación profesional sanitaria.”

## Botón “Escribir a mi Ejecutiva de Gestión”

Las páginas de pasos leen `?agent=` (o `?email=`) para construir un `mailto:` con asunto “Solicitud de gestión – Pasos X” y el conteo actual de pasos. Ejemplos:

- Cliente: `https://tusitio/client-steps.html?agent=ejecutiva@clinyco.cl`
- Agente: `https://tusitio/agent-steps.html?agent=ejecutiva@clinyco.cl`

## Scripts disponibles

- `npm run dev` – Desarrollo con hot reload.
- `npm run build` – Compilación de producción.
- `npm run start` – Servidor de producción.
- `npm run lint` – Linter de Next.js.
- `npm run test` – Pruebas unitarias con Vitest.

## Pruebas manuales sugeridas

1. Autenticar como agente (enviar cabecera `x-user-email` o cookie `user-email`).
2. Crear un tip borrador, publicarlo y verificar que aparece en `/tips` y `/tips/[id]`.
3. Intentar editar como usuario sin permisos → respuesta 403.
4. Validar el botón “Escribir a mi Ejecutiva de Gestión” en `/client-steps.html` y `/agent-steps.html` mostrando mailto con conteo actualizado.
5. Confirmar que `navigator.serviceWorker.controller` es truthy tras registrar `public/sw.js` si se desea mantener la PWA.
