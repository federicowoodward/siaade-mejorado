import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Card } from 'primeng/card';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
import { RoleLabelPipe } from '../../../shared/pipes/role-label.pipe';
import { AuthService } from '@/core/services/auth.service';
import { environment } from 'environments/environment';
import { take } from 'rxjs/operators';

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
  imports: [CommonModule, Card, RouterModule],
  templateUrl: './quick-access-component.html',
  styleUrls: ['./quick-access-component.scss'],
})
export class QuickAccessComponent {
  private permissions = inject(PermissionService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  accesses = signal<QuickAccess[]>([]);
  loadingStudentCertificate = signal(false);

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
        description: 'Mesas disponibles para inscripcion.',
        route: ['/alumno/mesas'],
      },
      {
        label: 'Certificado alumno',
        icon: 'pi pi-book',
        description: 'Genera certificado de alumno.',
        action: () => this.handleStudentCertificateClick(),
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

  isStudentCertificate(acc: QuickAccess): boolean {
    return acc.label === 'Certificado alumno';
  }

  private handleStudentCertificateClick(): void {
    if (this.loadingStudentCertificate()) {
      return;
    }

    this.loadingStudentCertificate.set(true);

    this.authService
      .getUser()
      .pipe(take(1))
      .subscribe({
        next: (user) => {
          if (!user) {
            this.loadingStudentCertificate.set(false);
            return;
          }

          const base = environment.apiBaseUrl.replace(/\/$/, '');
          const url = `${base}/generatePdf/student-certificate/${user.id}`;

          this.http.get(url, { responseType: 'blob' as 'blob' }).subscribe({
            next: (blob) => {
              const blobUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.target = '_blank';
              link.download = 'certificado-alumno.pdf';
              link.click();
              URL.revokeObjectURL(blobUrl);
              this.loadingStudentCertificate.set(false);
            },
            error: (error) => {
              console.error('Error al generar el certificado de alumno', error);
              this.loadingStudentCertificate.set(false);
            },
          });
        },
        error: (error) => {
          console.error('Error al obtener el usuario actual', error);
          this.loadingStudentCertificate.set(false);
        },
      });
  }

  navigate(route: string[]): void {
    this.router.navigate(route).then((ok) => {
      if (!ok) {
        console.warn('Navigation was canceled, check guards or path:', route);
      }
    });
  }
}
