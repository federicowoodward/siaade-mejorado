# Lógica de negocio básica de SIAD/SIAADE

## Introducción general

SIAD/SIAADE es un sistema integral de administración académica. Centraliza la gestión de usuarios, materias, cursadas y exámenes para acompañar el ciclo académico completo. Su propósito es asegurar que las inscripciones, calificaciones, asistencias y certificaciones se manejen de forma consistente y auditada.

Actores principales del dominio académico:

- **Alumno**: cursa materias, rinde parciales y finales, consulta su situación académica y genera certificados.
- **Docente**: dicta materias, carga notas y asistencia de cursada, participa en mesas de examen final.
- **Preceptor**: colabora en el control de asistencia y notas de cursada, ayuda a validar inscripciones.
- **Secretario**: administra materias, comisiones, mesas de examen final y revisa inscripciones.
- **Administrador**: gestiona usuarios, roles, estados y parámetros globales del ciclo académico.

## Estructura básica del dominio

- **Usuarios y roles**: cada usuario tiene uno o más roles que habilitan acciones; su estado puede ser activo, inactivo o bloqueado.
- **Materias (subjects)**: unidades curriculares que definen correlatividades y planes de cursada.
- **Comisiones (subject_commissions)**: grupos de cursada de una materia en un ciclo o período determinado.
- **Cursada**: instancia de un alumno dentro de una comisión, con registro de notas parciales y asistencia.
- **Exámenes parciales**: evaluaciones dentro de la cursada, con notas que impactan la regularidad.
- **Mesas de examen final (exam_table)**: convocatorias finales agrupadas por materia y rango de fechas dentro de un ciclo académico.
- **Exámenes finales (final_exams)**: evaluaciones finales asociadas a una mesa; cada alumno obtiene una nota y observaciones si aplica.
- **Inscripciones a finales**: solicitudes del alumno para rendir un final; requieren validar correlatividades y estado del usuario.
- **Correlatividades**: reglas que definen materias o cursadas previas necesarias para cursar o rendir un final.
- **Notas, asistencia y situación académica**: la combinación de calificaciones y asistencia determina la regularidad y habilita o restringe inscripciones y certificados.

## Reglas de negocio esenciales

- Un alumno solo puede inscribirse a exámenes finales donde cumple correlatividades y requisitos de regularidad.
- Las mesas se crean dentro de un ciclo académico, agrupan finales en un rango de fechas y cada final se genera a partir de una mesa.
- Los docentes cargan notas y asistencia de cursada; preceptores y secretarios pueden consultarlas y controlar inscripciones.
- El movimiento de estados de usuario sigue reglas: activo → inactivo/bloqueado (suspende acciones), reactivación requiere intervención administrativa.
- Las inscripciones a finales respetan cupos y ventanas de fecha definidos por la mesa.
- Las notas finales aceptan observaciones para registrar incidencias o aclaraciones académicas.
- La baja o bloqueo de un usuario no elimina su historial; los registros deben conservarse para auditoría.

## Flujos principales del sistema

- **Alta y gestión de usuarios**: crear usuario, asignar roles, definir estado (activo/inactivo/bloqueado) y credenciales; se actualizan roles según necesidades académicas.
- **Materias y comisiones**: registrar materias y sus correlatividades; abrir comisiones para un ciclo/período y asignar docentes.
- **Gestión de cursada**: vincular alumnos a comisiones; registrar notas parciales y asistencia; actualizar la regularidad.
- **Creación de mesas de examen final**: definir mesa por materia, fechas, sede y autoridades; generar los exámenes finales asociados.
- **Inscripción del alumno a un final**: validar estado del usuario, correlatividades y ventanas de inscripción; confirmar o rechazar la solicitud.
- **Registro de nota final**: asignar calificación y observaciones; actualizar la situación académica del alumno.
- **Consulta de situación académica**: visualizar materias cursadas, pendientes, finales aprobados/reprobados y estado de regularidad.
- **Generación de certificados PDF**: emitir constancias (regularidad, inscripción, materias aprobadas) usando datos vigentes y permisos del rol.

## Comportamiento según roles

- **Alumno**: ve sus materias, comisiones, inscripciones y notas; solicita inscripciones a finales y descarga certificados disponibles.
- **Docente**: carga y modifica notas parciales, asistencia y notas finales en mesas donde participa; consulta listados de alumnos.
- **Preceptor**: controla asistencia y notas de cursada; apoya la validación de inscripciones y seguimiento de regularidad.
- **Secretario**: administra materias, comisiones y mesas; revisa inscripciones a finales y puede ajustar estados académicos según políticas.
- **Administrador**: crea y mantiene usuarios, roles y estados; define parámetros globales (ciclos, calendarios, límites) y realiza acciones de control.

## Consideraciones de seguridad y consistencia

- **Autenticación**: login con emisión de JWT; las rutas protegidas verifican el token y los roles para autorizar acciones.
- **Estados de usuario**: inactivar suspende accesos sin impedir reactivación; bloquear se usa para restricciones más estrictas y evita nuevas inscripciones o cargas.
- **Auditoría**: se registran accesos y acciones relevantes (logs de solicitudes y validación de JWT) para trazabilidad; las notas y cambios de estado deben quedar historizados.
- **Correlatividades y validaciones**: antes de inscribir a un final se controla correlativas, regularidad, estado del usuario y ventana/cupo de la mesa; fallas en las validaciones detienen la operación.

## Notas finales

- Este documento es conceptual y no describe controllers, endpoints ni detalles técnicos de implementación.
- Para referencias adicionales ver otros documentos en `docs/` (manuales de usuario, seeds, visibilidad por rol, auditoría UI).
