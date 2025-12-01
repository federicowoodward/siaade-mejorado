import { formatDDMMYYYY } from '../../../shared/utils/date-utils';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { BlockedActionDirective } from '../../../shared/directives/blocked-action.directive';
import { CanAnyRoleDirective } from '@/shared/directives/can-any-role.directive';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FinalExamStudentsService,
  FinalExamDetailDto,
  FinalExamStudentDto,
} from '../../../core/services/final-exam-students.service';
import {
  ApiService,
  ToggleEnrollmentResponse,
} from '../../../core/services/api.service';
import { ExamTableSyncService } from '../../../core/services/exam-table-sync.service';
import { MessageService } from 'primeng/api';
import { UiAlertAuditService } from '../../../core/services/ui-alert-audit.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '@/core/auth/permission.service';
import { ROLE } from '@/core/auth/roles';

type Row = {
  id: number;

  student_id: string;

  name: string;

  enrolled: boolean;

  enrolled_at: string | null;

  score: number | null;

  notes: string;
};

@Component({
  selector: 'app-final-exam-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TagModule,
    BlockedActionDirective,
    ToastModule,
    SelectModule,
    CanAnyRoleDirective,
    AppBreadcrumbComponent,
  ],

  templateUrl: './final-exam-page.html',

  styleUrls: ['./final-exam-page.scss'],
})
export class FinalExamPage implements OnInit {
  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private svc = inject(FinalExamStudentsService);

  private api = inject(ApiService);

  private messages = inject(MessageService);

  private syncService = inject(ExamTableSyncService);

  private uiAlertAudit = inject(UiAlertAuditService);

  private auth = inject(AuthService);

  private permissions = inject(PermissionService);

