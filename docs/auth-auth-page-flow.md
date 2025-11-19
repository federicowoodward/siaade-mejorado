## Auth Flow Deep Dive

### 1. Frontend entry point: `AuthPage`
- File: `front/src/app/pages/auth/shared/auth_page/auth-page.ts`
- `submitLogin()` (líneas 94-157) valida el formulario y usa `firstValueFrom(this.auth.loginWithReason(...))`.
- Según `LoginResult.kind`, envía el toast con `MessageService.add`. Casos manejados: `user_blocked`, `user_not_found`, `invalid_credentials`, `server`, `network`, `default`.
- `submitRecover()` (líneas 162-207) reutiliza la nueva estructura de resultados para los flujos de recuperación.

### 2. AuthService (frontend)
- Archivo: `front/src/app/core/services/auth.service.ts`.
- Métodos clave:
  - `loginWithReason()` (líneas 131-139): llama al helper `loginRequest()` (línea 279) → `ApiService.request('POST', 'auth/login', payload)`. En `map` aplica `applyLoginResponse()` para persistir el usuario/token y devuelve `{ ok: true }`. En `catchError` usa `this.asFailure(err)` para entregar `{ ok: false, kind, message }`.
  - `requestPasswordRecovery`, `requestPasswordChangeCode`, `verifyResetCode`, `confirmPasswordReset` siguen el mismo patrón `ApiService.request` → `map` → `catchError(of(this.asFailure(...)))`.
  - `asFailure()` (líneas 300-303) llama a `normalizeApiError(err)` y empaqueta el resultado (kind/status/message/reason) en los tipos `LoginResult`, `PasswordRecoveryResult`, etc.
- `ApiService` (`front/src/app/core/services/api.service.ts`) centraliza `HttpClient` (`request<T>`), agrega `withCredentials`, maneja logging, e invalidación de caché. No interpone transforms sobre errores, por lo que `normalizeApiError` recibe la respuesta real del backend.

### 3. Normalización de errores
- Archivo: `front/src/app/core/http/error-normalizer.ts`.
- Flujo:
  1. Si `err` no es `HttpErrorResponse` → `kind: 'unknown'`.
  2. `status === 0` → `kind: 'network'`.
  3. `coercePayload` parsea `err.error` (string/ArrayBuffer/object) para obtener `payload` y `rawMessage`.
  4. Se consideran `payload.details` (cuando el backend envuelve `code/message` en un sub-objeto). `messages = extractMessages(details) + extractMessages(payload)`.
  5. `respond(kind, statusOverride?)` arma el objeto final con `message`, `code`, `reason`.
  6. Si llega `code` (`INVALID_CREDENTIALS`, `USER_NOT_FOUND`, `USER_BLOCKED`) se mapea directamente sin importar el status (útil cuando un proxy responde 200/404 genérico).
  7. Si no hay `code`, se usa `err.status`: `401 → invalid_credentials`, `404 → user_not_found`, `423/403 → user_blocked`, `>=500 → server`, resto → `unknown`.

### 4. Backend Auth Module (NestJS)

#### 4.1 `AuthController` (`backend/src/modules/users/auth/auth.controller.ts`)
- `/auth/login` (`POST`): delega en `AuthService.login()`, setea cookie `rt`.
- Otros endpoints relevantes para Auth Page:
  - `/auth/reset-password`
  - `/auth/reset-password/verify-code`
  - `/auth/reset-password/confirm`
  - `/auth/password/request-change-code`
- Usa `RateLimitService` para throttling y `JwtAuthGuard` en rutas autenticadas.

#### 4.2 `AuthService.login()` (`backend/src/modules/users/auth/auth.service.ts:70-111`)
1. Normaliza `identity`.
2. Busca usuario (`resolveUserByIdentity`). Si no existe → `NotFoundException` con `{ code: 'USER_NOT_FOUND', message: 'Usuario no existe' }`.
3. Valida flags:
   - `isActive === false` → `buildInvalidCredentialsException()` → 401 con `{ code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' }`.
   - `isBlocked === true` → `buildUserBlockedException(reason)` → HTTP 423 (LOCKED) con `{ code: 'USER_BLOCKED', reason }`.
