import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import {
  BlockMessageAction,
  BlockMessageComponent,
  BlockMessageVariant,
} from '../../../shared/block-message/block-message.component';
import {
  StudentExamBlockReason,
  StudentWindowState,
} from '../../../core/models/student-exam.model';
import {
  StudentSubjectCard,
  StudentSubjectNote,
} from '../../../core/services/student-status.service';

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
  selector: 'app-subject-status-detail',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    TagModule,
    ButtonModule,
    BlockMessageComponent,
  ],
  templateUrl: './subject-status-detail.component.html',
  styleUrl: './subject-status-detail.component.scss',
})
export class SubjectStatusDetailComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @Input() subject: StudentSubjectCard | null = null;
  @Input() studentName: string | null = null;
  @Input() examBlockActions: BlockMessageAction[] = [];

  @Output() courseEnroll = new EventEmitter<StudentSubjectCard>();
  @Output() examEnroll = new EventEmitter<StudentSubjectCard>();

  handleHide(): void {
    this.visibleChange.emit(false);
    this.closed.emit();
  }

  onCourseEnroll(): void {
    if (!this.subject || !this.subject.actions.canEnrollCourse) return;
    this.courseEnroll.emit(this.subject);
  }

  onExamEnroll(): void {
    if (!this.subject || !this.subject.actions.canEnrollExam) return;
    this.examEnroll.emit(this.subject);
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

  blockInfo(reason: StudentExamBlockReason | string | null) {
    if (!reason) return null;
    return (
      ACTION_REASON_COPY[(reason as StudentExamBlockReason) ?? 'DEFAULT'] ??
      ACTION_REASON_COPY.DEFAULT
    );
  }

  trackNote(_: number, note: StudentSubjectNote): string {
    return note.label;
  }

  windowLabel(state?: StudentWindowState | null): string {
    switch (state) {
      case 'open':
        return 'Ventana abierta';
      case 'upcoming':
        return 'Ventana proxima';
      case 'past':
      case 'closed':
        return 'Ventana cerrada';
      default:
        return 'Sin ventana informada';
    }
  }
}
