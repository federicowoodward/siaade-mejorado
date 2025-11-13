# SIAADE API - Guia operativa (actualizacion 12/11/2025)

## Resumen
- API NestJS 11 + TypeORM/PostgreSQL 15; prefijo `/api`.
- Autenticacion con JWT (access + refresh cookie) y RolesGuard (student, teacher, preceptor, secretary, executive_secretary).
- Swagger disponible en `http://localhost:3000/api/docs` con tags Catalogs, Finals, Subjects, Notices, Roles y Students.
- Scripts de humo: `npm run smoke:endpoints`, `npm run smoke:siad`, `npm run test:prerequisites`.

## Getting Started rapido
1. `nvm use 20.19.0`
2. `cd backend && npm install`
3. Configurar `backend/.env` (DB_HOST, JWT secrets, CORS, LOG_DIR) o reutilizar `.env.qa`.
4. `npm run db:migration:run` (opcional `npm run seed:dummy` para datos de prueba).
5. `npm run start:dev` (ts-node) o `docker compose up api` para contenedor.
6. Verificar `http://localhost:3000/api/docs` y ejecutar `npm run smoke:endpoints`.

## Flujos expuestos (alto nivel)
- **Auth**: `/api/auth/login`, `/logout`, `/refresh`, `/reset-password*`, `/password/*` para login, refresh y cambios forzados.
- **Usuarios**: `/api/users` (gestiona altas/bajas por rol) y `/api/users/read` (listados optimizados).
- **Catalogos**: `/api/catalogs/careers`, `commissions`, `subject-commissions`, `teachers`, `final-exam-status`, `subject-status-types`.
- **Materias y correlativas**: `/api/subjects` (notas, asistencia, inscripciones) y `/api/prerequisites/*` para validar correlativas.
- **Estudiantes**: `/api/students/read/:id/full`, `/subjects/status`, `/me/*` para panel administrativo y portal alumno.
- **Finales**: `/api/finals/exam-table`, `/api/finals/exam`, `/api/students/inscriptions/exam-tables` y `/api/students/inscriptions/enroll`.
- **Avisos**: `/api/notices` con filtros `audience=student|teacher|all`.
- **Soporte**: scripts `src/scripts/smoke-siad.ts`, `smoke-endpoints.ts`, `test-finals-admin.ts` para validar las principales operaciones.

## Documentacion relacionada
- [Manual tecnico y de usuario](./manual-tecnico-usuario.txt)
- [README general de docs](./README.md)
- [Seeds y migraciones](./seeds-and-migrations.md)
- [Set up basico](./set-up-basico.md)
- [Roles y visibilidad](./roles-visibility.md)
- [Flujo de pantallas de auth](./auth-auth-page-flow.md)

---
# SIAD API â€“ DocumentaciÃ³n de endpoints (Oct 2025)

Este documento describe los endpoints implementados recientemente en el backend (rama SIAD), junto con convenciones de autenticaciÃ³n, paginaciÃ³n y ejemplos mÃ­nimos de uso. Todo estÃ¡ disponible y navegable tambiÃ©n en Swagger: http://localhost:3000/api/docs

## AutenticaciÃ³n

- Tipo: Bearer JWT (Authorization: Bearer <token>)
- Algunos endpoints de lectura pueden estar pÃºblicos para smoke; en general, asumÃ­ que requieren token.

## Convenciones comunes

### PaginaciÃ³n

- Query params: `page` (>=1, por defecto 1), `limit` (1..100, por defecto 20)
- Respuesta paginada: siempre en el formato

```
{
  "data": [...],
  "meta": { "total": number, "page": number, "limit": number, "pages": number }
}
```

### Errores comunes

- 400 BadRequest: validaciones de DTO o reglas de negocio (fechas, etapa activa, etc.)
- 404 NotFound: entidades no encontradas (stage, subject, student, final, etc.)
- 409 Conflict: casos de negocio (p.ej. borrar docente con materias vinculadas)

---

## Registration

Base: `/api/registration`

### Listar tipos de etapa

- GET `/api/registration/types`
- Respuesta: array ordenado por id asc.

