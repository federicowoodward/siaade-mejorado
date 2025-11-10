# SIAD API – Documentación de endpoints (Oct 2025)

Este documento describe los endpoints implementados recientemente en el backend (rama SIAD), junto con convenciones de autenticación, paginación y ejemplos mínimos de uso. Todo está disponible y navegable también en Swagger: http://localhost:3000/api/docs

## Autenticación
- Tipo: Bearer JWT (Authorization: Bearer <token>)
- Algunos endpoints de lectura pueden estar públicos para smoke; en general, asumí que requieren token.

## Convenciones comunes

### Paginación
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
- Reglas: etapa debe estar activa; idempotente por combinación (stage, student, subject_commission)

### Desinscribir alumno
- DELETE `/api/registration/enroll/:id`
- Respuesta: `{ deleted: true }` en éxito

---

## Finals (Exámenes finales)
Base: `/api/finals`

### Registrar nota de final
- POST `/api/finals/exam/record`
- Body:
```
{ "final_exam_id": 10, "student_id": "<uuid>", "score": 7.5, "notes": "opcional" }
```

### Aprobación administrativa
- POST `/api/finals/exam/approve`
- Body:
```
{ "final_exam_id": 10, "student_id": "<uuid>" }
```

### Listar exámenes de una mesa (paginado)
- GET `/api/finals/exam/list-all/:final_exam_table_id?page&limit`
- Respuesta: `{ data: FinalExamListItem[], meta }`

Notas técnicas:
- Cleanup aplicado: consolidado `final_exam_id`; eliminado `final_exams_id` (legacy) vía migración.
- E2E smoke para record/approve: OK.

---

## Catálogos (read-only)
Base: `/api/catalogs`

- GET `/api/catalogs/academic-periods?page&limit`
- GET `/api/catalogs/careers?page&limit`
- GET `/api/catalogs/commissions?page&limit`
- GET `/api/catalogs/subject-commissions?subjectId=<n>&teacherId=<uuid>&page&limit`
- GET `/api/catalogs/final-exam-status`
- GET `/api/catalogs/subject-status-types`

Todas devuelven `{ data, meta }` (aun las listas cortas, con `meta.total = length`).

---

## Otros listados con paginación
- Roles: GET `/api/roles?page&limit` → `{ data, meta }`
  - Orden: roles administrativos primero y el de estudiante al final (orden descendente por id)
- Notices: GET `/api/notices?audience=student|teacher|all&page&limit` → `{ data, meta }`
- Subjects (read):
  - GET `/api/subjects/read?page&limit` → `{ data, meta }`
  - GET `/api/subjects` (alias protegido) → `{ data, meta }`

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

- GET `/api/students/read/me/subjects/status` → igual formato que `{studentId}/subjects/status` pero toma el id del JWT.
- GET `/api/students/read/me/full` → igual formato que `{studentId}/full`.
  - Roles permitidos: incluye también `student` para auto-consulta.

  - Respuesta:
```
{
  user: { id, name, lastName, email, roleId, isBlocked, blockedReason, isActive },
  student: { userId, legajo, commissionId, commissionLetter, canLogin, isActive, studentStartYear },
  academicStatus: { studentId, byYear: { "1° Año": [...], ... } },
  finals: [{ id, finalExamId, subjectId, subjectName, examDate, score, statusId, statusName, enrolledAt, approvedAt }],
  notices: [{ id, title, content, visibleRoleId, createdAt }]
}
```
  - Reglas: requiere JWT; accesible para roles administrativos (EXECUTIVE_SECRETARY, SECRETARY, PRECEPTOR, TEACHER)

Notas:
- `condition` se deriva desde la vista `v_subject_grades` y reglas de asistencia/promedio cuando corresponda.
- `notices` incluye avisos globales (visibleRoleId null) o específicos del rol del usuario.

---

## Swagger
- URL: `http://localhost:3000/api/docs`
- Tags relevantes: Registration, Finals / Exam, Finals / Exam Table, Catalogs, Notices, Roles, Subjects
- Convenciones documentadas: queries de `page`/`limit`, cuerpos de request y respuestas esperadas.

Sugerencias de uso:
- Explorar cada tag y usar el “Try it out”.
- Verificar que los ejemplos de request incluyen los campos obligatorios indicados en los DTOs.

---

## Infraestructura y ejecución
- Docker Compose levanta Postgres + API; la API compila con `tsc` y ejecuta migraciones al iniciar.
- Migraciones/Seeds: se ejecutan automáticamente (ver backend/docker-entrypoint.sh y configs de TypeORM).
- Smoke/E2E: hay scripts de smoke y de E2E de finales (record/approve) para validaciones rápidas.

---

## Estado actual
- Registration: tipos/etapas + inscribir (paginado, validado)
- Finals: registrar y aprobar; listado por mesa paginado
- Cleanup: migrado a `final_exam_id` (legacy fuera)
- Catálogos: períodos/carreras/comisiones/estados (paginado)
- Pulido: paginación+meta, DTOs validados, Swagger actualizado
- Infra: Docker+migraciones; smoke/E2E OK
- Rama: `SIAD` (subido)

---

## Apéndice – Ejemplos rápidos (PowerShell)

Listar comisiones (página 1, 2 por página):
```
(Invoke-RestMethod "http://localhost:3000/api/catalogs/commissions?page=1&limit=2") | ConvertTo-Json -Depth 5
```

Listar etapas de una carrera:
```
(Invoke-RestMethod "http://localhost:3000/api/registration/stages?career_id=1&page=1&limit=10") | ConvertTo-Json -Depth 5
```

Listar exámenes de una mesa:
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
