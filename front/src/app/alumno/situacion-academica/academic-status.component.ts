import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import {
  StudentStatusService,
  StudentSubjectCard,
} from '../../core/services/student-status.service';
import {
  BlockMessageComponent,
  BlockMessageVariant,
  BlockMessageAction,
} from '../../shared/block-message/block-message.component';
import { StudentExamBlockReason } from '../../core/models/student-exam.model';

const ACTION_REASON_COPY: Record<
  StudentExamBlockReason | 'DEFAULT',
  { title: string; message: string; variant: BlockMessageVariant }
> = {
  WINDOW_CLOSED: {
    title: 'Ventana cerrada',
    message: 'El periodo para esta accion aun no esta abierto o ya finalizo.',
    variant: 'institutional',
  },
  MISSING_REQUIREMENTS: {
    title: 'Falta cumplir requisitos',
    message:
      'Todavia no se cumplen los requisitos academicos para habilitar la accion.',
    variant: 'official',
  },
  DUPLICATE: {
    title: 'Solicitud duplicada',
    message: 'Ya existe una gestion activa para esta materia.',
    variant: 'official',
  },
  QUOTA_FULL: {
    title: 'Cupo completo',
    message: 'El cupo definido para esta materia ya fue utilizado.',
    variant: 'institutional',
  },
  BACKEND_BLOCK: {
    title: 'Acceso restringido',
    message: 'Esta materia se inscribe de manera manual en Secretaria.',
    variant: 'official',
  },
  UNKNOWN: {
    title: 'No disponible',
    message: 'La accion no esta disponible por el momento.',
    variant: 'info',
  },
  DEFAULT: {
    title: 'Accion bloqueada',
    message: 'El sistema bloqueo esta accion. Consulta con Secretaria.',
    variant: 'info',
  },
};

@Component({
  selector: 'app-academic-status-student',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ChipModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ProgressSpinnerModule,
    BlockMessageComponent,
  ],
  templateUrl: './academic-status.component.html',
  styleUrl: './academic-status.component.scss',
  providers: [MessageService],
})
export class AcademicStatusComponent implements OnInit {
  private readonly statusService = inject(StudentStatusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);

  readonly cards = this.statusService.status;
  readonly loading = this.statusService.loading;

  readonly groupedCards = computed(() => {
    const map = new Map<string, StudentSubjectCard[]>();
    this.cards().forEach((card) => {
      const key = card.yearLabel;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(card);
    });
    return Array.from(map.entries()).map(([year, subjects]) => ({
      year,
      subjects,
    }));
  });

  readonly calcHelp =
    'La nota final se calcula con el promedio de los parciales informados y se redondea segun el reglamento vigente.';
  readonly accreditationHelp =
    'La acreditacion resume el estado oficial de la materia dentro del plan (regularizada, promocionada, aprobada).';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.statusService
      .loadStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onCourseEnroll(card: StudentSubjectCard): void {
    this.messages.add({
      severity: 'info',
      summary: 'Gestion presencial',
      detail: `Coordina la inscripcion de cursado de ${card.subjectName} con Secretaria.`,
      life: 5000,
    });
  }

  onExamEnroll(card: StudentSubjectCard): void {
    this.goToMesas(card.subjectId);
  }

  blockInfo(reason: StudentExamBlockReason | string | null) {
    if (!reason) return null;
    const resolved =
      ACTION_REASON_COPY[(reason as StudentExamBlockReason) ?? 'DEFAULT'] ??
      ACTION_REASON_COPY.DEFAULT;
    return resolved;
  }

  stateSeverity(
    condition: string | null,
  ): 'success' | 'info' | 'danger' | 'warning' {
    if (!condition) return 'warning';
    const value = condition.toLowerCase();
    if (value.includes('promo') || value.includes('apro')) return 'success';
    if (value.includes('regular')) return 'info';
    if (value.includes('libre')) return 'danger';
    return 'warning';
  }

  goToMesas(subjectId?: number): void {
    const queryParams = subjectId ? { subjectId } : undefined;
    void this.router.navigate(['/alumno/mesas'], { queryParams });
  }

  blockActions(card: StudentSubjectCard): BlockMessageAction[] {
    return [
      {
        label: 'Ver mesas',
        icon: 'pi pi-calendar',
        command: () => this.goToMesas(card.subjectId),
      },
    ];
  }
}
