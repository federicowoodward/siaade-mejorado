# Visibilidad por roles (frontend)

Esta guia ayuda a entender el servicio construido en el frontend para facilitar la habilitación o inhabilitación de funcionalidades segun los roles del usuario.

## Roles productivos

Los nombres salen de la migración productiva `0200000000000_ProdReadyAdjustmentsAndSeeds.ts` y del `ROLE` del backend (`src/shared/rbac/roles.constants.ts`). Se usan tal cual en el front:

| Rol                  | Valor (string)        | ID  |
| -------------------- | --------------------- | --- |
| Estudiante           | `student`             | 1   |
| Docente              | `teacher`             | 2   |
| Preceptor            | `preceptor`           | 3   |
| Secretario           | `secretary`           | 4   |
| Secretario directivo | `executive_secretary` | 5   |

En `src/app/core/auth/roles.ts` se exportan el `enum ROLE`, `ROLE_VALUES`, `ROLE_IDS`, `ROLE_BY_ID`, `RoleLike` e `isRole()` para mantener la paridad exacta con el backend.

## Inicialización y carga de roles

1. `AuthService.loadUserFromStorage()` hidrata el usuario/token guardado.
2. Inmediatamente después, `AuthService.loadUserRoles()` llama a `GET /users/:id` (endpoint existente del backend) para traer el perfil real del usuario logueado.
3. El resultado se normaliza con `resolveRole()` y se propaga a:
   - `PermissionService` (lógica histórica que sigue vigente fuera de /subjects).
   - `RoleService` (`src/app/core/auth/role.service.ts`), que mantiene `signal<ROLE[]>` y la API `setRoles`, `has`, `hasAny`, `hasAll`, `roles`.
4. Si el fetch falla no se bloquea el bootstrap: se setean `[]` en `RoleService` y el UI oculta/deshabilita acciones protegidas.

Al iniciar sesión se repite el mismo flujo usando el `user` incluido en `POST /auth/login`, por lo que el estado queda consistente tras login o refresh.

## Directivas disponibles

Todas son standalone (`src/app/shared/directives`):

```html
<p-button
  *canAnyRole="[ROLE.SECRETARY, ROLE.PRECEPTOR]"
  label="Inscribir"
  (onClick)="enroll()"
/>

<div *canAllRoles="[ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY]">
  <!-- contenido solo para doble rol -->
</div>

<p-button
  label="Mover alumno"
  blockedAction
  [disableIfUnauthorized]="[ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY]"
  (onClick)="moveStudent(row)"
></p-button>
```

- `*canAnyRole` muestra el template si el usuario tiene **alguno** de los roles.
- `*canAllRoles` requiere todos los roles indicados (útil para acciones directorio + secretario, etc.).
- `[disableIfUnauthorized]` deja visible el control pero lo deshabilita cuando no hay permisos y agrega un `title="Sin permisos"` por accesibilidad. Se puede combinar con `blockedAction` para seguir respetando cuentas bloqueadas.

`RoleService` acepta `RoleLike` (`ROLE | string`) y normaliza a lower case, por lo que se puede pasar tanto `ROLE.SECRETARY` como `'secretary'`.

## Uso específico en `/subjects`

- `subject-academic-situation.page.html`: el botón "Mover a otra comisión" queda habilitado solo para preceptor/secretary/executive-secretary con `[disableIfUnauthorized]`, y en el TS se valida de nuevo con `roleService.hasAny(...)`.
- `career-students.page.html`: los `p-togglebutton` de acceso y estado usan `[disableIfUnauthorized]` y el TS valida con `RoleService` antes de enviar mutaciones.
- `students-page.ts`: ya no depende de `PermissionService`; obtiene el rol vigente desde `RoleService` para pasar contexto a `app-users-table`.

## Guía rápida de pruebas manuales en `/subjects`

1. **Preceptor**: debería poder editar notas y mover alumnos; los toggles de acceso/estado deben estar habilitados y los tooltips deben indicar "Sin permisos" cuando el rol no aplica.
2. **Secretario**: mismas capacidades que el preceptor, más el toggle de estado (`isActive`). Verificar que el botón de mover alumno se habilita y muestra tooltip normal.
3. **Ejecutivo**: acceso completo (todo habilitado).
4. **Docente / Estudiante**: no deberían ver la sección `Subjects` (por guardas), pero si accedieran, los botones quedarían visibles pero deshabilitados por `[disableIfUnauthorized]`.

Probar cada escenario con cuentas reales o forzando el rol en `localStorage` y refrescando para validar:

- Se ejecuta `loadUserRoles()` (ver red en devtools) y devuelve la lista correcta.
- Los botones agregan `title="Sin permisos"` y quedan con el atributo `disabled` cuando corresponde.
- Un usuario bloqueado sigue viendo `blockedAction` en acción (atributo `data-blocked` + disabled).

## Consideraciones de accesibilidad

- Ocultar (`*canAnyRole`, `*canAllRoles`) evita que usuarios sin rol encuentren acciones sensibles.
- `[disableIfUnauthorized]` mantiene el botón visible, añade `disabled` para evitar foco/acción y muestra un motivo textual en `title`. Útil cuando queremos que el usuario sepa que la opción existe pero no tiene permisos.
- Siempre que la acción sea crítica se valida también en el componente/servicio (ej. `RoleService.hasAny` en TS) para evitar ejecuciones manuales desde la consola.
