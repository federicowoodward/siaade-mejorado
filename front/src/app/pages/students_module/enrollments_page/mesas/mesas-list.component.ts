import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog'; // <-- nuevo
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api'; // <-- sacamos ConfirmationService
import {
  StudentFinalExamRow,
  StudentInscriptionsService,
} from '@/core/services/student-inscriptions.service';
import { GoBackService } from '@/core/services/go_back.service';
import { UiAlertAuditService } from '@/core/services/ui-alert-audit.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-mesas-list',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    DialogModule, // <-- nuevo
    ProgressSpinnerModule,
  ],
  templateUrl: './mesas-list.component.html',
  styleUrl: './mesas-list.component.scss',
  // providers: [ConfirmationService], // <-- lo sacamos
})
export class MesasListComponent implements OnInit {
  breadcrumbItems: SimpleBreadcrumbItem[] = [{ label: 'Mesas de examen' }];

  private readonly inscriptions = inject(StudentInscriptionsService);
  private readonly messages = inject(MessageService);
  private readonly uiAlertAudit = inject(UiAlertAuditService);
  private readonly goBackSvc = inject(GoBackService);

  loading = false;
  rows: StudentFinalExamRow[] = [];
  selectedRow: StudentFinalExamRow | null = null;

  // #ASUMIENDO CODIGO: usamos un modo simple para distinguir qué acción se confirma
  confirmDialogVisible = false;
  confirmDialogHeader = '';
  confirmDialogMessage = '';
  confirmDialogMode: 'enroll' | 'unenroll' | null = null;

  private readonly shortDateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  get hasEnrollments(): boolean {
    return this.rows.some((r) => r.isEnrolled);
  }

  ngOnInit(): void {
    this.loadAvailableExams();
  }

