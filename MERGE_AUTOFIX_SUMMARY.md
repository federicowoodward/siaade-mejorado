# MERGE_AUTOFIX_SUMMARY

## Archivos modificados
- `README.md`: se agregó la nota de variables de entorno para `DBML_DSN`.
- `backend/package.json`: el script `dbml` ahora usa la variable `"$DBML_DSN"` en lugar de credenciales duras.
- `front/src/environments/environment.qa.ts`: se incorporó el flag `debugRbac`.
- `backend/src/entities/registration/career-subject.entity.ts`: se eliminó la entidad duplicada `SubjectPrerequisiteByOrder` y se la reexporta desde su nuevo archivo dedicado.
- `backend/src/entities/subjects/subject-student.entity.ts`: se unificaron los campos `commissionId` y `enrolledBy`, más la relación con `SubjectCommission`.
- `backend/src/modules/catalogs/catalogs.module.ts`: se inyecta `SubjectPrerequisiteByOrder` y se exporta el `CatalogsService`.
- `backend/src/shared/services/user-profile-reader/user-profile-reader.types.ts`: se añadió `requiresPasswordChange`.
- `backend/src/database/migrations/0400000000000_AddSubjectStudentEnrollmentMeta.ts`: nueva migración para los campos de `subject_students`.
- Se añadieron marcadores `TODO: REVIEW_CONFLICT_SIAD` en todos los archivos con lógica en conflicto (ver sección siguiente).

## Conflictos resueltos automáticamente (no lógicos)
- `front/src/environments/environment.qa.ts`: se mantuvo la URL actual y se añadió `debugRbac: false`.
- `backend/src/entities/subjects/subject-student.entity.ts`: se integraron los campos `commission_id` y `enrolled_by` más la relación `SubjectCommission` sin romper compatibilidad.
- `backend/src/entities/registration/career-subject.entity.ts`: se conservó únicamente `CareerSubject` y se reexportó `SubjectPrerequisiteByOrder` desde su archivo especializado para evitar entidades duplicadas.
- `backend/src/modules/catalogs/catalogs.module.ts`: se incluyó el nuevo repositorio y se exportó el servicio para que los módulos consumidores puedan reutilizarlo.
- `backend/src/shared/services/user-profile-reader/user-profile-reader.types.ts`: se añadió `requiresPasswordChange` respetando el contrato existente.
- `README.md` + `backend/package.json`: se introdujo la variable `DBML_DSN` para scripts de documentación de base de datos, removiendo credenciales expuestas.

## Conflictos ignorados por lógica (`TODO: REVIEW_CONFLICT_SIAD`)
_Se conservó la versión de HEAD y se dejó el bloque entrante comentado inmediatamente encima._

- backend/src/guards/owner.guard.ts (l.1)
- backend/src/subjects/subjects.service.ts (múltiples ocurrencias desde l.1 hasta l.1470, ver marcadores en el archivo)
- backend/src/subjects/subjects.module.ts (l.9, l.58)
- backend/src/subjects/subjects.controller.ts (l.1)
- backend/src/database/migrations/0100000000000_InitSchema.ts (l.1)
- backend/src/database/migrations/0200000000000_ProdReadyAdjustmentsAndSeeds.ts (l.1)
- backend/src/database/migrations/9900000000000_DummyData.ts (l.1)
- backend/src/entities/subjects/subject.entity.ts (l.1)
- backend/src/modules/catalogs/catalogs.service.ts (l.1)
- backend/src/modules/final_exams/controllers/final-exam.controller.ts (l.1)
- backend/src/modules/final_exams/services/final-exam.service.ts (l.1)
- backend/src/modules/roles/roles.service.ts (l.1)
- backend/src/modules/users/auth/auth.controller.ts (l.1)
- backend/src/modules/users/auth/auth.service.ts (l.77 y bloque extenso hasta l.2306)
- backend/src/modules/users/auth/dto/confirm-reset-password.dto.ts (l.1)
- backend/src/modules/users/auth/jwt.strategy.ts (l.42)
- backend/src/scripts/smoke-siad.ts (l.1)
- backend/src/shared/services/user-profile-reader/user-profile-reader.types.ts (l.1) – sólo se mantuvo el bloque entrante como referencia.
- front/src/app/app.routes.ts (l.16)
- front/src/app/core/services/api.service.ts / auth.service.ts / auth/auth-api.service.ts / career-catalog.service.ts (cada uno con marcador en l.1)
- front/src/app/pages/auth/auth.router.ts (l.1)
- front/src/app/pages/auth/shared/reset_code_page/reset-code-page.ts (l.1)
- front/src/app/pages/auth/shared/reset_password_page/reset-password-page.(ts|html) (l.1)
- front/src/app/pages/final_examns_module/final-exam-page.(ts|html) (l.1)
- front/src/app/pages/personal_data_page/personal-data-page.(ts|html) (l.1)
- front/src/app/pages/subjects_module/career_page/career-page/career-page.html (l.1)
- front/src/app/pages/subjects_module/subject_academic_situation/subject-academic-situation.(page.ts|page.html|types.ts) (l.1)
- front/src/app/pages/welcome_page/welcome-page.(ts|html) (l.1)
- Otros archivos con lógica (p.ej. `backend/src/subjects/subjects.service.ts`) contienen múltiples marcadores; revisar con `rg "TODO: REVIEW_CONFLICT_SIAD"` para obtener el listado completo dentro de cada archivo.

## Migraciones nuevas
- `backend/src/database/migrations/0400000000000_AddSubjectStudentEnrollmentMeta.ts`: agrega las columnas `commission_id` (FK opcional a `subject_commissions`) y `enrolled_by` en `subject_students`, con la constraint `FK_subject_students_commission`.

## Build
- `npm run build` (backend) **falló** debido a que TypeScript aún encuentra múltiples bloques comentados con snapshots (`TODO: REVIEW_CONFLICT_SIAD`) dentro de archivos como `backend/src/modules/users/auth/auth.service.ts`. Se preservó el log para referencia y será necesario ajustar/revisar esos archivos antes de poder compilar.

## Acciones sugeridas
1. Revisar cada bloque marcado con `TODO: REVIEW_CONFLICT_SIAD [logic]` para decidir qué porciones del snapshot entrante deben incorporarse manualmente.
2. Ajustar o eliminar los snapshots una vez que la lógica entrante sea aprobada y volver a ejecutar `npm run build` para confirmar que el backend compila.
3. Aplicar la misma revisión en el frontend (componentes/servicios marcados) y revalidar con el build correspondiente.
4. Ejecutar la nueva migración `0400000000000_AddSubjectStudentEnrollmentMeta.ts` en entornos locales antes de validar funcionalidades relacionadas a inscripciones.

