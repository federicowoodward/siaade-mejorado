# Seeds y scripts de migraciones

El backend usa TypeORM y los scripts definidos en `backend/package.json` para versionar tanto la estructura como los distintos seeds que necesita SIAADE. Esta guía explica qué comando usar en cada contexto y documenta las migraciones actualmente mantenidas en `src/database/migrations`.

## Scripts de migraciones

### Desarrollo con TypeScript

- `npm run db:migration:run`: ejecuta todas las migraciones pendientes usando `ts-node` y `src/database/datasource.ts`. Es el flujo recomendado mientras se itera sobre el código fuente (hot reload, tests, etc.).
- `npm run db:migration:revert`: revierte la última migración aplicada usando la misma datasource en TypeScript.

Ambos comandos leen las variables de entorno del `.env` local, por lo que conviene usarlos cuando todavía no se compiló el backend o cuando se necesita depurar una migración paso a paso.

### Ambientes compilados (`dist/`)

- `npm run migration:run`: ejecuta las migraciones contra `dist/database/datasource.js`. Este comando es el que se invoca dentro de contenedores, pipelines de CI/CD y también desde los scripts `seed:*`.
- `npm run migration:revert`: revierte la migración más reciente usando los artefactos compilados. Antes de correrlo hay que ejecutar `npm run build` para asegurarse de que exista `dist/`.

Estos scripts son los únicos disponibles en runtime cuando el backend ya está empaquetado, por lo que son los que se deben exponer en imágenes Docker o procesos `npm run start:prod`.

## Flujos de seed

Los scripts `seed:prod`, `seed:dummy` y `unseed:dummy` son atajos que llaman a los comandos `migration:*` anteriores contra la datasource compilada.

- `npm run seed:prod`: aplica la cadena de migraciones sobre una base vacía y deja la instancia con el esquema y los datos productivos garantizados por `0100000000000_InitSchema.ts`, `0200000000000_ProdReadyAdjustmentsAndSeeds.ts` y `0200000000000_ProdSeed_Correlatives.ts`. En pipelines reales debe exportarse `NODE_ENV=production` y dejar la bandera `ALLOW_DUMMY_SEED` en `'false'` (en las migraciones dummy) para evitar que se inserte data de prueba aunque los archivos existan en `dist/`.
- `npm run seed:dummy`: vuelve a ejecutar `migration:run` en un ambiente de desarrollo (sin `NODE_ENV=production`), por lo que además de las migraciones productivas se aplican `0300000000000_DummyDevSeed_Correlatives.ts` y `9900000000000_DummyData.ts`. El resultado es una base consistente con datos de QA/UX para pruebas manuales.
- `npm run unseed:dummy`: hace `migration:revert` sobre `dist/`. Cada ejecución revierte una migración, empezando por `9950000000000_DummyData_ProdOptIn.ts` (si estuviera aplicada) y siguiendo con `9900000000000_DummyData.ts` y `0300000000000_DummyDevSeed_Correlatives.ts`. Repetir el comando hasta que la última migración aplicada sea `0200000000000_ProdSeed_Correlatives.ts`.

## Migraciones activas

### 0100000000000_InitSchema.ts

Es la migración que crea todo el esquema base. Define la extensión `uuid-ossp`, tablas principales (`roles`, `users`, `teachers`, `students`, `careers`, `subjects`, `subject_commissions`, `subject_students`, `exam_results`, `final_exams`, auditorías, etc.), índices, triggers y claves foráneas que sostienen la operación diaria de SIAADE. La parte final normaliza los `roles`, fija los IDs oficiales (`student`, `teacher`, `preceptor`, `secretary`, `executive_secretary`) y crea un usuario secretario (`sec.auto4@example.com`) con su registro en `secretaries`. Todo ambiente debe tener estas tablas antes de ejecutar cualquier seed adicional.

### 0200000000000_ProdReadyAdjustmentsAndSeeds.ts

Corresponde a los ajustes productivos y seeds productivos. Refuerza la consistencia de los roles, crea el preceptor por defecto (`preceptor@siaade.local`), registra los periodos académicos 2026‑2028, genera la cohorte oficial de materias (incluyendo campo, formato, carga horaria y orden dentro del plan) y las relaciona con la carrera “Tecnicatura de desarrollo en software”. Además, inserta los estados válidos de cursada en `subject_status_type` (“No inscripto”, “Libre”, “Aprobado”) y normaliza los `career_subjects.order_no` para soportar correlatividades posteriores.

### 0200000000000_ProdSeed_Correlatives.ts

