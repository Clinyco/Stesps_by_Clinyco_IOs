# Seguridad en Clínyco Steps

- El control de acceso se ejecuta en el servidor: solo correos presentes en `ALLOWED_AGENT_EMAILS` pueden acceder a `/agent` o mutar `/api/tips*`.
- Las peticiones a Zendesk Sell se realizan mediante token Bearer almacenado en el servidor (`SELL_ACCESS_TOKEN`). Nunca exponerlo en el cliente ni en logs.
- La app rechaza contenido con PII potencial (`safeContent`). Recomendamos complementar con revisión humana de los tips antes de publicarlos.
- No se almacena información sensible de pacientes ni diagnósticos. El contenido es meramente educativo.
- Ante incidencias o dudas contactar al equipo de seguridad de Clínyco.