  private clonedRows = new Map<string, Row>();

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Mesas de examen', routerLink: '/final_examns' },
    { label: 'Mesa' },
    { label: 'Examen' },
  ];

  examId = Number(this.route.snapshot.paramMap.get('id') ?? 0);

  // header del examen

  exam = signal<FinalExamDetailDto | null>(null);

  // filas de alumnos (derivadas del DTO)

  rows = signal<Row[]>([]);

  yearOptions = signal<Array<{ label: string; value: number | null }>>([]);

  selectedYear = signal<number | null>(null);

  loadingRow = signal<string | null>(null);

  savingRow = signal<string | null>(null);

  loading = signal<boolean>(false);

  error = signal<string | null>(null);

  // Edición permitida solo para docentes
  canEditScores(): boolean {
    return this.permissions.hasAnyRole([ROLE.TEACHER]);
  }

  canEditNotes(): boolean {
    return this.permissions.hasAnyRole([ROLE.TEACHER]);
  }

  ngOnInit(): void {
    this.fetch();
  }

  private fetch() {
    this.loading.set(true);

    this.error.set(null);

    const year = this.selectedYear();

    this.svc.getExamDetail(this.examId, { year }).subscribe({
      next: (data) => {
        this.exam.set(data);
        this.buildYearOptions(data);

        const mapped: Row[] = (data.students ?? []).map(
          (s: FinalExamStudentDto) => ({
            id: s.id,

            student_id: s.student_id,

            name: s.name,

            enrolled_at: s.enrolled_at,

            enrolled: !!s.enrolled_at,

            score: s.score,

            notes: s.notes ?? '',
          }),
        );

        this.rows.set(mapped);

        this.loading.set(false);
      },

      error: (e) => {
        console.error('[FinalExamPage] load error', e);

        this.error.set(e?.error?.message ?? 'No se pudo cargar el examen');

        this.loading.set(false);
      },
    });
  }

  onYearChange(year: number | null | undefined): void {
    const normalized =
      year === null || year === undefined ? null : Number(year);
    this.selectedYear.set(
      Number.isFinite(normalized as number) ? (normalized as number) : null,
    );
    this.fetch();
  }

  private buildYearOptions(exam: FinalExamDetailDto | null): void {
    if (!exam) {
      this.yearOptions.set([]);
      return;
    }

    const years = new Set<number>();

    const tableStart = exam.table_start_date
      ? new Date(exam.table_start_date).getFullYear()
      : undefined;
    const tableEnd = exam.table_end_date
      ? new Date(exam.table_end_date).getFullYear()
      : undefined;

    if (tableStart && Number.isFinite(tableStart)) {
      years.add(tableStart);
    }
    if (tableEnd && Number.isFinite(tableEnd)) {
      years.add(tableEnd);
    }

    const sortedYears = Array.from(years).sort((a, b) => a - b);

    const options: Array<{ label: string; value: number | null }> = [
      { label: 'Todos los años', value: null },
      ...sortedYears.map((y) => ({ label: String(y), value: y })),
    ];

    this.yearOptions.set(options);
  }

  back() {
    const tableId = this.exam()?.table_id ?? 0;

    this.router.navigate(['../../table', tableId], { relativeTo: this.route });
  }

  onToggleExamEnrollment(row: Row, action: 'enroll' | 'unenroll') {
    const exam = this.exam();

    if (!exam) {
      return;
    }

    this.loadingRow.set(row.student_id);

    const finalize = () => this.loadingRow.set(null);

    this.api

      .toggleFinalEnrollment({
        finalExamId: exam.id,

        studentId: row.student_id,

        action,
      })

      .subscribe({
        next: (res: ToggleEnrollmentResponse) => {
          const enrolled = !!res?.enrolled;

          row.enrolled = enrolled;

          row.enrolled_at = enrolled ? (res?.enrolled_at ?? null) : null;

          const dateLabel = res?.enrolled_at
            ? formatDDMMYYYY(res.enrolled_at)
            : '';
          this.toastOk(
            enrolled
              ? `Alumno inscripto${dateLabel ? ` (${dateLabel})` : ''}`
              : 'Alumno desinscripto',
          );

          // Notificar cambios a través del ExamTableSyncService
          // para que otros usuarios/pestañas vean los cambios en tiempo real
          if (exam && this.exam()?.table_id) {
            this.syncService.notify({
              action: 'updated',
              mesaId: this.exam()?.table_id,
            });
          }
        },

        error: (err: unknown) => {
          console.error('Error toggling exam enrollment', err);

          this.toastErr('No se pudo actualizar la inscripción');

          finalize();
        },

        complete: finalize,
      });
  }

  private toastOk(summary: string) {
    this.uiAlertAudit.add(this.messages, { severity: 'success', summary });
  }

  private toastErr(detail: string) {
    this.uiAlertAudit.add(this.messages, {
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }

  // helpers para el tag de estado

  isAprobado(r: Row) {
    return r.score != null && r.score >= 6;
  }

  isDesaprobado(r: Row) {
    return r.score != null && r.score < 6;
  }

  isInscripto(r: Row) {
    return r.score == null && !!r.enrolled_at;
  }

  onRowEditInit(row: Row): void {
    if (!row?.student_id) {
      return;
    }
    if (!this.canEditScores() && !this.canEditNotes()) {
      return;
    }
    this.clonedRows.set(row.student_id, { ...row });
  }

  onRowEditSave(row: Row): void {
    if (!row?.student_id) {
      return;
    }
    if (!this.canEditScores() && !this.canEditNotes()) {
      this.restoreRowFromClone(row);
      return;
    }

    const score = row.score;
    if (
      !(
        score === null ||
        score === undefined ||
        (typeof score === 'number' &&
          !Number.isNaN(score) &&
          score >= 0 &&
          score <= 10)
      )
    ) {
      this.restoreRowFromClone(row);
      this.showValidationError();
      return;
    }

    this.saveRow(row);
  }

  onRowEditCancel(row: Row, _index: number): void {
    if (!row?.student_id) {
      return;
    }
    this.restoreRowFromClone(row);
    this.clonedRows.delete(row.student_id);
  }

  private restoreRowFromClone(row: Row): void {
    if (!row?.student_id) {
      return;
    }
    const original = this.clonedRows.get(row.student_id);
    if (!original) {
      return;
    }
    Object.assign(row, original);
  }

  private showValidationError(): void {
    this.uiAlertAudit.add(this.messages, {
      severity: 'error',
      summary: 'Valores inválidos',
      detail: 'La nota final debe estar entre 0 y 10 o vacía.',
    });
  }

  saveRow(row: Row): void {
    const exam = this.exam();
    if (!exam) {
      return;
    }

    if (!row) {
      return;
    }

    const userId = this.auth.getUserId();
    if (!userId) {
      this.toastErr('No se pudo identificar al usuario actual.');
      return;
    }

    this.savingRow.set(row.student_id);

    const finalize = () => {
      this.savingRow.set(null);
    };

    this.svc
      .recordScore({
        final_exams_student_id: row.id,
        // enviamos undefined cuando no hay nota para evitar fallos de validación
        score:
          row.score === null || row.score === undefined
            ? (undefined as any)
            : row.score,
        notes: row.notes,
        recorded_by: userId,
      })
      .subscribe({
        next: () => {
          this.toastOk('Cambios guardados');
          if (this.exam()?.table_id) {
            this.syncService.notify({
              action: 'updated',
              mesaId: this.exam()!.table_id,
            });
          }
          this.clonedRows.delete(row.student_id);
          finalize();
        },
        error: (err: unknown) => {
          console.error('Error recording final exam score', err);
          this.restoreRowFromClone(row);
          this.uiAlertAudit.add(this.messages, {
            severity: 'error',
            summary: 'Error al guardar',
            detail:
              'No se pudieron guardar los cambios de este alumno. Intenta nuevamente.',
          });
          finalize();
        },
      });
  }
}
