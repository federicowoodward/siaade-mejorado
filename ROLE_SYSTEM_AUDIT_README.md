1) Resumen ejecutivo
- [Alta] Backend y frontend no comparten una fuente de verdad: el back emite/espera roles en castellano (ej. `secretario`, `profesor`) mientras el front asume literales en ingles (`secretary`, `teacher`) y permite cualquier string; esto rompe guards y claims (`backend/src/shared/constants/roles.ts:3`, `front/src/app/core/services/role.service.ts:5`).
- [Alta] El JWT expone `role` y `roleId` sin normalizacion ni jerarquia, y el front confia en `role.name` para mapear permisos; cada microservicio recrea la logica (`backend/src/modules/users/auth/auth.service.ts:38`, `backend/src/modules/users/auth/jwt.strategy.ts:28`, `front/src/app/core/services/auth.service.ts:126`).
- [Alta] Los guards clave no controlan nada: `RolesGuard` depende de constantes incompletas (no cubre `ADMIN_GENERAL`) y `RoleGuard` en Angular devuelve siempre `true`, dejando todas las rutas expuestas (`backend/src/guards/roles.guard.ts:58`, `front/src/app/core/guards/role.guard.ts:30`).
- [Alta] Migraciones/seeds de roles no son idempotentes ni coherentes con los enums; los SQL cargan `('Administrador','Estudiante',...)` y la migracion `AutoSeedRoles` solo contempla cinco roles sin admin (`database/create_siaade_complete.sql:214`, `backend/src/database/migrations/AutoSeedRoles1761015167695.ts:14`).
- [Media] Los services de usuarios mezclan `roleId` y `roleName` en ingles (secretary, teacher) con entidades en castellano; hay `console.log` y defaults peligrosos (asume `SECRETARIO` si falta usuario en `SubjectsService`, `backend/src/subjects/subjects.service.ts:270`).
- [Media] Guards `HierarchyGuard`/`OwnerGuard` existen pero no se usan; `@Roles` esta comentado en notices, dejando zonas sin control (`backend/src/modules/notices/notices.controller.ts:32`).
- [Baja] Front tiene matrices de politicas (`users.policy.ts:5`) con roles inexistentes (`director`, `admin`) y menus duplicados que deberian provenir de un helper compartido.

2) Inventario de uso de roles

Backend
- Definicion: entidad `Role` (`backend/src/entities/roles/role.entity.ts:7`) + constantes incompletas (`backend/src/shared/constants/roles.ts:3`). `roles.util` traduce alias pero depende de strings mezclados (`backend/src/shared/utils/roles.util.ts:3`).
- Consumo: `RolesGuard` mapea canonical y da pase libre a `ADMIN_GENERAL`/`SECRETARIO_DIRECTIVO` (`backend/src/guards/roles.guard.ts:58`). `HierarchyGuard` y `OwnerGuard` extienden JWT pero nunca se enlazan a rutas (`backend/src/guards/hierarchy.guard.ts:8`, `backend/src/guards/owner.guard.ts:5`).
- Decoradores: `@Roles` activo en `subjects.controller.ts` (`backend/src/subjects/subjects.controller.ts:42`) y comentado en notices (`backend/src/modules/notices/notices.controller.ts:32`).
- Services y flujos: `UserProvisioningService` fuerza `roleName` ingles (`backend/src/shared/services/user-provisioning/user-provisioning.service.ts:165`) y `UsersService` setea `roleName: "secretary"` etc. (`backend/src/modules/users/manage/users.service.ts:61`).
- JWT claims: `AuthService` firma tokens con `{ sub, email, role, roleId }` (`backend/src/modules/users/auth/auth.service.ts:38`); `JwtStrategy` rellena `roleName`, `canonicalRole` y `isDirective` (pero depende de `ALL_ROLE_NAMES` sin admin) (`backend/src/modules/users/auth/jwt.strategy.ts:28`).
- Bootstrap: `ensureRolesOnBoot` ejecuta normalizacion parcial de roles (mismos nombres incompletos) (`backend/src/shared/boot/ensure-roles.bootstrap.ts:11`).

