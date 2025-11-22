import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Card } from 'primeng/card';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
import { RoleLabelPipe } from '../../../shared/pipes/role-label.pipe';
import { ApiService } from '@/core/services/api.service';
import { AuthService } from '@/core/services/auth.service';
import { environment } from 'environments/environment.qa';

interface QuickAccess {
  label: string;
  icon: string;
  description: string;
  route?: string[];
  action?: (() => void) | null;
}

@Component({
  selector: 'app-quick-access',
  standalone: true,
  imports: [CommonModule, Card, RouterModule, RoleLabelPipe],
  templateUrl: './quick-access-component.html',
  styleUrls: ['./quick-access-component.scss'],
})
export class QuickAccessComponent {
  private permissions = inject(PermissionService);
  private router = inject(Router);
  private api = inject(ApiService);
  private authService = inject(AuthService);

  accesses = signal<QuickAccess[]>([]);

  userRole(): ROLE | null {
    return this.permissions.currentRole();
  }

  private readonly accessesByRole: Record<ROLE, QuickAccess[]> = {
    [ROLE.STUDENT]: [
      {
        label: 'Mi Legajo',
        icon: 'pi pi-id-card',
        description: 'Seguimiento de parciales, asistencia y condicion.',
        route: ['/alumno/situacion-academica'],
      },
      {
        label: 'Mesas de examen',
        icon: 'pi pi-calendar-plus',
        description: 'Mesas disponibles para inscripción.',
        route: ['/alumno/mesas'],
      },
      {
        label: 'Certificado alumno',
        icon: 'pi pi-book',
        description: 'Genera certificado de alumno.',
        action: () => {
          this.authService.getUser().subscribe((user) => {
            if (!user) return;

            const base = environment.apiBaseUrl.replace(/\/$/, ''); // http://localhost:3000/api
            const url = `${base}/generatePdf/student-certificate/${user.id}`;

            window.open(url, '_blank'); // abre el PDF en una nueva pestaña / dispara la descarga
          });
        },
      },
    ],
    [ROLE.TEACHER]: [
      {
        label: 'Mis Materias',
        icon: 'pi pi-briefcase',
        description: 'Gestiona las materias a tu cargo.',
        route: ['/subjects'],
      },
      {
        label: 'Finales',
        icon: 'pi pi-book',
        description: 'Consulta y administra mesas de examen.',
        route: ['/final_examns'],
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        description: 'Visualiza informacion de los estudiantes.',
        route: ['/users'],
      },
    ],
    [ROLE.PRECEPTOR]: [
      {
        label: 'Materias',
        icon: 'pi pi-briefcase',
        description: 'Consulta materias y asistencia.',
        route: ['/subjects'],
      },
      {
        label: 'Finales',
        icon: 'pi pi-book',
        description: 'Publica mesas y gestiona llamados para tus cursos.',
        route: ['/final_examns'],
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        description: 'Accede a datos de estudiantes.',
        route: ['/users'],
      },
    ],
    [ROLE.SECRETARY]: [
      {
        label: 'Materias',
        icon: 'pi pi-briefcase',
        description: 'Gestiona el listado de materias y correlativas.',
        route: ['/subjects'],
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        description: 'Administra cuentas y datos de usuarios.',
        route: ['/users'],
      },
      {
        label: 'Finales',
        icon: 'pi pi-book',
        description: 'Crea y administra mesas de examen.',
        route: ['/final_examns'],
      },
    ],
    [ROLE.EXECUTIVE_SECRETARY]: [
      {
        label: 'Materias',
        icon: 'pi pi-briefcase',
        description: 'Gestiona el listado de materias y correlativas.',
        route: ['/subjects'],
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        description: 'Administra cuentas y datos de usuarios.',
        route: ['/users'],
      },
      {
        label: 'Finales',
        icon: 'pi pi-book',
        description: 'Crea y administra mesas de examen.',
        route: ['/final_examns'],
      },
    ],
  };

  constructor() {
    effect(() => {
      const role = this.permissions.currentRole();
      this.accesses.set(role ? (this.accessesByRole[role] ?? []) : []);
    });
  }

  navigate(route: string[]) {
    this.router.navigate(route).then((ok) => {
      if (!ok)
        console.warn('Navigation was canceled, check guards or path:', route);
    });
  }
}
