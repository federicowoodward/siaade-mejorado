import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppBreadcrumbComponent } from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { ROLE } from '@/core/auth/roles';
import { CanAnyRoleDirective } from '@/shared/directives/can-any-role.directive';

interface FaqItem {
  title: string;
  description: string;
}

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, AppBreadcrumbComponent, CanAnyRoleDirective],
  templateUrl: './faq-page.html',
  styleUrl: './faq-page.scss',
})
export class FaqPage {
  readonly ROLE = ROLE;

  // Bloque general (visible para todos)
  readonly generalFaq: FaqItem[] = [
    {
      title: '¿Cómo ingreso al sistema?',
      description:
        'El acceso se realiza con las credenciales provistas por la institución. Si tenés problemas de acceso, contactá al preceptor o a la secretaría para verificar tus datos y restablecer la contraseña si es necesario.',
    },
    {
      title: '¿Cómo solicito soporte o reporto un problema?',
      description:
        'Si detectás errores en tus datos, dificultades para ingresar o cualquier comportamiento extraño del sistema, comunicate con la secretaría o el área de sistemas de la institución indicando tu nombre completo, DNI o CUIL y una descripción clara del inconveniente.',
    },
  ];

  // Preguntas para estudiantes
  readonly studentFaq: FaqItem[] = [
    {
      title: '¿Cómo realizo inscripciones a mesas de examen?',
      description:
        'Desde el menú lateral, accedé a la sección de inscripciones o mesas de examen y seguí los pasos indicados en pantalla. Vas a ver únicamente las mesas habilitadas para tu plan de estudios y ciclo lectivo.',
    },
    {
      title: '¿Dónde consulto mis notas y situación académica?',
      description:
        'En el módulo de “Situación académica” podés consultar tus materias, calificaciones, correlatividades y estado de regularidad. La información se actualiza a medida que la institución procesa actas y registros.',
    },
  ];

  // Preguntas para docentes
  readonly teacherFaq: FaqItem[] = [
    {
      title: 'Soy docente, ¿qué puedo gestionar desde el sistema?',
      description:
        'Podés consultar listados de alumnos, registrar calificaciones, visualizar mesas de examen asignadas y acceder a avisos institucionales, según los permisos configurados por la secretaría.',
    },
    {
      title: '¿Cómo registro notas de cursado y finales?',
      description:
        'Desde el módulo de materias y finales podés cargar y revisar notas de cursado y de mesas de examen. Asegurate de verificar la materia, turno y comisión antes de confirmar la carga.',
    },
  ];

  // Preguntas para personal administrativo (preceptor/secretaría)
  readonly adminFaq: FaqItem[] = [
    {
      title: 'Gestión de avisos y auditorías',
      description:
        'Desde los módulos de avisos y auditoría podés publicar comunicaciones institucionales, revisar el historial de acciones en el sistema y supervisar inscripciones, calificaciones y movimientos de alumnos y docentes, según los permisos de tu rol.',
    },
  ];
}