Frontend
- Route guards: `RoleGuard` esta sin implementar y se usa en todas las rutas (`front/src/app/app.routes.ts:22`, `front/src/app/core/guards/role.guard.ts:30`). `AuthGuard` solo revisa token local (`front/src/app/core/guards/auth.guard.ts:13`).
- Servicios de rol: `RolesService` define `RoleName = 'student'|'teacher'|'preceptor'|'secretary'` y hace `String(r.name).toLowerCase()` (`front/src/app/core/services/role.service.ts:5`). IDs hardcodeados en comments (`front/src/app/pages/subjects_module/new-subject-page/new-subject-page.ts:128`).
- Auth front: al bajar el token transforma `role` a minusculas inglesas (`front/src/app/core/services/auth.service.ts:126`) y setea signals en RolesService.
- UI condicional: `users.policy.ts` maneja visibilidad/acciones para `director` y `admin` inexistentes (`front/src/app/core/policy/users.policy.ts:5`); `MenuComponent` y `QuickAccess` usan `RolesService.currentRole()` para filtrar (`front/src/app/shared/components/menu/menu-component.ts:71`, `front/src/app/shared/components/quick-access-component/quick-access-component.ts:40`).
- Avisos: `NoticesService` envia `visibleFor: 'student' | 'teacher'` y mapea IDs 2/4 en duro (`front/src/app/core/services/notices.service.ts:52`).
- Datos de soporte: `mock-data.json` y adaptadores asumen mapping 1=student,2=teacher... (`front/src/assets/mock-data.json:3`, `front/src/app/shared/adapters/users.adapter.ts:5`).

3) Esquema actual y problemas

Tablas clave (simplificado):
```
roles(id PK serial, name text unique)
users(id uuid PK, role_id int not null FK roles.id, email unique, ...)
secretaries(user_id PK FK users.id, is_directive bool)
teachers(user_id PK FK users.id)
preceptors(user_id PK FK users.id)
students(user_id PK FK users.id, legajo unique, commission nullable)
notices(visible_role_id FK roles.id nullable)
```

Problemas detectados:
- [X] Seeds SQL no idempotentes ni en minuscula (`database/create_siaade_complete.sql:214`).
- [X] Back usa IDs/filtros por nombre, front usa literales ingleses y `roleId` assume 1..4 (`front/src/app/pages/subjects_module/new-subject-page/new-subject-page.ts:129`).
- [X] No existe registro para `admin_general` en constantes/migraciones (`backend/src/shared/constants/roles.ts:3`, `backend/src/database/migrations/AutoSeedRoles1761015167695.ts:14`).
- [X] Claims inconsistentes: back envia `role` (string libre), front espera alias ingles (`backend/src/modules/users/auth/auth.service.ts:38`, `front/src/app/core/services/auth.service.ts:126`).
- [X] Guards divergentes y sin fuente comun (`backend/src/guards/roles.guard.ts:31`, `front/src/app/core/guards/role.guard.ts:30`).
- [X] Falta constraint de FK estabilizado (`users.role_id` no tiene `ON DELETE` consistente y se permite renumerar IDs).

4) Matriz RBAC propuesta (unica fuente)

| Rol / Capacidad | Users listar | Users crear | Users editar | Users baja | Materias crear | Materias editar | Materias borrar | Asignar staff | Asist ver | Asist editar | Notas ver | Notas editar | Finales tablas | Finales mesas | Finales inscrip | Propio ver | Propio editar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin_general | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| secretario_directivo | Y | Y | Y | Y | Y | Y | N | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| secretario | Y | Y | Y | N | Y | Y | N | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| preceptor | O (scope) | N | Y (limitado) | N | N | Y (comisiones asignadas) | N | Y (comisiones) | Y | Y | Y | Y | N | N | N | Y | Y |
| profesor | O (alumnos propios) | N | N | N | N | N | N | N | Y | Y | Y | Y (solo parciales/final) | N | N | N | Y | Y |
| alumno | Self | N | N | N | N | N | N | N | Y (solo lectura) | N | Y (propias) | N | N | N | Y (auto) | Y | Y |

