# SIAADE

Sistema Integral de Administración Académica Educativa. Incluye backend (NestJS 11 + TypeORM + PostgreSQL, JWT, Swagger) y frontend (Angular + PrimeNG) orientado a la gestión académica completa. Para más contexto funcional y de negocio consulta `docs/` (manuales, seeds, roles, lógica de negocio).

## Requisitos previos

- Node.js LTS (en `backend/.nvmrc` se usa Node 20).
- Gestor de paquetes compatible con `package-lock.json` (npm recomendado).
- PostgreSQL 15 accesible para desarrollo/test/producción.
- Docker Engine y Docker Compose plugin si se ejecuta con contenedores.
- Subdominio DuckDNS y puertos 80/443 abiertos en el VPS para el perfil Traefik + DuckDNS.

## Configuración del entorno y archivo .env

- Backend: crear/ajustar `backend/.env` (y opcionalmente `.env.test`). Variables mínimas: `PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL`, `DATABASE_URL` (opcional), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`. Logging opcional: `ENABLE_FILE_LOGGER`, `LOG_DIR`, `LOG_FILE`, `MAX_LOG_BYTES`, `SLOW_QUERY_MS`.
- Docker: copiar `.env.example` a `.env` (si existe) y completar credenciales de Postgres, `DATABASE_URL`, dominio/token DuckDNS, email para Let's Encrypt y secretos JWT. `API_CORS_ORIGIN` se usa solo en el perfil local para permitir llamadas desde `http://localhost:4000`. Mantener `NODE_ENV=production`; los perfiles de Compose lo sobreescriben según necesidad. `DUCKDNS_DOMAIN` debe incluir el sufijo `.duckdns.org`.
- Bases: crear las bases definidas en las variables (dev/test/prod) sin inventar nombres nuevos.

## Entorno local Docker

- Inicio: `docker compose --profile local up -d --build`
- Servicios expuestos:
  - Postgres: `localhost:5432`
  - Nest API: `http://localhost:3000`
  - Angular front: `http://localhost:4000`
- Detener: `docker compose --profile local down`
- Reset de volúmenes: `docker compose --profile local down -v`
- Logs: `docker compose --profile local logs -f api` (cambiar `api` por `front` o `postgres-local` si aplica)

## Entorno producción Docker (Traefik + DuckDNS)

- Despliegue: `docker compose --profile prod up -d`
- Solo Traefik publica puertos 80/443; API y front quedan en la red `siaade_net`.
- Traefik gestiona certificados Let's Encrypt (HTTP challenge) y escribe `acme.json` en `traefik_letsencrypt`.
- DuckDNS mantiene sincronizada la IP pública para `${DUCKDNS_DOMAIN}`.
- Smoke tests: `https://<tu_dominio_duckdns>/` y `https://<tu_dominio_duckdns>/api/health`
- Logs clave: `docker compose --profile prod logs -f traefik` y `docker compose --profile prod logs -f duckdns`
- Notas: en local la API debe respetar `CORS_ORIGIN`; en producción el tráfico es same-origin detrás de Traefik. Configuración de Traefik en `traefik/traefik.yml` (estático) y `traefik/dynamic.yml` (middlewares). `deploy/nginx.conf` ya no se usa. Validar la pila con `docker compose --profile local config` o `docker compose --profile prod config`.

## Migraciones TypeORM

- Ubicación: `backend/src/database/migrations`.
- Ejecutar (dev/test): `npm run db:migration:run` (alias `npm run typeorm:migration:run`).
- Revertir: `npm run db:migration:revert`.
- Crear vacía: `npm run db:migration:create`.
- Generar desde esquema: `npm run db:migration:generate`.
- Ver esquema: `npm run db:show`; eliminar esquema: `npm run db:schema:drop`; reset completo (dev): `npm run db:reset:dev`.
- Producción: `npm run build` → `npm run migrate:prod` o `npm run revert:prod` (usa `dist/database/datasource.js`). `npm run reseed:prod` encadena revert+run en compilado.
- Scripts `seed:prod`, `seed:dummy`, `unseed:dummy` apuntan a comandos `migration:*` no declarados como scripts dedicados; pendiente de ajuste antes de usarlos.

