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
    // Si student ya está presente, cargar inmediatamente
    if (this.student) {
      this.loadData(this.student);
      return;
    }
    
    // Si no hay student input, usar el usuario logueado
    this.auth.getUser().subscribe((u) => {
      if (!u) return;
      this.loadData(u);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Cuando el Input student cambia, recargar datos
    if (changes["student"]) {
      const current = changes["student"].currentValue;
      if (current && current.id) {
        this.loading.set(true);
        this.loadData(current);
      }
    }
  }

  private loadData(s: any) {
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