Notas:
- `O` indica acceso limitado al propio alcance (por ejemplo, `preceptor` lista alumnos de su curso; `profesor` solo sus comisiones).
- Jerarquia HierarchyGuard: `admin_general > secretario_directivo > secretario > preceptor > profesor > alumno`. Mapa de sustitucion en `src/shared/rbac/rbac.policy.ts`.

5) Plan de normalizacion

Back (DB + API)
- Migracion de roles: usar IDs fijos 1..6 y nombres snake_case en minuscula (`proposals/backend/roles-canonicalization.migration.ts`). Ajustar `roles_id_seq`, `ON CONFLICT` y normalizar duplicates.
- Seed idempotente: `proposals/backend/seed-roles.ts` para `npm run seed:roles` que inserta/actualiza sin duplicar.
- JWT contrato unico: payload `{ sub, email, roleId, roleSlug, canonicalRole, isDirective }` documentado en Swagger. Eliminar `role` libre (`backend/src/modules/users/auth/auth.service.ts`) y consumir `roles.constants`.
- Guards: `JwtStrategy` debe usar `normalizeRoleAlias` (ver `src/shared/rbac/roles.constants.ts`) y `RolesGuard` comparar contra `RBAC_MATRIX`. Exponer helper `rbac.policy.ts`.
- Hierarchy/Owner: registrar guardias donde corresponda (usuarios, materias, avisos). Centralizar arbol con `ROLE_SUBSTITUTION_TREE`.
- Extra: remover `console.log` y defaults en `SubjectsService.ensureAccess` (`backend/src/subjects/subjects.service.ts:281`), pasar a helper `rbac`.

Front (Angular)
- Obtener rol desde token decodificado (interceptor `AuthService`) usando `roleSlug` canonical y `RBAC_MATRIX`. Guard `RoleGuard` debe leer `route.data['roles']` y `RolesService` soportar canonical -> alias UI.
- Unificar `RolesService` con la nueva constante compartida (`src/shared/rbac/roles.constants.ts`): mapear slug -> label/copy -> i18n.
- Crear directiva estructural `*can` que consulta helper `rbac.policy`. Reemplazar `roles.isOneOf` manual en menus/quick access.
- Actualizar route definitions para incluir `data: { roles: [...] }` (ej. subject solo `secretario`, `profesor`, `preceptor`).
- Ajustar politicas de usuarios/menus y mock data a la nueva lista (remover `director`, `admin` o mapearlos a `secretario_directivo`/`admin_general`).

Compatibilidad
- Mantener endpoints actuales pero documentar cambio en claim (`role` -> `roleSlug`). Proveer fallback de 1 release aceptando ambos.
- Generar mapping `legacyRoleToCanonical` para data antigua; loggear mismatches.

Telemetry
- Loggear rechazos en `RolesGuard` con metadata canonical y path.
- Front: enviar evento a analytics cuando `RoleGuard` bloquee navegacion.

6) Migraciones y seeds (prod-ready)
- Draft en `proposals/backend/roles-canonicalization.migration.ts`: normaliza nombres, mergea duplicados, fija IDs, corrige referencias, actualiza secuencia.
- Script `proposals/backend/seed-roles.ts`: upsert de roles canonicos, preparado para `npm run seed:roles`.
- Agregar script `npm run seed:dummy` que crea usuarios por rol (tomar estructura actual de provisioning) usando passwords previsibles (ej. `role+2025`).
- En TypeORM config, registrar nueva migracion una vez revisada; ejecutar en staging antes de prod.

7) Cambios de codigo propuestos (diffs ejemplificados)

