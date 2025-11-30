# Auditoría de alertas de UI (toasts PrimeNG)

Este documento resume cómo funciona el sistema de auditoría de alertas que registra en backend los toasts que se muestran en el frontend.

## 1. Visión general

- Cada vez que el frontend muestra un toast de PrimeNG relevante, también envía un evento al backend.
- El backend acumula eventos en un buffer en memoria y los persiste en una tabla dedicada de PostgreSQL.
- Se mantiene un máximo de **200 registros**, eliminando periódicamente los **20 más antiguos**.
- Solo usuarios con rol **`secretary`** pueden consultar las alertas por API.

## 2. Backend

### 2.1 Módulo y componentes

- Módulo: `AlertAuditModule`
  - Ruta: `backend/src/modules/alert_audit/`.
- Entidad: `UiAlertAudit`
  - Ruta: `backend/src/entities/audit/ui-alert-audit.entity.ts`.
- Servicios:
  - `AlertAuditBufferService`: mantiene el buffer en memoria y hace flush a DB.
  - `AlertAuditService`: API interna para registrar y listar alertas.
- Controlador: `AlertAuditController`
  - Ruta base: `/api/audit/alerts`.

### 2.2 Tabla `ui_alert_audits`

Definida en `backend/database.dbml` y creada por la migración `0400000000000_UiAlertAudits.ts`:

- Campos principales:
  - `id` (SERIAL, PK)
  - `user_id` (UUID, opcional) → usuario autenticado que disparó la alerta.
  - `severity` (TEXT) → `info | warn | error | success`.
  - `message` (TEXT) → texto combinado de summary/detail del toast.
  - `front_route` (TEXT, opcional) → ruta Angular (ej. `/students/enrollments`).
  - `front_module` (TEXT, opcional) → reservado para futuros usos.
  - `action` (TEXT, opcional) → identificador de acción (usa `key` del toast si existe).
  - `metadata` (JSONB, opcional) → copia estructurada de summary/detail/data/id/key.
  - `created_at` (TIMESTAMPTZ, default `now()`).
- Índices:
  - `idx_ui_alert_audits_created_at` sobre `created_at`.
  - `idx_ui_alert_audits_user` sobre `user_id`.

### 2.3 Buffer en memoria y retención

Implementado en `AlertAuditBufferService`:

- **Buffer**:
  - Array en memoria de hasta **20 eventos**.
  - Cada `recordAlert` encola un evento en el buffer.
- **Flush a DB**:
  - Ocurre cuando:
    - el buffer llega a 20 eventos, o
    - pasan **5 minutos** sin recibir nuevas alertas (timer de inactividad).
  - El flush copia el buffer, lo limpia y guarda todos los eventos en la tabla `ui_alert_audits` (un solo `save` en lote).
- **Retención (máx. 200 registros)**:
  - Tras cada flush, se cuenta el total de filas.
  - Si hay más de 200, se borran los **20 registros más antiguos**, ordenando por `created_at` + `id` ascendente.
- **Errores en flush**:
  - Se loguean con `Logger` de Nest.
  - Los eventos que no pudieron persistirse se vuelven a encolar (hasta 20) para un intento futuro.

## 3. API HTTP

### 3.1 Registrar una alerta

- Método: `POST`
- Ruta: `/api/audit/alerts`
- Auth: opcional, pero si hay JWT, se toma `user_id` desde `req.user.id`.
- Payload de ejemplo:

```json
{
  "message": "Inscripción confirmada - Programación I - Llamado 1",
  "severity": "success",
  "timestamp": "2025-11-23T01:15:00.000Z",
  "frontRoute": "/students/enrollments",
  "frontModule": "StudentsModule",
  "action": "ENROLL_STUDENT",
  "metadata": {
    "summary": "Inscripción confirmada",
    "detail": "Programación I - Llamado 1",
    "id": 123
  }
}
```

- Respuesta típica:

```json
{ "status": "queued" }
```

> Nota: el backend no garantiza que el evento ya esté en DB al responder; solo que fue encolado en el buffer para persistencia posterior.