### Listar etapas por carrera (paginado)

- GET `/api/registration/stages?career_id=<number>&active_only=<true|false>&page&limit`
- `career_id`: requerido
- `active_only`: opcional (filtra por etapas activas en el momento)
- Respuesta: `{ data: RegistrationStage[], meta }`

Ejemplo (PowerShell):

```
Invoke-RestMethod "http://localhost:3000/api/registration/stages?career_id=1&page=1&limit=10"
```

### Crear etapa

- POST `/api/registration/stages`
- Body (JSON):

```
{
  "career_id": 1,
  "type_id": 1,
  "period_label": "2025-1",        // opcional
  "start_at": "2025-03-01",
  "end_at":   "2025-04-01",
  "created_by": "<uuid>",
  "min_order_no": 1,                 // opcional
  "max_order_no": 100                // opcional
}
```

### Editar etapa

- PUT `/api/registration/stages/:id`
- Body: campos opcionales (`period_label`, `start_at`, `end_at`, `min_order_no`, `max_order_no`)

### Cerrar etapa

- POST `/api/registration/stages/:id/close`
- Efecto: `end_at = now()`

### Inscribir alumno

- POST `/api/registration/enroll`
- Body:

```
{ "stage_id": 1, "student_id": "<uuid>", "subject_commission_id": 12 }
```

- Reglas: etapa debe estar activa; idempotente por combinaciÃ³n (stage, student, subject_commission)

### Desinscribir alumno

- DELETE `/api/registration/enroll/:id`
- Respuesta: `{ deleted: true }` en Ã©xito

---

## Finals (ExÃ¡menes finales)

Base: `/api/finals`

### Registrar nota de final

- POST `/api/finals/exam/record`
- Body:

```
{ "final_exam_id": 10, "student_id": "<uuid>", "score": 7.5, "notes": "opcional" }
```

### AprobaciÃ³n administrativa

- POST `/api/finals/exam/approve`
- Body:

```
{ "final_exam_id": 10, "student_id": "<uuid>" }
```

### Listar exÃ¡menes de una mesa (paginado)

- GET `/api/finals/exam/list-all/:final_exam_table_id?page&limit`
- Respuesta: `{ data: FinalExamListItem[], meta }`

Notas tÃ©cnicas:

- Cleanup aplicado: consolidado `final_exam_id`; eliminado `final_exams_id` (legacy) vÃ­a migraciÃ³n.
- E2E smoke para record/approve: OK.

---

## CatÃ¡logos (read-only)

Base: `/api/catalogs`

- GET `/api/catalogs/academic-periods?page&limit`
- GET `/api/catalogs/careers?page&limit`
- GET `/api/catalogs/commissions?page&limit`
- GET `/api/catalogs/subject-commissions?subjectId=<n>&teacherId=<uuid>&page&limit`
- GET `/api/catalogs/final-exam-status`
- GET `/api/catalogs/subject-status-types`

Todas devuelven `{ data, meta }` (aun las listas cortas, con `meta.total = length`).

---

## Otros listados con paginaciÃ³n

- Roles: GET `/api/roles?page&limit` â†’ `{ data, meta }`
  - Orden: roles administrativos primero y el de estudiante al final (orden descendente por id)
- Notices: GET `/api/notices?audience=student|teacher|all&page&limit` â†’ `{ data, meta }`
- Subjects (read):
  - GET `/api/subjects/read?page&limit` â†’ `{ data, meta }`
  - GET `/api/subjects` (alias protegido) â†’ `{ data, meta }`

---

## Students (read)

Base: `/api/students/read`

- Listado de status de un alumno en todas sus materias (plano)
  - GET `/api/students/read/{studentId}/subjects/status`
  - Respuesta: `Array<{ subjectId, subjectName, year, commissionId, commissionLetter, condition }>`
  - Reglas: requiere JWT; accesible para roles administrativos (EXECUTIVE_SECRETARY, SECRETARY, PRECEPTOR, TEACHER)

- Toda la data de un alumno (agregada)
  - GET `/api/students/read/{studentId}/full`

