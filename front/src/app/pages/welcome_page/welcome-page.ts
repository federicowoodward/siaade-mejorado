import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { RolesService, RoleName } from '../../core/services/role.service';
import { NoticesService, Notice } from '../../core/services/notices.service';

import { QuickAccessComponent } from '../../shared/components/quick-access-component/quick-access-component';

// PrimeNG (compatibles)
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

interface KPI { label: string; value: number | string; progress?: number; }
interface EventItem { title: string; type: 'Mesa'|'Inscripción'|'Feriado'|'Recordatorio'; date: Date; location: string; }

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [
    CommonModule,
    // UI
    CardModule, ProgressBarModule, ButtonModule, TagModule,
    // Tu componente
    QuickAccessComponent
  ],
  templateUrl: './welcome-page.html',
  styleUrls: ['./welcome-page.scss'],
})
export class WelcomePage implements OnInit {
  private authService = inject(AuthService);
  private rolesService = inject(RolesService);
  private noticesService = inject(NoticesService);
  private router = inject(Router);

  public role: RoleName;
  constructor() {
    this.role = this.rolesService.currentRole();
  }

  // Estado: usuario y rol
  userName = signal<string>('');
  userRole = computed(() => this.rolesService.currentRole());

  // Fecha formateada simple (HOY)
  todayStr = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short', day: '2-digit', month: '2-digit'
  }).format(new Date());

  // Highlights banner (mockeados)
  todayExams = 2;
  enrollmentPct = 72;



  // Próximos eventos (mock)
  events: EventItem[] = [
    { title: 'Mesa de Física I',               type: 'Mesa',        date: new Date(Date.now()+86400_000*2), location: 'Aula 204' },
    { title: 'Inicio inscripción Laboratorio', type: 'Inscripción', date: new Date(Date.now()+86400_000*3), location: 'Campus Virtual' },
    { title: 'Feriado Nacional',               type: 'Feriado',     date: new Date(Date.now()+86400_000*5), location: '—' },
  ];

  // Avisos recientes (reutiliza filtros por rol)
  roleSignal = this.rolesService.currentRole; // signal<string>
  allNotices = this.noticesService.notices;   // signal<Notice[]>

  recentNotices = computed<Notice[]>(() => {
    const r = this.roleSignal();
    const list = this.allNotices() || [];
    const visibles = (r === 'preceptor' || r === 'secretary')
      ? list
      : list.filter(n => n.visibleFor === r);
    return [...visibles]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5);
  });

  ngOnInit() {
    this.authService.getUser().subscribe((user) => {
      if (user) {
        this.userName.set(`${user.name} ${user.lastName}`);
      }
    });
  }

  // ===== Helpers =====
  // Opción 1: método para mapear tipo de evento -> severity del Tag
  eventSeverity(type: 'Mesa' | 'Inscripción' | 'Feriado' | 'Recordatorio') {
    switch (type) {
      case 'Mesa':         return 'success';
      case 'Inscripción':  return 'info';
      case 'Feriado':      return 'secondary';
      case 'Recordatorio': return 'warning';
      default:             return 'secondary';
    }
  }

  // Acciones
  goToAllNotices() { this.router.navigate(['/avisos']); }
  createExamTable() { this.router.navigate(['/final_examns/new']); }
}