JWT payload (antes -> despues):
```ts
// backend/src/modules/users/auth/auth.service.ts
- const payload = { sub: profile.id, email: profile.email, role: roleName, roleId };
+ const payload = {
+   sub: profile.id,
+   email: profile.email,
+   roleId: roleId!,
+   roleSlug: CANONICAL_TO_DB_SLUG[canonicalRole],
+   canonicalRole,
+   isDirective: profile.secretary?.isDirective ?? false,
+ };
```

RolesGuard usando matriz:
```ts
// backend/src/guards/roles.guard.ts
- const allowed = requiredRoles.includes(normalizedRole) || ...
+ const policy = RBAC_MATRIX[userCanonical];
+ const allowed = requiredCanonical.some((required) => policy?.includes(required));
```

RoleGuard front:
```ts
// front/src/app/core/guards/role.guard.ts
canActivate(route: ActivatedRouteSnapshot) {
  const allowed = route.data['roles'] as CanonicalRole[] | undefined;
  if (!allowed?.length) return true;
  const current = this.roles.getCanonicalRole();
  return this.rbac.allows(current, allowed)
    ? true
    : this.router.createUrlTree(['/welcome'], { queryParams: { denied: route.url.join('/') } });
}
```

Directiva UI:
```html
<button *can="'subjects:update'">Editar materia</button>
```

Menus/quick access:
```ts
const actions = this.rbac.visibleMenusFor(currentRole);
```

8) Pruebas y verificacion
- Backend e2e: login por cada rol, hit a rutas (`/subjects`, `/users`, `/notices`) y validar 200/403/404 segun matriz. Casos borde: usuario sin rol asignado, `isDirective = true/false`, token sin `roleSlug`.
- Backend unit: testear helpers `normalizeRoleAlias`, `RBAC_MATRIX` para cada capability.
- Front: unit tests en `RoleGuard` y directiva `*can` (rooteo Permitir/Denegar). E2E (Cypress) para render condicional de menus/notices.
- QA checklist: seeds ejecutados, JWT con claims canonicos, rutas bloqueadas por guard, UI oculta botones indebidos, logs sin `console.log`.

9) Comandos utiles y busquedas
- `rg -n --hidden -S "RolesGuard|HierarchyGuard|OwnerGuard|role|roles" backend/src`
- `rg -n --hidden -S "@Roles(" backend/src`
- `rg -n --hidden -S "role_id|roleId|roleName" backend/src`
- `rg -n --hidden -S "canActivate|RoleGuard|hasRole" front/src/app`
- `rg -n --hidden -S "role|roles" front/src/app`
- `psql -c "SELECT id,name FROM roles ORDER BY id;"` (despues de migracion)
- `npm run typeorm migration:run -- -d ormconfig.ts` (para aplicar normalizacion)

10) Riesgos, rollout y fallback
- Orden recomendado: (1) aplicar migracion en entorno controlado -> (2) actualizar backend (guards, JWT, servicios) -> (3) desplegar front con servicios adaptados -> (4) limpiar seeds legacy.
- Riesgos: tokens antiguos sin `roleSlug`, datos con nombres mezcla (`Profesor`, `teacher`). Mitigar con fallback temporal en `normalizeRoleAlias`.
- Rollback: si migracion falla, restaurar backup DB y revertir despliegue; scripts `down` se dejan no-op para evitar borrado accidental.
- Feature flags: exponer `RBAC_MATRIX_VERSION` en env para activar nueva logica mientras convive front viejo.
- Aceptacion: QA confirma checklist, logs sin errores de mapeo, usuarios reales pueden acceder segun matriz.

Recursos agregados
- `src/shared/rbac/roles.constants.ts` y `src/shared/rbac/rbac.policy.ts` (base compartida para canonicalizacion y matriz).
- `proposals/backend/roles-canonicalization.migration.ts` y `proposals/backend/seed-roles.ts` como drafts para migraciones/seeds.