### 3.2 Consultar alertas (solo Secretaría)

- Método: `GET`
- Ruta: `/api/audit/alerts`
- Auth: requiere JWT + rol `secretary`.
- Query params:
  - `page` (opcional, default 1)
  - `limit` (opcional, default 50, máx. 100)
- Respuesta:

```json
{
  "data": [
    {
      "id": 1,
      "userId": "uuid-del-usuario",
      "severity": "success",
      "message": "Inscripción confirmada - Programación I - Llamado 1",
      "frontRoute": "/students/enrollments",
      "frontModule": null,
      "action": "ENROLL_STUDENT",
      "metadata": {
        "summary": "Inscripción confirmada",
        "detail": "Programación I - Llamado 1",
        "id": 123
      },
      "createdAt": "2025-11-23T01:15:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

## 4. Frontend

### 4.1 Servicio central de auditoría de toasts

- Archivo: `front/src/app/core/services/ui-alert-audit.service.ts`.
- Tipo principal:

```ts
export type UiAlertAuditPayload = {
  message: string;
  severity: "info" | "warn" | "error" | "success";
  timestamp: string;
  frontRoute?: string;
  frontModule?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};
```

- Método clave:

```ts
add(messageService: MessageService, message: any): void;
```

Comportamiento:

1. Llama a `messageService.add(message)` para mostrar el toast.
2. Extrae `severity`, `summary`, `detail`, `key`, `id`, `data` del mensaje.
3. Envia un `POST` a `audit/alerts` con `ApiService`, incluyendo:
   - `message`: concatenación de summary + detail.
   - `severity`
   - `timestamp`: `new Date().toISOString()`
   - `frontRoute`: URL actual de Angular.
   - `action`: `key` del toast, si existe.
   - `metadata`: objeto con summary/detail/data/key/id.

Los errores de red al auditar se ignoran (el toast sigue mostrándose igual).

### 4.2 Dónde se auditan toasts hoy

A modo de referencia, el servicio se usa ya en varios flujos clave, por ejemplo:

- Inscripciones a mesas de examen desde el módulo de alumnos.
- Creación/edición/eliminación de mesas de finales.
- Crear finales en una mesa.
- Inscribir/desinscribir alumnos a un final.
- Guardar notas y asistencia en situación académica.
- Actualizar correlativas de materias.
- Alta de nuevas materias.

Cualquier nuevo componente que quiera auditar sus toasts puede seguir el mismo patrón:

```ts
import { UiAlertAuditService } from "@/app/core/services/ui-alert-audit.service";
import { MessageService } from "primeng/api";

// ...
private readonly messages = inject(MessageService);
private readonly uiAlertAudit = inject(UiAlertAuditService);

// En lugar de this.messages.add(...):
this.uiAlertAudit.add(this.messages, {
  severity: "success",
  summary: "Operación exitosa",
  detail: "Se guardaron los cambios.",
});
```

## 5. Uso rápido (ejemplos)

### 5.1 Ver últimas alertas (curl)

Suponiendo backend en localhost:3000 y un JWT de secretaria en `TOKEN`:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/audit/alerts?page=1&limit=20"
```

### 5.2 Probar envío manual de alerta

```bash
curl -X POST "http://localhost:3000/api/audit/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Toast de prueba",
    "severity": "info",
    "timestamp": "2025-11-23T00:00:00.000Z",
    "frontRoute": "/debug/manual",
    "action": "MANUAL_TEST",
    "metadata": { "source": "curl" }
  }'
```

## 6. Notas y futuras mejoras

- Actualmente se auditan **todos** los toasts que pasan por `UiAlertAuditService`; si en el futuro se desea filtrar (solo errores, solo ciertos módulos), puede hacerse ahí.
- Es posible añadir más endpoints de lectura (filtros por usuario, severity, rango de fechas) y una pequeña UI interna para que Secretaría navegue las alertas desde el front.
- El sistema está pensado como una auditoría liviana de UI, no como reemplazo de un sistema de logging completo.