### Endpoints self (/me)

- GET `/api/students/read/me/subjects/status` â†’ igual formato que `{studentId}/subjects/status` pero toma el id del JWT.
- GET `/api/students/read/me/full` â†’ igual formato que `{studentId}/full`.
  - Roles permitidos: incluye tambiÃ©n `student` para auto-consulta.

  - Respuesta:

```
{
  user: { id, name, lastName, email, roleId, isBlocked, blockedReason, isActive },
  student: { userId, legajo, commissionId, commissionLetter, canLogin, isActive, studentStartYear },
  academicStatus: { studentId, byYear: { "1Â° AÃ±o": [...], ... } },
  finals: [{ id, finalExamId, subjectId, subjectName, examDate, score, statusId, statusName, enrolledAt, approvedAt }],
  notices: [{ id, title, content, visibleRoleId, createdAt }]
}
```

- Reglas: requiere JWT; accesible para roles administrativos (EXECUTIVE_SECRETARY, SECRETARY, PRECEPTOR, TEACHER)

Notas:

- `condition` se deriva desde la vista `v_subject_grades` y reglas de asistencia/promedio cuando corresponda.
- `notices` incluye avisos globales (visibleRoleId null) o especÃ­ficos del rol del usuario.

---

## Swagger

- URL: `http://localhost:3000/api/docs`
- Tags relevantes: Registration, Finals / Exam, Finals / Exam Table, Catalogs, Notices, Roles, Subjects
- Convenciones documentadas: queries de `page`/`limit`, cuerpos de request y respuestas esperadas.

Sugerencias de uso:

- Explorar cada tag y usar el â€œTry it outâ€.
- Verificar que los ejemplos de request incluyen los campos obligatorios indicados en los DTOs.

---

## Infraestructura y ejecuciÃ³n

- Docker Compose levanta Postgres + API; la API compila con `tsc` y ejecuta migraciones al iniciar.
- Migraciones/Seeds: se ejecutan automÃ¡ticamente (ver backend/docker-entrypoint.sh y configs de TypeORM).
- Smoke/E2E: hay scripts de smoke y de E2E de finales (record/approve) para validaciones rÃ¡pidas.

---

## Estado actual

- Registration: tipos/etapas + inscribir (paginado, validado)
- Finals: registrar y aprobar; listado por mesa paginado
- Cleanup: migrado a `final_exam_id` (legacy fuera)
- CatÃ¡logos: perÃ­odos/carreras/comisiones/estados (paginado)
- Pulido: paginaciÃ³n+meta, DTOs validados, Swagger actualizado
- Infra: Docker+migraciones; smoke/E2E OK
- Rama: `SIAD` (subido)

---

## ApÃ©ndice â€“ Ejemplos rÃ¡pidos (PowerShell)

Listar comisiones (pÃ¡gina 1, 2 por pÃ¡gina):

```
(Invoke-RestMethod "http://localhost:3000/api/catalogs/commissions?page=1&limit=2") | ConvertTo-Json -Depth 5
```

Listar etapas de una carrera:

```
(Invoke-RestMethod "http://localhost:3000/api/registration/stages?career_id=1&page=1&limit=10") | ConvertTo-Json -Depth 5
```

Listar exÃ¡menes de una mesa:

```
(Invoke-RestMethod "http://localhost:3000/api/finals/exam/list-all/1?page=1&limit=10") | ConvertTo-Json -Depth 5
```

Registrar nota de final:

```
Invoke-RestMethod -Uri "http://localhost:3000/api/finals/exam/record" -Method Post -ContentType 'application/json' -Body (@{ final_exam_id=10; student_id='UUID'; score=7.5 } | ConvertTo-Json)
```

Aprobar administrativamente:

```
Invoke-RestMethod -Uri "http://localhost:3000/api/finals/exam/approve" -Method Post -ContentType 'application/json' -Body (@{ final_exam_id=10; student_id='UUID' } | ConvertTo-Json)
```

## Seeds y scripts

Consulta el archivo docs/seeds-and-migrations.md para un detalle actualizado de los comandos de migracion y seeds.

