// src/app/features/exams/pages/exams-tables-page.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ExamTable } from '../../../core/models/exam_table.model';
import { ExamTablesService } from '../../../core/services/final-exam-tables.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ExamTableSyncService } from '../../../core/services/exam-table-sync.service';
import { UiAlertAuditService } from '../../../core/services/ui-alert-audit.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { PermissionService } from '@/core/auth/permission.service';
import { ROLE } from '../../../core/auth/roles';
@Component({
  selector: 'app-exams-tables-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    TableModule,
    Button,
    DialogModule,
    InputTextModule,
    FormsModule,
    TooltipModule,
    ConfirmPopupModule,
  ],
  templateUrl: './exams-tables-page.html',
  styleUrls: ['./exams-tables-page.scss'],
  providers: [ConfirmationService],
})
export class ExamsTablesPage implements OnInit {
  private svc = inject(ExamTablesService);
  private router = inject(Router);
  private messages = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private auth = inject(AuthService);
  private sync = inject(ExamTableSyncService);
  private uiAlertAudit = inject(UiAlertAuditService);
  private permissions = inject(PermissionService);

  breadcrumbItems: SimpleBreadcrumbItem[] = [{ label: 'Mesas de examen' }];

  tables = signal<ExamTable[]>([]);
  loading = signal<boolean>(false);

  showDialog = signal(false);
  saving = signal(false);
  editingId: number | null = null;
  name = '';
  start_date = '';
  end_date = '';

  ngOnInit() {
    this.reload();
  }

  private reload(force = false) {
    this.loading.set(true);
    this.svc.list(force).subscribe({
      next: (rows) => {
        this.tables.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.editingId = null;
    this.name = '';
    this.start_date = '';
    this.end_date = '';
    this.showDialog.set(true);
  }

  openEdit(t: ExamTable) {
    this.editingId = t.id;
    this.name = t.name;
    this.start_date = t.start_date;
    this.end_date = t.end_date;
    this.showDialog.set(true);
  }

  confirmDialog() {
    if (this.saving()) return;
    if (!this.validateDialog()) return;

    this.saving.set(true);

    const payload = {
      name: this.name.trim(),
      start_date: this.start_date,
      end_date: this.end_date,
    };

    const finish = () => {
      this.reload(true);
      this.showDialog.set(false);
    };

    if (this.editingId !== null) {
      const editingId = this.editingId;
      this.svc
        .update(editingId, payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.uiAlertAudit.add(this.messages, {
              severity: 'success',
              summary: 'Actualizado',
            });
            this.sync.notify({ action: 'updated', mesaId: editingId });
            finish();
          },
          error: (error) => this.showBackendError(error),
        });

      return;
    }

    const currentUserId = this.auth.getUserId();
    if (!currentUserId) {
      this.saving.set(false);
      this.uiAlertAudit.add(this.messages, {
        severity: 'error',
        summary: 'Sesion requerida',
        detail: 'No pudimos identificar al usuario actual para crear la mesa.',
        life: 5000,
      });
      return;
    }

    const createPayload = {
      ...payload,
      created_by: currentUserId,
    };

    this.svc
      .create(createPayload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (created) => {
          this.uiAlertAudit.add(this.messages, {
            severity: 'success',
            summary: 'Creado',
          });
          this.sync.notify({ action: 'created', mesaId: created.id });
          finish();
        },
        error: (error) => this.showBackendError(error),
      });
  }

  deleteTable(t: ExamTable) {
    this.svc.delete(t.id).subscribe({
      next: () => {
        this.uiAlertAudit.add(this.messages, {
          severity: 'success',
          summary: 'Eliminado',
        });
        this.reload(true);
        this.sync.notify({ action: 'deleted', mesaId: t.id });
      },
      error: () => {},
    });
  }

  openTable(t: ExamTable) {
    this.router.navigate(['/final_examns/table', t.id]);
  }

  private validateDialog(): boolean {
    if (!this.name.trim() || !this.start_date || !this.end_date) {
      this.uiAlertAudit.add(this.messages, {
        severity: 'warn',
        summary: 'Completa los campos',
        detail: 'Nombre y rango de fechas son obligatorios.',
        life: 4000,
      });
      return false;
    }
    const start = new Date(this.start_date);
    const end = new Date(this.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      this.uiAlertAudit.add(this.messages, {
        severity: 'warn',
        summary: 'Fechas invalidas',
        detail: 'Utiliza el formato YYYY-MM-DD en ambas fechas.',
        life: 4000,
      });
      return false;
    }
    if (start > end) {
      this.uiAlertAudit.add(this.messages, {
        severity: 'warn',
        summary: 'Rango inconsistente',
        detail: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
        life: 5000,
      });
      return false;
    }
    return true;
  }

  private showBackendError(error: unknown): void {
    const message =
      (error as any)?.error?.message ??
      (error as any)?.message ??
      'Intenta nuevamente o consulta con Secretaria.';
    this.uiAlertAudit.add(this.messages, {
      severity: 'error',
      summary: 'No se pudo guardar la mesa',
      detail: Array.isArray(message) ? message.join(' · ') : message,
      life: 5000,
    });
  }

  // Solo SECRETARIO o DIRECTIVO pueden crear mesas
  canCreateUser(): boolean {
    return this.permissions.hasAnyRole([
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
  }

  // Roles con permisos de gestión administrativa sobre mesas (crear/editar/eliminar)
  canManageTables(): boolean {
    return this.permissions.hasAnyRole([
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
  }

  confirm(event: Event, callback: () => void, onReject?: () => void) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de continuar?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => callback(),
      reject: () => {
        if (onReject) {
          onReject();
        }
      },
    });
  }
}
