import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

export interface StudentMinimal {
  id: string;
  name: string;
  lastName: string;
  cuil: string;
}

@Component({
  selector: 'app-academic-status',
  standalone: true,
  imports: [CommonModule, TableModule, Tag],
  templateUrl: './academic-status-component.html',
})
export class AcademicStatus implements OnInit, OnChanges {
  /** If provided, we load this student; otherwise we fall back to the logged-in user */
  @Input() student?: StudentMinimal;

  subjectsByYear = signal<Record<string, any[]>>({});
  loading = signal(true);
  user = signal<{ name: string; cuil: string } | undefined>(undefined);

  private api = inject(ApiService);
  private auth = inject(AuthService);

  ngOnInit() {
    console.log('[AcademicStatus] ngOnInit - student:', this.student);
    // NO hacer nada aquí - todo se maneja en ngOnChanges o AfterViewInit
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('[AcademicStatus] ngOnChanges ejecutado:', changes);
    
    // Cuando el Input student cambia, recargar datos
    if (changes["student"]) {
      const current = changes["student"].currentValue;
      const previous = changes["student"].previousValue;
      console.log('[AcademicStatus] Cambio detectado:', { previous, current });
      
      // Si ahora hay un student válido, cargar sus datos
      if (current && current.id) {
        console.log('[AcademicStatus] Cargando datos para student:', current);
        this.loading.set(true);
        this.subjectsByYear.set({});
        this.loadData(current);
        return;
      }
      
      // Si current es null/undefined y no había previous, cargar usuario logueado
      if (!current && !previous) {
        console.log('[AcademicStatus] Sin student, cargando usuario logueado');
        this.auth.getUser().subscribe((u) => {
          if (!u) return;
          this.loadData(u);
        });
      }
    }
  }

  private loadData(s: any) {
    console.log('[AcademicStatus] loadData llamado con:', s);
    
    if (!s || !s.id) {
      console.error('[AcademicStatus] Student sin ID válido:', s);
      this.loading.set(false);
      return;
    }
    
    this.user.set({
      name: `${s.name} ${s.lastName}`,
      cuil: s.cuil,
    });

    this.getAcademicStatus(s.id);
  }

  getAcademicStatus(studentId: string): void {
    console.log('[AcademicStatus] Cargando situación académica para:', studentId);
    this.loading.set(true);
    
    this.api
      .request<{ byYear: Record<string, any[]> }>(
        'GET',
        `catalogs/student/${studentId}/academic-status`
      )
      .subscribe({
        next: (payload) => {
          console.log('[AcademicStatus] Respuesta recibida:', payload);
          this.subjectsByYear.set(payload?.byYear ?? {});
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[AcademicStatus] Error al cargar:', err);
          this.subjectsByYear.set({});
          this.loading.set(false);
        },
      });
  }

  getSeverity(condition: string): string {
    switch (condition) {
      case 'Aprobado':
        return 'success';
      case 'Promocionado':
        return 'success';
      case 'Desaprobado':
        return 'warn';
      case 'Libre':
        return 'danger';
      case 'Inscripto':
        return 'info';
      default:
        return 'secondary';
    }
  }
}