4. `userAuthValidator.validateUser(identity, password)` comprueba la contraseña (bcrypt o igualdad directa en dev). Si falla → mismo 401.
5. `resolveProfileAndPayload()` vuelve a corroborar flags (inactivos, bloqueados, estudiantes sin `canLogin`), arma la payload JWT (rol, secretary flags) y también puede lanzar `buildInvalidCredentialsException()` o `buildUserBlockedException`.
6. `issueTokens()` genera `accessToken` (JWT corto) y `refreshToken` (JWT largo) y se devuelven al controller.

#### 4.3 Errores relevantes que llegan al front
| Backend excepción | Status | Payload | Kind esperado |
|-------------------|--------|---------|---------------|
| `NotFoundException` (usuario no existe) | 404 | `{ code: 'USER_NOT_FOUND', message: 'Usuario no existe' }` (o dentro de `details`) | `user_not_found` |
| `buildInvalidCredentialsException()` | 401 | `{ code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' }` | `invalid_credentials` |
| `buildUserBlockedException(reason)` | 423 (LOCKED) | `{ code: 'USER_BLOCKED', message: 'Usuario bloqueado', reason }` | `user_blocked` |
| `HttpStatus >=500` | 5xx | `message` genérico | `server` |
| Errores de red / CORS | status 0 | n/a | `network` |

#### 4.4 Otras rutas utilizadas por Auth Page
- `/auth/reset-password`: responde 200 siempre, expone `message`, `token`, `code` según config.
- `/auth/password/request-change-code`: autenticada; reutiliza internamente `resetPassword`.
- `/auth/reset-password/verify-code`: devuelve `{ token, expiresInSeconds }` o `401` con mensaje “Código inválido o expirado”.
- `/auth/reset-password/confirm`: `BadRequestException` para validaciones de contraseña, `401` si token/código inválido.

### 5. Cómo depurar el flujo end-to-end
1. **Reproducir desde UI**  
   - Login incorrecto → verificar toast (debe ser `Credenciales incorrectas`).  
   - Usuario inexistente → `Usuario no existe`.  
   - Usuario bloqueado → toast `Usuario bloqueado` con `reason` si existe.
2. **Inspeccionar respuesta HTTP**  
   - En devtools, confirmar que la respuesta JSON trae `{ code, message, reason }` o un wrapper `{ message, details: { code, ... } }`.
3. **Confirmar normalización**  
   - Revisar el `console.log` dentro de `AuthService.asFailure` para ver el objeto recibido y el `kind` resultante.
4. **Backend**  
   - Ver logs/stack en NestJS (puedes habilitar nivel `debug` en `main.ts`).  
   - Asegurarte de que ninguna capa externa (reverse proxy, API Gateway) sobreescriba `status` o la forma del JSON. Si lo hace, `normalizeApiError` ya prioriza `code`, pero un wrapper distinto requeriría extender `coercePayload`.

### 6. Archivos clave a revisar rápidamente
- `front/src/app/pages/auth/shared/auth_page/auth-page.ts`
- `front/src/app/core/services/auth.service.ts`
- `front/src/app/core/http/error-normalizer.ts`
- `front/src/app/core/services/api.service.ts`
- `backend/src/modules/users/auth/auth.controller.ts`
- `backend/src/modules/users/auth/auth.service.ts`
- `backend/src/shared/services/user-auth-validator/user-auth-validator.service.ts` (para la lógica de validación de contraseñas)

Con este mapa podés seguir el dato desde el input en Auth Page → llamada HTTP → interceptor (ApiService) → backend controller → service → excepción → respuesta HTTP → normalizador → switch de toasts.
