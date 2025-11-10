# Prerequisites Module

Implementa correlatividades por `order_no` para cada carrera sin depender de `subject_id`. El módulo es de solo lectura/validación:

- Fuente de verdad: tabla `subject_prerequisites_by_order`.
- `subjects.correlative` queda **deprecated** y no se usa en flujos de negocio.

## Endpoints

| Método | Ruta | Roles |
| ------ | ---- | ----- |
| `GET` | `/prerequisites/careers/:careerId/subjects/:orderNo` | SECRETARY, EXECUTIVE_SECRETARY, PRECEPTOR, TEACHER |
| `GET` | `/prerequisites/careers/:careerId/students/:studentId/validate?targetOrderNo=` | Roles anteriores + STUDENT (solo para su propio `studentId` mediante `OwnerGuard`) |
| `GET` | `/prerequisites/careers/:careerId/students/:studentId/overview` | Roles anteriores + STUDENT |

### Respuestas

```json
// /subjects/:orderNo
{ "careerId": 1, "subjectOrderNo": 5, "prereqs": [2, 3] }

// /validate
{
  "careerId": 1,
  "studentId": "uuid",
  "targetOrderNo": 5,
  "canEnroll": false,
  "met": [2],
  "unmet": [3]
}

// /overview
[
  { "orderNo": 1, "canEnrollNow": true, "unmet": [] },
  { "orderNo": 5, "canEnrollNow": false, "unmet": [3] }
]
```

## Reglas de aprobación

- `APPROVED_STATUS_NAMES = ['Aprobada', 'Promocionada', 'Final aprobado']`.
- Para un estudiante, se consideran cumplidas todas las materias cuyo `status_name` coincide (case-insensitive).
- No se cuentan estados como "Regular".

## Seeds

- `0200000000000_ProdSeed_Correlatives`: placeholder sin datos reales; completar previo al release.
- `0300000000000_DummyDevSeed_Correlatives`: inserta correlatividades mínimas para smoke tests (`career_id = 1`).

## Uso

1. Ejecutar migraciones (`npm run db:migration:run`) para materializar la tabla e inserts dummy.
2. Consumir los endpoints anteriores desde front/servicios internos.
3. Actualizar los seeds/producto real con correlatividades oficiales antes del despliegue productivo.
