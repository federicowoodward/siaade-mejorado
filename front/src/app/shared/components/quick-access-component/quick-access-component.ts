import { Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RoleName, RolesService } from '../../../core/services/role.service';
import { NoticesService, Notice } from '../../../core/services/notices.service';
import { Card } from 'primeng/card';


interface QuickAccess {
  label: string;
  icon: string;
  description: string;
  route: string[];
}

@Component({
  selector: 'app-quick-access',
  standalone: true,
  imports: [CommonModule, Card, RouterModule],
  templateUrl: './quick-access-component.html',
  styleUrls: ['./quick-access-component.scss'],
})
export class QuickAccessComponent {
  public rolesService = inject(RolesService);
  private router = inject(Router);
  private noticesSrv = inject(NoticesService);

  accesses = signal<QuickAccess[]>([]);

  private readonly accessesByRole: Record<RoleName, QuickAccess[]> = {
    student: [
      { label: 'Ver Materias', icon: 'pi pi-book', description: 'Consulta tus materias inscritas y su información.', route: ['/students/subjects'] },
      { label: 'Situación Académica', icon: 'pi pi-chart-line', description: 'Revisa tus notas y promedios actuales.', route: ['/students/academic-status'] },
      { label: 'Inscripciones a Finales', icon: 'pi pi-pencil', description: 'Inscríbete o cancela inscripción a exámenes finales.', route: ['/students/enrollments'] },
    ],
    teacher: [
      { label: 'Mis Materias', icon: 'pi pi-briefcase', description: 'Gestiona las materias a tu cargo.', route: ['/subjects'] },
      { label: 'Finales', icon: 'pi pi-book', description: 'Consulta y administra mesas de examen.', route: ['/final_examns'] },
      { label: 'Usuarios', icon: 'pi pi-users', description: 'Visualiza información de los estudiantes.', route: ['/users'] },
    ],
    preceptor: [
      { label: 'Materias', icon: 'pi pi-briefcase', description: 'Consulta materias y asistencia.', route: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', description: 'Accede a datos de estudiantes.', route: ['/users'] },
    ],
    secretary: [
      { label: 'Materias', icon: 'pi pi-briefcase', description: 'Gestiona el listado de materias y correlativas.', route: ['/subjects'] },
      { label: 'Usuarios', icon: 'pi pi-users', description: 'Administra cuentas y datos de usuarios.', route: ['/users'] },
      { label: 'Finales', icon: 'pi pi-book', description: 'Crea y administra mesas de examen.', route: ['/final_examns'] },
    ],
  };

  constructor() {
    effect(() => {
      const role = this.rolesService.currentRole();
      this.accesses.set(this.accessesByRole[role] ?? []);
    });
  }

  navigate(route: string[]) {
    this.router.navigate(route).then(ok => {
      if (!ok) console.warn('Navigation was canceled, check guards or path:', route);
    });
  }

  // ✅ Avisos
  role = this.rolesService.currentRole;
  allNotices = this.noticesSrv.notices;

  noticesForHome = computed<Notice[]>(() => {
    const role = this.role();
    const all = this.allNotices();
    if (role === 'preceptor' || role === 'secretary') return all;
    return all.filter(n => n.visibleFor === role);
  });

  stats = [
    { label: 'Materias activas', value: 5 },
    { label: 'Exámenes próximos', value: 2 },
    { label: 'Usuarios nuevos', value: 12 },
  ];
}
