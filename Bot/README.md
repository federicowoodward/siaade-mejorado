# SIAADE Bot (Email Batch Service)

CLI para gestionar envíos masivos de correo vía Mailgun (o simulación local sin credenciales).

## Requisitos
Node 18+ (ideal 20/22)

## Instalación
```
npm install
```

## Variables de entorno (.env)
```
BACKEND_URL=http://localhost:3000
BOT_BACKEND_TOKEN=TOKEN_JWT_INTERNO_OPCIONAL
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.tudominio.com
MAIL_FROM="SIAADE <no-reply@tudominio.com>"
# Para modo sin backend:
TEST_EMAILS=demo1@test.com,demo2@test.com
```
Si no defines MAILGUN_API_KEY y MAILGUN_DOMAIN el envío entra en modo simulación (no llama a la API real).
Si no defines BACKEND_URL puedes usar TEST_EMAILS para pruebas.

## Comandos
Listar batches:
```
npm run build && node dist/index.js list
```
Crear batch (preview):
```
node dist/index.js create -s "Asunto" -b "<p>Hola</p>" -r teacher,student --dry-run
```
Crear y procesar:
```
node dist/index.js create -s "Asunto" -b "<p>Hola</p>" -r teacher,student
```
Estado:
```
node dist/index.js status <id>
```
Forzar (si quedó pendiente):
```
node dist/index.js send <id>
```

## Modo HTTP

Levantar API:
```
npm run build
set BOT_HTTP_PORT=5001 (Windows PowerShell: $env:BOT_HTTP_PORT=5001)
node dist/http/server.js
```

Endpoints:
- GET /health
- POST /batches { subject, body, roles: string[], dryRun?: boolean }
- GET /batches
- GET /batches/:id
- POST /batches/:id/send

Header opcional: `x-internal-token: <BOT_API_TOKEN>` (si defines BOT_API_TOKEN en el entorno).

## Integración Frontend
El front lee `window.__BOT_BASE_URL__` y `window.__BOT_TOKEN__` definidos en `index.html`.
Para producción puedes inyectarlos en build o servir un snippet dinámico.

## Flujo Frontend (Integración futura)
1. Front llama a un endpoint del Bot (por crear) o ejecuta comandos vía API interna.
2. Se crea batch en modo dry-run para mostrar conteo.
3. Usuario confirma → crear real y procesar.
4. Front hace polling de `status <id>` para barra de progreso.

## Próximos pasos sugeridos
- Exponer REST simple (Express/Fastify) además del CLI.
- Persistir batches en Postgres/Redis.
- Autenticación interna (token compartido). 
- Plantillas (Handlebars + partials).

## Licencia
Privado interno SIAADE.