## Testing automatizado (Jest + Supertest + migraciones)

- Suite E2E en `backend/test/` con Jest + Supertest.
- Configuración `jest.e2e.config.ts`: `ts-jest`, mapeo `@/` → `src/`, `globalSetup` en `test/jest-global-setup.ts`.
- `test/jest-global-setup.ts` carga `.env.test`/.env, fija `NODE_ENV=test`, asegura la base de test (crea si falta), inicializa el `DataSource` y ejecuta todas las migraciones antes de la suite.
- App de prueba: `test/utils/test-app.factory.ts` crea `TestingModule` con `AppModule`, habilita CORS, `ValidationPipe` estricto, prefijo `api` y `ensureRolesOnBoot`.
- Seeds de prueba: `test/utils/test-seed.ts` inserta roles base y usuarios por rol (admin, secretario, preceptor, docente, alumno) y normaliza flags de bloqueo/activo.
- Helpers de autenticación: `test/utils/auth-helpers.ts` hace login vía `/api/auth/login` y devuelve `token` listo para headers.
- Utilidades de datos: `test/utils/test-data.ts` obtiene subjects/alumnos/comisiones existentes para casos E2E.
- Ejecutar E2E: definir variables de DB de test y correr `npm run test:e2e`.

## Swagger

- Documentación disponible en `http://localhost:3000/api/docs` (ajustar puerto según `PORT`).
- Habilitada en `backend/src/main.ts` con `DocumentBuilder`; incluye autenticación Bearer y esquema `cookieAuth` para refresh tokens.

## Scripts disponibles (backend/package.json)

- Básicos: `build`, `start:dev`, `start:watch`, `start:hmr`, `start:prod`.
- TypeORM/DB: `db:migration:generate`, `db:migration:create`, `db:migration:run`, `db:migration:revert`, `db:show`, `db:schema:drop`, `db:reset:dev`, `typeorm:migration:run`, `migrate:prod`, `revert:prod`, `reseed:prod`, `dbml`.
- Operativos: `smoke:siad`, `smoke:endpoints`, `test:finals-admin`.
- Testing: `test:prerequisites` (Vitest de correlativas), `test:e2e` (Jest + Supertest).
- Seeds (pendiente de ajuste): `seed:prod`, `seed:dummy`, `unseed:dummy` llaman a `migration:*` no declarados como scripts dedicados.

## Estructura general del proyecto

- `backend/`: API NestJS, entidades TypeORM, migraciones, scripts y configuración.
- `front/`: aplicación Angular 20 + PrimeNG.
- `docs/`: documentación funcional y operativa (manuales, seeds, visibilidad por rol, lógica de negocio).
- `docker-compose.yml`: orquestación de Postgres + API + front, con perfiles local/prod (Traefik + DuckDNS).
- `traefik/`: configuración de Traefik (estática y dinámica), certificados en volumen `traefik_letsencrypt`.
- `deploy/`: artefactos legados; `deploy/nginx.conf` ya no se usa.
- `dist/`, `node_modules/`: build y dependencias (no editar).

## Variables de entorno adicionales (DBML)

- `DBML_DSN`: cadena de conexión que usa `npm run dbml` para generar `database.dbml` sin exponer credenciales en texto plano (ej: `postgresql://user:pass@localhost:5432/SIAD?schemas=public`).

## Notas finales

- No se modifican endpoints ni lógica de negocio desde este README; para flujos y roles ver `docs/`.
- Mantener migraciones al día antes de desplegar. Swagger es la referencia rápida de la API.
- En producción con Docker, las migraciones no se ejecutan automáticamente en el entrypoint actual; correr `npm run migrate:prod` en el contenedor si se requieren.
