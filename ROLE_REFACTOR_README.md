# ROLE_REFACTOR_README

## 1. Diagnóstico resumido
- El backend y el frontend usaban nomenclaturas distintas (`secretario_directivo`, `teacher`, `ADMIN_GENERAL`), lo que dejaba los guards inconsistentes y era imposible auditar permisos reales.
- El guard `RolesGuard` mezclaba canonicalización ad-hoc, devolvía pase libre a ciertos roles y el guard de Angular devolvía siempre `true`, por lo que la UI no respetaba ninguna restricción.
- Los seeds/migraciones insertaban roles en castellano y no garantizaban IDs estables; varias partes del front dependían de números mágicos (1..4) para filtrar usuarios.
- No existía logging homogéneo ni en back ni en front para rechazos RBAC; depurar accesos denegados era manual.

## 2. Matriz RBAC (placeholder)
| Módulo / Acción | student | teacher | preceptor | secretary | executive_secretary |
| --- | --- | --- | --- | --- | --- |
| subjects.* (listar/editar) | ❌ | ✅ | ✅ | ✅ | ✅ |
| subjects.new / career-data | ❌ | ❌ | ❌ | ✅ | ✅ |
| users.read/list | ❌ | ✅ | ✅ | ✅ | ✅ |
| users.create | ❌ | ❌ | ❌ | ✅ | ✅ |
| students.module (self-service) | ✅ | ✅ (consulta) | ✅ (gestión) | ✅ | ✅ |
| final_examns.* | ❌ | ✅ | ✅ | ✅ | ✅ |
| notices.create/delete | ❌ | ❌ | ✅ | ✅ | ✅ |
| notices.read | ✅ | ✅ | ✅ | ✅ | ✅ |

> Nota: la matriz es la base mínima; el módulo RBAC (`rbac.policy.ts`) está preparado para ampliarla por acción (`module.action`).

## 3. Cambios implementados
- **Backend**
  - Nuevo paquete `src/shared/rbac/` con `roles.constants.ts`, `decorators`, `guards/roles.guard.ts` y `rbac.policy.ts` como fuente de verdad.
  - Eliminación de `roles.util.ts`, `constants/roles.ts` y el decorador `@Roles`. Se incorporaron `@AllowRoles` y `@Action` en controladores clave (subjects, users).
  - `JwtStrategy` y `AuthService` ahora emiten payload `{ sub, email, roleId, role, isDirective }` usando enums en inglés (`student`, `teacher`, etc.).
  - Nuevo `HierarchyGuard` basado en `ROLE` y sin alias.
  - Migración `1762030400000-NormalizeRolesEnglish` que normaliza la tabla `roles` (IDs 1..5 fijos) y actualiza referencias en `users`/`notices`.
  - `ensureRolesOnBoot` actualizado para los nuevos slugs y limpieza de duplicados.
  - Servicios (`user-provisioning`, `users.manage`, `users-patch`, `user-profile-reader`) sincronizados con `ROLE`/`ROLE_IDS` sin strings sueltos.

- **Frontend**
  - Nuevo paquete de auth (`core/auth/roles.ts`, `permission.service.ts`) y eliminación de `RolesService` legacy.
  - Guard universal (`role.guard.ts`) con `roleCanActivate/roleCanMatch` y logging en modo dev.
  - Directivas estructurales `*canRole` / `*canAnyRole` para ocultar UI según permisos.
  - Refactor de componentes (menu, quick-access, notices, users, students, role-switcher) para usar enums y `PermissionService`.
  - Rutas actualizadas con allowlists explícitas (`ROLE`).
  - `AuthService` front almacena el rol canónico (decode token/profile) y alimenta `PermissionService`.

- **Docs y propuestas**
  - Migraciones/seeds propuestas actualizadas en `proposals/backend/` con los slugs en inglés.

## 4. Cómo correr migraciones / seeds
```bash
# aplicar migraciones (Nest + TypeORM)
pnpm --filter backend typeorm migration:run -d src/database/datasource.ts

# (opcional) ejecutar seed draft
pnpm --filter backend ts-node proposals/backend/seed-roles.ts
```

La migración `NormalizeRolesEnglish1762030400000` es idempotente y puede ejecutarse en staging antes de producción.

## 5. Probando en desarrollo
- **Backend**
  - Ejecutar algún endpoint protegido (ej. `GET /subject-commissions/:id/grades`) con diferentes tokens. En modo dev (`NODE_ENV !== 'production'`) se loguea en consola: `{ email, role, action, allowedRoles, path, method }` cuando el guard rechaza.
  - Verificar que el JWT generado contiene `role` en inglés (`executive_secretary`, etc.).

- **Frontend**
  - Navegar con cada rol (usar `RoleSwitcherComponent` o login real). El guard de rutas y la directiva estructural deben ocultar botones/menús no permitidos.
  - En modo dev la consola muestra `[RBAC][Front][DENY]` con `allowed` vs `current` cuando se intenta acceder a una ruta bloqueada.

## 6. Checklist de verificación
### Backend
- [ ] Migración `1762030400000-NormalizeRolesEnglish` aplicada sin errores y roles únicos en `roles`.
- [ ] Tokens contienen `{ role, roleId }` en inglés.
- [ ] `@AllowRoles` presente en controllers sensibles (`subjects`, `users` read/manage).
- [ ] Logs de desarrollo aparecen ante 403 y facilitan auditoría.
- [ ] Servicios de provisioning/patch leen y escriben roles usando `ROLE_IDS` (sin strings).

### Frontend
- [ ] `PermissionService` refleja el rol al loguear y en recarga desde localStorage.
- [ ] Guard `roleCanActivate` bloquea/permite rutas según la matriz.
- [ ] Directivas `*canRole` / `*canAnyRole` se usan en componentes con UI sensible (notices, quick access, etc.).
- [ ] Menús/quick access renderizan opciones según rol.
- [ ] `UsersTable` muestra roles con slugs canónicos.

### Comandos útiles
```bash
# Build raíz
pnpm install
pnpm -w build

# Lint/format opcional según workspace
pnpm --filter backend lint
pnpm --filter front lint
```

## 7. Notas
- Mantener sincronizado el enum `ROLE` entre back y front; ambos viven en `src/shared/rbac/roles.constants.ts` (Nest) y `core/auth/roles.ts` (Angular).
- Los logs de dev pueden deshabilitarse en producción (`NODE_ENV=production`).
- Para nuevos módulos, declarar `@Action('modulo.accion')` + `@AllowRoles(...)` y documentar los cambios en `rbac.policy.ts` si se requiere reutilización global.
