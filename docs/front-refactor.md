## documentacion page borrada

manejamos boton para generar certificado de alumno regular en la home, limpio home para finalizar su desarrollo.

## muevo carpeta de alumnos (modulo mal ubicado en estructura de carpetas)

Se eliminó el módulo `src/app/alumno` y se integró toda su funcionalidad dentro de `src/app/pages/students_module`, respetando la arquitectura de páginas.

- `src/app/pages/students_module/enrollments_page` ahora contiene la pantalla de inscripciones / mesas de examen. El componente principal de lógica y UX es `MesasListComponent`, proveniente de la implementación del dev junior, expuesto desde `EnrollmentsPage`.
- `src/app/pages/students_module/academic_status_page` ahora contiene la pantalla de situación académica del alumno, usando `AcademicStatusComponent` como implementación principal, expuesta desde `AcademicStatusPage`.

Las rutas visibles para el usuario (`/alumno/mesas` y `/alumno/situacion-academica`) se mantienen iguales, pero ahora apuntan a los componentes bajo `pages/students_module`. El código funcional y la experiencia de usuario siguen siendo iguales, solo que reorganizados para respetar la arquitectura de `pages/students_module`.
