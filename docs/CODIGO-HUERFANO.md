Rutas No Usadas

front/src/app/pages/final_examns_module/final_examns_module.routes.ts (line 27) define final_examns/calendar/:id, pero no existe ningún routerLink/navigate hacia /final_examns/calendar en todo front/src (solo aparece el identificador de un input en HTML), por lo que CalendarPage nunca se activa.
backend/src/modules/users/auth/reset-password.controller.ts (line 7) expone POST /reset-password fuera del AuthController, pero esa clase no se declara en AuthModule y el cliente solo usa /auth/reset-password; es código huérfano.
backend/src/modules/users/auth/sign-in.controller.ts (line 7) crea POST /sign-in cuando la app usa /auth/login. Igual que el caso anterior, el controlador no está registrado y la ruta queda inaccesible.
backend/src/subjects/subjects.controller.ts (line 256) monta todo un @Controller("subject-status") (GET lista, GET grades por comisión, PATCH de celdas), pero no hay ninguna llamada a /subject-status en el front, así que el bloque completo no se invoca.
Páginas o Componentes No Referenciados

front/src/app/pages/final_examns_module/calendar-page/calendar-page.ts (line 9) y .../exams-mock.service.ts (line 17) dependen del route anterior; al no haber navegación hacia calendar/:id, ni la página ni el mock service se instancian.
front/src/app/shared/components/role-switcher/role-switcher.ts (line 8) (app-role-switcher) no aparece en ningún template ni import; fue pensado para debug del rol, pero nunca se usa.
front/src/app/shared/components/subjets-filter/subjets-filter.ts (line 11) (app-subject-filter) no se referencia en HTML o TS.
front/src/app/shared/components/search-bar/search-bar.ts (line 25) (app-generic-autocomplete) está documentado como “por ahora no lo usamos” y efectivamente no tiene consumidores.
front/src/app/shared/components/exam-range-calendar/exam-range-calendar.ts (line 4) (selector app-exam-range-calendar) solo contiene un <p>works!</p> y no se incluye en ningún módulo/página.
front/src/app/shared/components/api-example.component.ts (line 1) y .../dashboard-example.component.ts (line 1) son archivos vacíos que no se importan en ninguna parte.
Servicios o Funciones Sin Uso

front/src/app/core/services/subjects.service.ts (line 24) (getSubjectGrades) y (line 47) (patchGrade) no tienen referencias en todo el proyecto (rg solo devuelve la definición). Toda la UI usa getSubjectAcademicSituation, bulkUpsertCommissionGrades y moveStudentCommission, por lo que estas funciones quedaron obsoletas.
front/src/app/core/services/final-exams.service.ts (line 33) (getOne) y (line 60) (edit) tampoco se consumen; los componentes de finales solo listan, crean o eliminan registros.
Los modelos en front/src/app/core/models/{address_data,common_data,exam,exam_result,final_exam_student,preceptor,role,secretary,student,subject_student,teacher,user_info}.model.ts (line 1) se exportan pero no se importan desde ningún módulo (no existe ningún import ... from '../models/xxx.model'), por lo que son tipos muertos sin efecto en el tipado actual.
Endpoints Sin Llamados Desde el Front

backend/src/modules/careers/career-students.controller.ts (line 13) (GET /careers/:careerId/students) no se consume: el front solo toca catalogs/career-full-data y catalogs/career-students-by-commission.
backend/src/modules/roles/roles.controller.ts (line 7) (GET /roles) no tiene ningún cliente HTTP; no hay referencias a /roles en el repositorio.
backend/src/modules/catalogs/catalogs.controller.ts:{26,108,134,160,238} (GET /catalogs/careers, /academic-periods, /commissions, /subject-commissions/:commissionId, /student/:studentId/academic-subjects-minimal) no se invocan; todos los catalogs/ que usa el front son los especializados mencionados en el servicio (career-full-data, career-students-by-commission, subject/.../commission-teachers, student/.../academic-status, teachers, teacher/.../subject-commissions).
backend/src/modules/users/read/users.controller.ts (line 22) (GET /users/read) no tiene consumidores; el front solo hace getById('users/read', id).
backend/src/modules/users/manage/users.controller.ts (line 153) (DELETE /users/:id) no se usa; no hay DELETE users/ en la app Angular.
backend/src/modules/notices/notices.controller.ts (line 42) (PATCH /notices/:id) está sin clientes; la UI publica (POST) o elimina (DELETE) avisos, pero no edita.
backend/src/modules/final_exams/controllers/final-exam.controller.ts:{137,144} (POST /finals/exam/record, POST /finals/exam/approve) tampoco se llaman desde el front actual.
backend/src/modules/subjects/read/subjects.controller.ts (line 14) (GET /subjects/read/:id) es redundante; tanto new-subject-page como los diálogos usan solo getAll('subjects/read').
backend/src/subjects/subjects.controller.ts (line 256) (/subject-status/...) comparte el diagnóstico del bloque de rutas: ningún fetch del front pega a esas URLs.
Imports o Dependencias Redundantes

front/src/app/shared/components/menu/menu-component.ts (line 29) inyecta AuthService, pero ni el componente ni su template hacen referencia a this.authService; las acciones del menú dependen únicamente de PermissionService y DrawerVisibility.
front/src/app/pages/users_module/student-academic-status-page/student-academic-status-page.ts (line 47) mantiene un GoBackService inyectado sin uso (la navegación vuelve directamente con this.router.navigate(['/users'])). Esto sugiere código heredado que ya no aporta nada.
Siguientes pasos lógicos: decidir si conviene eliminar rutas/servicios muertos para reducir deuda técnica o, en caso de que sigan en el roadmap, enlazarlos explícitamente (por ejemplo, agregar navegación hacia calendar/:id o exponer los endpoints de catálogos necesarios). También es buen momento para limpiar modelos duplicados y dependencias inyectadas que ya no se usan, antes de que oculten errores reales.
