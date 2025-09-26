import { Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ⬅️ necesario para [(ngModel)]
import { Router, RouterModule } from '@angular/router';

import { RoleName, RolesService } from '../../../core/services/role.service';
import { NoticesService, Notice } from '../../../core/services/notices.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

interface QuickAccess {
  label: string;
  icon: string;
  description: string;
  route: string[];
}
interface Stat { label: string; value: number | string; progress?: number; }
interface EventItem { title: string; type: 'Mesa'|'Inscripción'|'Feriado'|'Recordatorio'; date: Date; location: string; }
interface Materia { nombre: string; profesor: string; inscripcion: Date; horaMesa: string; lugar: string; estado: 'Inscripto'|'Pendiente'|'Faltan docs'; promedio?: number; }

@Component({
  selector: 'app-quick-access',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, DataViewModule, ButtonModule, DividerModule, ToolbarModule,
    TagModule, TimelineModule, ProgressBarModule, InputTextModule, MessageModule
  ],
  templateUrl: './quick-access-component.html',
  styleUrls: ['./quick-access-component.scss'],
})
export class QuickAccessComponent {
  public rolesService = inject(RolesService);
  private router = inject(Router);
  private noticesSrv = inject(NoticesService);

  // ===== Accesos según rol (tu lógica base) =====
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

  // ===== Avisos (signals + filtro por rol) =====
  role = this.rolesService.currentRole;   // signal
  allNotices = this.noticesSrv.notices;   // signal

  noticesForHome = computed<Notice[]>(() => {
    const role = this.role();
    const all = this.allNotices();
    if (role === 'preceptor' || role === 'secretary') return all;
    return all.filter(n => n.visibleFor === role);
  });

  // ===== KPIs =====
  stats: Stat[] = [
    { label: 'Estudiantes activos', value: 1240 },
    { label: 'Docentes', value: 86 },
    { label: 'Mesas activas', value: 14 },
    { label: '% Inscripción', value: '72%', progress: 72 },
  ];

  // ===== Timeline de actividad reciente =====
  recentActivities = [
    { icon: 'pi pi-book',      title: 'Carga de notas',          description: 'Matemática I - Parcial 1 cargado',   when: new Date() },
    { icon: 'pi pi-lock',      title: 'Inscripciones cerradas',  description: 'Programación II cerró inscripción',  when: new Date(Date.now()-3600_000*3) },
    { icon: 'pi pi-user-plus', title: 'Alumno nuevo',            description: 'Se registró Pepito Gómez',           when: new Date(Date.now()-3600_000*12) },
  ];

  // ===== Próximos eventos =====
  nextEvents: EventItem[] = [
    { title: 'Mesa de Física I',               type: 'Mesa',        date: new Date(Date.now()+86400_000*2), location: 'Aula 204' },
    { title: 'Inicio inscripción Laboratorio', type: 'Inscripción', date: new Date(Date.now()+86400_000*3), location: 'Campus Virtual' },
    { title: 'Feriado Nacional',               type: 'Feriado',     date: new Date(Date.now()+86400_000*5), location: '—' },
    { title: 'Recordatorio documentación',     type: 'Recordatorio',date: new Date(Date.now()+86400_000*6), location: 'Bedelía' },
  ];

  // ===== Materias (sin dropdown) =====
  materias: Materia[] = [
    { nombre: 'Algoritmos', profesor: 'García', inscripcion: new Date(),                        horaMesa: '10:00', lugar: 'Lab B',    estado: 'Inscripto',  promedio: 6.8 },
    { nombre: 'Física I',   profesor: 'López',  inscripcion: new Date(Date.now()+86400_000*1),  horaMesa: '14:00', lugar: 'Aula 204', estado: 'Pendiente' },
    { nombre: 'Análisis I', profesor: 'Pérez',  inscripcion: new Date(Date.now()+86400_000*4),  horaMesa: '08:30', lugar: 'Aula 101', estado: 'Faltan docs', promedio: 5.1 },
  ];

  // estado de filtro + búsqueda
  materiaFilter: 'all' | 'Inscripto' | 'Pendiente' | 'Faltan docs' = 'all';
  materiaSearch = '';

  setMateriaFilter(v: 'all' | 'Inscripto' | 'Pendiente' | 'Faltan docs') {
    this.materiaFilter = v;
  }

  filteredMaterias() {
    const term = this.materiaSearch.toLowerCase().trim();
    return this.materias.filter(m => {
      const filterOk = this.materiaFilter === 'all' || m.estado === this.materiaFilter;
      const textOk = !term || [m.nombre, m.profesor, m.lugar].some(x => x.toLowerCase().includes(term));
      return filterOk && textOk;
    });
  }

  // ===== Severities helpers =====
  tagSeverity(tag?: string) {
    switch ((tag || '').toLowerCase()) {
      case 'urgente': return 'danger';
      case 'info': return 'info';
      case 'recordatorio': return 'warning';
      default: return 'secondary';
    }
  }
  eventSeverity(type: EventItem['type']) {
    switch (type) {
      case 'Mesa': return 'success';
      case 'Inscripción': return 'info';
      case 'Feriado': return 'secondary';
      case 'Recordatorio': return 'warning';
    }
  }
  stateSeverity(s: Materia['estado']) {
    return s === 'Inscripto' ? 'success' : s === 'Pendiente' ? 'warning' : 'danger';
  }

  // ===== Acciones UI / navegación =====
  onCreateNotice() { this.router.navigate(['/avisos/nuevo']); }
  onSeeAllNotices() { this.router.navigate(['/avisos']); }
  createExamTable() { this.router.navigate(['/final_examns/new']); } // stub
  editNotice(n: Notice) { /* abrir modal o navegar al editor */ }
  deleteNotice(n: Notice) { /* confirmar y borrar */ }
}