Carga la tabla `subject_prerequisites_by_order` con las correlatividades productivas. La migración identifica el `career_id` de la Tecnicatura, construye pares `(materia objetivo, materia requisito)` usando los `order_no` oficiales y hace `INSERT ... ON CONFLICT DO NOTHING` para garantizar idempotencia. Este es el dataset mínimo que debe existir antes de habilitar inscripción real.

### 0300000000000_DummyDevSeed_Correlatives.ts

Provee correlatividades reducidas para entornos de desarrollo. Inserta tres combinaciones en `subject_prerequisites_by_order` tomando `career_id = 1`, lo que habilita pruebas de flujo (aprobados, restricciones) sin depender de la tabla productiva. Debe considerarse una migración exclusiva de dev: si se necesita limpiar sus datos hay que ejecutar `npm run unseed:dummy` hasta revertirla.

### 9900000000000_DummyData.ts

Es el seed dummy principal. Dentro de una transacción crea comisiones A/B/C, docentes de ejemplo, al menos 20 estudiantes (generando correos `@siaade.local`, legajos `A0001+` y CUILs dummy), inscribe a todos en la Tecnicatura, crea `subject_commissions` para cada materia, matricula alumnos en todas las cursadas, completa `student_subject_progress`, y opcionalmente genera finales y registros en `final_exams_students`. La lógica borra cuidadosamente sólo los datos dummy en el `down()`. Este script chequea `process.env.NODE_ENV` y la bandera interna `ALLOW_DUMMY_SEED`: en producción debe dejarse en `'false'` para que la migración marque su estado como aplicado sin alterar la base; en desarrollo puede estar en `'true'` para poblar datos rápidamente.

### 9950000000000_DummyData_ProdOptIn.ts

Es un wrapper para ambientes productivos que necesiten datos dummy opt‑in (por ejemplo, demos controlados). No agrega lógica nueva: instancia la clase de `9900000000000_DummyData.ts` y delega tanto el `up()` como el `down()` cuando `ALLOW_DUMMY_SEED === "true"`. El objetivo de aislarla es que TypeORM ya puede haber registrado la migración 9900... como ejecutada (sin haber poblado datos por el guard de producción). Al correr 9950... con el flag activo se vuelve a ejecutar el seed dummy sin manipular manualmente la tabla `migrations`.

## Flujo real y alcance por ambiente

1. Siempre se ejecuta `0100000000000_InitSchema` y luego las dos migraciones `0200...`, porque definen el esquema y los datos oficiales mínimos.
2. En entornos locales o de pruebas se suman `0300...` y `9900...` para obtener correlatividades de laboratorio y usuarios/inscripciones dummy.
3. Cuando se necesita cargar datos de prueba en un ambiente productivo controlado se activa explícitamente `ALLOW_DUMMY_SEED` y se ejecuta `9950...`, lo que delega en el seed dummy real.

### Qué corre siempre en producción

- `0100000000000_InitSchema.ts`
- `0200000000000_ProdReadyAdjustmentsAndSeeds.ts`
- `0200000000000_ProdSeed_Correlatives.ts`

### Migraciones exclusivas de desarrollo

- `0300000000000_DummyDevSeed_Correlatives.ts`
- `9900000000000_DummyData.ts`

### Migraciones opt‑in para ambientes productivos

- `9950000000000_DummyData_ProdOptIn.ts` (requiere habilitar `ALLOW_DUMMY_SEED`)

## Estructura de migraciones del proyecto

- Se usa un prefijo numérico manual de 13 dígitos para imponer el orden lógico (no es un timestamp). El primer bloque del prefijo indica el tipo de migración: `01` esquema base, `02` seeds oficiales, `03` helpers de desarrollo y `99` seeds dummy u opt‑in.
- El sufijo en PascalCase describe con claridad el alcance (`InitSchema`, `ProdSeed_Correlatives`, `DummyData`, etc.). Evitá nombres genéricos para que se pueda rastrear fácilmente qué hace cada archivo.
- No se mezclan cambios de esquema con seeds en un mismo archivo. Si hay que modificar tablas, usá el rango `01`/`04`. Si hay que poblar datos productivos o referencias oficiales, usá el rango `02`. Datos dummy quedan reservados para `03` o `99`.
- Las futuras migraciones deben respetar el prefijo incremental y la separación de ambientes: cualquier seed que vaya a correr sólo en dev debe usar un prefijo alto (`03`/`99`) y dejar explícito en el nombre que es dummy. Las opt‑in para producción deben crear un wrapper nuevo (como `9950...`) que delegue en la migración real y honre la bandera `ALLOW_DUMMY_SEED`.
- Antes de commitear una migración nueva verificá que se pueda ejecutar tanto vía `db:migration:*` (TS) como mediante `migration:*` (dist), y documentá en el README si pertenece a flujo productivo o dummy, manteniendo la distinción dev/prod del repositorio.