  loadAvailableExams(options?: { refresh?: boolean }): void {
    this.loading = true;
    this.inscriptions
      .getAvailableFinalExamsForCurrentStudent(
        {},
        { refresh: options?.refresh },
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => {
          this.rows = rows;
        },
        error: (error) => {
          console.error('[MesasList] loadAvailableExams failed', error);
          this.showToast(
            'error',
            'No se pudieron cargar las mesas',
            'Intentá nuevamente en unos minutos.',
          );
          this.rows = [];
        },
      });
  }

  onReloadClick(): void {
    this.loadAvailableExams({ refresh: true });
  }

  onEnroll(row: StudentFinalExamRow): void {
    if (!this.canEnroll(row)) {
      return;
    }
    this.selectedRow = row;

    const when = this.formatExamDate(row.examDate);
    this.confirmDialogHeader = 'Confirmar inscripción';
    this.confirmDialogMessage = `¿Confirmás la inscripción a ${row.subjectName} para rendir el ${when}?`;
    this.confirmDialogMode = 'enroll';
    this.confirmDialogVisible = true;
  }

  onUnenroll(row: StudentFinalExamRow): void {
    if (!this.canUnenroll(row)) {
      return;
    }
    this.selectedRow = row;

    const when = this.formatExamDate(row.examDate);
    this.confirmDialogHeader = 'Cancelar inscripción';
    this.confirmDialogMessage = `¿Querés cancelar tu inscripción a ${row.subjectName} del ${when}?`;
    this.confirmDialogMode = 'unenroll';
    this.confirmDialogVisible = true;
  }

  onConfirmDialogAccept(): void {
    if (!this.selectedRow || !this.confirmDialogMode) {
      this.confirmDialogVisible = false;
      return;
    }

    if (this.confirmDialogMode === 'enroll') {
      this.executeEnroll(this.selectedRow);
    } else if (this.confirmDialogMode === 'unenroll') {
      this.executeUnenroll(this.selectedRow);
    }

    this.confirmDialogVisible = false;
    this.confirmDialogMode = null;
  }

  onConfirmDialogReject(): void {
    this.confirmDialogVisible = false;
    this.confirmDialogMode = null;
  }

  onPrintReceipt(row: StudentFinalExamRow): void {
    this.loading = true;
    this.inscriptions
      .downloadReceipt(row.finalExamId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (blob) => {
          try {
            const blobUrl = URL.createObjectURL(blob);
            const win = window.open(blobUrl, '_blank');
            if (!win) {
              const link = document.createElement('a');
              link.href = blobUrl;
              link.target = '_blank';
              link.rel = 'noopener';
              link.click();
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
          } catch (error) {
            console.error('[MesasList] opening receipt failed', error);
            this.showToast(
              'error',
              'No se pudo abrir el comprobante',
              'Intentá nuevamente en unos minutos.',
            );
          }
        },
        error: (error) => {
          console.error('[MesasList] downloadReceipt failed', error);
          this.showToast(
            'error',
            'No se pudo obtener el comprobante',
            'Intentá nuevamente en unos minutos.',
          );
        },
      });
  }

  onPrintLastReceipt(): void {
    if (!this.rows.length) return;
    const enrolled = this.rows.find((r) => r.isEnrolled);
    const target = enrolled ?? this.rows[0];
    this.onPrintReceipt(target);
  }

  onBack(): void {
    this.goBackSvc.back();
  }

  canEnroll(row: StudentFinalExamRow): boolean {
    const hasCorrelativeOk = row.correlativeStatus === 'OK';
    const isWindowOpen = row.window.state === 'open';
    const backendBlocked =
      row.blockedReason === 'WINDOW_CLOSED' ||
      row.blockedReason === 'QUOTA_FULL' ||
      row.blockedReason === 'BACKEND_BLOCK';

    return (
      !row.isEnrolled && hasCorrelativeOk && isWindowOpen && !backendBlocked
    );
  }

  canUnenroll(row: StudentFinalExamRow): boolean {
    return row.isEnrolled;
  }

  windowLabel(row: StudentFinalExamRow): string {
    const opens = this.formatExamDate(row.window.opensAt);
    const closes = this.formatExamDate(row.window.closesAt);
    if (!opens && !closes) return row.window.label;
    if (opens && closes) return `${opens} - ${closes}`;
    return opens || closes || row.window.label;
  }

  private executeEnroll(row: StudentFinalExamRow): void {
    this.loading = true;
    this.inscriptions
      .enrollToFinalExam(row.finalExamId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp) => {
          if (resp.ok) {
            this.rows = this.rows.map((r) =>
              r.finalExamId === row.finalExamId
                ? { ...r, isEnrolled: true }
                : r,
            );
            this.showToast(
              'success',
              'Inscripción confirmada',
              `Te inscribiste correctamente a ${row.subjectName}.`,
            );
            if (resp.refreshRequired) {
              this.loadAvailableExams({ refresh: true });
            }
          } else {
            const detail =
              resp.message ??
              'No se pudo completar la inscripción. Intentá nuevamente.';
            this.showToast('error', 'Inscripción bloqueada', detail);
          }
        },
        error: (error) => {
          console.error('[MesasList] enroll failed', error);
          this.showToast(
            'error',
            'No se pudo completar la operación',
            'Intentá nuevamente en unos minutos.',
          );
        },
      });
  }

  private executeUnenroll(row: StudentFinalExamRow): void {
    this.loading = true;
    this.inscriptions
      .unenrollFromFinalExam(row.finalExamId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (resp) => {
          if (resp.ok) {
            this.rows = this.rows.map((r) =>
              r.finalExamId === row.finalExamId
                ? {
                    ...r,
                    isEnrolled: false,
                    // #ASUMIENDO CODIGO: blockedReason existe en StudentFinalExamRow
                    // y dejarlo en null/undefined permite re-inscribirse si la ventana sigue abierta.
                    blockedReason: null,
                  }
                : r,
            );

            this.showToast(
              'success',
              'Inscripción cancelada',
              `Se canceló tu inscripción a ${row.subjectName}.`,
            );

            if (resp.refreshRequired) {
              this.loadAvailableExams({ refresh: true });
            }
          } else {
            const detail =
              resp.message ??
              'No se pudo cancelar la inscripción. Intentá nuevamente.';
            this.showToast('error', 'No se pudo cancelar', detail);
          }
        },
        error: (error) => {
          console.error('[MesasList] unenroll failed', error);
          this.showToast(
            'error',
            'No se pudo completar la operación',
            'Intentá nuevamente en unos minutos.',
          );
        },
      });
  }

  private formatExamDate(value: string | null | undefined): string {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return this.shortDateFormatter.format(dt);
  }

  private showToast(
    severity: 'success' | 'info' | 'warn' | 'error',
    summary: string,
    detail?: string,
  ): void {
    this.uiAlertAudit.add(this.messages, {
      severity,
      summary,
      detail,
    });
  }
}
