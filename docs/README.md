# SIAADE Docs

## Descripcion breve
Repositorio con backend NestJS 11 + TypeORM/PostgreSQL 15 y frontend Angular 20 + PrimeNG. El objetivo es centralizar la administracion academica (usuarios, materias, correlativas, mesas finales, avisos y portal del alumno) y documentar los flujos de despliegue e instalacion.

## Estructura general
- **Backend**: `backend/` con modulos Auth, Users, Catalogs, Subjects, Final Exams, Student Inscriptions y servicios compartidos (guards, interceptors, scripts smoke). Expone Swagger en `/api/docs`.
- **Frontend**: `front/` con app modular (core, shared, pages para users/subjects/final_examns/alumno) y servidores Express/Nginx para build productivo.
- **Base de datos**: PostgreSQL 15 modelada en `backend/database.dbml` y migraciones versionadas en `backend/src/database/migrations`.
- **Infraestructura**: `docker-compose.yml` orquesta Postgres + API + Front, cada carpeta tiene su propio Dockerfile y scripts de arranque.

## Getting Started

### Requisitos rapidos
- Node.js 20.19.0 (`nvm use 20.19.0`)
- npm 10+, Angular CLI 20 y Nest CLI 11 (opcionales para tooling)
- Docker Engine 24+ y Docker Compose plugin 2.20+ (para despliegues contenedorizados)
- PostgreSQL 15 (si se instala sin Docker)

### Backend local
1. `cd backend`
2. `npm install`
3. Revisar/copiar `.env` (puedes crear `.env.local`) y ajustar DB_HOST, credenciales y secretos JWT.
4. `npm run db:migration:run` (opcional `npm run seed:dummy` para datos de prueba).
5. `npm run start:dev` para modo watch o `npm run start:watch` si prefieres nodemon.

### Frontend local
1. `cd front`
2. `npm install`
3. Ajustar `src/environments/environment.ts` si la API no corre en `http://localhost:3000/api`.
4. `npm start` (alias de `ng serve --proxy-config proxy.conf.json`) y abrir `http://localhost:4200`.

### Docker Compose
1. Revisar `backend/.env.qa` (se monta en el servicio `api`) y asegurar secretos seguros.
2. `docker compose build`
3. `docker compose up -d`
4. Servicios disponibles: Postgres `5432`, API `http://localhost:3000`, Front `http://localhost:4000`.

### Verificacion rapida
- Swagger: `http://localhost:3000/api/docs`
- Frontend dev: `http://localhost:4200` (ng serve) o `http://localhost:4000` (Docker)
- Scripts de humo: `npm run smoke:endpoints`, `npm run smoke:siad`, `npm run test:prerequisites`

## Documentos relacionados
- [Manual tecnico y de usuario](./manual-tecnico-usuario.txt)
- [README de la API](./README-API-SIAD.md)
- [Set up basico](./set-up-basico.md)
- [Seeds y migraciones](./seeds-and-migrations.md)
- [Roles y visibilidad](./roles-visibility.md)
- [Flujo UI de autenticacion](./auth-auth-page-flow.md)
- [Pruebas para crear usuarios](./test-crear-usuarios.md)
- [Ideas y mejoras](./mejoras.md)
- [Codigo huerfano identificado](./CODIGO-HUERFANO.md)

## Notas rapidas
- Roles base se crean automaticamente con `shared/boot/ensure-roles.bootstrap.ts`.
- Scripts utiles: `npm run db:reset:dev`, `npm run migrate:prod`, `npm run revert:prod`.
- Variables criticas: `backend/.env*`, `front/src/environments/*.ts`, `docker-compose.yml`.
- La base PostgreSQL se documenta en `backend/database.dbml`; mantenerla alineada con las migraciones.
